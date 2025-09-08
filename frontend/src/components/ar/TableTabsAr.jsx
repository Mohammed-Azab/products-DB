import React from 'react'
import { Package, Users, Truck, FileText } from 'lucide-react'

const tableIcons = {
  products: Package,
  suppliers: Users,
  orders: Truck,
  categories: FileText
}

const tableNames = {
  products: 'المنتجات',
  suppliers: 'الموردين',
  orders: 'الطلبات',
  categories: 'الفئات'
}

function TableTabsAr({ tables, activeTable, onTableChange }) {
  return (
    <div className="border-b border-gray-200" dir="rtl">
      <nav className="flex space-x-reverse space-x-8 px-6">
        {tables.map((table) => {
          const Icon = tableIcons[table.name] || FileText
          const isActive = activeTable === table.name
          
          return (
            <button
              key={table.name}
              onClick={() => onTableChange(table.name)}
              className={`
                flex items-center space-x-reverse space-x-2 py-4 px-1 border-b-2 font-medium text-sm
                ${isActive
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              <Icon className="h-4 w-4" />
              <span>{tableNames[table.name] || table.name}</span>
              <span className="bg-gray-100 text-gray-600 py-1 px-2 rounded-full text-xs">
                {table.count}
              </span>
            </button>
          )
        })}
      </nav>
    </div>
  )
}

export default TableTabsAr
