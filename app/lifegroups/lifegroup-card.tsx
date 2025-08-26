'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Users, User, LogOut, UserPlus, Clock } from 'lucide-react'
import { requestJoinLifeGroup, leaveLifeGroup } from './actions'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"

interface LifeGroupCardProps {
  lifeGroup: {
    id: string
    name: string
    description?: string | null
    capacity: number
    leader: {
      id: string
      name?: string | null
      email: string
    }
    _count: {
      memberships: number
    }
  }
  isMember?: boolean
  hasPendingRequest?: boolean
  isFull?: boolean
  onAction?: () => void
}

export function LifeGroupCard({ 
  lifeGroup, 
  isMember = false, 
  hasPendingRequest = false,
  isFull = false,
  onAction 
}: LifeGroupCardProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [showJoinDialog, setShowJoinDialog] = useState(false)
  const [message, setMessage] = useState('')

  const handleJoin = async () => {
    setIsLoading(true)
    try {
      const result = await requestJoinLifeGroup(lifeGroup.id, message)
      if (result.success) {
        toast.success('Request sent successfully')
        setShowJoinDialog(false)
        setMessage('')
        onAction?.()
      } else {
        toast.error(result.error || 'Failed to send request')
      }
    } catch {
      toast.error('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handleLeave = async () => {
    if (!confirm('Are you sure you want to leave this life group?')) {
      return
    }

    setIsLoading(true)
    try {
      const result = await leaveLifeGroup(lifeGroup.id)
      if (result.success) {
        toast.success('Successfully left the life group')
        onAction?.()
      } else {
        toast.error(result.error || 'Failed to leave')
      }
    } catch {
      toast.error('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const availableSpots = lifeGroup.capacity - lifeGroup._count.memberships

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle>{lifeGroup.name}</CardTitle>
              <CardDescription className="mt-1">
                {lifeGroup.description || 'No description available'}
              </CardDescription>
            </div>
            {isMember && (
              <Badge variant="default">Member</Badge>
            )}
            {hasPendingRequest && (
              <Badge variant="secondary">
                <Clock className="mr-1 h-3 w-3" />
                Pending
              </Badge>
            )}
            {isFull && !isMember && (
              <Badge variant="destructive">Full</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <User className="h-4 w-4" />
                <span>Led by {lifeGroup.leader.name || lifeGroup.leader.email}</span>
              </div>
            </div>
            
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                <span>
                  {lifeGroup._count.memberships}/{lifeGroup.capacity} members
                </span>
              </div>
              {availableSpots > 0 && !isMember && (
                <span className="text-green-600">
                  {availableSpots} spot{availableSpots !== 1 ? 's' : ''} available
                </span>
              )}
            </div>

            {isMember ? (
              <Button 
                variant="outline" 
                className="w-full"
                onClick={handleLeave}
                disabled={isLoading}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Leave Group
              </Button>
            ) : hasPendingRequest ? (
              <Button variant="outline" className="w-full" disabled>
                <Clock className="mr-2 h-4 w-4" />
                Request Pending
              </Button>
            ) : (
              <Button 
                className="w-full"
                onClick={() => setShowJoinDialog(true)}
                disabled={isFull || isLoading}
              >
                <UserPlus className="mr-2 h-4 w-4" />
                {isFull ? 'Group Full' : 'Request to Join'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={showJoinDialog} onOpenChange={setShowJoinDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request to Join {lifeGroup.name}</DialogTitle>
            <DialogDescription>
              Send a message to the group leader with your request
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="message">Message (optional)</Label>
              <Textarea
                id="message"
                placeholder="Tell the leader why you'd like to join..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowJoinDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleJoin} disabled={isLoading}>
              {isLoading ? 'Sending...' : 'Send Request'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}