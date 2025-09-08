const XLSX = require('xlsx');
const mysql = require('mysql2/promise');
const path = require('path');
const { selectWorkingDatabase } = require('./db-selector');

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
    'حاله الصنف': 'notes',
    'التاريخ ': 'price'
};

async function ensureTableCompatibility(connection, dbType) {
    try {
        console.log('🔧 Checking table compatibility...');
        
        // Get current table structure
        const [tableStructure] = await connection.execute('DESCRIBE products');
        const existingColumns = new Set(tableStructure.map(col => col.Field));
        
        console.log('Current columns:', Array.from(existingColumns));
        
        // Define required columns with their types
        const requiredColumns = {
            'id': 'INT AUTO_INCREMENT PRIMARY KEY',
            'name': 'VARCHAR(255) NOT NULL',
            'description': 'TEXT',
            'price': 'DECIMAL(10,2) DEFAULT 0.00',
            'category': 'VARCHAR(100)',
            'stock_quantity': 'INT DEFAULT 0',
            'sku': 'VARCHAR(100) UNIQUE',
            'supplier': 'VARCHAR(255)',
            'created_at': 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP',
            'updated_at': 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'
        };
        
        // Add missing columns if any
        for (const [columnName, columnDefinition] of Object.entries(requiredColumns)) {
            if (!existingColumns.has(columnName) && columnName !== 'id') {
                console.log(`➕ Adding missing column: ${columnName}`);
                const alterQuery = `ALTER TABLE products ADD COLUMN ${columnName} ${columnDefinition}`;
                await connection.execute(alterQuery);
            }
        }
        
        // Verify final structure
        const [finalStructure] = await connection.execute('DESCRIBE products');
        console.log('✅ Table structure verified');
        console.table(finalStructure);
        
    } catch (error) {
        console.error('❌ Error ensuring table compatibility:', error.message);
        throw error;
    }
}

async function uploadExcelDataFinal() {
    let connection;
    let dbInfo;
    
    try {
        // Select working database (remote or local)
        dbInfo = await selectWorkingDatabase();
        console.log(`\n📋 Using ${dbInfo.type.toUpperCase()} database`);
        
        // Connect to selected database
        connection = await mysql.createConnection(dbInfo.config);
        console.log('✅ Connected to database successfully');
        
        // Ensure table compatibility
        await ensureTableCompatibility(connection, dbInfo.type);
        
        // Read Excel file
        console.log(`\nReading Excel file: ${excelFilePath}`);
        const workbook = XLSX.readFile(excelFilePath);
        console.log('Available sheets:', workbook.SheetNames);
        
        let totalInserted = 0;
        let totalErrors = 0;
        let totalUpdated = 0;
        
        // Get current record count
        const [countBefore] = await connection.execute('SELECT COUNT(*) as count FROM products');
        console.log(`📊 Current records in database: ${countBefore[0].count}`);
        
        // Ask user if they want to clear existing data
        if (countBefore[0].count > 0) {
            console.log('⚠️  Database contains existing data. Clearing for fresh import...');
            await connection.execute('DELETE FROM products');
            console.log('✅ Cleared existing products data');
        }
        
        // Process each sheet
        for (const sheetName of workbook.SheetNames) {
            console.log(`\n📄 Processing sheet: ${sheetName}`);
            
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
            
            let sheetInserted = 0;
            let sheetErrors = 0;
            
            // Process each data row
            for (let i = 0; i < dataRows.length; i++) {
                const row = dataRows[i];
                
                try {
                    // Create row object with mapped values
                    const rowData = {
                        name: 'Unknown Product',
                        stock_quantity: 0,
                        price: 0.00
                    };
                    
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
                                    const priceValue = parseFloat(value);
                                    rowData.price = isNaN(priceValue) ? 0.00 : priceValue;
                                    break;
                                case 'category':
                                    rowData.category = value;
                                    break;
                                case 'stock_quantity':
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
                                case 'notes':
                                    rowData.notes = value;
                                    break;
                            }
                        }
                    });
                    
                    // Skip if no meaningful data
                    if (!rowData.name || rowData.name === 'Unknown Product') {
                        continue;
                    }
                    
                    // Use INSERT IGNORE to handle duplicates gracefully
                    const insertQuery = `
                        INSERT IGNORE INTO products (name, description, price, category, stock_quantity, sku, supplier) 
                        VALUES (?, ?, ?, ?, ?, ?, ?)
                    `;
                    
                    const [result] = await connection.execute(insertQuery, [
                        rowData.name,
                        rowData.description || null,
                        rowData.price || 0.00,
                        rowData.category || null,
                        rowData.stock_quantity || 0,
                        rowData.sku || null,
                        rowData.supplier || null
                    ]);
                    
                    if (result.affectedRows > 0) {
                        sheetInserted++;
                    }
                    
                } catch (error) {
                    console.error(`❌ Error inserting row ${i + 1}:`, error.message);
                    sheetErrors++;
                }
            }
            
            console.log(`\n📊 Sheet ${sheetName} processing completed:`);
            console.log(`   ✅ Successfully inserted: ${sheetInserted} records`);
            console.log(`   ❌ Errors/Duplicates: ${sheetErrors} records`);
            
            totalInserted += sheetInserted;
            totalErrors += sheetErrors;
        }
        
        // Verify final count
        const [countResult] = await connection.execute('SELECT COUNT(*) as total FROM products');
        
        console.log(`\n🎉 Excel file upload completed successfully!`);
        console.log(`📊 Summary:`);
        console.log(`   Database: ${dbInfo.type.toUpperCase()}`);
        console.log(`   Records processed: ${totalInserted + totalErrors}`);
        console.log(`   Successfully inserted: ${totalInserted}`);
        console.log(`   Errors/Duplicates: ${totalErrors}`);
        console.log(`   Final database count: ${countResult[0].total}`);
        
        // Show sample data
        const [sampleData] = await connection.execute('SELECT id, name, sku, stock_quantity, category FROM products LIMIT 5');
        console.log(`\n📝 Sample imported data:`);
        console.table(sampleData);
        
    } catch (error) {
        console.error('❌ Error during upload:', error.message);
        if (error.code === 'ENOTFOUND') {
            console.error('\n💡 Database connection failed - using local database');
            console.error('   - Remote database host could not be reached');
            console.error('   - Check your IONOS hosting panel for correct connection details');
        } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
            console.error('\n💡 Access denied:');
            console.error('   - Verify your database username and password');
            console.error('   - Check database user permissions');
        }
    } finally {
        if (connection) {
            await connection.end();
            console.log('\n🔐 Database connection closed');
        }
    }
}

// Run the upload
uploadExcelDataFinal();
