import React, { useState } from 'react'
import { Package, Wrench, Layers, MoreHorizontal } from 'lucide-react'

// Define categories and their associated tables
const categories = {
  all: {
    label: 'All',
    icon: Layers,
    tables: ['products', 'suppliers', 'spare_parts', 'others']
  },
  products: {
    label: 'Products',
    icon: Package,
    tables: ['products']
  },
  spare_parts: {
    label: 'Spare Parts',
    icon: Wrench,
    tables: ['spare_parts']
  },
  others: {
    label: 'Others',
    icon: MoreHorizontal,
    tables: ['suppliers', 'others']
  }
}

// Table display names in English
const tableNames = {
  products: 'Products',
  suppliers: 'Suppliers',
  spare_parts: 'Spare Parts',
  others: 'Others'
}

function CategoryTabs({ tables, activeTable, onTableSelect }) {
  const [activeCategory, setActiveCategory] = useState('all')

  // Filter tables based on active category
  const getFilteredTables = () => {
    if (activeCategory === 'all') {
      return tables
    }
    
    const categoryTables = categories[activeCategory]?.tables || []
    return tables.filter(table => categoryTables.includes(table.name))
  }

  const filteredTables = getFilteredTables()

  return (
    <div className="bg-white border-b border-gray-200">
      {/* Category Tabs */}
      <div className="px-6 pt-4">
        <div className="flex space-x-8 border-b border-gray-200">
          {Object.entries(categories).map(([key, category]) => {
            const IconComponent = category.icon
            const isActive = activeCategory === key
            
            return (
              <button
                key={key}
                onClick={() => setActiveCategory(key)}
                className={`flex items-center space-x-2 px-3 py-2 border-b-2 font-medium text-sm transition-colors ${
                  isActive
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <IconComponent className="w-4 h-4" />
                <span>{category.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Table Buttons */}
      <div className="px-6 py-4">
        <div className="flex flex-wrap gap-2">
          {filteredTables.length > 0 ? (
            filteredTables.map((table) => (
              <button
                key={table.name}
                onClick={() => onTableSelect(table.name)}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors border ${
                  activeTable === table.name
                    ? 'bg-blue-50 text-blue-700 border-blue-200'
                    : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                }`}
              >
                {tableNames[table.name] || table.name}
                <span className="ml-2 text-xs text-gray-500">
                  ({table.row_count || 0})
                </span>
              </button>
            ))
          ) : (
            <div className="text-gray-500 text-sm py-4">
              No tables available in this category
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default CategoryTabs
