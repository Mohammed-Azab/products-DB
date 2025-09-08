import React, { useState, useEffect } from 'react'
import { Search, X } from 'lucide-react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { searchApi } from '../lib/api'
import toast from 'react-hot-toast'

const SearchModal = ({ isOpen, onClose, tables, activeTable }) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchScope, setSearchScope] = useState('current') // 'current' or 'all'

  useEffect(() => {
    if (isOpen) {
      setSearchQuery('')
      setSearchResults([])
    }
  }, [isOpen])

  const handleSearch = async () => {
    if (!searchQuery.trim()) return

    try {
      setLoading(true)
      let response

      if (searchScope === 'current' && activeTable) {
        response = await searchApi.searchInTable(activeTable, searchQuery)
      } else {
        response = await searchApi.searchGlobal(searchQuery)
      }

      setSearchResults(response.data.results || [])
    } catch (error) {
      toast.error('Search failed')
      console.error('Search error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
    if (e.key === 'Escape') {
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-4xl max-h-[80vh] mx-4">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Search className="h-5 w-5" />
            <span>Search Database</span>
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Search Controls */}
          <div className="space-y-3">
            <div className="flex space-x-2">
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Enter search query..."
                className="flex-1"
                onKeyDown={handleKeyDown}
                autoFocus
              />
              <Button onClick={handleSearch} disabled={loading}>
                {loading ? 'Searching...' : 'Search'}
              </Button>
            </div>
            
            <div className="flex items-center space-x-4">
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  value="current"
                  checked={searchScope === 'current'}
                  onChange={(e) => setSearchScope(e.target.value)}
                  disabled={!activeTable}
                />
                <span>Current table ({activeTable})</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  value="all"
                  checked={searchScope === 'all'}
                  onChange={(e) => setSearchScope(e.target.value)}
                />
                <span>All tables</span>
              </label>
            </div>
          </div>

          {/* Search Results */}
          <div className="border rounded-lg max-h-96 overflow-auto">
            {searchResults.length > 0 ? (
              <div className="space-y-2 p-4">
                {searchResults.map((result, index) => (
                  <div key={index} className="border rounded p-3 hover:bg-muted/50">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm text-primary">
                        Table: {result.tableName}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Row ID: {result.id}
                      </span>
                    </div>
                    <div className="text-sm space-y-1">
                      {Object.entries(result.data || {}).map(([key, value]) => (
                        <div key={key} className="flex">
                          <span className="font-medium w-24 text-muted-foreground">{key}:</span>
                          <span className="flex-1">{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : searchQuery && !loading ? (
              <div className="p-8 text-center text-muted-foreground">
                No results found for "{searchQuery}"
              </div>
            ) : (
              <div className="p-8 text-center text-muted-foreground">
                Enter a search query to find data across your tables
              </div>
            )}
          </div>

          <div className="text-sm text-muted-foreground">
            {searchResults.length > 0 && (
              <>Found {searchResults.length} result{searchResults.length !== 1 ? 's' : ''}</>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default SearchModal
