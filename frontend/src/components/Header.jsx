import React from 'react'
import { useTranslation } from 'react-i18next'
import { Search, BarChart3, RefreshCw, Database } from 'lucide-react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import LanguageSwitcher from './LanguageSwitcher'

const Header = ({ onSearch, onStats, onRefresh }) => {
  const { t } = useTranslation()

  return (
    <header className="border-b bg-card shadow-sm">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Database className="h-6 w-6 text-primary" />
              <h1 className="text-2xl font-bold text-foreground">{t('header.title')}</h1>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <LanguageSwitcher />
            
            <Button
              variant="outline"
              size="sm"
              onClick={onSearch}
              className="flex items-center space-x-2"
            >
              <Search className="h-4 w-4" />
              <span>{t('header.search')}</span>
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={onStats}
              className="flex items-center space-x-2"
            >
              <BarChart3 className="h-4 w-4" />
              <span>{t('header.statistics')}</span>
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              className="flex items-center space-x-2"
            >
              <RefreshCw className="h-4 w-4" />
              <span>{t('actions.refresh')}</span>
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header
