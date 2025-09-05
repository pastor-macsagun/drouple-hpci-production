'use client'

/**
 * Realtime Attendance List Component
 * 
 * Enhanced version with React Query and realtime updates
 * - Subscribes to attendance.created|updated events
 * - Updates cache immediately when someone checks in
 * - Shows live connection status
 */

import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/patterns/data-table'
import { Download, RefreshCw, Wifi, WifiOff } from 'lucide-react'
import { format } from 'date-fns'
import { useAttendanceSubscriptions } from '@/lib/realtime'
import { getServiceAttendance } from './actions'

interface RealtimeAttendanceListProps {
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

async function fetchAttendance(serviceId: string): Promise<AttendanceItem[]> {
  const result = await getServiceAttendance(serviceId)
  if (result.success) {
    return result.data || []
  }
  throw new Error(result.error || 'Failed to fetch attendance')
}

export function RealtimeAttendanceList({ serviceId, serviceName }: RealtimeAttendanceListProps) {
  // Subscribe to realtime attendance updates
  const { isConnected, metrics } = useAttendanceSubscriptions()

  // Fetch attendance data with React Query
  const { 
    data: attendance = [], 
    isLoading, 
    error, 
    refetch 
  } = useQuery({
    queryKey: ['services', serviceId, 'attendances'],
    queryFn: () => fetchAttendance(serviceId),
    staleTime: 30000, // 30 seconds
    gcTime: 60000,    // 1 minute
    refetchInterval: isConnected ? false : 15000, // Poll only when not connected
  })

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
            <CardTitle className="flex items-center gap-2">
              Attendance List
              {/* Live connection indicator */}
              <div className="flex items-center gap-1">
                {isConnected ? (
                  <>
                    <Wifi className="h-4 w-4 text-green-500" />
                    <span className="text-xs text-green-600">Live</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="h-4 w-4 text-gray-400" />
                    <span className="text-xs text-gray-500">Offline</span>
                  </>
                )}
              </div>
            </CardTitle>
            <CardDescription>
              {serviceName} - {attendance.length} checked in
              {/* Show performance metrics if available */}
              {metrics.eventCount > 0 && (
                <span className="ml-2 text-xs text-muted-foreground">
                  ({metrics.eventCount} updates received)
                </span>
              )}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => refetch()}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
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

        {/* Performance warning */}
        {metrics.p95Latency > 2000 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-2">
            <p className="text-xs text-yellow-800">
              ⚠️ High update latency detected ({metrics.p95Latency.toFixed(0)}ms). 
              Some updates may be delayed.
            </p>
          </div>
        )}
      </CardHeader>
      <CardContent>
        {error ? (
          <div className="text-center py-8">
            <p className="text-red-600 mb-2">Failed to load attendance</p>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => refetch()}
            >
              Try Again
            </Button>
          </div>
        ) : isLoading ? (
          <div className="text-center py-8 text-muted-foreground">
            Loading attendance...
          </div>
        ) : (
          <DataTable
            data={attendance}
            columns={columns}
            caption={`Service attendance list for ${serviceName} showing ${attendance.length} attendees`}
            ariaLabel="Service attendance data"
            emptyState={
              <div className="text-center py-8 text-muted-foreground">
                <p>No one has checked in yet</p>
                {isConnected && (
                  <p className="text-xs mt-2">Updates will appear automatically</p>
                )}
              </div>
            }
          />
        )}
      </CardContent>
    </Card>
  )
}