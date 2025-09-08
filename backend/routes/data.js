const express = require('express')
const router = express.Router()
const mysql = require('mysql2/promise')
const db = require('../config/database')

// Get data from a specific table
router.get('/:tableName', async (req, res) => {
  try {
    const { tableName } = req.params
    const { limit = 1000, offset = 0, sortBy, sortOrder = 'ASC' } = req.query
    
    let sql = `SELECT * FROM ${mysql.escapeId(tableName)}`
    const params = []
    
    if (sortBy) {
      sql += ` ORDER BY ${mysql.escapeId(sortBy)} ${sortOrder.toUpperCase()}`
    }
    
    sql += ` LIMIT ? OFFSET ?`
    params.push(parseInt(limit), parseInt(offset))
    
    const data = await db.query(sql, params)
    const columns = await db.getTableColumns(tableName)
    
    res.json({ rows: data, columns })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Create new record
router.post('/:tableName', async (req, res) => {
  try {
    const { tableName } = req.params
    const data = req.body
    
    // Remove undefined/null values and id if present
    const cleanData = Object.fromEntries(
      Object.entries(data).filter(([key, value]) => 
        key !== 'id' && value !== undefined && value !== null && value !== ''
      )
    )
    
    const columns = Object.keys(cleanData)
    const values = Object.values(cleanData)
    const placeholders = columns.map(() => '?').join(', ')
    
    const sql = `INSERT INTO ${mysql.escapeId(tableName)} (${columns.map(col => mysql.escapeId(col)).join(', ')}) VALUES (${placeholders})`
    
    const result = await db.query(sql, values)
    
    // Get the created record
    const newRecord = await db.query(
      `SELECT * FROM ${mysql.escapeId(tableName)} WHERE id = ?`,
      [result.insertId]
    )
    
    res.status(201).json(newRecord[0])
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Update record
router.put('/:tableName/:id', async (req, res) => {
  try {
    const { tableName, id } = req.params
    const data = req.body
    
    // Remove id from update data
    delete data.id
    
    const columns = Object.keys(data)
    const values = Object.values(data)
    const setClause = columns.map(col => `${mysql.escapeId(col)} = ?`).join(', ')
    
    const sql = `UPDATE ${mysql.escapeId(tableName)} SET ${setClause} WHERE id = ?`
    
    await db.query(sql, [...values, id])
    
    // Get updated record
    const updatedRecord = await db.query(
      `SELECT * FROM ${mysql.escapeId(tableName)} WHERE id = ?`,
      [id]
    )
    
    res.json(updatedRecord[0])
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Bulk update records
router.put('/:tableName/bulk', async (req, res) => {
  try {
    const { tableName } = req.params
    const records = req.body
    
    if (!Array.isArray(records)) {
      return res.status(400).json({ error: 'Request body must be an array of records' })
    }
    
    await db.transaction(async (connection) => {
      for (const record of records) {
        if (!record.id) continue
        
        const data = { ...record }
        delete data.id
        
        const columns = Object.keys(data)
        const values = Object.values(data)
        const setClause = columns.map(col => `${mysql.escapeId(col)} = ?`).join(', ')
        
        const sql = `UPDATE ${mysql.escapeId(tableName)} SET ${setClause} WHERE id = ?`
        await connection.execute(sql, [...values, record.id])
      }
    })
    
    res.json({ message: 'Bulk update completed successfully' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Delete record
router.delete('/:tableName/:id', async (req, res) => {
  try {
    const { tableName, id } = req.params
    
    const sql = `DELETE FROM ${mysql.escapeId(tableName)} WHERE id = ?`
    await db.query(sql, [id])
    
    res.json({ message: 'Record deleted successfully' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Bulk delete records
router.delete('/:tableName/bulk', async (req, res) => {
  try {
    const { tableName } = req.params
    const { ids } = req.body
    
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'IDs array is required' })
    }
    
    const placeholders = ids.map(() => '?').join(', ')
    const sql = `DELETE FROM ${mysql.escapeId(tableName)} WHERE id IN (${placeholders})`
    
    await db.query(sql, ids)
    
    res.json({ message: 'Records deleted successfully' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

module.exports = router
