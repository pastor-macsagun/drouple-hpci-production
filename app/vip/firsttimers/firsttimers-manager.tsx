'use client'

import { useState } from 'react'
import { UserRole, BelieverStatus } from '@prisma/client'
import {
  createFirstTimer,
  updateFirstTimer,
  deleteFirstTimer,
  markBelieverInactive,
  setBelieverStatus,
} from '@/app/actions/firsttimers'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { UserPlus, CheckCircle, Circle, Trash2, Edit, XCircle, Filter, Users, UserCheck } from 'lucide-react'
import { format } from 'date-fns'
import { toast } from 'sonner'

interface FirstTimer {
  id: string
  memberId: string
  gospelShared: boolean
  rootsCompleted: boolean
  notes: string | null
  createdAt: Date
  updatedAt: Date
  member: {
    id: string
    name: string | null
    email: string
    phone: string | null
    createdAt: Date
    pathwayEnrollments: Array<{
      status: string
      completedAt: Date | null
    }>
    memberships: Array<{
      id: string
      localChurchId: string
      believerStatus: BelieverStatus
    }>
  }
  assignedVip: {
    id: string
    name: string | null
    email: string
  } | null
}

interface VipMember {
  id: string
  name: string | null
  email: string
  role: UserRole
}

interface FirstTimersManagerProps {
  initialFirstTimers: FirstTimer[]
  vipMembers: VipMember[]
  userRole: UserRole
}

