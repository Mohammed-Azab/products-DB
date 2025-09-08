import React, { useState } from 'react'
import { Plus, RefreshCw, Edit, Trash2, Search } from 'lucide-react'

const columnNames = {
  id: 'الرقم',
  name: 'الاسم',
  description: 'الوصف',
  price: 'السعر',
  category_id: 'فئة المنتج',
  supplier_id: 'المورد',
  stock_quantity: 'الكمية',
  created_at: 'تاريخ الإنشاء',
  updated_at: 'تاريخ التحديث',
  contact_info: 'معلومات الاتصال',
  email: 'البريد الإلكتروني',
  phone: 'الهاتف',
  address: 'العنوان'
}

function DataTableAr({ data, columns, loading, onRefresh, onAdd, onUpdate, onDelete }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editData, setEditData] = useState({})
  const [showAddForm, setShowAddForm] = useState(false)
  const [newData, setNewData] = useState({})

  const filteredData = data.filter(row =>
    Object.values(row).some(value =>
      value?.toString().toLowerCase().includes(searchTerm.toLowerCase())
    )
  )

  const handleEdit = (row) => {
    setEditingId(row.id)
    setEditData(row)
  }

  const handleSave = () => {
    onUpdate(editingId, editData)
    setEditingId(null)
    setEditData({})
  }

  const handleCancel = () => {
    setEditingId(null)
    setEditData({})
  }

  const handleAdd = () => {
    onAdd(newData)
    setNewData({})
    setShowAddForm(false)
  }

  const handleDelete = (id) => {
    if (window.confirm('هل أنت متأكد من حذف هذا السجل؟')) {
      onDelete(id)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64" dir="rtl">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">جاري تحميل البيانات...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6" dir="rtl">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-reverse space-x-4">
          <h2 className="text-xl font-semibold text-gray-900">البيانات</h2>
          <span className="bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full">
            {filteredData.length} سجل
          </span>
        </div>
        
        <div className="flex items-center space-x-reverse space-x-3">
          <button
            onClick={onRefresh}
            className="flex items-center space-x-reverse space-x-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            <RefreshCw className="h-4 w-4" />
            <span>تحديث</span>
          </button>
          
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center space-x-reverse space-x-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            <span>إضافة جديد</span>
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="mb-4">
        <div className="relative">
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input
            type="text"
            placeholder="البحث في البيانات..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-right"
          />
        </div>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
          <h3 className="text-lg font-medium mb-4">إضافة سجل جديد</h3>
          <div className="grid grid-cols-2 gap-4">
            {columns.filter(col => col.name !== 'id' && col.name !== 'created_at' && col.name !== 'updated_at').map((column) => (
              <div key={column.name}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {columnNames[column.name] || column.name}
                </label>
                <input
                  type="text"
                  value={newData[column.name] || ''}
                  onChange={(e) => setNewData({...newData, [column.name]: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-right"
                />
              </div>
            ))}
          </div>
          <div className="flex justify-end space-x-reverse space-x-3 mt-4">
            <button
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              إلغاء
            </button>
            <button
              onClick={handleAdd}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
            >
              إضافة
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.name}
                  className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {columnNames[column.name] || column.name}
                </th>
              ))}
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                الإجراءات
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredData.map((row) => (
              <tr key={row.id} className="hover:bg-gray-50">
                {columns.map((column) => (
                  <td key={column.name} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                    {editingId === row.id && column.name !== 'id' && column.name !== 'created_at' && column.name !== 'updated_at' ? (
                      <input
                        type="text"
                        value={editData[column.name] || ''}
                        onChange={(e) => setEditData({...editData, [column.name]: e.target.value})}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-right"
                      />
                    ) : (
                      row[column.name]
                    )}
                  </td>
                ))}
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  {editingId === row.id ? (
                    <div className="flex space-x-reverse space-x-2">
                      <button
                        onClick={handleSave}
                        className="text-green-600 hover:text-green-900"
                      >
                        حفظ
                      </button>
                      <button
                        onClick={handleCancel}
                        className="text-gray-600 hover:text-gray-900"
                      >
                        إلغاء
                      </button>
                    </div>
                  ) : (
                    <div className="flex space-x-reverse space-x-2">
                      <button
                        onClick={() => handleEdit(row)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(row.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredData.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500">لا توجد بيانات متاحة</p>
        </div>
      )}
    </div>
  )
}

export default DataTableAr
