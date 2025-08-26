'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { rsvpToEvent, cancelRsvp } from '../actions'
import { RsvpStatus } from '@prisma/client'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

interface RsvpButtonProps {
  eventId: string
  userRsvp?: {
    id: string
    status: RsvpStatus
    hasPaid: boolean
  } | null
  isFull: boolean
  requiresPayment: boolean
}

export function RsvpButton({ eventId, userRsvp, isFull, requiresPayment }: RsvpButtonProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleRsvp = async () => {
    setIsLoading(true)
    try {
      const result = await rsvpToEvent(eventId)
      if (result.success) {
        if (result.data?.status === RsvpStatus.WAITLIST) {
          toast.success('Added to waitlist!')
        } else {
          toast.success('Successfully registered!')
        }
        router.refresh()
      } else {
        toast.error(result.error || 'Failed to RSVP')
      }
    } catch {
      toast.error('An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = async () => {
    setIsLoading(true)
    try {
      const result = await cancelRsvp(eventId)
      if (result.success) {
        toast.success('RSVP cancelled')
        router.refresh()
      } else {
        toast.error(result.error || 'Failed to cancel')
      }
    } catch {
      toast.error('An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  if (userRsvp) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          {userRsvp.status === RsvpStatus.GOING && (
            <>
              <Badge variant="default" className="text-lg py-1 px-3">
                You&apos;re Going!
              </Badge>
              {requiresPayment && (
                <Badge 
                  variant={userRsvp.hasPaid ? "secondary" : "outline"} 
                  className="text-lg py-1 px-3"
                >
                  {userRsvp.hasPaid ? "Paid" : "Payment Pending"}
                </Badge>
              )}
            </>
          )}
          {userRsvp.status === RsvpStatus.WAITLIST && (
            <Badge variant="secondary" className="text-lg py-1 px-3">
              You&apos;re on the Waitlist
            </Badge>
          )}
        </div>
        
        <Button 
          onClick={handleCancel} 
          variant="destructive"
          disabled={isLoading}
        >
          {isLoading ? 'Cancelling...' : 'Cancel RSVP'}
        </Button>

        {userRsvp.status === RsvpStatus.WAITLIST && (
          <p className="text-sm text-gray-600">
            You&apos;ll be automatically moved to the attendee list if a spot opens up.
          </p>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <Button 
        onClick={handleRsvp} 
        disabled={isLoading}
        variant={isFull ? "secondary" : "default"}
        size="lg"
      >
        {isLoading ? 'Processing...' : isFull ? 'Join Waitlist' : 'RSVP to Event'}
      </Button>
      
      {isFull && (
        <p className="text-sm text-gray-600">
          This event is currently full. You can join the waitlist and will be notified if a spot opens up.
        </p>
      )}

      {requiresPayment && !isFull && (
        <p className="text-sm text-gray-600">
          Payment will be collected at the event.
        </p>
      )}
    </div>
  )
}