#!/bin/bash

echo "🚀 Quick MySQL Setup for Products Database"
echo ""

# Check if MySQL is installed
if ! command -v mysql &> /dev/null; then
    echo "📦 Installing MySQL..."
    sudo apt update
    sudo apt install -y mysql-server
    
    echo "🔒 Securing MySQL installation..."
    sudo mysql_secure_installation
fi

echo "🔧 Setting up database..."
sudo mysql -e "
CREATE DATABASE IF NOT EXISTS products_db;
CREATE USER IF NOT EXISTS 'products_user'@'localhost' IDENTIFIED BY 'products_password';
GRANT ALL PRIVILEGES ON products_db.* TO 'products_user'@'localhost';
FLUSH PRIVILEGES;
"

echo "✅ Database setup complete!"
echo ""
echo "📝 Updating backend configuration..."

# Update the .env file
cat > /home/mohammedazab/myRepo/products-DB/backend/.env << EOF
# Environment Configuration
NODE_ENV=development
PORT=5000

# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_NAME=products_db
DB_USER=products_user
DB_PASSWORD=products_password

# Security
JWT_SECRET=your-super-secret-jwt-key-change-in-production
API_RATE_LIMIT=100

# CORS
CORS_ORIGIN=http://localhost:3000

# File Upload
MAX_FILE_SIZE=10485760
UPLOAD_PATH=./uploads
EOF

echo "🎉 Setup complete! You can now run:"
echo "   cd /home/mohammedazab/myRepo/products-DB"
echo "   npm run dev"
