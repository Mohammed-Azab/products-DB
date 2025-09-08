const mysql = require('mysql2/promise')
require('dotenv').config()

class Database {
  constructor() {
    this.pool = null
    this.initPool()
  }

  initPool() {
    this.pool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'products_db',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    })
  }

  async testConnection() {
    try {
      const connection = await this.pool.getConnection()
      await connection.ping()
      connection.release()
      console.log('Database connection successful')
      return true
    } catch (error) {
      console.error('Database connection failed:', error.message)
      
      // Try to create database if it doesn't exist
      if (error.code === 'ER_BAD_DB_ERROR') {
        await this.createDatabase()
        return this.testConnection()
      }
      throw error
    }
  }

  async createDatabase() {
    try {
      console.log('Creating database...')
      const tempPool = mysql.createPool({
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 3306,
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        waitForConnections: true,
        connectionLimit: 1
      })

      const connection = await tempPool.getConnection()
      await connection.execute(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME || 'products_db'}\``)
      connection.release()
      await tempPool.end()
      
      // Reinitialize pool with the new database
      await this.pool.end()
      this.initPool()
      
      console.log(`Database "${process.env.DB_NAME || 'products_db'}" created successfully`)
    } catch (error) {
      console.error('Error creating database:', error.message)
      throw error
    }
  }

  async query(sql, params = []) {
    try {
      const [rows] = await this.pool.execute(sql, params)
      return rows
    } catch (error) {
      console.error('Database query error:', error.message)
      console.error('SQL:', sql)
      console.error('Params:', params)
      throw error
    }
  }

  async transaction(callback) {
    const connection = await this.pool.getConnection()
    await connection.beginTransaction()
    
    try {
      const result = await callback(connection)
      await connection.commit()
      connection.release()
      return result
    } catch (error) {
      await connection.rollback()
      connection.release()
      throw error
    }
  }

  async getTables() {
    try {
      const tables = await this.query(`
        SELECT 
          t.table_name as name,
          COALESCE(tm.display_name, t.table_name) as display_name,
          t.table_rows as row_count,
          COALESCE(tm.created_at, NOW()) as created_at
        FROM information_schema.tables t
        LEFT JOIN table_metadata tm ON t.table_name = tm.table_name
        WHERE t.table_schema = DATABASE() 
        AND t.table_name != 'table_metadata'
        ORDER BY t.table_name
      `)
      return tables
    } catch (error) {
      console.error('Error getting tables:', error.message)
      return []
    }
  }

  async getTableColumns(tableName) {
    try {
      const columns = await this.query(`
        SELECT 
          column_name as name,
          data_type as type,
          is_nullable as nullable,
          column_default as defaultValue,
          character_maximum_length as maxLength,
          column_key as \`key\`
        FROM information_schema.columns 
        WHERE table_schema = DATABASE() 
        AND table_name = ?
        ORDER BY ordinal_position
      `, [tableName])
      
      return columns.map(col => ({
        name: col.name,
        type: col.type,
        nullable: col.nullable === 'YES',
        default: col.defaultValue,
        maxLength: col.maxLength,
        primaryKey: col.key === 'PRI',
        autoIncrement: col.key === 'PRI' && col.name === 'id'
      }))
    } catch (error) {
      console.error('Error getting table columns:', error.message)
      return []
    }
  }

  async initializeSampleData() {
    try {
      // Create metadata table
      await this.query(`
        CREATE TABLE IF NOT EXISTS table_metadata (
          id INT AUTO_INCREMENT PRIMARY KEY,
          table_name VARCHAR(64) NOT NULL UNIQUE,
          display_name VARCHAR(255),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `)

      // Check if sample tables exist
      const existingTables = await this.getTables()
      const tableNames = existingTables.map(t => t.name)

      // Create Products table if it doesn't exist
      if (!tableNames.includes('products')) {
        await this.query(`
          CREATE TABLE products (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            description TEXT,
            price DECIMAL(10,2),
            category VARCHAR(100),
            stock_quantity INT DEFAULT 0,
            sku VARCHAR(100) UNIQUE,
            supplier VARCHAR(255),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
          )
        `)

        // Insert sample products
        await this.query(`
          INSERT INTO products (name, description, price, category, stock_quantity, sku, supplier) VALUES
          ('Laptop Pro 15"', 'High-performance laptop with 16GB RAM and 512GB SSD', 1299.99, 'Electronics', 25, 'LP15-001', 'TechCorp'),
          ('Office Chair Deluxe', 'Ergonomic office chair with lumbar support', 299.99, 'Furniture', 40, 'OCD-002', 'FurniCorp'),
          ('Smartphone X', 'Latest smartphone with 128GB storage', 699.99, 'Electronics', 60, 'SMX-003', 'MobileTech'),
          ('Standing Desk', 'Adjustable height standing desk', 449.99, 'Furniture', 15, 'SD-004', 'FurniCorp'),
          ('Wireless Headphones', 'Noise-cancelling wireless headphones', 199.99, 'Electronics', 35, 'WH-005', 'AudioCorp'),
          ('Coffee Mug Set', 'Set of 4 ceramic coffee mugs', 29.99, 'Kitchenware', 100, 'CMS-006', 'KitchenPlus'),
          ('Notebook Pack', 'Pack of 5 ruled notebooks', 12.99, 'Stationery', 200, 'NP-007', 'PaperCorp'),
          ('USB-C Hub', '7-in-1 USB-C hub with multiple ports', 89.99, 'Electronics', 50, 'UCH-008', 'TechCorp')
        `)

        // Add to metadata
        await this.query(`
          INSERT INTO table_metadata (table_name, display_name) 
          VALUES ('products', 'Products')
        `)

        console.log('Products table created with sample data')
      }

      // Create Suppliers table if it doesn't exist
      if (!tableNames.includes('suppliers')) {
        await this.query(`
          CREATE TABLE suppliers (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            contact_person VARCHAR(255),
            email VARCHAR(255),
            phone VARCHAR(50),
            address TEXT,
            country VARCHAR(100),
            rating DECIMAL(3,2) DEFAULT 0.00,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
          )
        `)

        // Insert sample suppliers
        await this.query(`
          INSERT INTO suppliers (name, contact_person, email, phone, address, country, rating) VALUES
          ('TechCorp', 'John Smith', 'john@techcorp.com', '+1-555-0101', '123 Tech Street, Silicon Valley, CA', 'USA', 4.5),
          ('FurniCorp', 'Sarah Johnson', 'sarah@furnicorp.com', '+1-555-0102', '456 Furniture Ave, Grand Rapids, MI', 'USA', 4.2),
          ('MobileTech', 'David Chen', 'david@mobiletech.com', '+86-21-1234-5678', '789 Mobile Road, Shenzhen', 'China', 4.7),
          ('AudioCorp', 'Emma Wilson', 'emma@audiocorp.com', '+49-30-1234-5678', '101 Sound Street, Berlin', 'Germany', 4.3),
          ('KitchenPlus', 'Maria Garcia', 'maria@kitchenplus.com', '+34-91-123-4567', '202 Kitchen Ave, Madrid', 'Spain', 4.1),
          ('PaperCorp', 'James Brown', 'james@papercorp.com', '+44-20-1234-5678', '303 Paper Lane, London', 'UK', 4.0)
        `)

        // Add to metadata
        await this.query(`
          INSERT INTO table_metadata (table_name, display_name) 
          VALUES ('suppliers', 'Suppliers')
        `)

        console.log('Suppliers table created with sample data')
      }

      console.log('Sample data initialization complete')
    } catch (error) {
      console.error('Error initializing sample data:', error.message)
      // Don't throw - let the app continue even if sample data fails
    }
  }

  async close() {
    if (this.pool) {
      await this.pool.end()
    }
  }
}

module.exports = new Database()
