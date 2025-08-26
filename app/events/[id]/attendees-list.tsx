'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { markAsPaid } from '../actions'
import { RsvpStatus } from '@prisma/client'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { DollarSign, CheckCircle } from 'lucide-react'

interface AttendeesListProps {
  eventId: string
  rsvps: Array<{
    id: string
    status: RsvpStatus
    hasPaid: boolean
    rsvpAt: Date
    user: {
      id: string
      name: string | null
      email: string
    }
  }>
  requiresPayment: boolean
}

export function AttendeesList({ rsvps, requiresPayment }: AttendeesListProps) {
  const router = useRouter()
  const [loadingIds, setLoadingIds] = useState<Set<string>>(new Set())

  const handleMarkPaid = async (rsvpId: string) => {
    setLoadingIds(prev => new Set(prev).add(rsvpId))
    try {
      const result = await markAsPaid(rsvpId)
      if (result.success) {
        toast.success('Marked as paid')
        router.refresh()
      } else {
        toast.error(result.error || 'Failed to update payment status')
      }
    } catch {
      toast.error('An error occurred')
    } finally {
      setLoadingIds(prev => {
        const next = new Set(prev)
        next.delete(rsvpId)
        return next
      })
    }
  }

  const goingList = rsvps.filter(r => r.status === RsvpStatus.GOING)
  const waitlist = rsvps.filter(r => r.status === RsvpStatus.WAITLIST)

  return (
    <div className="space-y-6">
      {goingList.length > 0 && (
        <div>
          <h4 className="font-medium mb-3">Attending ({goingList.length})</h4>
          <div className="space-y-2">
            {goingList.map((rsvp, index) => (
              <div key={rsvp.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-500">#{index + 1}</span>
                  <div>
                    <p className="font-medium">{rsvp.user.name || 'No name'}</p>
                    <p className="text-sm text-gray-600">{rsvp.user.email}</p>
                  </div>
                </div>
                
                {requiresPayment && (
                  <div className="flex items-center gap-2">
                    {rsvp.hasPaid ? (
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <CheckCircle className="h-3 w-3" />
                        Paid
                      </Badge>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleMarkPaid(rsvp.id)}
                        disabled={loadingIds.has(rsvp.id)}
                      >
                        <DollarSign className="h-3 w-3 mr-1" />
                        Mark Paid
                      </Button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {waitlist.length > 0 && (
        <div>
          <h4 className="font-medium mb-3">Waitlist ({waitlist.length})</h4>
          <div className="space-y-2">
            {waitlist.map((rsvp, index) => (
              <div key={rsvp.id} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-500">#{index + 1}</span>
                  <div>
                    <p className="font-medium">{rsvp.user.name || 'No name'}</p>
                    <p className="text-sm text-gray-600">{rsvp.user.email}</p>
                  </div>
                </div>
                <Badge variant="outline">Waitlist</Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {goingList.length === 0 && waitlist.length === 0 && (
        <p className="text-gray-500 text-center py-4">No attendees yet</p>
      )}
    </div>
  )
}