'use client'

import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChevronLeft, ChevronRight, Calendar, MapPin, Users } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CalendarEvent {
  id: string
  name: string
  startDateTime: Date
  location?: string | null
  _count: {
    rsvps: number
  }
  capacity: number
}

interface SimpleCalendarProps {
  events: CalendarEvent[]
  onEventClick?: (event: CalendarEvent) => void
}

export function SimpleCalendar({ events, onEventClick }: SimpleCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())

  // Group events by date
  const eventsByDate = useMemo(() => {
    const grouped: { [key: string]: CalendarEvent[] } = {}
    
    events.forEach(event => {
      const dateKey = new Date(event.startDateTime).toDateString()
      if (!grouped[dateKey]) {
        grouped[dateKey] = []
      }
      grouped[dateKey].push(event)
    })
    
    return grouped
  }, [events])

  // Get calendar grid
  const calendar = useMemo(() => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    
    // Get first day of month and how many days
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()
    
    const days = []
    
    // Add empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null)
    }
    
    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day)
      const dateKey = date.toDateString()
      const dayEvents = eventsByDate[dateKey] || []
      
      days.push({
        date,
        day,
        events: dayEvents,
        isToday: date.toDateString() === new Date().toDateString()
      })
    }
    
    return days
  }, [currentDate, eventsByDate])

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
  }

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Calendar className="h-5 w-5" />
            <span className="truncate">{monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}</span>
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={goToToday} className="flex-shrink-0">
              Today
            </Button>
            <Button variant="outline" size="sm" onClick={goToPreviousMonth} className="flex-shrink-0">
              <ChevronLeft className="h-4 w-4" />
              <span className="sr-only">Previous month</span>
            </Button>
            <Button variant="outline" size="sm" onClick={goToNextMonth} className="flex-shrink-0">
              <ChevronRight className="h-4 w-4" />
              <span className="sr-only">Next month</span>
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {/* Day headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {dayNames.map(day => (
            <div key={day} className="p-2 text-center text-xs sm:text-sm font-medium text-muted-foreground">
              <span className="hidden sm:inline">{day}</span>
              <span className="sm:hidden">{day.substring(0, 1)}</span>
            </div>
          ))}
        </div>
        
        {/* Calendar grid - responsive height */}
        <div className="grid grid-cols-7 gap-1">
          {calendar.map((day, index) => (
            <div
              key={index}
              className={cn(
                "min-h-[60px] sm:min-h-[80px] p-1 border rounded-lg transition-colors",
                day?.isToday ? "bg-primary/10 border-primary" : "border-border",
                day ? "cursor-pointer hover:bg-muted/50 active:bg-muted/70" : ""
              )}
            >
              {day && (
                <>
                  <div className="text-xs sm:text-sm font-medium mb-1">{day.day}</div>
                  <div className="space-y-1">
                    {day.events.slice(0, 2).map((event) => (
                      <div
                        key={event.id}
                        onClick={() => onEventClick?.(event)}
                        className="text-xs p-1 bg-primary/20 text-primary rounded cursor-pointer hover:bg-primary/30 active:bg-primary/40 transition-colors touch-manipulation"
                        title={`${event.name}${event.location ? ` - ${event.location}` : ''}`}
                      >
                        <div className="font-medium truncate leading-tight">{event.name}</div>
                        <div className="flex items-center gap-1 text-[10px] opacity-75 mt-0.5">
                          {event.location && (
                            <>
                              <MapPin className="h-2 w-2 flex-shrink-0" />
                              <span className="truncate flex-1">{event.location}</span>
                            </>
                          )}
                          <div className="flex items-center gap-0.5 ml-auto flex-shrink-0">
                            <Users className="h-2 w-2" />
                            <span>{event._count.rsvps}/{event.capacity}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                    {day.events.length > 2 && (
                      <div className="text-[9px] sm:text-[10px] text-muted-foreground text-center py-0.5">
                        +{day.events.length - 2} more
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
        
        {/* Legend */}
        <div className="mt-4 pt-4 border-t">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-primary/20 rounded"></div>
                <span>Event</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-primary/10 border border-primary rounded"></div>
                <span>Today</span>
              </div>
            </div>
            <div className="text-xs">
              Click on events to view details
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}