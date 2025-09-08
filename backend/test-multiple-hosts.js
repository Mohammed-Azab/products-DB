const mysql = require('mysql2/promise');
require('dotenv').config();

async function testMultipleHosts() {
    // Common hostname variations for IONOS hosting
    const hostVariations = [
        'db5018580491.hosting-data.io',
        'db5018580491.db.1and1.com',
        'db5018580491.perfora.net',
        'db5018580491.hosting-data.io:3306',
        'mysql-5.db.hosting-data.io',
        'mysql.db.hosting-data.io',
        '212.227.17.169', // Common IONOS IP range (example)
        '217.160.0.169'   // Another common IONOS IP range (example)
    ];

    const baseConfig = {
        port: process.env.DB_PORT || 3306,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        charset: 'utf8mb4',
        connectTimeout: 10000,
        acquireTimeout: 10000
    };

    console.log('Testing multiple hostname variations...\n');

    for (const host of hostVariations) {
        console.log(`=== Testing: ${host} ===`);
        
        const configs = [
            { ...baseConfig, host, ssl: { rejectUnauthorized: false } },
            { ...baseConfig, host },
            { ...baseConfig, host, ssl: true }
        ];

        for (let i = 0; i < configs.length; i++) {
            const config = configs[i];
            const sslType = i === 0 ? 'with SSL (relaxed)' : i === 1 ? 'without SSL' : 'with SSL (strict)';
            
            try {
                console.log(`  Trying ${sslType}...`);
                const connection = await mysql.createConnection(config);
                console.log('  ✅ Connection successful!');
                
                // Test basic query
                const [result] = await connection.execute('SELECT 1 as test');
                console.log('  ✅ Query test successful');
                
                // Get database info
                const [dbInfo] = await connection.execute('SELECT DATABASE() as current_db, VERSION() as mysql_version');
                console.log('  ✅ Database info:', dbInfo[0]);
                
                await connection.end();
                console.log(`  ✅ SUCCESS! Working hostname: ${host} (${sslType})`);
                
                // Update .env file with working config
                const envContent = `# Environment Configuration
NODE_ENV=development
PORT=5000

# Database Configuration
DB_HOST=${host}
DB_PORT=${config.port}
DB_NAME=${config.database}
DB_USER=${config.user}
DB_PASSWORD=${config.password}

# Security
JWT_SECRET=your-super-secret-jwt-key-change-in-production
API_RATE_LIMIT=100

# CORS
CORS_ORIGIN=http://localhost:3000

# File Upload
MAX_FILE_SIZE=10485760`;

                const fs = require('fs');
                fs.writeFileSync('.env', envContent);
                console.log('  ✅ Updated .env file with working configuration');
                
                return { host, config };
                
            } catch (error) {
                console.log(`  ❌ Failed: ${error.message}`);
            }
        }
        console.log('');
    }
    
    console.log('❌ No working hostname found. Please check:');
    console.log('1. Your IONOS hosting panel for the exact hostname');
    console.log('2. If there is an IP address listed instead');
    console.log('3. If MySQL remote access is enabled in your hosting panel');
    console.log('4. If your current IP is whitelisted for remote access');
}

testMultipleHosts();
