#!/bin/bash

echo "=== Database Configuration Helper ==="
echo ""
echo "Please provide the following information from your hosting panel:"
echo ""

read -p "Database Hostname (current: db5018580491.hosting-data.io): " DB_HOST
DB_HOST=${DB_HOST:-"db5018580491.hosting-data.io"}

read -p "Database Port (current: 3306): " DB_PORT
DB_PORT=${DB_PORT:-"3306"}

read -p "Database Name (current: dbu378229): " DB_NAME
DB_NAME=${DB_NAME:-"dbu378229"}

read -p "Database Username (current: dbu378229): " DB_USER
DB_USER=${DB_USER:-"dbu378229"}

echo ""
read -s -p "Database Password: " DB_PASSWORD
echo ""

echo ""
echo "=== Testing Connection ==="

# Update .env file
cat > .env << EOF
# Environment Configuration
NODE_ENV=development
PORT=5000

# Database Configuration
DB_HOST=$DB_HOST
DB_PORT=$DB_PORT
DB_NAME=$DB_NAME
DB_USER=$DB_USER
DB_PASSWORD=$DB_PASSWORD

# Security
JWT_SECRET=your-super-secret-jwt-key-change-in-production
API_RATE_LIMIT=100

# CORS
CORS_ORIGIN=http://localhost:3000

# File Upload
MAX_FILE_SIZE=10485760
EOF

echo "✅ Configuration saved to .env file"
echo ""
echo "Testing connection..."
node test-db-connection.js
