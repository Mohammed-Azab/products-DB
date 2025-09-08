const express = require('express')
const mysql = require('mysql2/promise')
const router = express.Router()
const db = require('../config/database')
const { validateTableCreation, validateTableUpdate } = require('../middleware/validation')

// Get all tables
router.get('/', async (req, res) => {
  try {
    const tables = await db.getTables()
    res.json(tables)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Get specific table structure
router.get('/:tableName', async (req, res) => {
  try {
    const { tableName } = req.params
    const columns = await db.getTableColumns(tableName)
    res.json({ name: tableName, columns })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Create new table
router.post('/', validateTableCreation, async (req, res) => {
  try {
    const { name, columns, displayName } = req.body

    await db.transaction(async (connection) => {
      // Build CREATE TABLE SQL
      const columnDefinitions = columns.map(col => {
        let def = `${mysql.escapeId(col.name)} ${col.type.toUpperCase()}`
        
        if (col.length) {
          def += `(${col.length})`
        }
        
        if (col.primaryKey) {
          def += ' PRIMARY KEY'
        }
        
        if (col.autoIncrement) {
          def += ' AUTO_INCREMENT'
        }
        
        if (!col.nullable && !col.primaryKey) {
          def += ' NOT NULL'
        }
        
        if (col.default) {
          def += ` DEFAULT ${col.default}`
        }
        
        return def
      }).join(', ')

      const createTableSql = `CREATE TABLE ${mysql.escapeId(name)} (${columnDefinitions})`
      await connection.execute(createTableSql)

      // Add to metadata
      await connection.execute(
        'INSERT INTO table_metadata (table_name, display_name) VALUES (?, ?)',
        [name, displayName || name]
      )
    })

    res.status(201).json({ message: 'Table created successfully', name })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Update table structure
router.put('/:tableName', validateTableUpdate, async (req, res) => {
  try {
    const { tableName } = req.params
    const { action, column } = req.body

    await db.transaction(async (connection) => {
      if (action === 'add_column') {
        let def = `${mysql.escapeId(column.name)} ${column.type.toUpperCase()}`
        
        if (column.length) {
          def += `(${column.length})`
        }
        
        if (!column.nullable) {
          def += ' NOT NULL'
        }
        
        if (column.default) {
          def += ` DEFAULT ${column.default}`
        }

        const sql = `ALTER TABLE ${mysql.escapeId(tableName)} ADD COLUMN ${def}`
        await connection.execute(sql)
        
      } else if (action === 'delete_column') {
        const sql = `ALTER TABLE ${mysql.escapeId(tableName)} DROP COLUMN ${mysql.escapeId(column)}`
        await connection.execute(sql)
      }

      // Update metadata timestamp
      await connection.execute(
        'UPDATE table_metadata SET updated_at = CURRENT_TIMESTAMP WHERE table_name = ?',
        [tableName]
      )
    })

    res.json({ message: 'Table updated successfully' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Delete table
router.delete('/:tableName', async (req, res) => {
  try {
    const { tableName } = req.params

    await db.transaction(async (connection) => {
      await connection.execute(`DROP TABLE IF EXISTS ${mysql.escapeId(tableName)}`)
      await connection.execute('DELETE FROM table_metadata WHERE table_name = ?', [tableName])
    })

    res.json({ message: 'Table deleted successfully' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

module.exports = router
