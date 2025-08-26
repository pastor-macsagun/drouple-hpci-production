'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { createLifeGroup, deleteLifeGroup, listLifeGroups, exportRosterCsv } from './actions'
import { LifeGroupManageDrawer } from './lifegroup-manage-drawer'
import { UserRole } from '@prisma/client'

interface Leader {
  id: string
  name: string | null
  email: string
}

interface LifeGroup {
  id: string
  name: string
  description: string | null
  capacity: number
  leaderId: string
  localChurchId: string
  leader: Leader
  localChurch: {
    id: string
    name: string
  }
  _count: {
    memberships: number
  }
}

interface LifeGroupsManagerProps {
  initialLifeGroups: {
    items: LifeGroup[]
    nextCursor: string | null
    hasMore: boolean
  }
  churches: Array<{ id: string; name: string }>
  leaders: Leader[]
  userRole: UserRole
  userChurchId: string | null
}

export function LifeGroupsManager({ 
  initialLifeGroups, 
  churches, 
  leaders,
  userRole, 
  userChurchId 
}: LifeGroupsManagerProps) {
  const [lifeGroups, setLifeGroups] = useState(initialLifeGroups.items)
  const [cursor, setCursor] = useState(initialLifeGroups.nextCursor)
  const [hasMore, setHasMore] = useState(initialLifeGroups.hasMore)
  const [isLoading, startTransition] = useTransition()
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<string | null>(null)
  const [manageDrawerOpen, setManageDrawerOpen] = useState<string | null>(null)
  
  const [newLifeGroup, setNewLifeGroup] = useState({
    name: '',
    leaderId: '',
    schedule: '',
    capacity: 10,
    localChurchId: userChurchId || churches[0]?.id || '',
    description: ''
  })
  
  const [selectedChurchFilter, setSelectedChurchFilter] = useState<string>('')

  const handleCreateLifeGroup = () => {
    startTransition(async () => {
      const result = await createLifeGroup({
        name: newLifeGroup.name,
        leaderId: newLifeGroup.leaderId,
        capacity: newLifeGroup.capacity,
        localChurchId: newLifeGroup.localChurchId,
        description: newLifeGroup.description
      })

      if (result.success && result.data) {
        toast.success('Life group created successfully')
        setLifeGroups([result.data, ...lifeGroups])
        setCreateDialogOpen(false)
        setNewLifeGroup({
          name: '',
          leaderId: '',
          schedule: '',
          capacity: 10,
          localChurchId: userChurchId || churches[0]?.id || '',
          description: ''
        })
      } else {
        toast.error(result.error)
      }
    })
  }

  const handleDeleteLifeGroup = (id: string) => {
    startTransition(async () => {
      const result = await deleteLifeGroup({ id })
      if (result.success) {
        toast.success('Life group deleted successfully')
        setLifeGroups(lifeGroups.filter(lg => lg.id !== id))
        setDeleteDialogOpen(null)
      } else {
        toast.error(result.error)
      }
    })
  }

  const handleExportRoster = async (lifeGroupId: string) => {
    const response = await exportRosterCsv({ lifeGroupId })
    if (response.ok) {
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = response.headers.get('content-disposition')?.split('filename=')[1]?.replace(/"/g, '') || 'roster.csv'
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      toast.success('Roster exported successfully')
    } else {
      toast.error('Failed to export roster')
    }
  }

  const loadMore = () => {
    if (!cursor || !hasMore) return
    
    startTransition(async () => {
      const result = await listLifeGroups({ cursor, churchId: selectedChurchFilter || undefined })
      if (result.success && result.data) {
        setLifeGroups([...lifeGroups, ...result.data.items])
        setCursor(result.data.nextCursor)
        setHasMore(result.data.hasMore)
      }
    })
  }

  const handleChurchFilterChange = (churchId: string) => {
    setSelectedChurchFilter(churchId)
    startTransition(async () => {
      const result = await listLifeGroups({ churchId: churchId || undefined })
      if (result.success && result.data) {
        setLifeGroups(result.data.items)
        setCursor(result.data.nextCursor)
        setHasMore(result.data.hasMore)
      }
    })
  }

  if (lifeGroups.length === 0 && !createDialogOpen) {
    return (
      <Card className="p-8 text-center">
        <p className="text-muted-foreground mb-4">No life groups yet</p>
        <Button onClick={() => setCreateDialogOpen(true)}>
          Create LifeGroup
        </Button>
      </Card>
    )
  }

  return (
    <>
      <div className="mb-4 flex justify-between items-center">
        {userRole === UserRole.SUPER_ADMIN && churches.length > 1 && (
          <div className="flex items-center gap-2">
            <Label htmlFor="church-filter">Filter by Church:</Label>
            <Select value={selectedChurchFilter} onValueChange={handleChurchFilterChange}>
              <SelectTrigger id="church-filter" className="w-48">
                <SelectValue placeholder="All Churches" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Churches</SelectItem>
                {churches.map((church) => (
                  <SelectItem key={church.id} value={church.id}>
                    {church.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        <Button onClick={() => setCreateDialogOpen(true)}>
          Create LifeGroup
        </Button>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Leader</TableHead>
              <TableHead>Members</TableHead>
              <TableHead>Capacity</TableHead>
              <TableHead>Schedule</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {lifeGroups.map((lifeGroup) => (
              <TableRow key={lifeGroup.id}>
                <TableCell className="font-medium">{lifeGroup.name}</TableCell>
                <TableCell>{lifeGroup.leader.name || lifeGroup.leader.email}</TableCell>
                <TableCell>{lifeGroup._count.memberships}</TableCell>
                <TableCell>{lifeGroup.capacity}</TableCell>
                <TableCell>{lifeGroup.description || '-'}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setManageDrawerOpen(lifeGroup.id)}
                    >
                      Manage
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleExportRoster(lifeGroup.id)}
                    >
                      Export Roster CSV
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setDeleteDialogOpen(lifeGroup.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {hasMore && (
        <div className="mt-4 text-center">
          <Button 
            onClick={loadMore} 
            disabled={isLoading}
            variant="outline"
          >
            Load More
          </Button>
        </div>
      )}

      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create LifeGroup</DialogTitle>
          </DialogHeader>
          <form 
            id="create-lifegroup-form"
            onSubmit={(e) => {
              e.preventDefault()
              handleCreateLifeGroup()
            }}
          >
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  name="name"
                  value={newLifeGroup.name}
                  onChange={(e) => setNewLifeGroup({ ...newLifeGroup, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="leader">Leader</Label>
                <Select
                  value={newLifeGroup.leaderId}
                  onValueChange={(value) => setNewLifeGroup({ ...newLifeGroup, leaderId: value })}
                >
                  <SelectTrigger id="leader">
                    <SelectValue placeholder="Select a leader" />
                  </SelectTrigger>
                  <SelectContent>
                    {leaders.map((leader) => (
                      <SelectItem key={leader.id} value={leader.id}>
                        {leader.name || leader.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="schedule">Schedule</Label>
                <Input
                  id="schedule"
                  name="schedule"
                  value={newLifeGroup.schedule}
                  onChange={(e) => setNewLifeGroup({ ...newLifeGroup, schedule: e.target.value })}
                  placeholder="e.g., Every Tuesday 7PM"
                />
              </div>
              <div>
                <Label htmlFor="capacity">Capacity</Label>
                <Input
                  id="capacity"
                  name="capacity"
                  type="number"
                  min="1"
                  value={newLifeGroup.capacity}
                  onChange={(e) => setNewLifeGroup({ ...newLifeGroup, capacity: parseInt(e.target.value) || 10 })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={newLifeGroup.description}
                  onChange={(e) => setNewLifeGroup({ ...newLifeGroup, description: e.target.value })}
                  placeholder="Optional description"
                />
              </div>
              {userRole === UserRole.SUPER_ADMIN && churches.length > 1 && (
                <div>
                  <Label htmlFor="church">Local Church</Label>
                  <Select
                    value={newLifeGroup.localChurchId}
                    onValueChange={(value) => setNewLifeGroup({ ...newLifeGroup, localChurchId: value })}
                  >
                    <SelectTrigger id="church">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {churches.map((church) => (
                        <SelectItem key={church.id} value={church.id}>
                          {church.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </form>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              form="create-lifegroup-form"
              disabled={isLoading || !newLifeGroup.name || !newLifeGroup.leaderId}
            >
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteDialogOpen} onOpenChange={(open) => !open && setDeleteDialogOpen(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete LifeGroup</DialogTitle>
          </DialogHeader>
          <p>Are you sure you want to delete this life group? This will also remove all memberships and attendance records.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(null)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => deleteDialogOpen && handleDeleteLifeGroup(deleteDialogOpen)}
              disabled={isLoading}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {manageDrawerOpen && (
        <LifeGroupManageDrawer
          lifeGroupId={manageDrawerOpen}
          open={!!manageDrawerOpen}
          onClose={() => setManageDrawerOpen(null)}
        />
      )}
    </>
  )
}