export function FirstTimersManager({
  initialFirstTimers,
  vipMembers,
  userRole,
}: FirstTimersManagerProps) {
  const [firstTimers, setFirstTimers] = useState(initialFirstTimers)
  const [isCreating, setIsCreating] = useState(false)
  const [selectedFirstTimer, setSelectedFirstTimer] = useState<FirstTimer | null>(null)
  const [notesDialogOpen, setNotesDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [inactiveDialogOpen, setInactiveDialogOpen] = useState(false)
  const [gospelFilter, setGospelFilter] = useState<'all' | 'yes' | 'no'>('all')
  const [rootsFilter, setRootsFilter] = useState<'all' | 'yes' | 'no'>('all')
  const [assignedFilter, setAssignedFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<BelieverStatus | 'all'>('all')

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    assignedVipId: 'none',
    notes: '',
  })

  const [editNotes, setEditNotes] = useState('')

  const filteredFirstTimers = firstTimers.filter((ft) => {
    if (gospelFilter !== 'all') {
      const match = gospelFilter === 'yes' ? ft.gospelShared : !ft.gospelShared
      if (!match) return false
    }
    if (rootsFilter !== 'all') {
      const match = rootsFilter === 'yes' ? ft.rootsCompleted : !ft.rootsCompleted
      if (!match) return false
    }
    if (assignedFilter !== 'all') {
      if (assignedFilter === 'unassigned' && ft.assignedVip) return false
      if (assignedFilter !== 'unassigned' && ft.assignedVip?.id !== assignedFilter) return false
    }
    // US-VIP-003: Believer status filter
    if (statusFilter !== 'all') {
      const membership = ft.member.memberships?.[0]
      if (!membership || membership.believerStatus !== statusFilter) return false
    }
    return true
  })

  const handleCreate = async () => {
    try {
      const newFirstTimer = await createFirstTimer({
        ...formData,
        assignedVipId: formData.assignedVipId === 'none' ? undefined : formData.assignedVipId,
      })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setFirstTimers([newFirstTimer as any, ...firstTimers])
      setIsCreating(false)
      setFormData({ name: '', email: '', phone: '', assignedVipId: 'none', notes: '' })
      toast.success('First timer created successfully')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create first timer')
    }
  }

  const handleUpdateStatus = async (
    id: string,
    field: 'gospelShared' | 'rootsCompleted',
    value: boolean
  ) => {
    try {
      const updated = await updateFirstTimer(id, { [field]: value })
      setFirstTimers(
        firstTimers.map((ft) =>
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ft.id === id ? { ...ft, ...updated } as any : ft
        )
      )
      toast.success(
        field === 'gospelShared'
          ? `Gospel ${value ? 'shared' : 'not shared'} status updated`
          : `ROOTS ${value ? 'completed' : 'not completed'} status updated`
      )
    } catch {
      toast.error('Failed to update status')
    }
  }

  const handleUpdateNotes = async () => {
    if (!selectedFirstTimer) return
    try {
      const updated = await updateFirstTimer(selectedFirstTimer.id, {
        notes: editNotes,
      })
      setFirstTimers(
        firstTimers.map((ft) =>
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ft.id === selectedFirstTimer.id ? { ...ft, ...updated } as any : ft
        )
      )
      setNotesDialogOpen(false)
      setSelectedFirstTimer(null)
      setEditNotes('')
      toast.success('Notes updated successfully')
    } catch {
      toast.error('Failed to update notes')
    }
  }

  const handleUpdateAssignment = async (id: string, assignedVipId: string | null) => {
    try {
      const updated = await updateFirstTimer(id, { assignedVipId })
      setFirstTimers(
        firstTimers.map((ft) =>
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ft.id === id ? { ...ft, ...updated } as any : ft
        )
      )
      toast.success('Assignment updated successfully')
    } catch {
      toast.error('Failed to update assignment')
    }
  }

  const handleDelete = async () => {
    if (!selectedFirstTimer) return
    try {
      await deleteFirstTimer(selectedFirstTimer.id)
      setFirstTimers(firstTimers.filter((ft) => ft.id !== selectedFirstTimer.id))
      setDeleteDialogOpen(false)
      setSelectedFirstTimer(null)
      toast.success('First timer record deleted')
    } catch {
      toast.error('Failed to delete first timer')
    }
  }

  const handleMarkInactive = async () => {
    if (!selectedFirstTimer || !selectedFirstTimer.member.memberships[0]) return
    try {
      await markBelieverInactive(selectedFirstTimer.member.memberships[0].id)
      setFirstTimers(
        firstTimers.map((ft) =>
          ft.id === selectedFirstTimer.id
            ? {
                ...ft,
                member: {
                  ...ft.member,
                  memberships: ft.member.memberships.map((m) => ({
                    ...m,
                    believerStatus: BelieverStatus.INACTIVE
                  }))
                }
              }
            : ft
        )
      )
      setInactiveDialogOpen(false)
      setSelectedFirstTimer(null)
      toast.success('Believer marked as inactive')
    } catch {
      toast.error('Failed to mark believer as inactive')
    }
  }

  const canDelete = userRole === UserRole.SUPER_ADMIN || userRole === UserRole.ADMIN

  return (
    <div className="space-y-6">
      {/* Filters and Create Button */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          <Select value={gospelFilter} onValueChange={(v) => setGospelFilter(v as 'all' | 'yes' | 'no')}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Gospel Shared" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="yes">Gospel Shared</SelectItem>
              <SelectItem value="no">Not Shared</SelectItem>
            </SelectContent>
          </Select>

          <Select value={rootsFilter} onValueChange={(v) => setRootsFilter(v as 'all' | 'yes' | 'no')}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="ROOTS Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="yes">ROOTS Completed</SelectItem>
              <SelectItem value="no">Not Completed</SelectItem>
            </SelectContent>
          </Select>

          <Select value={assignedFilter} onValueChange={setAssignedFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Assigned VIP" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="unassigned">Unassigned</SelectItem>
              {vipMembers.map((vip) => (
                <SelectItem key={vip.id} value={vip.id}>
                  {vip.name || vip.email}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as BelieverStatus | 'all')}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Believer Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value={BelieverStatus.ACTIVE}>Active</SelectItem>
              <SelectItem value={BelieverStatus.INACTIVE}>Inactive</SelectItem>
              <SelectItem value={BelieverStatus.COMPLETED}>Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Dialog open={isCreating} onOpenChange={setIsCreating}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="mr-2 h-4 w-4" />
              Add First Timer
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Add New First Timer</DialogTitle>
              <DialogDescription>
                Create a new member account and track their follow-up progress
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="John Doe"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="john@example.com"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="phone">Phone (Optional)</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+1234567890"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="assignedVip">Assign to VIP (Optional)</Label>
                <Select
                  value={formData.assignedVipId}
                  onValueChange={(value) => setFormData({ ...formData, assignedVipId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select VIP member" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {vipMembers.map((vip) => (
                      <SelectItem key={vip.id} value={vip.id}>
                        {vip.name || vip.email} ({vip.role})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Add any initial notes..."
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreating(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreate}>Create First Timer</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Assigned VIP</TableHead>
              <TableHead>Gospel Shared</TableHead>
              <TableHead>ROOTS Status</TableHead>
              <TableHead>Added</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredFirstTimers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground">
                  No first timers found
                </TableCell>
              </TableRow>
            ) : (
              filteredFirstTimers.map((ft) => {
                const believerStatus = ft.member.memberships[0]?.believerStatus || BelieverStatus.ACTIVE
                const isInactive = believerStatus === BelieverStatus.INACTIVE
                
                return (
                  <TableRow key={ft.id} className={isInactive ? 'bg-gray-50 opacity-75' : ''}>
                    <TableCell className="font-medium">
                      {ft.member.name || 'Unknown'}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{ft.member.email}</div>
                        {ft.member.phone && (
                          <div className="text-muted-foreground">{ft.member.phone}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          believerStatus === BelieverStatus.COMPLETED
                            ? 'default'
                            : believerStatus === BelieverStatus.INACTIVE
                            ? 'secondary'
                            : 'outline'
                        }
                      >
                        {believerStatus}
                      </Badge>
                    </TableCell>
                    <TableCell>
                    <Select
                      value={ft.assignedVip?.id || 'unassigned'}
                      onValueChange={(value) =>
                        handleUpdateAssignment(ft.id, value === 'unassigned' ? null : value)
                      }
                    >
                      <SelectTrigger className="w-[150px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unassigned">Unassigned</SelectItem>
                        {vipMembers.map((vip) => (
                          <SelectItem key={vip.id} value={vip.id}>
                            {vip.name || vip.email}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant={ft.gospelShared ? 'default' : 'outline'}
                      onClick={() => handleUpdateStatus(ft.id, 'gospelShared', !ft.gospelShared)}
                      className="w-20"
                    >
                      {ft.gospelShared ? (
                        <>
                          <CheckCircle className="mr-1 h-3 w-3" />
                          Yes
                        </>
                      ) : (
                        <>
                          <Circle className="mr-1 h-3 w-3" />
                          No
                        </>
                      )}
                    </Button>
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant={ft.rootsCompleted ? 'default' : 'outline'}
                      onClick={() => handleUpdateStatus(ft.id, 'rootsCompleted', !ft.rootsCompleted)}
                      className="w-24"
                    >
                      {ft.rootsCompleted ? (
                        <>
                          <CheckCircle className="mr-1 h-3 w-3" />
                          Done
                        </>
                      ) : (
                        <>
                          <Circle className="mr-1 h-3 w-3" />
                          Pending
                        </>
                      )}
                    </Button>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-muted-foreground">
                      {format(new Date(ft.createdAt), 'MMM d, yyyy')}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setSelectedFirstTimer(ft)
                          setEditNotes(ft.notes || '')
                          setNotesDialogOpen(true)
                        }}
                        title="Edit Notes"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      {believerStatus === BelieverStatus.ACTIVE && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setSelectedFirstTimer(ft)
                            setInactiveDialogOpen(true)
                          }}
                          title="Set Inactive"
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      )}
                      {canDelete && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setSelectedFirstTimer(ft)
                            setDeleteDialogOpen(true)
                          }}
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              )
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Notes Dialog */}
      <Dialog open={notesDialogOpen} onOpenChange={setNotesDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Notes</DialogTitle>
            <DialogDescription>
              Update follow-up notes for {selectedFirstTimer?.member.name || 'this first timer'}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              value={editNotes}
              onChange={(e) => setEditNotes(e.target.value)}
              placeholder="Add follow-up notes..."
              rows={5}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNotesDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateNotes}>Save Notes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete First Timer Record</DialogTitle>
            <DialogDescription>
              This will delete the first timer tracking record for{' '}
              {selectedFirstTimer?.member.name || 'this person'}, but their member account will
              remain. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete Record
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Inactive Confirmation Dialog */}
      <Dialog open={inactiveDialogOpen} onOpenChange={setInactiveDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Mark Believer as Inactive</DialogTitle>
            <DialogDescription>
              Are you sure you want to mark{' '}
              {selectedFirstTimer?.member.name || 'this believer'} as inactive? 
              Their ROOTS progress will be preserved, but they will be marked as 
              inactive in the system.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInactiveDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleMarkInactive}>
              Set Inactive
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}