import React from 'react'
import { Search, BarChart3, Database, Globe } from 'lucide-react'
import { Link } from 'react-router-dom'

function HeaderAr({ onSearch, onStats }) {
  return (
    <header className="bg-white shadow-sm border-b" dir="rtl">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Title */}
          <div className="flex items-center space-x-reverse space-x-3">
            <Database className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-xl font-bold text-gray-900">قاعدة بيانات المنتجات</h1>
              <p className="text-sm text-gray-500">نظام إدارة البيانات</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-reverse space-x-4">
            {/* Stats Button */}
            <button
              onClick={onStats}
              className="flex items-center space-x-reverse space-x-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
            >
              <BarChart3 className="h-4 w-4" />
              <span>الإحصائيات</span>
            </button>

            {/* Search Button */}
            <button
              onClick={onSearch}
              className="flex items-center space-x-reverse space-x-2 px-4 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-md transition-colors"
            >
              <Search className="h-4 w-4" />
              <span>بحث</span>
            </button>

            {/* Language Switcher */}
            <Link 
              to="/en" 
              className="flex items-center space-x-reverse space-x-2 px-3 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-md transition-colors"
            >
              <Globe className="h-4 w-4" />
              <span>English</span>
            </Link>
          </div>
        </div>
      </div>
    </header>
  )
}

export default HeaderAr
