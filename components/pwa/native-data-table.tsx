'use client'

import React, { useState, useCallback } from 'react'
import { ChevronDown, MoreVertical, Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import { MobileButton } from '@/components/mobile/mobile-button'
import { useHaptic } from '@/hooks/use-haptic'

interface Column<T> {
  key: keyof T
  title: string
  render?: (value: any, item: T) => React.ReactNode
  sortable?: boolean
  width?: string
}

interface NativeDataTableProps<T> {
  data: T[]
  columns: Column<T>[]
  loading?: boolean
  searchable?: boolean
  onRowAction?: (action: string, item: T) => void
  rowActions?: Array<{ key: string; label: string; icon?: React.ReactNode }>
  className?: string
  emptyMessage?: string
  onRefresh?: () => void
}

export function NativeDataTable<T extends { id: string | number }>({
  data,
  columns,
  loading = false,
  searchable = true,
  onRowAction,
  rowActions = [],
  className,
  emptyMessage = "No data available",
  onRefresh
}: NativeDataTableProps<T>) {
  const [searchQuery, setSearchQuery] = useState('')
  const [sortConfig, setSortConfig] = useState<{ key: keyof T; direction: 'asc' | 'desc' } | null>(null)
  const [activeRowId, setActiveRowId] = useState<string | number | null>(null)
  const { triggerHaptic } = useHaptic()

  // Filter data based on search query
  const filteredData = searchQuery
    ? data.filter(item =>
        columns.some(col => {
          const value = item[col.key]
          return String(value).toLowerCase().includes(searchQuery.toLowerCase())
        })
      )
    : data

  // Sort filtered data
  const sortedData = sortConfig
    ? [...filteredData].sort((a, b) => {
        const aValue = a[sortConfig.key]
        const bValue = b[sortConfig.key]
        
        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1
        }
        return 0
      })
    : filteredData

  const handleSort = useCallback((key: keyof T) => {
    triggerHaptic('light')
    setSortConfig(current => ({
      key,
      direction: current?.key === key && current.direction === 'asc' ? 'desc' : 'asc'
    }))
  }, [triggerHaptic])

  const handleRowAction = useCallback((action: string, item: T) => {
    triggerHaptic('medium')
    setActiveRowId(null)
    onRowAction?.(action, item)
  }, [onRowAction, triggerHaptic])

  const toggleRowActions = useCallback((id: string | number) => {
    triggerHaptic('light')
    setActiveRowId(current => current === id ? null : id)
  }, [triggerHaptic])

  if (loading) {
    return (
      <div className={cn("space-y-3", className)}>
        {searchable && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <div className="h-10 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" data-testid="native-data-table-loading" />
          </div>
        )}
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="bg-white dark:bg-gray-900 rounded-lg p-4 animate-pulse"
            data-testid="native-data-table-loading"
          >
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Search Bar */}
      {searchable && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 pl-10 pr-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            data-testid="native-data-table-search"
          />
        </div>
      )}

      {/* Column Headers - Mobile Optimized */}
      <div className="hidden md:flex bg-gray-50 dark:bg-gray-800 rounded-lg p-3 gap-3">
        {columns.map((column) => (
          <div
            key={String(column.key)}
            className={cn(
              "flex items-center gap-1 text-sm font-medium text-gray-600 dark:text-gray-300",
              column.sortable && "cursor-pointer hover:text-gray-900 dark:hover:text-white",
              column.width || "flex-1"
            )}
            onClick={() => column.sortable && handleSort(column.key)}
          >
            {column.title}
            {column.sortable && (
              <ChevronDown
                className={cn(
                  "w-3 h-3 transition-transform",
                  sortConfig?.key === column.key && sortConfig.direction === 'desc' && "rotate-180"
                )}
              />
            )}
          </div>
        ))}
        {rowActions.length > 0 && (
          <div className="w-8" /> // Actions column spacer
        )}
      </div>

      {/* Data Rows - Native List Style */}
      <div className="space-y-2">
        {sortedData.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            {emptyMessage}
          </div>
        ) : (
          sortedData.map((item) => (
            <div
              key={String(item.id)}
              className={cn(
                "bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 transition-all duration-200",
                activeRowId === item.id && "ring-2 ring-blue-500"
              )}
              data-testid="native-data-table-row"
            >
              {/* Mobile Card Layout */}
              <div className="md:hidden p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1 space-y-2">
                    {columns.slice(0, 3).map((column) => {
                      const value = item[column.key]
                      return (
                        <div key={String(column.key)}>
                          <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                            {column.title}
                          </div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {column.render ? column.render(value, item) : String(value)}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  {rowActions.length > 0 && (
                    <MobileButton
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleRowActions(item.id)}
                      hapticFeedback
                    >
                      <MoreVertical className="w-4 h-4" />
                    </MobileButton>
                  )}
                </div>
                
                {/* Row Actions */}
                {activeRowId === item.id && rowActions.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex gap-2 flex-wrap">
                      {rowActions.map((action) => (
                        <MobileButton
                          key={action.key}
                          variant="outline"
                          size="sm"
                          onClick={() => handleRowAction(action.key, item)}
                          hapticFeedback
                        >
                          {action.icon && <span className="mr-1">{action.icon}</span>}
                          {action.label}
                        </MobileButton>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Desktop Table Layout */}
              <div className="hidden md:flex items-center p-3 gap-3 hover:bg-gray-50 dark:hover:bg-gray-800">
                {columns.map((column) => {
                  const value = item[column.key]
                  return (
                    <div
                      key={String(column.key)}
                      className={cn(
                        "text-sm text-gray-900 dark:text-white",
                        column.width || "flex-1"
                      )}
                    >
                      {column.render ? column.render(value, item) : String(value)}
                    </div>
                  )
                })}
                {rowActions.length > 0 && (
                  <div className="relative">
                    <MobileButton
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleRowActions(item.id)}
                      hapticFeedback
                    >
                      <MoreVertical className="w-4 h-4" />
                    </MobileButton>
                    {activeRowId === item.id && (
                      <div className="absolute right-0 top-8 z-10 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg min-w-32">
                        {rowActions.map((action) => (
                          <button
                            key={action.key}
                            onClick={() => handleRowAction(action.key, item)}
                            className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-700 first:rounded-t-lg last:rounded-b-lg"
                          >
                            <div className="flex items-center gap-2">
                              {action.icon}
                              {action.label}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Refresh Button - Pull to refresh alternative for desktop */}
      {onRefresh && (
        <div className="flex justify-center pt-4">
          <MobileButton
            variant="outline"
            onClick={() => {
              triggerHaptic('medium')
              onRefresh()
            }}
            hapticFeedback
          >
            Refresh Data
          </MobileButton>
        </div>
      )}
    </div>
  )
}
