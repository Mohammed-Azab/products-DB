import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import Header from './components/Header'
import TableTabs from './components/TableTabs'
import DataTable from './components/DataTable'
import SearchModal from './components/SearchModal'
import StatsModal from './components/StatsModal'
import { tablesApi, dataApi } from './lib/api'
import toast from 'react-hot-toast'

function App() {
  const { i18n, t } = useTranslation()
  const [tables, setTables] = useState([])
  const [activeTable, setActiveTable] = useState(null)
  const [tableData, setTableData] = useState([])
  const [tableColumns, setTableColumns] = useState([])
  const [loading, setLoading] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const [showStats, setShowStats] = useState(false)

  // Set initial document direction for Arabic
  useEffect(() => {
    document.dir = i18n.language === 'ar' ? 'rtl' : 'ltr'
    document.documentElement.lang = i18n.language
  }, [i18n.language])

  // Load tables on mount
  useEffect(() => {
    loadTables()
  }, [])

  // Load table data when active table changes
  useEffect(() => {
    if (activeTable) {
      loadTableData(activeTable)
    }
  }, [activeTable])

  const loadTables = async () => {
    try {
      setLoading(true)
      const response = await tablesApi.getTables()
      setTables(response.data)
      if (response.data.length > 0 && !activeTable) {
        setActiveTable(response.data[0].name)
      }
    } catch (error) {
      toast.error('Failed to load tables')
      console.error('Error loading tables:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadTableData = async (tableName) => {
    try {
      setLoading(true)
      const response = await dataApi.getData(tableName)
      setTableData(response.data.rows || [])
      setTableColumns(response.data.columns || [])
    } catch (error) {
      toast.error(`Failed to load data for ${tableName}`)
      console.error('Error loading table data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleTableSwitch = (tableName) => {
    setActiveTable(tableName)
  }

  const handleDataUpdate = async (updatedData) => {
    try {
      // Optimistically update the UI
      setTableData(updatedData)
      
      // Save to backend
      await dataApi.bulkUpdate(activeTable, updatedData)
      toast.success('Data updated successfully')
    } catch (error) {
      toast.error('Failed to update data')
      // Reload data to revert optimistic update
      loadTableData(activeTable)
    }
  }

  const handleAddRow = async (newRow) => {
    try {
      const response = await dataApi.createRecord(activeTable, newRow)
      setTableData(prev => [...prev, response.data])
      toast.success('Row added successfully')
    } catch (error) {
      toast.error('Failed to add row')
    }
  }

  const handleDeleteRow = async (rowId) => {
    try {
      await dataApi.deleteRecord(activeTable, rowId)
      setTableData(prev => prev.filter(row => row.id !== rowId))
      toast.success('Row deleted successfully')
    } catch (error) {
      toast.error('Failed to delete row')
    }
  }

  const handleAddColumn = async (columnDef) => {
    try {
      await tablesApi.updateTable(activeTable, {
        action: 'add_column',
        column: columnDef
      })
      loadTableData(activeTable)
      toast.success('Column added successfully')
    } catch (error) {
      toast.error('Failed to add column')
    }
  }

  const handleDeleteColumn = async (columnName) => {
    try {
      await tablesApi.updateTable(activeTable, {
        action: 'delete_column',
        column: columnName
      })
      loadTableData(activeTable)
      toast.success('Column deleted successfully')
    } catch (error) {
      toast.error('Failed to delete column')
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Header 
        onSearch={() => setShowSearch(true)}
        onStats={() => setShowStats(true)}
        onRefresh={() => loadTableData(activeTable)}
      />
      
      <div className="container mx-auto px-4 py-6">
        <TableTabs
          tables={tables}
          activeTable={activeTable}
          onTableSwitch={handleTableSwitch}
          onTablesChange={loadTables}
        />
        
        {activeTable && (
          <div className="mt-6">
            <DataTable
              data={tableData}
              columns={tableColumns}
              tableName={activeTable}
              loading={loading}
              onDataUpdate={handleDataUpdate}
              onAddRow={handleAddRow}
              onDeleteRow={handleDeleteRow}
              onAddColumn={handleAddColumn}
              onDeleteColumn={handleDeleteColumn}
            />
          </div>
        )}
      </div>

      <SearchModal
        isOpen={showSearch}
        onClose={() => setShowSearch(false)}
        tables={tables}
        activeTable={activeTable}
      />

      <StatsModal
        isOpen={showStats}
        onClose={() => setShowStats(false)}
        activeTable={activeTable}
        tables={tables}
      />
    </div>
  )
}

export default App
