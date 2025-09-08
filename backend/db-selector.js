const mysql = require('mysql2/promise');
require('dotenv').config();

// Configuration for both local and remote databases
const configs = {
    local: {
        host: 'localhost',
        port: 3306,
        user: 'products_user',
        password: 'products_password',
        database: 'products_db',
        charset: 'utf8mb4'
    },
    remote: {
        host: process.env.DB_HOST || 'db5018580491.hosting-data.io',
        port: process.env.DB_PORT || 3306,
        user: process.env.DB_USER || 'dbu378229',
        password: process.env.DB_PASSWORD || 'Ionos359#',
        database: process.env.DB_NAME || 'dbu378229',
        charset: 'utf8mb4',
        ssl: { rejectUnauthorized: false },
        connectTimeout: 10000
    }
};

async function selectWorkingDatabase() {
    console.log('🔍 Testing database connections...\n');
    
    // Test remote first
    console.log('=== Testing Remote Database ===');
    try {
        const remoteConnection = await mysql.createConnection(configs.remote);
        console.log('✅ Remote database connection successful!');
        await remoteConnection.execute('SELECT 1');
        console.log('✅ Remote database query test successful!');
        await remoteConnection.end();
        
        console.log('\n🎯 Using REMOTE database configuration');
        return { type: 'remote', config: configs.remote };
        
    } catch (error) {
        console.log('❌ Remote database failed:', error.message);
    }
    
    // Test local as fallback
    console.log('\n=== Testing Local Database ===');
    try {
        const localConnection = await mysql.createConnection(configs.local);
        console.log('✅ Local database connection successful!');
        await localConnection.execute('SELECT 1');
        console.log('✅ Local database query test successful!');
        await localConnection.end();
        
        console.log('\n🎯 Using LOCAL database configuration');
        return { type: 'local', config: configs.local };
        
    } catch (error) {
        console.log('❌ Local database failed:', error.message);
    }
    
    throw new Error('❌ No working database configuration found!');
}

module.exports = { selectWorkingDatabase, configs };
