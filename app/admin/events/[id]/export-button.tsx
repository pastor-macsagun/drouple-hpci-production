'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { exportEventAttendees } from '@/app/events/actions'
import { Download } from 'lucide-react'
import { toast } from 'sonner'

interface ExportButtonProps {
  eventId: string
  eventName: string
}

export function ExportButton({ eventId, eventName }: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false)

  const handleExport = async () => {
    setIsExporting(true)
    try {
      const result = await exportEventAttendees(eventId)
      
      if (result.success && result.data) {
        // Create and download CSV file
        const blob = new Blob([result.data], { type: 'text/csv' })
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `${eventName.replace(/\s+/g, '_')}_attendees_${new Date().toISOString().split('T')[0]}.csv`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)
        
        toast.success('Attendees exported successfully')
      } else {
        toast.error(result.error || 'Failed to export attendees')
      }
    } catch {
      toast.error('An error occurred while exporting')
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <Button onClick={handleExport} disabled={isExporting}>
      <Download className="h-4 w-4 mr-2" />
      {isExporting ? 'Exporting...' : 'Export Attendees'}
    </Button>
  )
}