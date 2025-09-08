const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const compression = require('compression')
const morgan = require('morgan')
const rateLimit = require('express-rate-limit')
require('dotenv').config()

const db = require('./config/database')
const tablesRoutes = require('./routes/tables')
const dataRoutes = require('./routes/data')
const searchRoutes = require('./routes/search')
const reportsRoutes = require('./routes/reports')

const app = express()
const PORT = process.env.PORT || 5000

// Security middleware
app.use(helmet())
app.use(compression())

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}))

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.API_RATE_LIMIT || 100,
  message: 'Too many requests from this IP, please try again later.'
})
app.use('/api', limiter)

// Logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined'))
}

// Body parsing middleware
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() })
})

// API Routes
app.use('/api/tables', tablesRoutes)
app.use('/api/data', dataRoutes)
app.use('/api/search', searchRoutes)
app.use('/api/reports', reportsRoutes)

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' })
})

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack)
  
  if (err.name === 'ValidationError') {
    return res.status(400).json({ error: err.message })
  }
  
  if (err.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({ error: 'Duplicate entry' })
  }
  
  res.status(500).json({ 
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message 
  })
})

// Initialize database and start server
const startServer = async () => {
  try {
    // Test database connection
    await db.testConnection()
    console.log('Database connected successfully')
    
    // Initialize sample tables if they don't exist
    await db.initializeSampleData()
    console.log('Database initialized')
    
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`)
      console.log(`Environment: ${process.env.NODE_ENV}`)
    })
  } catch (error) {
    console.error('Failed to start server:', error)
    process.exit(1)
  }
}

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully')
  process.exit(0)
})

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully')
  process.exit(0)
})

if (require.main === module) {
  startServer()
}

module.exports = app
