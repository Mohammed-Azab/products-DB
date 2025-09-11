import React, { useState, useEffect } from 'react'
import HeaderAr from '../../components/ar/HeaderAr'
import CategoryTabsAr from '../../components/ar/CategoryTabsAr'
import DataTableAr from '../../components/ar/DataTableAr'
import SearchModalAr from '../../components/ar/SearchModalAr'
import StatsModalAr from '../../components/ar/StatsModalAr'
import { tablesApi, dataApi } from '../../lib/api'
import toast from 'react-hot-toast'

function ArabicDashboard() {
  const [tables, setTables] = useState([])
  const [activeTable, setActiveTable] = useState(null)
  const [tableData, setTableData] = useState([])
  const [tableColumns, setTableColumns] = useState([])
  const [loading, setLoading] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const [showStats, setShowStats] = useState(false)

  // Set document direction for Arabic
  useEffect(() => {
    document.dir = 'rtl'
    document.documentElement.lang = 'ar'
    document.body.style.fontFamily = "'Cairo', 'Segoe UI', 'Tahoma', 'Arial', 'Helvetica Neue', sans-serif"
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
      toast.error('فشل في تحميل الجداول')
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
      toast.error(`فشل في تحميل بيانات ${tableName}`)
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
      toast.success('تم إضافة السجل بنجاح')
      loadTableData(activeTable)
    } catch (error) {
      toast.error('فشل في إضافة السجل')
      console.error('Error adding record:', error)
    }
  }

  const handleUpdateRecord = async (id, data) => {
    try {
      await dataApi.updateRecord(activeTable, id, data)
      toast.success('تم تحديث السجل بنجاح')
      loadTableData(activeTable)
    } catch (error) {
      toast.error('فشل في تحديث السجل')
      console.error('Error updating record:', error)
    }
  }

  const handleDeleteRecord = async (id) => {
    try {
      await dataApi.deleteRecord(activeTable, id)
      toast.success('تم حذف السجل بنجاح')
      loadTableData(activeTable)
    } catch (error) {
      toast.error('فشل في حذف السجل')
      console.error('Error deleting record:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <HeaderAr 
        onSearch={() => setShowSearch(true)}
        onStats={() => setShowStats(true)}
      />
      
      <main className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow">
          <CategoryTabsAr
            tables={tables}
            activeTable={activeTable}
            onTableSelect={setActiveTable}
          />
          
          <DataTableAr
            data={tableData}
            columns={tableColumns}
            loading={loading}
            onRefresh={handleRefresh}
            onAdd={handleAddRecord}
            onUpdate={handleUpdateRecord}
            onDelete={handleDeleteRecord}
          />
        </div>
      </main>

      {showSearch && (
        <SearchModalAr
          tables={tables}
          onClose={() => setShowSearch(false)}
        />
      )}

      {showStats && (
        <StatsModalAr
          tables={tables}
          onClose={() => setShowStats(false)}
        />
      )}
    </div>
  )
}

export default ArabicDashboard
