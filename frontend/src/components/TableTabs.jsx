import React, { useState } from 'react'
import { Plus, X } from 'lucide-react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { tablesApi } from '../lib/api'
import toast from 'react-hot-toast'

const TableTabs = ({ tables, activeTable, onTableSwitch, onTablesChange }) => {
  const [showNewTableInput, setShowNewTableInput] = useState(false)
  const [newTableName, setNewTableName] = useState('')

  const handleCreateTable = async () => {
    if (!newTableName.trim()) return

    try {
      await tablesApi.createTable({
        name: newTableName.trim(),
        columns: [
          { name: 'id', type: 'integer', primaryKey: true, autoIncrement: true },
          { name: 'name', type: 'varchar', length: 255 },
          { name: 'description', type: 'text' },
          { name: 'created_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP' }
        ]
      })
      
      setNewTableName('')
      setShowNewTableInput(false)
      onTablesChange()
      toast.success('Table created successfully')
    } catch (error) {
      toast.error('Failed to create table')
    }
  }

  const handleDeleteTable = async (tableName, e) => {
    e.stopPropagation()
    
    if (!confirm(`Are you sure you want to delete table "${tableName}"?`)) {
      return
    }

    try {
      await tablesApi.deleteTable(tableName)
      onTablesChange()
      toast.success('Table deleted successfully')
    } catch (error) {
      toast.error('Failed to delete table')
    }
  }

  return (
    <div className="border-b bg-muted/50">
      <div className="flex items-center space-x-1 px-2 py-2 overflow-x-auto">
        {tables.map((table) => (
          <div
            key={table.name}
            className={`
              group relative flex items-center space-x-2 px-4 py-2 rounded-md cursor-pointer
              ${activeTable === table.name 
                ? 'bg-background text-foreground border border-border' 
                : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
              }
            `}
            onClick={() => onTableSwitch(table.name)}
          >
            <span className="whitespace-nowrap font-medium">{table.name}</span>
            <button
              onClick={(e) => handleDeleteTable(table.name, e)}
              className="opacity-0 group-hover:opacity-100 transition-opacity hover:text-destructive"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
        
        {showNewTableInput ? (
          <div className="flex items-center space-x-2 px-2">
            <Input
              value={newTableName}
              onChange={(e) => setNewTableName(e.target.value)}
              placeholder="Table name"
              className="h-8 w-32"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreateTable()
                if (e.key === 'Escape') {
                  setShowNewTableInput(false)
                  setNewTableName('')
                }
              }}
              autoFocus
            />
            <Button size="sm" onClick={handleCreateTable}>
              Create
            </Button>
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={() => {
                setShowNewTableInput(false)
                setNewTableName('')
              }}
            >
              Cancel
            </Button>
          </div>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowNewTableInput(true)}
            className="flex items-center space-x-1 text-muted-foreground hover:text-foreground"
          >
            <Plus className="h-4 w-4" />
            <span>Add Table</span>
          </Button>
        )}
      </div>
    </div>
  )
}

export default TableTabs
