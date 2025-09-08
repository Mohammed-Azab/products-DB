import React, { useState, useEffect } from 'react'
import { BarChart3, X, Download, TrendingUp } from 'lucide-react'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { reportsApi } from '../lib/api'
import toast from 'react-hot-toast'

const StatsModal = ({ isOpen, onClose, activeTable, tables }) => {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(false)
  const [scope, setScope] = useState('current') // 'current' or 'global'

  useEffect(() => {
    if (isOpen) {
      loadStats()
    }
  }, [isOpen, scope, activeTable])

  const loadStats = async () => {
    try {
      setLoading(true)
      let response

      if (scope === 'current' && activeTable) {
        response = await reportsApi.getTableStats(activeTable)
      } else {
        response = await reportsApi.getGlobalStats()
      }

      setStats(response.data)
    } catch (error) {
      toast.error('Failed to load statistics')
      console.error('Stats error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async (format) => {
    if (!activeTable) return

    try {
      const response = await reportsApi.exportData(activeTable, format)
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `${activeTable}.${format}`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
      
      toast.success(`Exported ${activeTable} as ${format.toUpperCase()}`)
    } catch (error) {
      toast.error('Export failed')
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-4xl max-h-[80vh] mx-4">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <BarChart3 className="h-5 w-5" />
            <span>Database Statistics & Reports</span>
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Scope Selection */}
          <div className="flex items-center space-x-4 p-4 bg-muted/50 rounded-lg">
            <span className="font-medium">Scope:</span>
            <label className="flex items-center space-x-2">
              <input
                type="radio"
                value="current"
                checked={scope === 'current'}
                onChange={(e) => setScope(e.target.value)}
                disabled={!activeTable}
              />
              <span>Current table ({activeTable})</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="radio"
                value="global"
                checked={scope === 'global'}
                onChange={(e) => setScope(e.target.value)}
              />
              <span>All tables</span>
            </label>
          </div>

          {/* Statistics Display */}
          {loading ? (
            <div className="text-center py-8">
              <div className="text-muted-foreground">Loading statistics...</div>
            </div>
          ) : stats ? (
            <div className="space-y-4">
              {/* Overview Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-primary">{stats.totalRows || 0}</div>
                    <div className="text-sm text-muted-foreground">Total Rows</div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-primary">{stats.totalColumns || 0}</div>
                    <div className="text-sm text-muted-foreground">Total Columns</div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-primary">
                      {scope === 'global' ? tables.length : 1}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {scope === 'global' ? 'Tables' : 'Table'}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Table Details */}
              {scope === 'current' && stats.tableInfo && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Table Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Table Name:</span>
                        <span className="font-medium">{stats.tableInfo.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Created:</span>
                        <span className="font-medium">
                          {new Date(stats.tableInfo.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Last Modified:</span>
                        <span className="font-medium">
                          {new Date(stats.tableInfo.updated_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Column Statistics */}
              {stats.columnStats && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Column Statistics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {stats.columnStats.map((col, index) => (
                        <div key={index} className="flex items-center justify-between p-2 border rounded">
                          <div>
                            <span className="font-medium">{col.name}</span>
                            <span className="text-sm text-muted-foreground ml-2">({col.type})</span>
                          </div>
                          <div className="text-sm">
                            {col.nullCount !== undefined && (
                              <span className="text-muted-foreground">
                                {col.nullCount} nulls
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Global Table List */}
              {scope === 'global' && stats.tables && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Tables Overview</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {stats.tables.map((table, index) => (
                        <div key={index} className="flex items-center justify-between p-2 border rounded">
                          <span className="font-medium">{table.name}</span>
                          <div className="text-sm text-muted-foreground">
                            {table.rowCount} rows, {table.columnCount} columns
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-muted-foreground">No statistics available</div>
            </div>
          )}

          {/* Export Options */}
          {scope === 'current' && activeTable && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center space-x-2">
                  <Download className="h-5 w-5" />
                  <span>Export Data</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex space-x-2">
                  <Button 
                    variant="outline" 
                    onClick={() => handleExport('csv')}
                    className="flex items-center space-x-2"
                  >
                    <span>Export CSV</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => handleExport('json')}
                    className="flex items-center space-x-2"
                  >
                    <span>Export JSON</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => handleExport('xlsx')}
                    className="flex items-center space-x-2"
                  >
                    <span>Export Excel</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default StatsModal
