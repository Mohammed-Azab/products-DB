const XLSX = require('xlsx');
const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config();

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'products_db',
  charset: 'utf8mb4'
};

async function uploadExcelToDatabase() {
  let connection;
  
  try {
    // Connect to database
    connection = await mysql.createConnection(dbConfig);
    console.log('Connected to database successfully');

    // First, let's check the actual table structure
    const [tableInfo] = await connection.execute('DESCRIBE products');
    console.log('Current table structure:');
    console.table(tableInfo);

    // Read Excel file
    const excelFilePath = path.join(__dirname, '..', 'المخزن الاساسي - Copy.xlsx');
    console.log('Reading Excel file:', excelFilePath);
    
    const workbook = XLSX.readFile(excelFilePath);
    const sheetNames = workbook.SheetNames;
    console.log('Available sheets:', sheetNames);

    // Process the first sheet with data
    for (const sheetName of sheetNames) {
      console.log(`\nProcessing sheet: ${sheetName}`);
      
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      
      if (jsonData.length === 0) {
        console.log(`Sheet ${sheetName} is empty, skipping...`);
        continue;
      }

      // Get headers (first row)
      const headers = jsonData[0];
      console.log('Headers found:', headers);

      // Get data rows (skip header)
      const dataRows = jsonData.slice(1).filter(row => row.length > 0 && row.some(cell => cell != null && cell !== ''));
      console.log(`Found ${dataRows.length} non-empty data rows`);

      if (dataRows.length === 0) {
        console.log('No data rows found, skipping...');
        continue;
      }

      // Clear existing products data
      await connection.execute('DELETE FROM products');
      console.log('Cleared existing products data');

      // Map common Arabic headers to database columns
      const headerMapping = {
        'الرقم': 'id',
        'رقم': 'id',
        'ID': 'id',
        'الاسم': 'name',
        'اسم المنتج': 'name',
        'المنتج': 'name',
        'Name': 'name',
        'اسم': 'name',
        'Product': 'name',
        'الوصف': 'description',
        'وصف': 'description',
        'Description': 'description',
        'السعر': 'price',
        'سعر': 'price',
        'Price': 'price',
        'الكمية': 'stock',
        'كمية': 'stock',
        'المخزون': 'stock',
        'Stock': 'stock',
        'Quantity': 'stock',
        'الفئة': 'category',
        'فئة': 'category',
        'Category': 'category',
        'النوع': 'category',
        'نوع': 'category',
        'Type': 'category',
        'الكود': 'sku',
        'كود': 'sku',
        'SKU': 'sku',
        'Code': 'sku',
        'رقم المنتج': 'sku',
        'Product Code': 'sku'
      };

      // Map headers to database columns
      const mappedColumns = headers.map(header => {
        const mapped = headerMapping[header];
        if (mapped) {
          return mapped;
        }
        // If no mapping found, use a safe column name
        const safeColumnName = header ? header.toString().replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase() : 'unknown_column';
        return safeColumnName;
      });

      console.log('Mapped columns:', mappedColumns);

      // Insert data into products table (using existing structure)
      let successCount = 0;
      let errorCount = 0;

      for (let i = 0; i < dataRows.length; i++) {
        const row = dataRows[i];
        
        // Skip empty rows
        if (!row || row.length === 0 || row.every(cell => cell == null || cell === '')) {
          continue;
        }
        
        try {
          // Extract data based on column mapping (only use available columns)
          let productData = {
            name: '',
            description: '',
            price: 0,
            category: '',
            stock: 0, // Note: using 'stock' not 'stock_quantity'
            sku: ''
          };

          // Map row data to product fields
          for (let j = 0; j < headers.length && j < row.length; j++) {
            const columnName = mappedColumns[j];
            const cellValue = row[j];

            if (cellValue == null || cellValue === '') continue;

            switch (columnName) {
              case 'name':
                productData.name = cellValue.toString();
                break;
              case 'description':
                productData.description = cellValue.toString();
                break;
              case 'price':
                productData.price = parseFloat(cellValue) || 0;
                break;
              case 'stock':
                productData.stock = parseInt(cellValue) || 0;
                break;
              case 'category':
                productData.category = cellValue.toString();
                break;
              case 'sku':
                productData.sku = cellValue.toString();
                break;
            }
          }

          // Set default name if empty
          if (!productData.name || productData.name.trim() === '') {
            productData.name = `منتج من Excel - ${i + 1}`;
          }

          // Set default SKU if empty
          if (!productData.sku || productData.sku.trim() === '') {
            productData.sku = `EXCEL${String(i + 1).padStart(3, '0')}`;
          }

          // Set default category if empty
          if (!productData.category || productData.category.trim() === '') {
            productData.category = 'عام';
          }

          // Insert into database using exact column names from table structure
          await connection.execute(
            'INSERT INTO products (name, description, price, category, stock, sku, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [
              productData.name,
              productData.description,
              productData.price,
              productData.category,
              productData.stock,
              productData.sku,
              'active'
            ]
          );

          successCount++;
          
          if (successCount % 50 === 0) {
            console.log(`Inserted ${successCount} records...`);
          }

        } catch (error) {
          errorCount++;
          console.error(`Error inserting row ${i + 1}:`, error.message);
          // Show first few error details for debugging
          if (errorCount <= 5) {
            console.log('Row data:', row);
          }
        }
      }

      console.log(`\nSheet ${sheetName} processing completed:`);
      console.log(`- Successfully inserted: ${successCount} records`);
      console.log(`- Errors: ${errorCount} records`);
      
      // Only process the first sheet with data
      if (successCount > 0) {
        break;
      }
    }

    console.log('\n✅ Excel file upload completed successfully!');

  } catch (error) {
    console.error('❌ Error uploading Excel file:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('Database connection closed');
    }
  }
}

// Run the upload
uploadExcelToDatabase();
