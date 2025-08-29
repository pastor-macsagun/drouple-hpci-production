'use client'

import { useState, useTransition, useCallback } from 'react'
import { UserRole, MemberStatus } from '@prisma/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { DataTable } from '@/components/patterns/data-table'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/use-toast'
import { Edit, Plus, Search, RefreshCw, UserX, Copy, Download } from 'lucide-react'
import { 
  listMembers, 
  createMember, 
  updateMember, 
  deactivateMember,
  resetPassword,
  exportMembersCsv 
} from './actions'

interface Member {
  id: string
  name: string | null
  email: string
  role: UserRole
  tenantId: string | null
  memberStatus: MemberStatus
  mustChangePassword: boolean
  joinedAt: Date
  memberships: {
    localChurch: {
      id: string
      name: string
    } | null
  }[]
}

interface Church {
  id: string
  name: string
}

interface MembersManagerProps {
  initialMembers: {
    items: Member[]
    nextCursor: string | null
    hasMore: boolean
  }
  churches: Church[]
  userRole: UserRole
  userChurchId: string | null
}

export function MembersManager({ 
  initialMembers, 
  churches, 
  userRole, 
  userChurchId 
}: MembersManagerProps) {
  const [members, setMembers] = useState(initialMembers.items)
  const [cursor, setCursor] = useState(initialMembers.nextCursor)
  const [hasMore, setHasMore] = useState(initialMembers.hasMore)
  const [search, setSearch] = useState('')
  const [selectedChurch, setSelectedChurch] = useState(userRole === 'SUPER_ADMIN' ? 'all' : userChurchId || '')
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editingMember, setEditingMember] = useState<Member | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [generatedPassword, setGeneratedPassword] = useState('')
  const [isPending, startTransition] = useTransition()
  const { toast } = useToast()

  const [formData, setFormData] = useState<{
    name: string
    email: string
    systemRoles: UserRole[]
    selectedChurchId: string
    memberStatus: MemberStatus
  }>({
    name: '',
    email: '',
    systemRoles: [UserRole.MEMBER], // Default to MEMBER
    selectedChurchId: userChurchId || '',
    memberStatus: MemberStatus.PENDING
  })

  const handleSearch = useCallback(() => {
    startTransition(async () => {
      const result = await listMembers({ 
        search, 
        churchId: selectedChurch === 'all' ? undefined : selectedChurch || undefined 
      })
      if (result.success && result.data) {
        setMembers(result.data.items)
        setCursor(result.data.nextCursor)
        setHasMore(result.data.hasMore)
      }
    })
  }, [search, selectedChurch])

  const handleLoadMore = useCallback(() => {
    if (!cursor || isPending) return
    
    startTransition(async () => {
      const result = await listMembers({ 
        search, 
        cursor,
        churchId: selectedChurch === 'all' ? undefined : selectedChurch || undefined 
      })
      if (result.success && result.data) {
        setMembers(prev => [...prev, ...result.data.items])
        setCursor(result.data.nextCursor)
        setHasMore(result.data.hasMore)
      }
    })
  }, [cursor, search, selectedChurch, isPending])

  const handleCreate = useCallback(() => {
    // Validate form
    if (formData.systemRoles.length === 0) {
      toast({
        title: 'Validation Error',
        description: 'Please select at least one system role',
        variant: 'destructive'
      })
      return
    }
    
    // For Super Admin: validate church selection, for others: validate userChurchId
    if (userRole === 'SUPER_ADMIN') {
      if (!formData.selectedChurchId) {
        toast({
          title: 'Validation Error',
          description: 'Please select a church',
          variant: 'destructive'
        })
        return
      }
    } else {
      if (!userChurchId) {
        toast({
          title: 'Error',
          description: 'Admin church not found',
          variant: 'destructive'
        })
        return
      }
    }

    startTransition(async () => {
      const result = await createMember({
        name: formData.name,
        email: formData.email,
        systemRoles: formData.systemRoles,
        churchMemberships: [{ 
          churchId: userRole === 'SUPER_ADMIN' ? formData.selectedChurchId : userChurchId!, 
          role: UserRole.MEMBER 
        }]
      })
      
      if (result.success && result.password) {
        setGeneratedPassword(result.password)
        setShowPassword(true)
        setIsCreateOpen(false)
        handleSearch()
        setFormData({
          name: '',
          email: '',
          systemRoles: [UserRole.MEMBER],
          selectedChurchId: userChurchId || '',
          memberStatus: MemberStatus.PENDING
        })
      } else {
        toast({
          title: 'Error',
          description: result.error,
          variant: 'destructive'
        })
      }
    })
  }, [formData, toast, handleSearch, userChurchId, userRole, startTransition])

  const handleUpdate = useCallback(() => {
    if (!editingMember) return
    
    startTransition(async () => {
      const result = await updateMember({
        id: editingMember.id,
        name: formData.name,
        email: formData.email,
        role: formData.systemRoles[0] || UserRole.MEMBER, // Use first system role for now, we'll need to update this later
        memberStatus: formData.memberStatus
      })
      
      if (result.success) {
        toast({
          title: 'Success',
          description: 'Member updated successfully'
        })
        setIsEditOpen(false)
        setEditingMember(null)
        handleSearch()
      } else {
        toast({
          title: 'Error',
          description: result.error,
          variant: 'destructive'
        })
      }
    })
  }, [editingMember, formData, toast, handleSearch, startTransition])

  const handleDeactivate = useCallback((memberId: string) => {
    startTransition(async () => {
      const result = await deactivateMember(memberId)
      if (result.success) {
        toast({
          title: 'Success',
          description: 'Member deactivated successfully'
        })
        handleSearch()
      } else {
        toast({
          title: 'Error',
          description: result.error,
          variant: 'destructive'
        })
      }
    })
  }, [toast, handleSearch, startTransition])

  const handleResetPassword = useCallback((memberId: string) => {
    startTransition(async () => {
      const result = await resetPassword(memberId)
      if (result.success && result.password) {
        setGeneratedPassword(result.password)
        setShowPassword(true)
        handleSearch()
      } else {
        toast({
          title: 'Error',
          description: result.error,
          variant: 'destructive'
        })
      }
    })
  }, [toast, handleSearch, startTransition])

  const openEditDialog = useCallback((member: Member) => {
    setEditingMember(member)
    setFormData({
      name: member.name || '',
      email: member.email,
      systemRoles: [member.role], // Convert single role to array
      selectedChurchId: member.memberships[0]?.localChurch?.id || '',
      memberStatus: member.memberStatus
    })
    setIsEditOpen(true)
  }, [])

  const copyToClipboard = useCallback(() => {
    navigator.clipboard.writeText(generatedPassword)
    toast({
      title: 'Copied',
      description: 'Password copied to clipboard'
    })
  }, [generatedPassword, toast])

  const handleExportCsv = useCallback(async () => {
    try {
      const response = await exportMembersCsv({ churchId: selectedChurch === 'all' ? undefined : selectedChurch || undefined })
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = response.headers.get('content-disposition')?.split('filename=')[1]?.replace(/"/g, '') || 'members.csv'
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        toast({
          title: 'Success',
          description: 'Members exported successfully'
        })
      } else {
        toast({
          title: 'Error',
          description: 'Failed to export members',
          variant: 'destructive'
        })
      }
    } catch {
      toast({
        title: 'Error',
        description: 'An error occurred while exporting',
        variant: 'destructive'
      })
    }
  }, [selectedChurch, toast])

  const getStatusBadgeColor = (status: MemberStatus) => {
    switch (status) {
      case 'ACTIVE': return 'bg-success/10 text-success'
      case 'PENDING': return 'bg-amber-100 text-amber-800'
      case 'INACTIVE': return 'bg-elevated text-ink'
      default: return 'bg-elevated text-ink'
    }
  }

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case 'SUPER_ADMIN': return 'bg-accent-secondary/10 text-accent-secondary'
      case 'PASTOR': return 'bg-accent/10 text-accent'
      case 'ADMIN': return 'bg-accent/10 text-accent'
      case 'VIP': return 'bg-amber-100 text-amber-800'
      case 'LEADER': return 'bg-success/10 text-success'
      default: return 'bg-elevated text-ink'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-ink-muted h-4 w-4" />
            <Input
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="pl-10"
            />
          </div>
          <Button onClick={handleSearch} disabled={isPending}>
            Search
          </Button>
        </div>
        
        {userRole === 'SUPER_ADMIN' && churches.length > 0 && (
          <Select value={selectedChurch} onValueChange={setSelectedChurch}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="All Churches" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Churches</SelectItem>
              {churches.map(church => (
                <SelectItem key={church.id} value={church.id}>
                  {church.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <Button onClick={handleExportCsv} variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
        
        <Button onClick={() => setIsCreateOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Member
        </Button>
      </div>

      <DataTable
        data={members}
        columns={[
          {
            key: 'name',
            header: 'Name',
            mobileLabel: 'Name',
            cell: (member) => (
              <div>
                {member.name || 'Unnamed'}
                {member.mustChangePassword && (
                  <Badge className="ml-2" variant="secondary">Reset Required</Badge>
                )}
              </div>
            )
          },
          {
            key: 'email',
            header: 'Email',
            mobileLabel: 'Email',
            cell: (member) => member.email
          },
          {
            key: 'role',
            header: 'Role',
            mobileLabel: 'Role',
            cell: (member) => (
              <Badge className={getRoleBadgeColor(member.role)}>
                {member.role}
              </Badge>
            )
          },
          {
            key: 'church',
            header: 'Church',
            mobileLabel: 'Church',
            cell: (member) => member.memberships[0]?.localChurch?.name || '-'
          },
          {
            key: 'status',
            header: 'Status',
            mobileLabel: 'Status',
            cell: (member) => (
              <Badge className={getStatusBadgeColor(member.memberStatus)}>
                {member.memberStatus}
              </Badge>
            )
          },
          {
            key: 'actions',
            header: 'Actions',
            mobileLabel: 'Actions',
            className: 'text-right',
            cell: (member) => (
              <div className="space-x-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => openEditDialog(member)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleResetPassword(member.id)}
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
                {member.memberStatus !== 'INACTIVE' && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDeactivate(member.id)}
                  >
                    <UserX className="h-4 w-4" />
                  </Button>
                )}
              </div>
            )
          }
        ]}
        emptyState={<div className="text-center py-8 text-muted-foreground">No members found</div>}
        ariaLabel="Members table"
      />

      {hasMore && (
        <div className="flex justify-center">
          <Button onClick={handleLoadMore} disabled={isPending} variant="outline">
            Load More
          </Button>
        </div>
      )}

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Member</DialogTitle>
            <DialogDescription>
              Create a new member account. A secure password will be generated.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter member name"
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="Enter email address"
              />
            </div>
            <div>
              <Label>System Roles</Label>
              <div className="grid grid-cols-2 gap-3 mt-2">
                {Object.values(UserRole)
                  .filter(role => role !== 'SUPER_ADMIN') // Exclude SUPER_ADMIN
                  .map(role => {
                    const isChecked = formData.systemRoles.includes(role)
                    return (
                      <div key={role} className="flex items-center space-x-2">
                        <Checkbox
                          id={`system-role-${role}`}
                          checked={isChecked}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setFormData({
                                ...formData,
                                systemRoles: [...formData.systemRoles, role]
                              })
                            } else {
                              setFormData({
                                ...formData,
                                systemRoles: formData.systemRoles.filter(r => r !== role)
                              })
                            }
                          }}
                        />
                        <Label htmlFor={`system-role-${role}`} className="text-sm cursor-pointer">
                          {role}
                        </Label>
                      </div>
                    )
                  })}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Select all applicable system-wide roles. At least one role is required.
              </p>
            </div>
            {userRole === 'SUPER_ADMIN' ? (
              churches.length > 0 && (
                <div>
                  <Label htmlFor="church-select">Church</Label>
                  <Select 
                    value={formData.selectedChurchId} 
                    onValueChange={(value) => setFormData({ ...formData, selectedChurchId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a church" />
                    </SelectTrigger>
                    <SelectContent>
                      {churches.map(church => (
                        <SelectItem key={church.id} value={church.id}>
                          {church.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    Select the church for this member
                  </p>
                </div>
              )
            ) : (
              <div className="p-3 bg-muted/50 rounded-lg">
                <div className="text-sm text-muted-foreground">
                  <span className="font-medium">Church Assignment:</span> Member will be automatically assigned to your church
                  {userChurchId && churches.find(c => c.id === userChurchId) && (
                    <span className="ml-1">({churches.find(c => c.id === userChurchId)?.name})</span>
                  )}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreate} 
              disabled={isPending || formData.systemRoles.length === 0 || (userRole === 'SUPER_ADMIN' ? !formData.selectedChurchId : !userChurchId)}
            >
              Create Member
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Member</DialogTitle>
            <DialogDescription>
              Update member information
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter member name"
              />
            </div>
            <div>
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="Enter email address"
              />
            </div>
            <div>
              <Label>System Roles</Label>
              <div className="grid grid-cols-2 gap-3 mt-2">
                {Object.values(UserRole)
                  .filter(role => role !== 'SUPER_ADMIN') // Exclude SUPER_ADMIN
                  .map(role => {
                    const isChecked = formData.systemRoles.includes(role)
                    return (
                      <div key={role} className="flex items-center space-x-2">
                        <Checkbox
                          id={`edit-system-role-${role}`}
                          checked={isChecked}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setFormData({
                                ...formData,
                                systemRoles: [...formData.systemRoles, role]
                              })
                            } else {
                              setFormData({
                                ...formData,
                                systemRoles: formData.systemRoles.filter(r => r !== role)
                              })
                            }
                          }}
                        />
                        <Label htmlFor={`edit-system-role-${role}`} className="text-sm cursor-pointer">
                          {role}
                        </Label>
                      </div>
                    )
                  })}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Select all applicable system-wide roles
              </p>
            </div>
            <div>
              <Label htmlFor="edit-status">Status</Label>
              <Select 
                value={formData.memberStatus} 
                onValueChange={(value) => setFormData({ ...formData, memberStatus: value as MemberStatus })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(MemberStatus).map(status => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={isPending}>
              Update Member
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showPassword} onOpenChange={setShowPassword}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generated Password</DialogTitle>
            <DialogDescription>
              Please copy this password and share it with the member securely. They will be required to change it on first login.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-surface rounded-lg font-mono text-sm break-all">
              {generatedPassword}
            </div>
            <Button onClick={copyToClipboard} className="w-full gap-2">
              <Copy className="h-4 w-4" />
              Copy to Clipboard
            </Button>
          </div>
          <DialogFooter>
            <Button onClick={() => setShowPassword(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}