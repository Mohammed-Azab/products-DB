con  initPool() {
    this.pool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'products_db',
      waitForConnections: true,
      connectionLimit: 10,
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
      timeout: 60000,
      reconnect: true
    })
  }

  async testConnection() {
    try {
      const connection = await this.pool.getConnection()
      await connection.ping()
      connection.release()
      return true
    } catch (error) {
      throw new Error(`Database connection failed: ${error.message}`)
    }
  }

  async query(sql, params = []) {
    try {
      const [rows] = await this.pool.execute(sql, params)
      return rows
    } catch (error) {
      console.error('Database query error:', error)
      throw error
    }
  }

  async transaction(callback) {
    const connection = await this.pool.getConnection()
    await connection.beginTransaction()
    
    try {
      const result = await callback(connection)
      await connection.commit()
      return result
    } catch (error) {
      await connection.rollback()
      throw error
    } finally {
      connection.release()
    }
  }

  // Initialize sample data for testing
  async initializeSampleData() {
    try {
      // Create database if it doesn't exist
      const createDbSql = `CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME || 'products_db'}`
      await this.pool.execute(createDbSql)
      
      // Use the database
      await this.pool.execute(`USE ${process.env.DB_NAME || 'products_db'}`)

      // Create metadata table for tracking custom tables
      const metaTableSql = `
        CREATE TABLE IF NOT EXISTS table_metadata (
          id INT PRIMARY KEY AUTO_INCREMENT,
          table_name VARCHAR(255) UNIQUE NOT NULL,
          display_name VARCHAR(255) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `
      await this.query(metaTableSql)

      // Check if sample tables exist
      const existingTables = await this.query("SHOW TABLES LIKE 'products'")
      
      if (existingTables.length === 0) {
        // Create sample Products table
        const productsTableSql = `
          CREATE TABLE products (
            id INT PRIMARY KEY AUTO_INCREMENT,
            name VARCHAR(255) NOT NULL,
            description TEXT,
            price DECIMAL(10, 2),
            category VARCHAR(100),
            stock_quantity INT DEFAULT 0,
            sku VARCHAR(100) UNIQUE,
            supplier VARCHAR(255),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
          )
        `
        await this.query(productsTableSql)

        // Insert sample data
        const sampleProducts = [
          ['Laptop Computer', 'High-performance laptop for business use', 999.99, 'Electronics', 50, 'LAP001', 'TechCorp'],
          ['Office Chair', 'Ergonomic office chair with lumbar support', 299.99, 'Furniture', 25, 'CHR001', 'FurniCorp'],
          ['Wireless Mouse', 'Bluetooth wireless mouse with precision tracking', 49.99, 'Electronics', 100, 'MOU001', 'TechCorp'],
          ['Standing Desk', 'Adjustable height standing desk', 599.99, 'Furniture', 15, 'DSK001', 'FurniCorp'],
          ['Smartphone', 'Latest model smartphone with advanced features', 799.99, 'Electronics', 75, 'PHN001', 'MobileCorp']
        ]

        for (const product of sampleProducts) {
          await this.query(
            'INSERT INTO products (name, description, price, category, stock_quantity, sku, supplier) VALUES (?, ?, ?, ?, ?, ?, ?)',
            product
          )
        }

        // Add to metadata
        await this.query(
          'INSERT IGNORE INTO table_metadata (table_name, display_name) VALUES (?, ?)',
          ['products', 'Products']
        )
      }

      // Create sample Suppliers table
      const suppliersExists = await this.query("SHOW TABLES LIKE 'suppliers'")
      
      if (suppliersExists.length === 0) {
        const suppliersTableSql = `
          CREATE TABLE suppliers (
            id INT PRIMARY KEY AUTO_INCREMENT,
            name VARCHAR(255) NOT NULL,
            contact_person VARCHAR(255),
            email VARCHAR(255),
            phone VARCHAR(50),
            address TEXT,
            country VARCHAR(100),
            rating DECIMAL(3, 2),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
          )
        `
        await this.query(suppliersTableSql)

        // Insert sample suppliers
        const sampleSuppliers = [
          ['TechCorp', 'John Smith', 'john@techcorp.com', '+1-555-0123', '123 Tech Street, Silicon Valley', 'USA', 4.5],
          ['FurniCorp', 'Jane Doe', 'jane@furnicorp.com', '+1-555-0456', '456 Furniture Ave, Design City', 'USA', 4.2],
          ['MobileCorp', 'Bob Johnson', 'bob@mobilecorp.com', '+1-555-0789', '789 Mobile Blvd, Innovation Hub', 'USA', 4.8]
        ]

        for (const supplier of sampleSuppliers) {
          await this.query(
            'INSERT INTO suppliers (name, contact_person, email, phone, address, country, rating) VALUES (?, ?, ?, ?, ?, ?, ?)',
            supplier
          )
        }

        // Add to metadata
        await this.query(
          'INSERT IGNORE INTO table_metadata (table_name, display_name) VALUES (?, ?)',
          ['suppliers', 'Suppliers']
        )
      }

      console.log('Sample data initialized successfully')
    } catch (error) {
      console.error('Error initializing sample data:', error)
      throw error
    }
  }

  async getTables() {
    try {
      const tables = await this.query(`
        SELECT 
          tm.table_name as name,
          tm.display_name,
          tm.created_at,
          tm.updated_at,
          (SELECT COUNT(*) FROM information_schema.tables 
           WHERE table_schema = DATABASE() AND table_name = tm.table_name) as exists_flag
        FROM table_metadata tm
        ORDER BY tm.created_at DESC
      `)
      
      return tables.filter(table => table.exists_flag > 0)
    } catch (error) {
      console.error('Error getting tables:', error)
      throw error
    }
  }

  async getTableColumns(tableName) {
    try {
      const columns = await this.query(`
        SELECT 
          COLUMN_NAME as name,
          DATA_TYPE as type,
          IS_NULLABLE as nullable,
          COLUMN_DEFAULT as defaultValue,
          EXTRA as extra,
          CHARACTER_MAXIMUM_LENGTH as maxLength
        FROM information_schema.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = ?
        ORDER BY ORDINAL_POSITION
      `, [tableName])
      
      return columns
    } catch (error) {
      console.error('Error getting table columns:', error)
      throw error
    }
  }

  async getTableData(tableName, limit = 1000, offset = 0) {
    try {
      const columns = await this.getTableColumns(tableName)
      const data = await this.query(
        `SELECT * FROM ${mysql.escapeId(tableName)} LIMIT ? OFFSET ?`,
        [limit, offset]
      )
      
      return { columns, rows: data }
    } catch (error) {
      console.error('Error getting table data:', error)
      throw error
    }
  }

  close() {
    return this.pool.end()
  }
}

module.exports = new Database()
