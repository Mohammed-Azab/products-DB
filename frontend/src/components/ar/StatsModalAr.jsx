import React, { useState, useEffect } from 'react'
import { X, BarChart3, TrendingUp, Package, Users } from 'lucide-react'

function StatsModalAr({ tables, onClose }) {
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalSuppliers: 0,
    totalOrders: 0,
    totalCategories: 0
  })

  const tableNames = {
    products: 'المنتجات',
    suppliers: 'الموردين',
    orders: 'الطلبات',
    categories: 'الفئات'
  }

  useEffect(() => {
    // Calculate stats from tables
    const newStats = {}
    tables.forEach(table => {
      switch(table.name) {
        case 'products':
          newStats.totalProducts = table.count
          break
        case 'suppliers':
          newStats.totalSuppliers = table.count
          break
        case 'orders':
          newStats.totalOrders = table.count
          break
        case 'categories':
          newStats.totalCategories = table.count
          break
      }
    })
    setStats(newStats)
  }, [tables])

  const statCards = [
    {
      title: 'إجمالي المنتجات',
      value: stats.totalProducts,
      icon: Package,
      color: 'bg-blue-500',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'إجمالي الموردين',
      value: stats.totalSuppliers,
      icon: Users,
      color: 'bg-green-500',
      bgColor: 'bg-green-50'
    },
    {
      title: 'إجمالي الطلبات',
      value: stats.totalOrders,
      icon: TrendingUp,
      color: 'bg-yellow-500',
      bgColor: 'bg-yellow-50'
    },
    {
      title: 'إجمالي الفئات',
      value: stats.totalCategories,
      icon: BarChart3,
      color: 'bg-purple-500',
      bgColor: 'bg-purple-50'
    }
  ]

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" dir="rtl">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">إحصائيات قاعدة البيانات</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Stats Content */}
        <div className="p-6">
          {/* Overview Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {statCards.map((stat, index) => {
              const Icon = stat.icon
              return (
                <div key={index} className={`${stat.bgColor} p-4 rounded-lg`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                      <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                    </div>
                    <div className={`${stat.color} p-3 rounded-full`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Tables Details */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">تفاصيل الجداول</h3>
            <div className="overflow-hidden bg-gray-50 rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      اسم الجدول
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      عدد السجلات
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      الحالة
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {tables.map((table) => (
                    <tr key={table.name}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right">
                        {tableNames[table.name] || table.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                        {table.count}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                          نشط
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Summary */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-blue-900 mb-2">ملخص الإحصائيات</h4>
            <p className="text-sm text-blue-800">
              يحتوي النظام على {tables.reduce((total, table) => total + table.count, 0)} سجل موزعة على {tables.length} جداول مختلفة.
              جميع الجداول نشطة وتعمل بشكل طبيعي.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default StatsModalAr
