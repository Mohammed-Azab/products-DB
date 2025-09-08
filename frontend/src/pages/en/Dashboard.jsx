import React, { useState, useEffect } from 'react'
import Header from '../../components/Header'
import TableTabs from '../../components/TableTabs'
import DataTable from '../../components/DataTable'
import SearchModal from '../../components/SearchModal'
import StatsModal from '../../components/StatsModal'
import { tablesApi, dataApi } from '../../lib/api'
import toast from 'react-hot-toast'

function EnglishDashboard() {
  const [tables, setTables] = useState([])
  const [activeTable, setActiveTable] = useState(null)
  const [tableData, setTableData] = useState([])
  const [tableColumns, setTableColumns] = useState([])
  const [loading, setLoading] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const [showStats, setShowStats] = useState(false)

  // Set document direction for English
  useEffect(() => {
    document.dir = 'ltr'
    document.documentElement.lang = 'en'
  }, [])

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
      setTableData(response.data.rows)
      setTableColumns(response.data.columns)
    } catch (error) {
      toast.error(`Failed to load ${tableName} data`)
      console.error(`Error loading ${tableName} data:`, error)
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = () => {
    if (activeTable) {
      loadTableData(activeTable)
    }
  }

  const handleAddRecord = async (data) => {
    try {
      await dataApi.addRecord(activeTable, data)
      toast.success('Record added successfully')
      loadTableData(activeTable)
    } catch (error) {
      toast.error('Failed to add record')
      console.error('Error adding record:', error)
    }
  }

  const handleUpdateRecord = async (id, data) => {
    try {
      await dataApi.updateRecord(activeTable, id, data)
      toast.success('Record updated successfully')
      loadTableData(activeTable)
    } catch (error) {
      toast.error('Failed to update record')
      console.error('Error updating record:', error)
    }
  }

  const handleDeleteRecord = async (id) => {
    try {
      await dataApi.deleteRecord(activeTable, id)
      toast.success('Record deleted successfully')
      loadTableData(activeTable)
    } catch (error) {
      toast.error('Failed to delete record')
      console.error('Error deleting record:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        onSearch={() => setShowSearch(true)}
        onStats={() => setShowStats(true)}
        language="en"
      />
      
      <main className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow">
          <TableTabs
            tables={tables}
            activeTable={activeTable}
            onTableChange={setActiveTable}
            language="en"
          />
          
          <DataTable
            data={tableData}
            columns={tableColumns}
            loading={loading}
            onRefresh={handleRefresh}
            onAdd={handleAddRecord}
            onUpdate={handleUpdateRecord}
            onDelete={handleDeleteRecord}
            language="en"
          />
        </div>
      </main>

      {showSearch && (
        <SearchModal
          tables={tables}
          onClose={() => setShowSearch(false)}
          language="en"
        />
      )}

      {showStats && (
        <StatsModal
          tables={tables}
          onClose={() => setShowStats(false)}
          language="en"
        />
      )}
    </div>
  )
}

export default EnglishDashboard
