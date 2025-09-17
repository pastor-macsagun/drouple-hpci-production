'use client'

import React, { useState, useRef, useCallback, useEffect } from 'react'
import { TrendingUp, TrendingDown, Calendar, Download, Share, Eye, EyeOff, BarChart3, PieChart, LineChart } from 'lucide-react'
import { cn } from '@/lib/utils'
import { MobileButton } from '@/components/mobile/mobile-button'
import { PullToRefresh } from '@/components/mobile/pull-to-refresh'
import { useHaptic } from '@/hooks/use-haptic'
import { useNativeFileSystem } from '@/hooks/use-native-file-system'

interface DataPoint {
  label: string
  value: number
  change?: number
  color?: string
}

interface ChartData {
  labels: string[]
  datasets: Array<{
    label: string
    data: number[]
    color: string
    fillColor?: string
  }>
}

interface NativeAnalyticsProps {
  title: string
  data: ChartData
  summary?: DataPoint[]
  onRefresh?: () => Promise<void>
  onExport?: (format: 'csv' | 'json' | 'image') => Promise<void>
  className?: string
  loading?: boolean
}

type ChartType = 'line' | 'bar' | 'pie'

export function NativeAnalytics({
  title,
  data,
  summary = [],
  onRefresh,
  onExport,
  className,
  loading = false
}: NativeAnalyticsProps) {
  const [chartType, setChartType] = useState<ChartType>('line')
  const [selectedDataset, setSelectedDataset] = useState<number>(0)
  const [showValues, setShowValues] = useState(true)
  const [timeRange, setTimeRange] = useState('7d')
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { triggerHaptic } = useHaptic()
  const { saveCSV, saveJSON, saveImage } = useNativeFileSystem()

  const handleChartTypeChange = useCallback((type: ChartType) => {
    triggerHaptic('light')
    setChartType(type)
  }, [triggerHaptic])

  const handleExport = useCallback(async (format: 'csv' | 'json' | 'image') => {
    triggerHaptic('medium')
    
    if (onExport) {
      await onExport(format)
      return
    }

    // Default export implementations
    try {
      switch (format) {
        case 'csv':
          const csvData = data.labels.map((label, index) => {
            const row: Record<string, any> = { date: label }
            data.datasets.forEach(dataset => {
              row[dataset.label] = dataset.data[index] || 0
            })
            return row
          })
          await saveCSV(csvData, `${title.toLowerCase().replace(/\s+/g, '-')}.csv`)
          break
          
        case 'json':
          await saveJSON({ title, data, summary, exportedAt: new Date().toISOString() }, 
                         `${title.toLowerCase().replace(/\s+/g, '-')}.json`)
          break
          
        case 'image':
          if (canvasRef.current) {
            canvasRef.current.toBlob(async (blob) => {
              if (blob) {
                await saveImage(blob, `${title.toLowerCase().replace(/\s+/g, '-')}.png`)
              }
            })
          }
          break
      }
      triggerHaptic('success')
    } catch (error) {
      triggerHaptic('error')
      console.error('Export failed:', error)
    }
  }, [onExport, data, title, summary, saveCSV, saveJSON, saveImage, triggerHaptic])

  const handleShare = useCallback(async () => {
    triggerHaptic('light')
    
    if ('share' in navigator) {
      try {
        // Create a shareable summary
        const summaryText = summary.map(item => 
          `${item.label}: ${item.value.toLocaleString()}`
        ).join('\n')
        
        await navigator.share({
          title: title,
          text: `${title}\n\n${summaryText}`,
          url: window.location.href
        })
      } catch (error) {
        // User cancelled or share not supported
        console.log('Share cancelled or not supported')
      }
    } else {
      // Fallback: copy to clipboard
      const summaryText = summary.map(item => 
        `${item.label}: ${item.value.toLocaleString()}`
      ).join('\n')
      
      if ('clipboard' in navigator && (navigator as any).clipboard) {
        await (navigator as any).clipboard.writeText(`${title}\n\n${summaryText}`)
        triggerHaptic('success')
      }
    }
  }, [title, summary, triggerHaptic])

  // Draw chart on canvas
  useEffect(() => {
    if (!canvasRef.current || !data.datasets.length || loading) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size for high DPI displays
    const rect = canvas.getBoundingClientRect()
    const dpr = window.devicePixelRatio || 1
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    ctx.scale(dpr, dpr)
    canvas.style.width = rect.width + 'px'
    canvas.style.height = rect.height + 'px'

    // Clear canvas
    ctx.clearRect(0, 0, rect.width, rect.height)

    const dataset = data.datasets[selectedDataset]
    if (!dataset) return

    const padding = 40
    const chartWidth = rect.width - 2 * padding
    const chartHeight = rect.height - 2 * padding

    // Calculate data bounds
    const maxValue = Math.max(...dataset.data, 0)
    const minValue = Math.min(...dataset.data, 0)
    const valueRange = maxValue - minValue || 1

    // Draw based on chart type
    switch (chartType) {
      case 'line':
        drawLineChart(ctx, dataset, chartWidth, chartHeight, padding, minValue, valueRange)
        break
      case 'bar':
        drawBarChart(ctx, dataset, chartWidth, chartHeight, padding, minValue, valueRange)
        break
      case 'pie':
        drawPieChart(ctx, dataset, Math.min(chartWidth, chartHeight) / 2, rect.width / 2, rect.height / 2)
        break
    }

    // Draw labels if showing values
    if (showValues && chartType !== 'pie') {
      drawValueLabels(ctx, dataset, data.labels, chartWidth, chartHeight, padding, minValue, valueRange)
    }

  }, [data, chartType, selectedDataset, showValues, loading])

  const drawLineChart = (
    ctx: CanvasRenderingContext2D,
    dataset: ChartData['datasets'][0],
    width: number,
    height: number,
    padding: number,
    minValue: number,
    valueRange: number
  ) => {
    const points: Array<[number, number]> = []
    
    // Calculate points
    dataset.data.forEach((value, index) => {
      const x = padding + (index / (dataset.data.length - 1)) * width
      const y = padding + height - ((value - minValue) / valueRange) * height
      points.push([x, y])
    })

    // Draw line
    ctx.strokeStyle = dataset.color
    ctx.lineWidth = 3
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    
    ctx.beginPath()
    points.forEach(([x, y], index) => {
      if (index === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }
    })
    ctx.stroke()

    // Draw fill area
    if (dataset.fillColor) {
      ctx.fillStyle = dataset.fillColor
      ctx.beginPath()
      points.forEach(([x, y], index) => {
        if (index === 0) {
          ctx.moveTo(x, y)
        } else {
          ctx.lineTo(x, y)
        }
      })
      ctx.lineTo(points[points.length - 1][0], padding + height)
      ctx.lineTo(points[0][0], padding + height)
      ctx.closePath()
      ctx.fill()
    }

    // Draw points
    ctx.fillStyle = dataset.color
    points.forEach(([x, y]) => {
      ctx.beginPath()
      ctx.arc(x, y, 4, 0, Math.PI * 2)
      ctx.fill()
    })
  }

  const drawBarChart = (
    ctx: CanvasRenderingContext2D,
    dataset: ChartData['datasets'][0],
    width: number,
    height: number,
    padding: number,
    minValue: number,
    valueRange: number
  ) => {
    const barWidth = width / dataset.data.length * 0.8
    const barSpacing = width / dataset.data.length * 0.2

    ctx.fillStyle = dataset.color
    
    dataset.data.forEach((value, index) => {
      const x = padding + index * (width / dataset.data.length) + barSpacing / 2
      const barHeight = ((value - minValue) / valueRange) * height
      const y = padding + height - barHeight
      
      ctx.fillRect(x, y, barWidth, barHeight)
    })
  }

  const drawPieChart = (
    ctx: CanvasRenderingContext2D,
    dataset: ChartData['datasets'][0],
    radius: number,
    centerX: number,
    centerY: number
  ) => {
    const total = dataset.data.reduce((sum, value) => sum + value, 0)
    let currentAngle = -Math.PI / 2

    const colors = [
      dataset.color,
      '#10B981',
      '#F59E0B',
      '#EF4444',
      '#8B5CF6',
      '#06B6D4'
    ]

    dataset.data.forEach((value, index) => {
      const sliceAngle = (value / total) * Math.PI * 2
      
      ctx.fillStyle = colors[index % colors.length]
      ctx.beginPath()
      ctx.moveTo(centerX, centerY)
      ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle)
      ctx.closePath()
      ctx.fill()
      
      currentAngle += sliceAngle
    })
  }

  const drawValueLabels = (
    ctx: CanvasRenderingContext2D,
    dataset: ChartData['datasets'][0],
    labels: string[],
    width: number,
    height: number,
    padding: number,
    minValue: number,
    valueRange: number
  ) => {
    ctx.fillStyle = '#6B7280'
    ctx.font = '12px system-ui'
    ctx.textAlign = 'center'

    dataset.data.forEach((value, index) => {
      const x = padding + (index / (dataset.data.length - 1)) * width
      const y = padding + height - ((value - minValue) / valueRange) * height - 10
      
      ctx.fillText(value.toString(), x, y)
    })
  }

  if (loading) {
    return (
      <div className={cn("space-y-4 animate-pulse", className)}>
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
        <div className="grid grid-cols-2 gap-4">
          <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded" />
        </div>
        <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded" />
      </div>
    )
  }

  return (
    <PullToRefresh onRefresh={onRefresh || (async () => {})} className={className}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {title}
          </h2>
          <div className="flex gap-2">
            <MobileButton
              variant="ghost"
              size="sm"
              onClick={handleShare}
              hapticFeedback
            >
              <Share className="w-4 h-4" />
            </MobileButton>
            <MobileButton
              variant="ghost"
              size="sm"
              onClick={() => setShowValues(!showValues)}
              hapticFeedback
            >
              {showValues ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            </MobileButton>
          </div>
        </div>

        {/* Summary Cards */}
        {summary.length > 0 && (
          <div className="grid grid-cols-2 gap-4">
            {summary.map((item, index) => (
              <div
                key={index}
                className="bg-white dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700"
              >
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {item.label}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-2xl font-bold text-gray-900 dark:text-white">
                    {item.value.toLocaleString()}
                  </span>
                  {item.change !== undefined && (
                    <div
                      className={cn(
                        "flex items-center gap-1 text-xs",
                        item.change > 0 ? "text-green-600" : "text-red-600"
                      )}
                    >
                      {item.change > 0 ? (
                        <TrendingUp className="w-3 h-3" />
                      ) : (
                        <TrendingDown className="w-3 h-3" />
                      )}
                      {Math.abs(item.change)}%
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Chart Controls */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex gap-2">
            <MobileButton
              variant={chartType === 'line' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleChartTypeChange('line')}
              hapticFeedback
            >
              <LineChart className="w-4 h-4" />
            </MobileButton>
            <MobileButton
              variant={chartType === 'bar' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleChartTypeChange('bar')}
              hapticFeedback
            >
              <BarChart3 className="w-4 h-4" />
            </MobileButton>
            <MobileButton
              variant={chartType === 'pie' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleChartTypeChange('pie')}
              hapticFeedback
            >
              <PieChart className="w-4 h-4" />
            </MobileButton>
          </div>

          {/* Export Options */}
          <div className="flex gap-2">
            <MobileButton
              variant="outline"
              size="sm"
              onClick={() => handleExport('csv')}
              hapticFeedback
            >
              CSV
            </MobileButton>
            <MobileButton
              variant="outline"
              size="sm"
              onClick={() => handleExport('json')}
              hapticFeedback
            >
              JSON
            </MobileButton>
            <MobileButton
              variant="outline"
              size="sm"
              onClick={() => handleExport('image')}
              hapticFeedback
            >
              IMG
            </MobileButton>
          </div>
        </div>

        {/* Dataset Selector (if multiple datasets) */}
        {data.datasets.length > 1 && (
          <div className="flex gap-2 flex-wrap">
            {data.datasets.map((dataset, index) => (
              <button
                key={index}
                onClick={() => {
                  triggerHaptic('light')
                  setSelectedDataset(index)
                }}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-lg text-sm border transition-colors",
                  selectedDataset === index
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900 text-blue-600 dark:text-blue-300"
                    : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                )}
              >
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: dataset.color }}
                />
                {dataset.label}
              </button>
            ))}
          </div>
        )}

        {/* Chart Canvas */}
        <div className="bg-white dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <canvas
            ref={canvasRef}
            className="w-full h-64 touch-manipulation"
            style={{ touchAction: 'pan-y' }}
          />
        </div>

        {/* Chart Labels */}
        {chartType !== 'pie' && (
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 px-4">
            {data.labels.map((label, index) => (
              <span key={index} className={index % 2 === 1 ? "hidden sm:inline" : ""}>
                {label}
              </span>
            ))}
          </div>
        )}

        {/* Legend for pie chart */}
        {chartType === 'pie' && (
          <div className="grid grid-cols-2 gap-2">
            {data.labels.map((label, index) => (
              <div key={index} className="flex items-center gap-2 text-sm">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{
                    backgroundColor: ['#1F2937', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'][index % 6]
                  }}
                />
                <span className="text-gray-700 dark:text-gray-300">{label}</span>
                <span className="text-gray-500 dark:text-gray-400">
                  ({data.datasets[selectedDataset]?.data[index] || 0})
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </PullToRefresh>
  )
}