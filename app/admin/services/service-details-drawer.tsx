'use client'

import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getServiceAttendance } from './actions'

interface ServiceDetailsDrawerProps {
  serviceId: string
  open: boolean
  onClose: () => void
}

interface Checkin {
  id: string
  checkedInAt: Date | string
  isNewBeliever: boolean
  user: {
    name: string | null
    email: string
  }
}

export function ServiceDetailsDrawer({ serviceId, open, onClose }: ServiceDetailsDrawerProps) {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<{ count: number; checkins: Checkin[] } | null>(null)

  useEffect(() => {
    if (open && serviceId) {
      setLoading(true)
      getServiceAttendance({ serviceId }).then((result) => {
        if (result.success && result.data) {
          setData(result.data)
        }
        setLoading(false)
      })
    }
  }, [serviceId, open])

  if (!open) return null

  return (
    <>
      <div 
        className="fixed inset-0 bg-surface/80 backdrop-blur-sm z-50" 
        onClick={onClose}
        aria-label="Close drawer"
      />
      <div className="fixed right-0 top-0 h-full w-96 bg-background shadow-lg z-50 flex flex-col">
        <div className="p-6 border-b flex items-center justify-between">
          <h2 className="text-xl font-semibold">Service Details</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="p-6 flex-1 overflow-auto">
          {loading ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : data ? (
            <>
              <div className="mb-6">
                <p className="text-sm text-muted-foreground">Total Attendance</p>
                <p className="text-2xl font-bold">{data.count}</p>
              </div>
              
              <div>
                <h3 className="font-semibold mb-4">Recent Check-ins</h3>
                {data.checkins.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No check-ins yet</p>
                ) : (
                  <div className="space-y-3">
                    {data.checkins.map((checkin) => (
                      <div key={checkin.id} className="border-b pb-3">
                        <p className="font-medium">
                          {checkin.user.name || checkin.user.email}
                          {checkin.isNewBeliever && (
                            <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                              New Believer
                            </span>
                          )}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(checkin.checkedInAt), 'p')}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <p className="text-red-500">Failed to load attendance data</p>
          )}
        </div>
      </div>
    </>
  )
}