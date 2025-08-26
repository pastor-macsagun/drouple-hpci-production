'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/patterns/data-table'
import { Download, RefreshCw } from 'lucide-react'
import { format } from 'date-fns'
import { getServiceAttendance } from './actions'

interface AttendanceListProps {
  serviceId: string
  serviceName: string
}

interface AttendanceItem {
  id: string
  user: {
    name: string | null
    email: string
  }
  checkedInAt: Date | string
  isNewBeliever: boolean
}

export function AttendanceList({ serviceId, serviceName }: AttendanceListProps) {
  const [attendance, setAttendance] = useState<AttendanceItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchAttendance = useCallback(async () => {
    const result = await getServiceAttendance(serviceId)
    if (result.success) {
      setAttendance(result.data || [])
    }
    setIsLoading(false)
  }, [serviceId])

  useEffect(() => {
    fetchAttendance()
    // Poll for updates every 5 seconds
    const interval = setInterval(fetchAttendance, 5000)
    return () => clearInterval(interval)
  }, [serviceId, fetchAttendance])

  const exportCSV = () => {
    const headers = ['Name', 'Email', 'Checked In At', 'New Believer']
    const rows = attendance.map(item => [
      item.user.name || 'N/A',
      item.user.email,
      format(new Date(item.checkedInAt), 'yyyy-MM-dd HH:mm:ss'),
      item.isNewBeliever ? 'Yes' : 'No'
    ])
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `attendance-${format(new Date(), 'yyyy-MM-dd')}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const columns = [
    {
      key: 'name',
      header: 'Name',
      cell: (item: AttendanceItem) => item.user.name || 'N/A'
    },
    {
      key: 'email', 
      header: 'Email',
      cell: (item: AttendanceItem) => item.user.email
    },
    {
      key: 'checkedInAt',
      header: 'Checked In',
      cell: (item: AttendanceItem) => format(new Date(item.checkedInAt), 'h:mm a')
    },
    {
      key: 'newBeliever',
      header: 'New Believer',
      cell: (item: AttendanceItem) => item.isNewBeliever ? (
        <span className="text-green-600 font-medium">Yes</span>
      ) : (
        <span className="text-muted-foreground">No</span>
      )
    }
  ]

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Attendance List</CardTitle>
            <CardDescription>
              {serviceName} - {attendance.length} checked in
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={fetchAttendance}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={exportCSV}
              disabled={attendance.length === 0}
            >
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">
            Loading attendance...
          </div>
        ) : (
          <DataTable
            data={attendance}
            columns={columns}
            emptyState={
              <div className="text-center py-8 text-muted-foreground">
                No one has checked in yet
              </div>
            }
          />
        )}
      </CardContent>
    </Card>
  )
}