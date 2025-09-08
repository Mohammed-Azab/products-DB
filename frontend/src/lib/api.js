import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
})

// Tables API
export const tablesApi = {
  getTables: () => api.get('/tables'),
  getTable: (tableName) => api.get(`/tables/${tableName}`),
  createTable: (tableData) => api.post('/tables', tableData),
  updateTable: (tableName, data) => api.put(`/tables/${tableName}`, data),
  deleteTable: (tableName) => api.delete(`/tables/${tableName}`),
}

// Data API
export const dataApi = {
  getData: (tableName, params = {}) => api.get(`/data/${tableName}`, { params }),
  createRecord: (tableName, record) => api.post(`/data/${tableName}`, record),
  updateRecord: (tableName, id, record) => api.put(`/data/${tableName}/${id}`, record),
  deleteRecord: (tableName, id) => api.delete(`/data/${tableName}/${id}`),
  bulkUpdate: (tableName, records) => api.put(`/data/${tableName}/bulk`, records),
  bulkDelete: (tableName, ids) => api.delete(`/data/${tableName}/bulk`, { data: { ids } }),
}

// Search API
export const searchApi = {
  searchInTable: (tableName, query) => api.get(`/search/${tableName}`, { params: { q: query } }),
  searchGlobal: (query) => api.get('/search', { params: { q: query } }),
}

// Reports API
export const reportsApi = {
  getTableStats: (tableName) => api.get(`/reports/stats/${tableName}`),
  getGlobalStats: () => api.get('/reports/stats'),
  generateReport: (params) => api.post('/reports/generate', params),
  exportData: (tableName, format = 'csv') => api.get(`/reports/export/${tableName}`, { 
    params: { format },
    responseType: 'blob'
  }),
}

export default api
