import React, { useState } from 'react'
import { X, Search } from 'lucide-react'

function SearchModalAr({ tables, onClose }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTable, setSelectedTable] = useState('products')
  const [searchResults, setSearchResults] = useState([])
  const [loading, setLoading] = useState(false)

  const tableNames = {
    products: 'المنتجات',
    suppliers: 'الموردين',
    orders: 'الطلبات',
    categories: 'الفئات'
  }

  const handleSearch = async () => {
    if (!searchTerm.trim()) return
    
    setLoading(true)
    try {
      // Simulate search API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      setSearchResults([
        { id: 1, name: 'نتيجة البحث 1', description: 'وصف النتيجة الأولى' },
        { id: 2, name: 'نتيجة البحث 2', description: 'وصف النتيجة الثانية' }
      ])
    } catch (error) {
      console.error('Search error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" dir="rtl">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">البحث في البيانات</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Search Form */}
        <div className="p-6">
          <div className="space-y-4">
            {/* Table Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                البحث في
              </label>
              <select
                value={selectedTable}
                onChange={(e) => setSelectedTable(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-right"
              >
                {tables.map((table) => (
                  <option key={table.name} value={table.name}>
                    {tableNames[table.name] || table.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Search Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                كلمة البحث
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="ادخل كلمة البحث..."
                  className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-right"
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              </div>
            </div>

            {/* Search Button */}
            <button
              onClick={handleSearch}
              disabled={loading || !searchTerm.trim()}
              className="w-full flex items-center justify-center space-x-reverse space-x-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <>
                  <Search className="h-4 w-4" />
                  <span>بحث</span>
                </>
              )}
            </button>
          </div>

          {/* Results */}
          {searchResults.length > 0 && (
            <div className="mt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">نتائج البحث</h3>
              <div className="space-y-3">
                {searchResults.map((result) => (
                  <div key={result.id} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                    <h4 className="font-medium text-gray-900">{result.name}</h4>
                    <p className="text-sm text-gray-600 mt-1">{result.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default SearchModalAr
