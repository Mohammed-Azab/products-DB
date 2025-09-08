const express = require('express')
const router = express.Router()
const mysql = require('mysql2/promise')
const db = require('../config/database')

// Search in specific table
router.get('/:tableName', async (req, res) => {
  try {
    const { tableName } = req.params
    const { q: query, limit = 50 } = req.query
    
    if (!query) {
      return res.status(400).json({ error: 'Search query is required' })
    }
    
    // Get table columns
    const columns = await db.getTableColumns(tableName)
    const searchableColumns = columns.filter(col => 
      ['varchar', 'text', 'char'].includes(col.type.toLowerCase())
    )
    
    if (searchableColumns.length === 0) {
      return res.json({ results: [] })
    }
    
    // Build search query
    const searchConditions = searchableColumns.map(col => 
      `${mysql.escapeId(col.name)} LIKE ?`
    ).join(' OR ')
    
    const searchValue = `%${query}%`
    const searchParams = searchableColumns.map(() => searchValue)
    
    const sql = `
      SELECT * FROM ${mysql.escapeId(tableName)} 
      WHERE ${searchConditions}
      LIMIT ?
    `
    
    const results = await db.query(sql, [...searchParams, parseInt(limit)])
    
    // Format results
    const formattedResults = results.map(row => ({
      tableName,
      id: row.id,
      data: row
    }))
    
    res.json({ results: formattedResults })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Global search across all tables
router.get('/', async (req, res) => {
  try {
    const { q: query, limit = 100 } = req.query
    
    if (!query) {
      return res.status(400).json({ error: 'Search query is required' })
    }
    
    // Get all tables
    const tables = await db.getTables()
    const allResults = []
    
    for (const table of tables) {
      try {
        // Get searchable columns for this table
        const columns = await db.getTableColumns(table.name)
        const searchableColumns = columns.filter(col => 
          ['varchar', 'text', 'char'].includes(col.type.toLowerCase())
        )
        
        if (searchableColumns.length === 0) continue
        
        // Build search query for this table
        const searchConditions = searchableColumns.map(col => 
          `${mysql.escapeId(col.name)} LIKE ?`
        ).join(' OR ')
        
        const searchValue = `%${query}%`
        const searchParams = searchableColumns.map(() => searchValue)
        
        const sql = `
          SELECT * FROM ${mysql.escapeId(table.name)} 
          WHERE ${searchConditions}
          LIMIT ?
        `
        
        const results = await db.query(sql, [...searchParams, 20])
        
        // Add table context to results
        const tableResults = results.map(row => ({
          tableName: table.name,
          id: row.id,
          data: row,
          score: calculateRelevanceScore(row, query, searchableColumns)
        }))
        
        allResults.push(...tableResults)
      } catch (error) {
        console.error(`Error searching table ${table.name}:`, error)
        // Continue with other tables even if one fails
      }
    }
    
    // Sort by relevance and limit results
    allResults.sort((a, b) => b.score - a.score)
    const limitedResults = allResults.slice(0, parseInt(limit))
    
    res.json({ 
      results: limitedResults.map(({ score, ...result }) => result),
      totalFound: allResults.length
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Calculate relevance score for search results
function calculateRelevanceScore(row, query, searchableColumns) {
  let score = 0
  const queryLower = query.toLowerCase()
  
  searchableColumns.forEach(col => {
    const value = row[col.name]
    if (value) {
      const valueLower = value.toString().toLowerCase()
      
      // Exact match gets highest score
      if (valueLower === queryLower) {
        score += 100
      }
      // Starts with query gets high score
      else if (valueLower.startsWith(queryLower)) {
        score += 50
      }
      // Contains query gets medium score
      else if (valueLower.includes(queryLower)) {
        score += 25
      }
      
      // Boost score for shorter matches (more precise)
      if (valueLower.includes(queryLower)) {
        score += Math.max(1, 10 - (valueLower.length - queryLower.length) / 10)
      }
    }
  })
  
  return score
}

module.exports = router
