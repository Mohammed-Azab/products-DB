const mysql = require('mysql2/promise')
require('dotenv').config()

async function setupDatabase() {
  try {
    // Create connection
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      charset: 'utf8mb4'
    })

    console.log('Connected to database server')

    // Create database if not exists (connect without database first)
    const adminConnection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      charset: 'utf8mb4'
    })

    await adminConnection.query(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`)
    await adminConnection.end()
    console.log('Database created/verified')

    // Drop existing tables to recreate with proper structure
    await connection.query('DROP TABLE IF EXISTS products')
    await connection.query('DROP TABLE IF EXISTS suppliers')
    console.log('Existing tables dropped')

    // Create products table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS products (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        price DECIMAL(10,2),
        category VARCHAR(100),
        stock INT DEFAULT 0,
        sku VARCHAR(100),
        status ENUM('active', 'inactive') DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
    `)
    console.log('Products table created')

    // Create suppliers table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS suppliers (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        phone VARCHAR(50),
        address TEXT,
        city VARCHAR(100),
        country VARCHAR(100),
        status ENUM('active', 'inactive') DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
    `)
    console.log('Suppliers table created')

    // Insert sample Arabic products
    const products = [
      ['جهاز كمبيوتر محمول', 'جهاز كمبيوتر محمول عالي الأداء مع شاشة 15 بوصة', 2500.00, 'إلكترونيات', 15, 'LAPTOP001', 'active'],
      ['هاتف ذكي', 'هاتف ذكي بكاميرا عالية الدقة ومساحة تخزين كبيرة', 1200.00, 'إلكترونيات', 25, 'PHONE001', 'active'],
      ['طاولة مكتب', 'طاولة مكتب خشبية بتصميم عصري وجودة عالية', 350.00, 'أثاث', 8, 'DESK001', 'active'],
      ['كرسي مكتب', 'كرسي مكتب مريح بظهر قابل للتعديل', 180.00, 'أثاث', 12, 'CHAIR001', 'active'],
      ['طابعة ليزر', 'طابعة ليزر ملونة بسرعة عالية للمكاتب', 450.00, 'إلكترونيات', 6, 'PRINTER001', 'active'],
      ['قلم رصاص', 'مجموعة أقلام رصاص عالية الجودة', 5.00, 'قرطاسية', 100, 'PENCIL001', 'active'],
      ['دفتر ملاحظات', 'دفتر ملاحظات بغلاف جلدي وأوراق عالية الجودة', 15.00, 'قرطاسية', 50, 'NOTEBOOK001', 'active'],
      ['ماوس لاسلكي', 'ماوس لاسلكي بتقنية البلوتوث ودقة عالية', 35.00, 'إلكترونيات', 30, 'MOUSE001', 'active'],
      ['لوحة مفاتيح', 'لوحة مفاتيح ميكانيكية بإضاءة RGB', 85.00, 'إلكترونيات', 20, 'KEYBOARD001', 'active'],
      ['سماعات أذن', 'سماعات أذن لاسلكية بإلغاء الضوضاء', 120.00, 'إلكترونيات', 18, 'HEADPHONES001', 'active']
    ]

    for (const product of products) {
      await connection.query(
        'INSERT INTO products (name, description, price, category, stock, sku, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
        product
      )
    }
    console.log('Sample products inserted')

    // Insert sample Arabic suppliers
    const suppliers = [
      ['شركة التقنية المتقدمة', 'info@advanced-tech.com', '+966501234567', 'شارع الملك فهد، الحي التجاري', 'الرياض', 'السعودية', 'active'],
      ['مؤسسة الأثاث الحديث', 'sales@modern-furniture.com', '+966502345678', 'طريق الأمير محمد بن عبدالعزيز', 'جدة', 'السعودية', 'active'],
      ['دار القرطاسية الذهبية', 'orders@golden-stationery.com', '+966503456789', 'شارع التحلية، حي النزهة', 'الرياض', 'السعودية', 'active'],
      ['شركة الإلكترونيات الشاملة', 'support@comprehensive-electronics.com', '+966504567890', 'كورنيش جدة، حي الشاطئ', 'جدة', 'السعودية', 'active'],
      ['مركز الأعمال التجاري', 'contact@business-center.com', '+966505678901', 'شارع العليا، حي الملز', 'الرياض', 'السعودية', 'active']
    ]

    for (const supplier of suppliers) {
      await connection.query(
        'INSERT INTO suppliers (name, email, phone, address, city, country, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
        supplier
      )
    }
    console.log('Sample suppliers inserted')

    await connection.end()
    console.log('Database setup completed successfully!')

  } catch (error) {
    console.error('Database setup failed:', error)
    process.exit(1)
  }
}

setupDatabase()
