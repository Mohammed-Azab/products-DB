const XLSX = require('xlsx');
const mysql = require('mysql2/promise');
const path = require('path');

// Database configuration
const dbConfig = {
    host: 'localhost',
    user: 'products_user',
    password: 'products_password',
    database: 'products_db',
    charset: 'utf8mb4'
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

async function uploadExcelToDatabase() {
    let connection;
    
    try {
        // Connect to database
        connection = await mysql.createConnection(dbConfig);
        console.log('Connected to database successfully');
        
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
            
            // Clear existing data
            await connection.execute('DELETE FROM products');
            console.log('Cleared existing products data');
            
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
                    
                    // Insert into database
                    const insertQuery = `
                        INSERT INTO products (name, description, price, category, stock_quantity, sku, supplier) 
                        VALUES (?, ?, ?, ?, ?, ?, ?)
                    `;
                    
                    await connection.execute(insertQuery, [
                        rowData.name || 'Unknown Product',
                        rowData.description || null,
                        rowData.price || 0.00,
                        rowData.category || null,
                        rowData.stock_quantity || 0,
                        rowData.sku || null,
                        rowData.supplier || null
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
        
        console.log(`\n✅ Excel file upload completed successfully!`);
        console.log(`Total records inserted: ${totalInserted}`);
        console.log(`Total errors: ${totalErrors}`);
        
    } catch (error) {
        console.error('❌ Error during upload:', error.message);
        console.error(error.stack);
    } finally {
        if (connection) {
            await connection.end();
            console.log('Database connection closed');
        }
    }
}

// Run the upload
uploadExcelToDatabase();
