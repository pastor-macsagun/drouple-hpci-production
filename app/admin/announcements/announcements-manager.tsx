'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Bell,
  AlertCircle,
  Info,
  AlertTriangle,
  Calendar,
  Clock
} from 'lucide-react'
import { createAnnouncement, updateAnnouncement, deleteAnnouncement } from './actions'
import type { Announcement, User, LocalChurch, UserRole } from '@prisma/client'

type AnnouncementWithRelations = Announcement & {
  author: Pick<User, 'name' | 'role'>
  localChurch: Pick<LocalChurch, 'name'>
}

interface AnnouncementsManagerProps {
  initialAnnouncements: {
    items: AnnouncementWithRelations[]
    nextCursor: string | null
    hasMore: boolean
  }
  churches: { id: string; name: string }[]
  userRole: UserRole
  userChurchId: string | null
}

const priorityIcons = {
  LOW: Info,
  NORMAL: Bell,
  HIGH: AlertTriangle,
  URGENT: AlertCircle,
}

const priorityColors = {
  LOW: 'text-blue-600 bg-blue-50 border-blue-200',
  NORMAL: 'text-gray-600 bg-gray-50 border-gray-200',
  HIGH: 'text-orange-600 bg-orange-50 border-orange-200',
  URGENT: 'text-red-600 bg-red-50 border-red-200',
}

export function AnnouncementsManager({ 
  initialAnnouncements, 
  churches, 
  userRole: _userRole, 
  userChurchId 
}: AnnouncementsManagerProps) {
  const [announcements] = useState(initialAnnouncements.items)
  const [searchTerm, setSearchTerm] = useState('')
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const filteredAnnouncements = announcements.filter(announcement =>
    announcement.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    announcement.content.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const formatDateTime = (date: Date | null) => {
    if (!date) return ''
    return new Date(date).toISOString().slice(0, 16)
  }

  const AnnouncementForm = ({ 
    announcement, 
    onClose 
  }: { 
    announcement?: AnnouncementWithRelations | null
    onClose: () => void 
  }) => {
    const isEditing = !!announcement
    const action = isEditing ? updateAnnouncement.bind(null, announcement.id) : createAnnouncement

    return (
      <form action={action} className="space-y-4">
        <div>
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            name="title"
            defaultValue={announcement?.title || ''}
            required
            placeholder="Enter announcement title"
          />
        </div>

        <div>
          <Label htmlFor="content">Content</Label>
          <Textarea
            id="content"
            name="content"
            defaultValue={announcement?.content || ''}
            required
            rows={4}
            placeholder="Enter announcement content"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="localChurchId">Church</Label>
            <Select name="localChurchId" defaultValue={announcement?.localChurchId || userChurchId || ''} required>
              <SelectTrigger>
                <SelectValue placeholder="Select church" />
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

          <div>
            <Label htmlFor="scope">Scope</Label>
            <Select name="scope" defaultValue={announcement?.scope || 'MEMBERS'} required>
              <SelectTrigger>
                <SelectValue placeholder="Select scope" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PUBLIC">Public</SelectItem>
                <SelectItem value="MEMBERS">Members</SelectItem>
                <SelectItem value="LEADERS">Leaders</SelectItem>
                <SelectItem value="ADMINS">Admins</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="priority">Priority</Label>
            <Select name="priority" defaultValue={announcement?.priority || 'NORMAL'} required>
              <SelectTrigger>
                <SelectValue placeholder="Select priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="LOW">Low</SelectItem>
                <SelectItem value="NORMAL">Normal</SelectItem>
                <SelectItem value="HIGH">High</SelectItem>
                <SelectItem value="URGENT">Urgent</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2 pt-6">
            <Switch 
              id="isActive" 
              name="isActive" 
              defaultChecked={announcement?.isActive ?? true}
            />
            <Label htmlFor="isActive">Active</Label>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="publishedAt">Publish Date (Optional)</Label>
            <Input
              id="publishedAt"
              name="publishedAt"
              type="datetime-local"
              defaultValue={formatDateTime(announcement?.publishedAt || null)}
            />
          </div>

          <div>
            <Label htmlFor="expiresAt">Expiry Date (Optional)</Label>
            <Input
              id="expiresAt"
              name="expiresAt"
              type="datetime-local"
              defaultValue={formatDateTime(announcement?.expiresAt || null)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">
            {isEditing ? 'Update' : 'Create'} Announcement
          </Button>
        </DialogFooter>
      </form>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="relative w-80">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-ink-muted h-4 w-4" />
          <Input
            placeholder="Search announcements..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Announcement
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Announcement</DialogTitle>
            </DialogHeader>
            <AnnouncementForm onClose={() => setIsCreateOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Announcements List */}
      {filteredAnnouncements.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Bell className="mx-auto h-12 w-12 text-ink-muted" />
            <h3 className="mt-2 text-sm font-medium text-ink">No announcements</h3>
            <p className="mt-1 text-sm text-ink-muted">
              {searchTerm ? 'No announcements match your search' : 'Get started by creating your first announcement'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredAnnouncements.map((announcement) => {
            const Icon = priorityIcons[announcement.priority as keyof typeof priorityIcons]
            const colorClass = priorityColors[announcement.priority as keyof typeof priorityColors]
            
            return (
              <Card key={announcement.id} className="overflow-hidden">
                <div className={`h-1 ${announcement.priority === 'URGENT' ? 'bg-red-500' : announcement.priority === 'HIGH' ? 'bg-orange-500' : ''}`} />
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      <div className={`p-2 rounded-lg border ${colorClass}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-xl">{announcement.title}</CardTitle>
                        <div className="flex items-center gap-4 mt-1 text-sm text-ink-muted">
                          <span>By {announcement.author.name}</span>
                          <span>•</span>
                          <span>{announcement.localChurch.name}</span>
                          <span>•</span>
                          <span>{new Date(announcement.publishedAt || announcement.createdAt).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline" className={colorClass}>
                            {announcement.priority}
                          </Badge>
                          <Badge variant="outline">
                            {announcement.scope}
                          </Badge>
                          <Badge variant={announcement.isActive ? "default" : "secondary"}>
                            {announcement.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Edit Announcement</DialogTitle>
                          </DialogHeader>
                          <AnnouncementForm 
                            announcement={announcement} 
                            onClose={() => {}} 
                          />
                        </DialogContent>
                      </Dialog>
                      
                      <Dialog open={deletingId === announcement.id} onOpenChange={(open) => setDeletingId(open ? announcement.id : null)}>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Delete Announcement</DialogTitle>
                          </DialogHeader>
                          <p>Are you sure you want to delete &quot;{announcement.title}&quot;? This action cannot be undone.</p>
                          <DialogFooter>
                            <Button 
                              variant="outline" 
                              onClick={() => setDeletingId(null)}
                            >
                              Cancel
                            </Button>
                            <form action={deleteAnnouncement.bind(null, announcement.id)}>
                              <Button variant="destructive" type="submit">
                                Delete
                              </Button>
                            </form>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm max-w-none">
                    <p className="whitespace-pre-wrap">{announcement.content}</p>
                  </div>
                  
                  {(announcement.publishedAt || announcement.expiresAt) && (
                    <div className="mt-4 flex items-center gap-4 text-sm text-ink-muted">
                      {announcement.publishedAt && (
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          Published {new Date(announcement.publishedAt).toLocaleString()}
                        </div>
                      )}
                      {announcement.expiresAt && (
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-1" />
                          Expires {new Date(announcement.expiresAt).toLocaleString()}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}