'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/patterns/data-table'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Download, Check, X, Users, UserPlus } from 'lucide-react'
import { format } from 'date-fns'
import { 
  getLifeGroupMembers, 
  getLifeGroupRequests, 
  approveRequest, 
  rejectRequest 
} from './actions'
import { toast } from 'sonner'

interface LeaderViewProps {
  lifeGroupId: string
  lifeGroupName: string
}

interface MemberItem {
  id: string
  user: {
    name: string | null
    email: string
    phone: string | null
  }
  joinedAt: Date | string
}

interface RequestItem {
  id: string
  user: {
    name: string | null
    email: string
  }
  message: string | null
  requestedAt: Date | string
}

export function LeaderView({ lifeGroupId, lifeGroupName }: LeaderViewProps) {
  const [members, setMembers] = useState<MemberItem[]>([])
  const [requests, setRequests] = useState<RequestItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchData = useCallback(async () => {
    try {
      const [membersResult, requestsResult] = await Promise.all([
        getLifeGroupMembers(lifeGroupId),
        getLifeGroupRequests(lifeGroupId)
      ])

      if (membersResult.success) {
        setMembers(membersResult.data || [])
      }
      if (requestsResult.success) {
        setRequests(requestsResult.data || [])
      }
    } catch {
      toast.error('Failed to load data')
    } finally {
      setIsLoading(false)
    }
  }, [lifeGroupId])

  useEffect(() => {
    fetchData()
  }, [lifeGroupId, fetchData])

  const handleApprove = async (requestId: string) => {
    const result = await approveRequest(requestId)
    if (result.success) {
      toast.success('Request approved')
      fetchData()
    } else {
      toast.error(result.error || 'Failed to approve request')
    }
  }

  const handleReject = async (requestId: string) => {
    const result = await rejectRequest(requestId)
    if (result.success) {
      toast.success('Request rejected')
      fetchData()
    } else {
      toast.error(result.error || 'Failed to reject request')
    }
  }

  const exportMembers = () => {
    const headers = ['Name', 'Email', 'Phone', 'Joined Date']
    const rows = members.map(item => [
      item.user.name || 'N/A',
      item.user.email,
      item.user.phone || 'N/A',
      format(new Date(item.joinedAt), 'yyyy-MM-dd')
    ])
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${lifeGroupName.replace(/\s+/g, '-')}-members-${format(new Date(), 'yyyy-MM-dd')}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const memberColumns = [
    {
      key: 'name',
      header: 'Name',
      cell: (item: MemberItem) => item.user.name || 'N/A'
    },
    {
      key: 'email',
      header: 'Email',
      cell: (item: MemberItem) => item.user.email
    },
    {
      key: 'phone',
      header: 'Phone',
      cell: (item: MemberItem) => item.user.phone || 'N/A'
    },
    {
      key: 'joinedAt',
      header: 'Joined',
      cell: (item: MemberItem) => format(new Date(item.joinedAt), 'MMM d, yyyy')
    }
  ]

  const requestColumns = [
    {
      key: 'name',
      header: 'Name',
      cell: (item: RequestItem) => item.user.name || 'N/A'
    },
    {
      key: 'email',
      header: 'Email',
      cell: (item: RequestItem) => item.user.email
    },
    {
      key: 'message',
      header: 'Message',
      cell: (item: RequestItem) => item.message || 'No message'
    },
    {
      key: 'requestedAt',
      header: 'Requested',
      cell: (item: RequestItem) => format(new Date(item.requestedAt), 'MMM d, yyyy')
    },
    {
      key: 'actions',
      header: 'Actions',
      cell: (item: RequestItem) => (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleApprove(item.id)}
          >
            <Check className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleReject(item.id)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )
    }
  ]

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-muted-foreground">
            Loading...
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Manage {lifeGroupName}</CardTitle>
            <CardDescription>
              View members and handle join requests
            </CardDescription>
          </div>
          {requests.length > 0 && (
            <Badge variant="secondary">
              {requests.length} pending request{requests.length !== 1 ? 's' : ''}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="members">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="members">
              <Users className="mr-2 h-4 w-4" />
              Members ({members.length})
            </TabsTrigger>
            <TabsTrigger value="requests">
              <UserPlus className="mr-2 h-4 w-4" />
              Requests ({requests.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="members" className="space-y-4">
            <div className="flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={exportMembers}
                disabled={members.length === 0}
              >
                <Download className="mr-2 h-4 w-4" />
                Export CSV
              </Button>
            </div>
            <DataTable
              data={members}
              columns={memberColumns}
              emptyState={
                <div className="text-center py-8 text-muted-foreground">
                  No members yet
                </div>
              }
            />
          </TabsContent>

          <TabsContent value="requests">
            <DataTable
              data={requests}
              columns={requestColumns}
              emptyState={
                <div className="text-center py-8 text-muted-foreground">
                  No pending requests
                </div>
              }
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}