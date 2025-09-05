'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { CheckCircle, Calendar, Users, Loader2, QrCode } from 'lucide-react'
import { QRScanner } from '@/components/ui/qr-scanner'
import { checkIn } from './actions'
import { format } from 'date-fns'
import { toast } from 'sonner'

interface CheckInFormProps {
  service: {
    id: string
    date: Date
    localChurch: {
      name: string
    }
    _count: {
      checkins: number
    }
  }
  existingCheckin?: {
    id: string
    checkedInAt: Date
    isNewBeliever: boolean
  } | null
}

export function CheckInForm({ service, existingCheckin }: CheckInFormProps) {
  const [isNewBeliever, setIsNewBeliever] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [showScanner, setShowScanner] = useState(false)

  const handleCheckIn = async () => {
    setIsLoading(true)
    try {
      const formData = new FormData()
      formData.set('serviceId', service.id)
      formData.set('isNewBeliever', isNewBeliever.toString())
      const result = await checkIn(formData)
      if (result.success) {
        toast.success('Successfully checked in!')
        // Refresh the page to show updated state
        window.location.reload()
      } else {
        toast.error(result.error || 'Failed to check in')
      }
    } catch {
      toast.error('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handleQRScan = (result: string) => {
    // For now, just show the scanned result and close scanner
    toast.success(`QR Code scanned: ${result}`)
    setShowScanner(false)
    // In a real implementation, you would process the QR code for check-in
  }

  if (existingCheckin) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle className="h-6 w-6" />
            <CardTitle>You are checked in!</CardTitle>
          </div>
          <CardDescription>
            You checked in at {format(new Date(existingCheckin.checkedInAt), 'h:mm a')}
            {existingCheckin.isNewBeliever && ' as a new believer'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>{format(new Date(service.date), 'EEEE, MMMM d, yyyy')}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>{service._count.checkins} people checked in</span>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (showScanner) {
    return (
      <QRScanner
        onScan={handleQRScan}
        onError={(error) => toast.error(`Scanner error: ${error}`)}
        onClose={() => setShowScanner(false)}
      />
    )
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Sunday Service Check-In</CardTitle>
        <CardDescription>
          {service.localChurch.name} - {format(new Date(service.date), 'EEEE, MMMM d, yyyy')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>{service._count.checkins} people checked in</span>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox 
              id="new-believer" 
              checked={isNewBeliever}
              onCheckedChange={(checked) => setIsNewBeliever(!!checked)}
            />
            <Label 
              htmlFor="new-believer" 
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              I am a new believer
            </Label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Button 
              onClick={handleCheckIn} 
              disabled={isLoading}
              className="w-full"
              size="lg"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Checking in...
                </>
              ) : (
                'Check In'
              )}
            </Button>
            <Button 
              onClick={() => setShowScanner(true)}
              variant="outline"
              className="w-full"
              size="lg"
            >
              <QrCode className="mr-2 h-4 w-4" />
              Scan QR Code
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}