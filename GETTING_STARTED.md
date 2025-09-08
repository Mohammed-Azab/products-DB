# Quick Start Guide

## Getting Started Without Local MySQL

Since you don't have MySQL running locally, here are your options:

### Option 1: Use Your IONOS Database (Recommended)
1. Edit `backend/.env` with your IONOS database credentials:
   ```env
   DB_HOST=your-ionos-database-host.com
   DB_PORT=3306
   DB_NAME=your_database_name
   DB_USER=your_username
   DB_PASSWORD=your_password
   ```

### Option 2: Install MySQL Locally (Quick Setup)
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install mysql-server
sudo mysql_secure_installation

# Then create a database
sudo mysql -u root -p
CREATE DATABASE products_db;
EXIT;
```

### Option 3: Use Docker MySQL (No System Installation)
```bash
# Run MySQL in Docker
docker run --name mysql-products -e MYSQL_ROOT_PASSWORD=password -e MYSQL_DATABASE=products_db -p 3306:3306 -d mysql:8.0

# Update backend/.env
DB_HOST=localhost
DB_PASSWORD=password
```

### Option 4: Use SQLite (Requires Code Changes)
If you prefer SQLite for testing, we can modify the code to use SQLite instead.

## Starting the Application

Once your database is configured:

```bash
cd /home/mohammedazab/myRepo/products-DB

# Start both frontend and backend
npm run dev
```

The application will:
- Automatically create the database if it doesn't exist
- Set up sample tables (Products, Suppliers)
- Insert sample data for testing

Access the application at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## Frontend-Only Demo

If you want to see the UI without setting up the database:

```bash
cd frontend
npm run dev
```

The UI will load but API calls will fail until the backend is configured with a working database.

## Troubleshooting

### Database Connection Issues
- Check your database credentials
- Ensure your database server is running
- Verify firewall settings for remote databases
- Check that the database allows connections from your IP

### PostCSS/Tailwind Issues
- Already fixed with postcss.config.cjs

### Module Issues
- Try deleting node_modules and running npm install again

## Next Steps

1. Configure your database connection
2. Start the application with `npm run dev`  
3. Open http://localhost:3000
4. Start managing your products database!

The application includes:
- Excel-like data editing
- Search across all tables
- Add/remove columns and rows
- Export data (CSV, JSON, Excel)
- Statistics and reporting
