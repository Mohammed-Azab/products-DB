// Mock backend for demo purposes
const express = require('express')
const cors = require('cors')

const app = express()
const PORT = 5000

app.use(cors())
app.use(express.json())

// Mock data
const mockTables = [
  { name: 'products', displayName: 'المنتجات' },
  { name: 'suppliers', displayName: 'الموردين' }
]

const mockData = {
  products: [
    { id: 1, name: 'منتج تجريبي', description: 'وصف المنتج', price: 100, category: 'فئة أ' },
    { id: 2, name: 'منتج آخر', description: 'وصف آخر', price: 200, category: 'فئة ب' }
  ],
  suppliers: [
    { id: 1, name: 'مورد تجريبي', email: 'supplier@example.com', phone: '123456789' },
    { id: 2, name: 'مورد آخر', email: 'supplier2@example.com', phone: '987654321' }
  ]
}

// Routes
app.get('/api/tables', (req, res) => {
  res.json({ tables: mockTables })
})

app.get('/api/data/:table', (req, res) => {
  const tableName = req.params.table
  const data = mockData[tableName] || []
  res.json({ 
    data,
    columns: Object.keys(data[0] || {}),
    total: data.length
  })
})

app.listen(PORT, () => {
  console.log(`Mock server running on port ${PORT}`)
})
