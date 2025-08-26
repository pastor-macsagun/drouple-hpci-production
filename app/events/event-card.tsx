'use client'

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { Calendar, MapPin, Users, DollarSign } from 'lucide-react'
import { EventScope } from '@prisma/client'

interface EventCardProps {
  event: {
    id: string
    name: string
    description: string | null
    startDateTime: Date
    endDateTime: Date
    location: string | null
    capacity: number
    scope: EventScope
    requiresPayment: boolean
    feeAmount: number | null
    localChurch?: { name: string } | null
    _count: { rsvps: number }
  }
}

export function EventCard({ event }: EventCardProps) {
  const startDate = new Date(event.startDateTime)
  const attendeeCount = event._count.rsvps
  const spotsLeft = Math.max(0, event.capacity - attendeeCount)
  const isFull = spotsLeft === 0

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle className="text-xl">{event.name}</CardTitle>
          {event.scope === EventScope.WHOLE_CHURCH && (
            <Badge variant="secondary">All Churches</Badge>
          )}
        </div>
        {event.description && (
          <CardDescription className="mt-2">{event.description}</CardDescription>
        )}
      </CardHeader>
      
      <CardContent className="flex-1 space-y-3">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Calendar className="h-4 w-4" />
          <span>
            {startDate.toLocaleDateString()} at {startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>

        {event.location && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <MapPin className="h-4 w-4" />
            <span>{event.location}</span>
          </div>
        )}

        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Users className="h-4 w-4" />
          <span>
            {attendeeCount} / {event.capacity} attending
            {isFull && <Badge variant="destructive" className="ml-2">Full</Badge>}
            {!isFull && spotsLeft <= 5 && (
              <Badge variant="outline" className="ml-2">{spotsLeft} spots left</Badge>
            )}
          </span>
        </div>

        {event.requiresPayment && event.feeAmount && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <DollarSign className="h-4 w-4" />
            <span>${event.feeAmount.toFixed(2)}</span>
          </div>
        )}

        {event.localChurch && (
          <div className="text-sm text-gray-500">
            {event.localChurch.name}
          </div>
        )}
      </CardContent>

      <CardFooter>
        <Link href={`/events/${event.id}`} className="w-full">
          <Button className="w-full" variant={isFull ? "secondary" : "default"}>
            {isFull ? "View Waitlist" : "View Details"}
          </Button>
        </Link>
      </CardFooter>
    </Card>
  )
}