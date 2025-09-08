import React, { useState, useCallback, useMemo } from 'react'
import { Plus, Minus, Edit, Trash2, Save, X } from 'lucide-react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Card, CardContent } from './ui/card'

const DataTable = ({ 
  data, 
  columns, 
  tableName, 
  loading, 
  onDataUpdate, 
  onAddRow, 
  onDeleteRow, 
  onAddColumn, 
  onDeleteColumn 
}) => {
  const [editingCell, setEditingCell] = useState(null)
  const [editingValue, setEditingValue] = useState('')
  const [selectedRows, setSelectedRows] = useState(new Set())
  const [showAddColumn, setShowAddColumn] = useState(false)
  const [newColumnName, setNewColumnName] = useState('')
  const [newColumnType, setNewColumnType] = useState('varchar')

  const tableData = useMemo(() => data || [], [data])
  const tableColumns = useMemo(() => columns || [], [columns])

  const handleCellEdit = (rowIndex, columnName, value) => {
    setEditingCell({ rowIndex, columnName })
    setEditingValue(value || '')
  }

  const handleCellSave = () => {
    if (!editingCell) return

    const updatedData = [...tableData]
    updatedData[editingCell.rowIndex] = {
      ...updatedData[editingCell.rowIndex],
      [editingCell.columnName]: editingValue
    }
    
    onDataUpdate(updatedData)
    setEditingCell(null)
    setEditingValue('')
  }

  const handleCellCancel = () => {
    setEditingCell(null)
    setEditingValue('')
  }

  const handleAddRow = () => {
    const newRow = {}
    tableColumns.forEach(col => {
      if (col.name !== 'id') {
        newRow[col.name] = ''
      }
    })
    onAddRow(newRow)
  }

  const handleDeleteSelectedRows = () => {
    if (selectedRows.size === 0) return
    
    if (!confirm(`Delete ${selectedRows.size} selected rows?`)) return

    selectedRows.forEach(rowIndex => {
      const row = tableData[rowIndex]
      if (row?.id) {
        onDeleteRow(row.id)
      }
    })
    setSelectedRows(new Set())
  }

  const handleAddColumn = () => {
    if (!newColumnName.trim()) return

    onAddColumn({
      name: newColumnName.trim(),
      type: newColumnType,
      length: newColumnType === 'varchar' ? 255 : null
    })

    setNewColumnName('')
    setShowAddColumn(false)
  }

  const toggleRowSelection = (rowIndex) => {
    const newSelection = new Set(selectedRows)
    if (newSelection.has(rowIndex)) {
      newSelection.delete(rowIndex)
    } else {
      newSelection.add(rowIndex)
    }
    setSelectedRows(newSelection)
  }

  const selectAllRows = () => {
    if (selectedRows.size === tableData.length) {
      setSelectedRows(new Set())
    } else {
      setSelectedRows(new Set(tableData.map((_, index) => index)))
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="text-muted-foreground">Loading...</div>
        </CardContent>
      </Card>
    )
  }

  if (tableColumns.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="text-muted-foreground">No data available</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="p-0">
        {/* Toolbar */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center space-x-2">
            <Button size="sm" onClick={handleAddRow}>
              <Plus className="h-4 w-4 mr-1" />
              Add Row
            </Button>
            <Button 
              size="sm" 
              variant="destructive" 
              onClick={handleDeleteSelectedRows}
              disabled={selectedRows.size === 0}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Delete Selected ({selectedRows.size})
            </Button>
          </div>
          
          <div className="flex items-center space-x-2">
            {showAddColumn ? (
              <div className="flex items-center space-x-2">
                <Input
                  value={newColumnName}
                  onChange={(e) => setNewColumnName(e.target.value)}
                  placeholder="Column name"
                  className="h-8 w-32"
                />
                <select
                  value={newColumnType}
                  onChange={(e) => setNewColumnType(e.target.value)}
                  className="h-8 px-2 border rounded"
                >
                  <option value="varchar">Text</option>
                  <option value="integer">Number</option>
                  <option value="decimal">Decimal</option>
                  <option value="boolean">Boolean</option>
                  <option value="date">Date</option>
                  <option value="timestamp">DateTime</option>
                </select>
                <Button size="sm" onClick={handleAddColumn}>
                  <Save className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setShowAddColumn(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <Button size="sm" variant="outline" onClick={() => setShowAddColumn(true)}>
                <Plus className="h-4 w-4 mr-1" />
                Add Column
              </Button>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-auto max-h-[600px]">
          <table className="w-full">
            <thead className="sticky top-0 bg-muted/50 border-b">
              <tr>
                <th className="w-12 p-2 text-left">
                  <input
                    type="checkbox"
                    checked={selectedRows.size === tableData.length && tableData.length > 0}
                    onChange={selectAllRows}
                    className="rounded"
                  />
                </th>
                {tableColumns.map((column) => (
                  <th key={column.name} className="p-2 text-left font-medium text-sm border-r">
                    <div className="flex items-center justify-between group">
                      <span>{column.name}</span>
                      {column.name !== 'id' && (
                        <button
                          onClick={() => onDeleteColumn(column.name)}
                          className="opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive/80"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tableData.map((row, rowIndex) => (
                <tr 
                  key={row.id || rowIndex} 
                  className={`border-b hover:bg-muted/25 ${selectedRows.has(rowIndex) ? 'bg-muted/50' : ''}`}
                >
                  <td className="p-2">
                    <input
                      type="checkbox"
                      checked={selectedRows.has(rowIndex)}
                      onChange={() => toggleRowSelection(rowIndex)}
                      className="rounded"
                    />
                  </td>
                  {tableColumns.map((column) => (
                    <td key={column.name} className="p-1 border-r">
                      {editingCell?.rowIndex === rowIndex && editingCell?.columnName === column.name ? (
                        <div className="flex items-center space-x-1">
                          <Input
                            value={editingValue}
                            onChange={(e) => setEditingValue(e.target.value)}
                            className="h-8 text-sm"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleCellSave()
                              if (e.key === 'Escape') handleCellCancel()
                            }}
                            autoFocus
                          />
                          <Button size="sm" onClick={handleCellSave}>
                            <Save className="h-3 w-3" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={handleCellCancel}>
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        <div
                          onClick={() => handleCellEdit(rowIndex, column.name, row[column.name])}
                          className="min-h-[32px] p-1 cursor-pointer hover:bg-accent rounded text-sm flex items-center"
                        >
                          {row[column.name] || (column.name === 'id' ? row.id : '')}
                        </div>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {tableData.length === 0 && (
          <div className="p-8 text-center text-muted-foreground">
            No data in this table. Click "Add Row" to get started.
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default DataTable
