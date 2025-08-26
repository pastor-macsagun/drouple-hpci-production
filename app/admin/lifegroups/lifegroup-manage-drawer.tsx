'use client'

import { useEffect, useState, useTransition } from 'react'
import { format } from 'date-fns'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { 
  listMemberships, 
  listJoinRequests, 
  approveRequest, 
  rejectRequest,
  removeMember,
  startAttendanceSession,
  markAttendance,
  exportAttendanceCsv
} from './actions'

interface LifeGroupManageDrawerProps {
  lifeGroupId: string
  open: boolean
  onClose: () => void
}

interface Member {
  id: string
  userId: string
  user: {
    id: string
    name: string | null
    email: string
    phone: string | null
  }
}

interface JoinRequest {
  id: string
  userId: string
  message: string | null
  requestedAt: Date | string
  user: {
    id: string
    name: string | null
    email: string
  }
}

interface AttendanceSession {
  id: string
  date: Date
  members: Array<{
    userId: string
    present: boolean
  }>
}

export function LifeGroupManageDrawer({ lifeGroupId, open, onClose }: LifeGroupManageDrawerProps) {
  const [loading, setLoading] = useState(true)
  const [isTransitioning, startTransition] = useTransition()
  const [activeTab, setActiveTab] = useState('roster')
  const [members, setMembers] = useState<Member[]>([])
  const [requests, setRequests] = useState<JoinRequest[]>([])
  const [currentSession, setCurrentSession] = useState<AttendanceSession | null>(null)
  const [sessionDate, setSessionDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [attendance, setAttendance] = useState<Record<string, boolean>>({})

  useEffect(() => {
    if (open && lifeGroupId) {
      loadData()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lifeGroupId, open, activeTab])

  const loadData = async () => {
    setLoading(true)
    try {
      if (activeTab === 'roster') {
        const result = await listMemberships({ lifeGroupId })
        if (result.success && result.data) {
          setMembers(result.data)
        }
      } else if (activeTab === 'requests') {
        const result = await listJoinRequests({ lifeGroupId })
        if (result.success && result.data) {
          setRequests(result.data)
        }
      } else if (activeTab === 'attendance') {
        const result = await listMemberships({ lifeGroupId })
        if (result.success && result.data) {
          setMembers(result.data)
          const initialAttendance: Record<string, boolean> = {}
          result.data.forEach(m => {
            initialAttendance[m.userId] = false
          })
          setAttendance(initialAttendance)
        }
      }
    } finally {
      setLoading(false)
    }
  }

  const handleApproveRequest = (requestId: string) => {
    startTransition(async () => {
      const result = await approveRequest({ requestId })
      if (result.success) {
        toast.success('Request approved')
        setRequests(requests.filter(r => r.id !== requestId))
      } else {
        toast.error(result.error)
      }
    })
  }

  const handleRejectRequest = (requestId: string) => {
    startTransition(async () => {
      const result = await rejectRequest({ requestId })
      if (result.success) {
        toast.success('Request rejected')
        setRequests(requests.filter(r => r.id !== requestId))
      } else {
        toast.error(result.error)
      }
    })
  }

  const handleRemoveMember = (userId: string) => {
    startTransition(async () => {
      const result = await removeMember({ lifeGroupId, userId })
      if (result.success) {
        toast.success('Member removed')
        setMembers(members.filter(m => m.userId !== userId))
      } else {
        toast.error(result.error)
      }
    })
  }

  const handleStartSession = () => {
    startTransition(async () => {
      const result = await startAttendanceSession({ 
        lifeGroupId, 
        date: new Date(sessionDate) 
      })
      if (result.success && result.data) {
        setCurrentSession({
          id: result.data.id,
          date: result.data.date,
          members: []
        })
        toast.success('Attendance session started')
      } else {
        toast.error(result.error)
      }
    })
  }

  const handleMarkAttendance = (memberId: string, present: boolean) => {
    if (!currentSession) return
    
    setAttendance({ ...attendance, [memberId]: present })
    
    startTransition(async () => {
      const result = await markAttendance({ 
        sessionId: currentSession.id, 
        memberId, 
        present 
      })
      if (!result.success) {
        toast.error(result.error)
        setAttendance({ ...attendance, [memberId]: !present })
      }
    })
  }

  const handleExportAttendance = async () => {
    const response = await exportAttendanceCsv({ lifeGroupId })
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

  if (!open) return null

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/50 z-50" 
        onClick={onClose}
        aria-label="Close drawer"
      />
      <div className="fixed right-0 top-0 h-full w-[500px] bg-background shadow-lg z-50 flex flex-col">
        <div className="p-6 border-b flex items-center justify-between">
          <h2 className="text-xl font-semibold">Manage LifeGroup</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <TabsList className="mx-6 mt-4">
            <TabsTrigger value="roster">Roster</TabsTrigger>
            <TabsTrigger value="requests">Join Requests</TabsTrigger>
            <TabsTrigger value="attendance">Attendance</TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-auto">
            <TabsContent value="roster" className="p-6">
              {loading ? (
                <p className="text-muted-foreground">Loading...</p>
              ) : members.length === 0 ? (
                <p className="text-muted-foreground">No members yet</p>
              ) : (
                <div className="space-y-3">
                  {members.map((member) => (
                    <div key={member.id} className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <p className="font-medium">{member.user.name || member.user.email}</p>
                        {member.user.phone && (
                          <p className="text-sm text-muted-foreground">{member.user.phone}</p>
                        )}
                      </div>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleRemoveMember(member.userId)}
                        disabled={isTransitioning}
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="requests" className="p-6">
              {loading ? (
                <p className="text-muted-foreground">Loading...</p>
              ) : requests.length === 0 ? (
                <p className="text-muted-foreground">No pending requests</p>
              ) : (
                <div className="space-y-3">
                  {requests.map((request) => (
                    <div key={request.id} className="p-3 border rounded">
                      <div className="mb-3">
                        <p className="font-medium">{request.user.name || request.user.email}</p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(request.requestedAt), 'PPp')}
                        </p>
                        {request.message && (
                          <p className="text-sm mt-2">{request.message}</p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleApproveRequest(request.id)}
                          disabled={isTransitioning}
                        >
                          Approve
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRejectRequest(request.id)}
                          disabled={isTransitioning}
                        >
                          Reject
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="attendance" className="p-6">
              {!currentSession ? (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="session-date">Session Date</Label>
                    <Input
                      id="session-date"
                      type="date"
                      value={sessionDate}
                      onChange={(e) => setSessionDate(e.target.value)}
                    />
                  </div>
                  <Button 
                    onClick={handleStartSession}
                    disabled={isTransitioning}
                  >
                    Start Session
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={handleExportAttendance}
                    className="ml-2"
                  >
                    Export Attendance CSV
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="mb-4">
                    <p className="font-medium">Session: {format(new Date(currentSession.date), 'PPP')}</p>
                    <p className="text-sm text-muted-foreground">Mark members present</p>
                  </div>
                  {loading ? (
                    <p className="text-muted-foreground">Loading...</p>
                  ) : members.length === 0 ? (
                    <p className="text-muted-foreground">No members to track attendance</p>
                  ) : (
                    <div className="space-y-2">
                      {members.map((member) => (
                        <div key={member.userId} className="flex items-center space-x-3 p-2 border rounded">
                          <Checkbox
                            id={`attendance-${member.userId}`}
                            checked={attendance[member.userId] || false}
                            onCheckedChange={(checked) => 
                              handleMarkAttendance(member.userId, checked as boolean)
                            }
                            disabled={isTransitioning}
                          />
                          <Label 
                            htmlFor={`attendance-${member.userId}`}
                            className="flex-1 cursor-pointer"
                          >
                            {member.user.name || member.user.email}
                          </Label>
                        </div>
                      ))}
                    </div>
                  )}
                  <Button 
                    variant="outline"
                    onClick={() => setCurrentSession(null)}
                    className="w-full"
                  >
                    End Session
                  </Button>
                </div>
              )}
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </>
  )
}