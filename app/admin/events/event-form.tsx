'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { createEvent, updateEvent } from '@/app/events/actions'
import { EventScope, UserRole } from '@prisma/client'
import { toast } from 'sonner'

interface EventFormProps {
  event?: {
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
  }
  localChurches?: Array<{ id: string; name: string }>
}

export function EventForm({ event, localChurches }: EventFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: event?.name || '',
    description: event?.description || '',
    startDateTime: event ? new Date(event.startDateTime).toISOString().slice(0, 16) : '',
    endDateTime: event ? new Date(event.endDateTime).toISOString().slice(0, 16) : '',
    location: event?.location || '',
    capacity: event?.capacity || 50,
    scope: event?.scope || EventScope.LOCAL_CHURCH,
    localChurchId: event?.localChurchId || '',
    requiresPayment: event?.requiresPayment || false,
    feeAmount: event?.feeAmount || 0,
    visibleToRoles: event?.visibleToRoles || [],
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const data = {
        ...formData,
        startDateTime: new Date(formData.startDateTime),
        endDateTime: new Date(formData.endDateTime),
        description: formData.description || undefined,
        location: formData.location || undefined,
        localChurchId: formData.scope === EventScope.LOCAL_CHURCH ? formData.localChurchId : undefined,
        feeAmount: formData.requiresPayment ? formData.feeAmount : undefined,
      }

      const result = event 
        ? await updateEvent(event.id, data)
        : await createEvent(data)

      if (result.success) {
        toast.success(event ? 'Event updated successfully' : 'Event created successfully')
        router.push('/admin/events')
        router.refresh()
      } else {
        toast.error(result.error || 'Failed to save event')
      }
    } catch {
      toast.error('An error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRoleToggle = (role: UserRole) => {
    setFormData(prev => ({
      ...prev,
      visibleToRoles: prev.visibleToRoles.includes(role)
        ? prev.visibleToRoles.filter(r => r !== role)
        : [...prev.visibleToRoles, role]
    }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">Event Name *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="capacity">Capacity *</Label>
          <Input
            id="capacity"
            type="number"
            min="1"
            value={formData.capacity}
            onChange={e => setFormData(prev => ({ ...prev, capacity: parseInt(e.target.value) }))}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
          rows={3}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="startDateTime">Start Date & Time *</Label>
          <Input
            id="startDateTime"
            type="datetime-local"
            value={formData.startDateTime}
            onChange={e => setFormData(prev => ({ ...prev, startDateTime: e.target.value }))}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="endDateTime">End Date & Time *</Label>
          <Input
            id="endDateTime"
            type="datetime-local"
            value={formData.endDateTime}
            onChange={e => setFormData(prev => ({ ...prev, endDateTime: e.target.value }))}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="location">Location</Label>
        <Input
          id="location"
          value={formData.location}
          onChange={e => setFormData(prev => ({ ...prev, location: e.target.value }))}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="scope">Event Scope *</Label>
          <Select
            value={formData.scope}
            onValueChange={value => setFormData(prev => ({ ...prev, scope: value as EventScope }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={EventScope.LOCAL_CHURCH}>Local Church</SelectItem>
              <SelectItem value={EventScope.WHOLE_CHURCH}>Whole Church</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {formData.scope === EventScope.LOCAL_CHURCH && localChurches && (
          <div className="space-y-2">
            <Label htmlFor="localChurchId">Local Church *</Label>
            <Select
              value={formData.localChurchId}
              onValueChange={value => setFormData(prev => ({ ...prev, localChurchId: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a church" />
              </SelectTrigger>
              <SelectContent>
                {localChurches.map(church => (
                  <SelectItem key={church.id} value={church.id}>
                    {church.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="requiresPayment"
            checked={formData.requiresPayment}
            onCheckedChange={checked => 
              setFormData(prev => ({ ...prev, requiresPayment: checked as boolean }))
            }
          />
          <Label htmlFor="requiresPayment">This event requires payment</Label>
        </div>

        {formData.requiresPayment && (
          <div className="space-y-2 ml-6">
            <Label htmlFor="feeAmount">Fee Amount ($)</Label>
            <Input
              id="feeAmount"
              type="number"
              min="0"
              step="0.01"
              value={formData.feeAmount}
              onChange={e => setFormData(prev => ({ ...prev, feeAmount: parseFloat(e.target.value) }))}
            />
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label>Visibility Restrictions</Label>
        <p className="text-sm text-gray-600">
          Leave unchecked to make visible to all members, or select specific roles
        </p>
        <div className="space-y-2 mt-2">
          {[UserRole.LEADER, UserRole.ADMIN].map(role => (
            <div key={role} className="flex items-center space-x-2">
              <Checkbox
                id={role}
                checked={formData.visibleToRoles.includes(role)}
                onCheckedChange={() => handleRoleToggle(role)}
              />
              <Label htmlFor={role}>{role.replace('_', ' ')}</Label>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push('/admin/events')}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : event ? 'Update Event' : 'Create Event'}
        </Button>
      </div>
    </form>
  )
}