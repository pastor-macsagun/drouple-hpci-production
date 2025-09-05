'use client'

import { useState, useTransition, useCallback } from 'react'
import { EventScope, UserRole } from '@prisma/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Search, Calendar, MapPin, Users, Edit, Eye, Plus, List } from 'lucide-react'
import { getEvents } from '@/app/events/actions'
import { SimpleCalendar } from '@/components/calendar/simple-calendar'
import Link from 'next/link'
import { useToast } from '@/components/ui/use-toast'

interface Event {
  id: string
  name: string
  description: string | null
  startDateTime: Date
  endDateTime: Date
  location: string | null
  capacity: number
  scope: EventScope
  localChurchId: string | null
  requiresPayment: boolean
  feeAmount: number | null
  visibleToRoles: UserRole[]
  isActive: boolean
  localChurch: {
    id: string
    name: string
  } | null
  _count: {
    rsvps: number
  }
}

interface EventsManagerProps {
  initialEvents: Event[]
}

export function EventsManager({ initialEvents }: EventsManagerProps) {
  const [events, setEvents] = useState(initialEvents)
  const [search, setSearch] = useState('')
  const [isPending, startTransition] = useTransition()
  const { toast } = useToast()

  const handleSearch = useCallback(() => {
    startTransition(async () => {
      const result = await getEvents({ search })
      if (result.success && result.data) {
        setEvents(result.data)
      } else {
        toast({
          title: 'Error',
          description: result.error,
          variant: 'destructive'
        })
      }
    })
  }, [search, toast])

  const handleEventClick = useCallback((event: any) => {
    // Navigate to event details page
    window.location.href = `/admin/events/${event.id}`
  }, [])

  return (
    <div className="container mx-auto p-6">
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Manage Events</h1>
          <Link href="/admin/events/new">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Create Event
            </Button>
          </Link>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-2">
          <div className="relative flex-1 max-w-none sm:max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search events..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="pl-10 h-11 sm:h-10"
            />
          </div>
          <Button 
            onClick={handleSearch} 
            disabled={isPending}
            className="h-11 sm:h-10 min-w-[100px]"
          >
            <Search className="h-4 w-4 mr-2 sm:mr-1" />
            Search
          </Button>
        </div>
      </div>

      <Tabs defaultValue="list" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="list" className="flex items-center gap-2">
            <List className="h-4 w-4" />
            List View
          </TabsTrigger>
          <TabsTrigger value="calendar" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Calendar
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="list" className="mt-6">
          {events.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <p className="text-muted-foreground">
                  {search ? 'No events found matching your search.' : 'No events created yet.'}
                </p>
                <Link href="/admin/events/new">
                  <Button className="mt-4">
                    {search ? 'Create New Event' : 'Create Your First Event'}
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {events.map((event) => {
                const startDate = new Date(event.startDateTime)
                const attendeeCount = event._count.rsvps
                const isFull = attendeeCount >= event.capacity

                return (
                  <Card key={event.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-lg leading-tight">{event.name}</CardTitle>
                          {event.description && (
                            <CardDescription className="mt-1 line-clamp-2">{event.description}</CardDescription>
                          )}
                        </div>
                        <div className="flex gap-2 flex-wrap">
                          {event.scope === EventScope.WHOLE_CHURCH && (
                            <Badge variant="secondary" className="text-xs">All Churches</Badge>
                          )}
                          {!event.isActive && (
                            <Badge variant="destructive" className="text-xs">Inactive</Badge>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="pt-0">
                      {/* Mobile-optimized info grid */}
                      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 mb-4">
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <span className="truncate">{startDate.toLocaleDateString()}</span>
                        </div>
                        
                        {event.location && (
                          <div className="flex items-center gap-2 text-sm">
                            <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            <span className="truncate">{event.location}</span>
                          </div>
                        )}
                        
                        <div className="flex items-center gap-2 text-sm">
                          <Users className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <span className="flex items-center gap-2">
                            {attendeeCount} / {event.capacity}
                            {isFull && <Badge variant="destructive" className="text-xs">Full</Badge>}
                          </span>
                        </div>
                      </div>

                      {/* Touch-friendly buttons */}
                      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                        <Link href={`/admin/events/${event.id}`} className="flex-1 sm:flex-none">
                          <Button size="sm" className="w-full sm:w-auto min-h-[44px] sm:min-h-[36px]">
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </Button>
                        </Link>
                        <Link href={`/admin/events/${event.id}/edit`} className="flex-1 sm:flex-none">
                          <Button size="sm" variant="outline" className="w-full sm:w-auto min-h-[44px] sm:min-h-[36px]">
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="calendar" className="mt-6">
          <SimpleCalendar 
            events={events} 
            onEventClick={handleEventClick}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}