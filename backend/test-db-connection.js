const mysql = require('mysql2/promise');
require('dotenv').config();

async function testConnection() {
    const configs = [
        {
            name: 'Config from .env',
            config: {
                host: process.env.DB_HOST,
                port: process.env.DB_PORT || 3306,
                user: process.env.DB_USER,
                password: process.env.DB_PASSWORD,
                database: process.env.DB_NAME,
                charset: 'utf8mb4',
                ssl: { rejectUnauthorized: false }
            }
        },
        {
            name: 'Config without SSL',
            config: {
                host: process.env.DB_HOST,
                port: process.env.DB_PORT || 3306,
                user: process.env.DB_USER,
                password: process.env.DB_PASSWORD,
                database: process.env.DB_NAME,
                charset: 'utf8mb4'
            }
        }
    ];

    for (const { name, config } of configs) {
        console.log(`\n=== Testing ${name} ===`);
        console.log(`Host: ${config.host}`);
        console.log(`Port: ${config.port}`);
        console.log(`User: ${config.user}`);
        console.log(`Database: ${config.database}`);
        console.log(`Password: ${config.password ? '[PROVIDED]' : '[NOT PROVIDED]'}`);
        
        try {
            console.log('Attempting connection...');
            const connection = await mysql.createConnection(config);
            console.log('✅ Connection successful!');
            
            // Test basic query
            const [result] = await connection.execute('SELECT 1 as test');
            console.log('✅ Query test successful:', result);
            
            // Get database info
            const [dbInfo] = await connection.execute('SELECT DATABASE() as current_db, VERSION() as mysql_version');
            console.log('✅ Database info:', dbInfo[0]);
            
            await connection.end();
            console.log('✅ Connection closed successfully');
            break; // Stop testing if one config works
            
        } catch (error) {
            console.error('❌ Connection failed:', error.message);
            if (error.code) {
                console.error('Error code:', error.code);
            }
        }
    }
}

console.log('Testing database connection...');
testConnection();
