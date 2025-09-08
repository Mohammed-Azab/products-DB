const express = require('express')
const router = express.Router()
const mysql = require('mysql2/promise')
const { Parser } = require('@json2csv/plainjs')
const XLSX = require('xlsx')
const db = require('../config/database')

// Get statistics for a specific table
router.get('/stats/:tableName', async (req, res) => {
  try {
    const { tableName } = req.params
    
    // Get basic table info
    const [tableInfo] = await db.query(`
      SELECT 
        table_name as name,
        CREATE_TIME as created_at,
        UPDATE_TIME as updated_at
      FROM information_schema.tables 
      WHERE table_schema = DATABASE() AND table_name = ?
    `, [tableName])
    
    // Get row count
    const [rowCount] = await db.query(`SELECT COUNT(*) as count FROM ${mysql.escapeId(tableName)}`)
    
    // Get columns info
    const columns = await db.getTableColumns(tableName)
    
    // Get column statistics
    const columnStats = []
    for (const column of columns) {
      const [nullCount] = await db.query(`
        SELECT COUNT(*) as count FROM ${mysql.escapeId(tableName)} 
        WHERE ${mysql.escapeId(column.name)} IS NULL
      `)
      
      columnStats.push({
        name: column.name,
        type: column.type,
        nullable: column.nullable === 'YES',
        nullCount: nullCount.count
      })
    }
    
    res.json({
      tableInfo: {
        ...tableInfo,
        created_at: tableInfo?.created_at || new Date(),
        updated_at: tableInfo?.updated_at || new Date()
      },
      totalRows: rowCount.count,
      totalColumns: columns.length,
      columnStats
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Get global statistics
router.get('/stats', async (req, res) => {
  try {
    const tables = await db.getTables()
    let totalRows = 0
    let totalColumns = 0
    const tableStats = []
    
    for (const table of tables) {
      try {
        const [rowCount] = await db.query(`SELECT COUNT(*) as count FROM ${mysql.escapeId(table.name)}`)
        const columns = await db.getTableColumns(table.name)
        
        totalRows += rowCount.count
        totalColumns += columns.length
        
        tableStats.push({
          name: table.name,
          rowCount: rowCount.count,
          columnCount: columns.length
        })
      } catch (error) {
        console.error(`Error getting stats for table ${table.name}:`, error)
      }
    }
    
    res.json({
      totalRows,
      totalColumns,
      tableCount: tables.length,
      tables: tableStats
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Generate custom report
router.post('/generate', async (req, res) => {
  try {
    const { tables, columns, filters, groupBy, orderBy } = req.body
    
    if (!tables || tables.length === 0) {
      return res.status(400).json({ error: 'At least one table must be specified' })
    }
    
    // For now, support single table reports
    const tableName = tables[0]
    let sql = `SELECT `
    
    // Select columns
    if (columns && columns.length > 0) {
      sql += columns.map(col => mysql.escapeId(col)).join(', ')
    } else {
      sql += '*'
    }
    
    sql += ` FROM ${mysql.escapeId(tableName)}`
    const params = []
    
    // Add filters
    if (filters && filters.length > 0) {
      const conditions = filters.map(filter => {
        params.push(filter.value)
        return `${mysql.escapeId(filter.column)} ${filter.operator || '='} ?`
      })
      sql += ` WHERE ${conditions.join(' AND ')}`
    }
    
    // Add grouping
    if (groupBy && groupBy.length > 0) {
      sql += ` GROUP BY ${groupBy.map(col => mysql.escapeId(col)).join(', ')}`
    }
    
    // Add ordering
    if (orderBy && orderBy.length > 0) {
      const orderClauses = orderBy.map(order => 
        `${mysql.escapeId(order.column)} ${order.direction || 'ASC'}`
      )
      sql += ` ORDER BY ${orderClauses.join(', ')}`
    }
    
    // Limit results for safety
    sql += ` LIMIT 1000`
    
    const results = await db.query(sql, params)
    
    res.json({
      report: {
        sql: sql.replace(/\?/g, (match, offset, string) => {
          const paramIndex = string.substring(0, offset).split('?').length - 1
          return `'${params[paramIndex]}'`
        }),
        rowCount: results.length,
        data: results
      }
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Export table data
router.get('/export/:tableName', async (req, res) => {
  try {
    const { tableName } = req.params
    const { format = 'csv' } = req.query
    
    // Get all data from table
    const data = await db.query(`SELECT * FROM ${mysql.escapeId(tableName)}`)
    
    if (data.length === 0) {
      return res.status(404).json({ error: 'No data found' })
    }
    
    switch (format.toLowerCase()) {
      case 'csv':
        const parser = new Parser()
        const csv = parser.parse(data)
        
        res.setHeader('Content-Type', 'text/csv')
        res.setHeader('Content-Disposition', `attachment; filename="${tableName}.csv"`)
        res.send(csv)
        break
        
      case 'json':
        res.setHeader('Content-Type', 'application/json')
        res.setHeader('Content-Disposition', `attachment; filename="${tableName}.json"`)
        res.json(data)
        break
        
      case 'xlsx':
        const worksheet = XLSX.utils.json_to_sheet(data)
        const workbook = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(workbook, worksheet, tableName)
        
        const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })
        
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
        res.setHeader('Content-Disposition', `attachment; filename="${tableName}.xlsx"`)
        res.send(buffer)
        break
        
      default:
        res.status(400).json({ error: 'Unsupported format. Use csv, json, or xlsx' })
    }
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

module.exports = router
