'use client'

import { useState, useTransition } from 'react'
import { format } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { toast } from 'sonner'
import { createService, deleteService, listServices, exportAttendanceCsv } from './actions'
import { ServiceDetailsDrawer } from './service-details-drawer'
import { UserRole } from '@prisma/client'

interface Service {
  id: string
  date: Date
  localChurchId: string
  localChurch: {
    id: string
    name: string
  }
  _count: {
    checkins: number
  }
}

interface ServicesManagerProps {
  initialServices: {
    items: Service[]
    nextCursor: string | null
    hasMore: boolean
  }
  churches: Array<{ id: string; name: string }>
  userRole: UserRole
  userChurchId: string | null
}

export function ServicesManager({ 
  initialServices, 
  churches, 
  userRole, 
  userChurchId 
}: ServicesManagerProps) {
  const [services, setServices] = useState(initialServices.items)
  const [cursor, setCursor] = useState(initialServices.nextCursor)
  const [hasMore, setHasMore] = useState(initialServices.hasMore)
  const [isLoading, startTransition] = useTransition()
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<string | null>(null)
  const [detailsDrawerOpen, setDetailsDrawerOpen] = useState<string | null>(null)
  
  const [newService, setNewService] = useState({
    date: '',
    time: '',
    title: '',
    localChurchId: userChurchId || churches[0]?.id || ''
  })
  
  const [selectedChurchFilter, setSelectedChurchFilter] = useState<string>('all')

  const handleCreateService = () => {
    startTransition(async () => {
      const result = await createService({
        date: new Date(newService.date + 'T' + (newService.time || '00:00')),
        localChurchId: newService.localChurchId
      })

      if (result.success && result.data) {
        toast.success('Service created successfully')
        setServices([result.data, ...services])
        setCreateDialogOpen(false)
        setNewService({
          date: '',
          time: '',
          title: '',
          localChurchId: userChurchId || churches[0]?.id || ''
        })
      } else {
        toast.error(result.error)
      }
    })
  }

  const handleDeleteService = (id: string) => {
    startTransition(async () => {
      const result = await deleteService({ id })
      if (result.success) {
        toast.success('Service deleted successfully')
        setServices(services.filter(s => s.id !== id))
        setDeleteDialogOpen(null)
      } else {
        toast.error(result.error)
      }
    })
  }

  const handleExportCsv = async (serviceId: string) => {
    const response = await exportAttendanceCsv({ serviceId })
    if (response.ok) {
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = response.headers.get('content-disposition')?.split('filename=')[1]?.replace(/"/g, '') || 'attendance.csv'
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      toast.success('Attendance exported successfully')
    } else {
      toast.error('Failed to export attendance')
    }
  }

  const loadMore = () => {
    if (!cursor || !hasMore) return
    
    startTransition(async () => {
      const result = await listServices({ cursor, churchId: selectedChurchFilter || undefined })
      if (result.success && result.data) {
        setServices([...services, ...result.data.items])
        setCursor(result.data.nextCursor)
        setHasMore(result.data.hasMore)
      }
    })
  }

  const handleChurchFilterChange = (churchId: string) => {
    setSelectedChurchFilter(churchId)
    startTransition(async () => {
      const result = await listServices({ churchId: churchId === 'all' ? undefined : churchId || undefined })
      if (result.success && result.data) {
        setServices(result.data.items)
        setCursor(result.data.nextCursor)
        setHasMore(result.data.hasMore)
      }
    })
  }

  if (services.length === 0 && !createDialogOpen) {
    return (
      <Card className="p-8 text-center">
        <p className="text-muted-foreground mb-4">No services yet</p>
        <Button onClick={() => setCreateDialogOpen(true)}>
          Create Service
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
                <SelectItem value="all">All Churches</SelectItem>
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
          Create Service
        </Button>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Time</TableHead>
              <TableHead>Church</TableHead>
              <TableHead>Attendance</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {services.map((service) => (
              <TableRow key={service.id}>
                <TableCell>{format(new Date(service.date), 'PPP')}</TableCell>
                <TableCell>{format(new Date(service.date), 'p')}</TableCell>
                <TableCell>{service.localChurch.name}</TableCell>
                <TableCell>{service._count.checkins}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDetailsDrawerOpen(service.id)}
                    >
                      View
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleExportCsv(service.id)}
                    >
                      Export CSV
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setDeleteDialogOpen(service.id)}
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
            <DialogTitle>Create Service</DialogTitle>
          </DialogHeader>
          <form 
            id="create-service-form"
            onSubmit={(e) => {
              e.preventDefault()
              handleCreateService()
            }}
          >
            <div className="space-y-4">
              <div>
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  name="date"
                  type="date"
                  value={newService.date}
                  onChange={(e) => setNewService({ ...newService, date: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="time">Time</Label>
                <Input
                  id="time"
                  name="time"
                  type="time"
                  value={newService.time}
                  onChange={(e) => setNewService({ ...newService, time: e.target.value })}
                  required
                />
              </div>
              {userRole === UserRole.SUPER_ADMIN && churches.length > 1 && (
                <div>
                  <Label htmlFor="church">Local Church</Label>
                  <Select
                    value={newService.localChurchId}
                    onValueChange={(value) => setNewService({ ...newService, localChurchId: value })}
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
              form="create-service-form"
              disabled={isLoading || !newService.date}
            >
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteDialogOpen} onOpenChange={(open) => !open && setDeleteDialogOpen(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Service</DialogTitle>
          </DialogHeader>
          <p>Are you sure you want to delete this service? This will also delete all check-in records.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(null)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => deleteDialogOpen && handleDeleteService(deleteDialogOpen)}
              disabled={isLoading}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {detailsDrawerOpen && (
        <ServiceDetailsDrawer
          serviceId={detailsDrawerOpen}
          open={!!detailsDrawerOpen}
          onClose={() => setDetailsDrawerOpen(null)}
        />
      )}
    </>
  )
}