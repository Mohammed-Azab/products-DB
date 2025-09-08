import React from 'react'
import { Link } from 'react-router-dom'
import { Database, Globe, ArrowLeft, ArrowRight } from 'lucide-react'

function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-12">
          <Database className="h-16 w-16 text-blue-600 mx-auto mb-6" />
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Products Database System
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Choose your preferred language to access the system
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Arabic Version */}
          <Link
            to="/ar"
            className="group bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-8 text-center border-2 border-transparent hover:border-blue-200"
          >
            <div className="mb-6">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-200 transition-colors">
                <span className="text-2xl font-bold text-blue-600">عربي</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">النسخة العربية</h2>
              <p className="text-gray-600 mb-4">نظام إدارة قاعدة بيانات المنتجات</p>
              <p className="text-sm text-gray-500">
                واجهة عربية كاملة مع دعم الكتابة من اليمين إلى اليسار
              </p>
            </div>
            <div className="flex items-center justify-center text-blue-600 group-hover:text-blue-700">
              <span className="mr-2">ادخل إلى النظام</span>
              <ArrowLeft className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* English Version */}
          <Link
            to="/en"
            className="group bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-8 text-center border-2 border-transparent hover:border-green-200"
          >
            <div className="mb-6">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-green-200 transition-colors">
                <Globe className="h-10 w-10 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">English Version</h2>
              <p className="text-gray-600 mb-4">Products Database Management System</p>
              <p className="text-sm text-gray-500">
                Full English interface with modern design and functionality
              </p>
            </div>
            <div className="flex items-center justify-center text-green-600 group-hover:text-green-700">
              <span className="ml-2">Enter System</span>
              <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        </div>

        <div className="text-center mt-12">
          <p className="text-gray-500 text-sm">
            Products Database System © 2024 - Built with React & Node.js
          </p>
        </div>
      </div>
    </div>
  )
}

export default LandingPage
