# Products Database Management System

A full-stack web application for managing product databases with an Excel-like interface.

## Features

- **Excel-style Interface**: Tabbed interface with spreadsheet-like data editing
- **Real-time CRUD Operations**: Add, edit, delete rows and columns
- **Advanced Search**: Search within tables or across all tables
- **Reports & Statistics**: Generate insights and export data
- **Responsive Design**: Modern UI with Tailwind CSS and shadcn/ui components
- **MySQL Integration**: Connect to your IONOS or any MySQL database

## Tech Stack

### Frontend
- React 18
- Vite (build tool)
- Tailwind CSS
- shadcn/ui components
- Lucide React icons
- React Hot Toast
- Axios for API calls

### Backend
- Node.js with Express
- MySQL2 for database connectivity
- Joi for validation
- CORS, Helmet for security
- Rate limiting
- CSV/JSON/Excel export capabilities

## Quick Start

### Prerequisites
- Node.js 16+
- MySQL database (can be hosted on IONOS or locally)

### 1. Clone and Setup

```bash
git clone <your-repo>
cd products-DB
```

### 2. Backend Setup

```bash
cd backend
npm install

# Copy environment file and configure your database
cp .env.example .env
# Edit .env with your IONOS database credentials
```

Configure your `.env` file:
```env
DB_HOST=your-ionos-database-host.com
DB_PORT=3306
DB_NAME=your_database_name
DB_USER=your_username
DB_PASSWORD=your_password
```

### 3. Frontend Setup

```bash
cd ../frontend
npm install
```

### 4. Run the Application

Start the backend:
```bash
cd backend
npm run dev
```

Start the frontend (in a new terminal):
```bash
cd frontend
npm run dev
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## Database Setup

The application will automatically:
1. Create the database if it doesn't exist
2. Set up sample tables (Products, Suppliers)
3. Insert sample data for testing

### Sample Tables Created:

**Products Table:**
- id, name, description, price, category, stock_quantity, sku, supplier, created_at, updated_at

**Suppliers Table:**
- id, name, contact_person, email, phone, address, country, rating, created_at, updated_at

## API Documentation

### Tables API
- `GET /api/tables` - Get all tables
- `POST /api/tables` - Create new table
- `PUT /api/tables/:name` - Update table structure
- `DELETE /api/tables/:name` - Delete table

### Data API
- `GET /api/data/:tableName` - Get table data
- `POST /api/data/:tableName` - Create new record
- `PUT /api/data/:tableName/:id` - Update record
- `DELETE /api/data/:tableName/:id` - Delete record
- `PUT /api/data/:tableName/bulk` - Bulk update
- `DELETE /api/data/:tableName/bulk` - Bulk delete

### Search API
- `GET /api/search/:tableName?q=query` - Search in specific table
- `GET /api/search?q=query` - Global search across all tables

### Reports API
- `GET /api/reports/stats/:tableName` - Get table statistics
- `GET /api/reports/stats` - Get global statistics
- `GET /api/reports/export/:tableName?format=csv` - Export data (csv/json/xlsx)

## Usage Guide

### Managing Tables
1. Click "Add Table" to create new tables
2. Define columns with types (text, number, date, etc.)
3. Switch between tables using the tab interface

### Editing Data
1. Click any cell to edit its value
2. Use "Add Row" to insert new records
3. Select multiple rows and use "Delete Selected"
4. Add/remove columns using the column management tools

### Searching
1. Click the "Search" button in the header
2. Choose to search current table or all tables
3. Results show matching records with context

### Reports & Export
1. Click "Reports" to view statistics
2. See row counts, column info, and table details
3. Export data as CSV, JSON, or Excel files

## Deployment

### Frontend (for IONOS hosting)
```bash
cd frontend
npm run build
# Upload the 'dist' folder to your IONOS web hosting
```

### Backend (for IONOS or VPS)
```bash
cd backend
# Set NODE_ENV=production in .env
# Configure production database settings
npm start
```

## Customization

### Adding New Column Types
Edit `backend/middleware/validation.js` to add new column types.

### Styling
Modify `frontend/src/index.css` and Tailwind configuration.

### Additional Features
- Add authentication by implementing JWT middleware
- Add file upload capabilities
- Implement real-time updates with WebSockets
- Add data visualization charts

## Security Notes

- Change default JWT secret in production
- Configure proper CORS origins
- Use environment variables for sensitive data
- Implement proper user authentication for production use
- Regular database backups recommended

## Troubleshooting

### Database Connection Issues
- Verify IONOS database credentials
- Check firewall settings
- Ensure database server is accessible

### Build Issues
- Clear node_modules and reinstall
- Check Node.js version compatibility
- Verify all environment variables are set

## Support

For issues and questions, check the console logs for detailed error messages. The application includes comprehensive error handling and logging.
