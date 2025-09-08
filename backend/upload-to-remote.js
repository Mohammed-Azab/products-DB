iONOS359#const XLSX = require('xlsx');
const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config();

// Database configuration from environment variables
const dbConfig = {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    charset: 'utf8mb4',
    ssl: {
        rejectUnauthorized: false
    }
};

// Excel file path
const excelFilePath = path.join(__dirname, '..', 'المخزن الاساسي - Copy.xlsx');

// Column mapping for Arabic headers to database fields
const headerMapping = {
    'products_id': 'sku',
    'الصنف': 'name',
    'الرصيد الافتتاحي ': 'description', 
    'الكميه الحاليه ': 'stock_quantity',
    'المكان ': 'category',
    'الملاحظات': 'supplier',
    'حاله الصنف': 'status',
    'التاريخ ': 'price'
};

async function setupRemoteDatabase(connection) {
    try {
        console.log('Setting up database tables...');
        
        // Create products table if it doesn't exist
        const createTableQuery = `
            CREATE TABLE IF NOT EXISTS products (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                description TEXT,
                price DECIMAL(10,2) DEFAULT 0.00,
                category VARCHAR(100),
                stock_quantity INT DEFAULT 0,
                sku VARCHAR(100) UNIQUE,
                supplier VARCHAR(255),
                status VARCHAR(50) DEFAULT 'active',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `;
        
        await connection.execute(createTableQuery);
        console.log('Products table created/verified successfully');
        
        // Create suppliers table if it doesn't exist
        const createSuppliersTable = `
            CREATE TABLE IF NOT EXISTS suppliers (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                contact_info TEXT,
                address TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `;
        
        await connection.execute(createSuppliersTable);
        console.log('Suppliers table created/verified successfully');
        
    } catch (error) {
        console.error('Error setting up database:', error.message);
        throw error;
    }
}

async function uploadExcelToRemoteDatabase() {
    let connection;
    
    try {
        console.log('Connecting to remote database...');
        console.log(`Host: ${dbConfig.host}`);
        console.log(`Database: ${dbConfig.database}`);
        console.log(`User: ${dbConfig.user}`);
        
        // Connect to remote database
        connection = await mysql.createConnection(dbConfig);
        console.log('✅ Connected to remote database successfully');
        
        // Setup database tables
        await setupRemoteDatabase(connection);
        
        // Get table structure
        const [tableStructure] = await connection.execute('DESCRIBE products');
        console.log('Current table structure:');
        console.table(tableStructure);
        
        // Read Excel file
        console.log(`Reading Excel file: ${excelFilePath}`);
        const workbook = XLSX.readFile(excelFilePath);
        console.log('Available sheets:', workbook.SheetNames);
        
        let totalInserted = 0;
        let totalErrors = 0;
        
        // Clear existing data
        await connection.execute('DELETE FROM products');
        console.log('Cleared existing products data');
        
        // Process each sheet
        for (const sheetName of workbook.SheetNames) {
            console.log(`\nProcessing sheet: ${sheetName}`);
            
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
            
            if (jsonData.length === 0) {
                console.log(`Sheet ${sheetName} is empty, skipping...`);
                continue;
            }
            
            // Get headers from first row
            const headers = jsonData[0].map(header => 
                typeof header === 'string' ? header.trim() : String(header || '').trim()
            );
            console.log('Headers found:', headers);
            
            // Filter out empty data rows
            const dataRows = jsonData.slice(1).filter(row => 
                row && row.some(cell => cell !== undefined && cell !== null && String(cell).trim() !== '')
            );
            
            console.log(`Found ${dataRows.length} non-empty data rows`);
            
            if (dataRows.length === 0) {
                console.log(`No valid data in sheet ${sheetName}, skipping...`);
                continue;
            }
            
            // Map headers to database columns
            const mappedColumns = headers.map(header => headerMapping[header] || '_____');
            console.log('Mapped columns:', mappedColumns);
            
            let sheetInserted = 0;
            let sheetErrors = 0;
            
            // Process each data row
            for (let i = 0; i < dataRows.length; i++) {
                const row = dataRows[i];
                
                try {
                    // Create row object with mapped values
                    const rowData = {};
                    
                    // Set default values for required fields
                    rowData.name = 'Unknown Product';
                    rowData.stock_quantity = 0;
                    rowData.price = 0.00;
                    rowData.status = 'active';
                    
                    // Map Excel data to database columns
                    headers.forEach((header, index) => {
                        const dbColumn = headerMapping[header];
                        const cellValue = row[index];
                        
                        if (dbColumn && cellValue !== undefined && cellValue !== null && String(cellValue).trim() !== '') {
                            const value = String(cellValue).trim();
                            
                            switch(dbColumn) {
                                case 'name':
                                    rowData.name = value;
                                    break;
                                case 'description':
                                    rowData.description = value;
                                    break;
                                case 'price':
                                    // Try to parse price, default to 0
                                    const priceValue = parseFloat(value);
                                    rowData.price = isNaN(priceValue) ? 0.00 : priceValue;
                                    break;
                                case 'category':
                                    rowData.category = value;
                                    break;
                                case 'stock_quantity':
                                    // Try to parse quantity, extract numbers from text
                                    const quantityMatch = value.match(/(\d+)/);
                                    const quantityValue = quantityMatch ? parseInt(quantityMatch[1]) : 0;
                                    rowData.stock_quantity = quantityValue;
                                    break;
                                case 'sku':
                                    rowData.sku = value;
                                    break;
                                case 'supplier':
                                    rowData.supplier = value;
                                    break;
                                case 'status':
                                    rowData.status = value || 'active';
                                    break;
                                default:
                                    // For other fields, store as text
                                    rowData[dbColumn] = value;
                            }
                        }
                    });
                    
                    // Skip if no meaningful data
                    if (!rowData.name || rowData.name === 'Unknown Product') {
                        continue;
                    }
                    
                    // Insert into remote database
                    const insertQuery = `
                        INSERT INTO products (name, description, price, category, stock_quantity, sku, supplier, status) 
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                    `;
                    
                    await connection.execute(insertQuery, [
                        rowData.name || 'Unknown Product',
                        rowData.description || null,
                        rowData.price || 0.00,
                        rowData.category || null,
                        rowData.stock_quantity || 0,
                        rowData.sku || null,
                        rowData.supplier || null,
                        rowData.status || 'active'
                    ]);
                    
                    sheetInserted++;
                    
                } catch (error) {
                    console.error(`Error inserting row ${i + 1}:`, error.message);
                    console.log('Row data:', row.slice(0, 5)); // Show first 5 columns
                    sheetErrors++;
                }
            }
            
            console.log(`\nSheet ${sheetName} processing completed:`);
            console.log(`- Successfully inserted: ${sheetInserted} records`);
            console.log(`- Errors: ${sheetErrors} records`);
            
            totalInserted += sheetInserted;
            totalErrors += sheetErrors;
        }
        
        // Verify final count
        const [countResult] = await connection.execute('SELECT COUNT(*) as total FROM products');
        console.log(`\n✅ Excel file upload to remote database completed successfully!`);
        console.log(`Total records inserted: ${totalInserted}`);
        console.log(`Total errors: ${totalErrors}`);
        console.log(`Final database count: ${countResult[0].total}`);
        
    } catch (error) {
        console.error('❌ Error during remote upload:', error.message);
        if (error.code === 'ENOTFOUND') {
            console.error('Could not connect to remote database. Please check:');
            console.error('- Database host is correct');
            console.error('- Internet connection is working');
            console.error('- Database credentials are correct');
        } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
            console.error('Access denied. Please check:');
            console.error('- Username and password are correct');
            console.error('- User has permissions for the database');
        }
        console.error(error.stack);
    } finally {
        if (connection) {
            await connection.end();
            console.log('Remote database connection closed');
        }
    }
}

// Run the upload
uploadExcelToRemoteDatabase();
