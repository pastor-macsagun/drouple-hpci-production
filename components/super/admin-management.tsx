'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'
import { UserPlus, Trash2, Shield, AlertCircle } from 'lucide-react'
import { CredentialsDisplay } from './credentials-display'
import { inviteAdmin, removeAdmin } from '../../app/(super)/super/local-churches/[id]/admins/actions'
import { UserRole } from '@prisma/client'

interface AdminManagementProps {
  localChurch: {
    id: string
    name: string
    memberships: Array<{
      id: string
      role: UserRole
      user: {
        id: string
        name: string | null
        email: string
      }
    }>
  }
}

export function AdminManagement({ localChurch }: AdminManagementProps) {
  const [credentials, setCredentials] = useState<{ email: string; password: string } | null>(null)
  const [showCredentials, setShowCredentials] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState<{
    name: string
    email: string
    role: UserRole
  }>({
    name: '',
    email: '',
    role: UserRole.ADMIN
  })
  const { toast } = useToast()

  const handleInviteAdmin = async (formData: FormData) => {
    setIsSubmitting(true)
    setError(null)
    
    try {
      const result = await inviteAdmin(localChurch.id, formData)
      
      if (result.success && result.credentials) {
        setCredentials(result.credentials)
        setShowCredentials(true)
        
        // Reset form
        setFormData({
          name: '',
          email: '',
          role: UserRole.ADMIN
        })
        
        toast({
          title: 'Admin account created',
          description: `Successfully created admin account for ${result.credentials.email}`,
        })
      } else if (result.error) {
        setError(result.error)
        toast({
          title: 'Failed to create admin account',
          description: result.error,
          variant: 'destructive',
        })
      }
    } catch {
      const errorMessage = 'Failed to create admin account. Please try again.'
      setError(errorMessage)
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRemoveAdmin = async (formData: FormData) => {
    if (!confirm('Are you sure you want to remove this administrator?')) {
      return
    }

    try {
      await removeAdmin(formData)
      toast({
        title: 'Administrator removed',
        description: 'Successfully removed administrator access',
      })
    } catch {
      toast({
        title: 'Failed to remove administrator',
        description: 'Please try again',
        variant: 'destructive',
      })
    }
  }

  return (
    <>
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Current Administrators</CardTitle>
          </CardHeader>
          <CardContent>
            {localChurch.memberships.length === 0 ? (
              <div className="text-center py-8">
                <Shield className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-600">No administrators assigned yet</p>
              </div>
            ) : (
              <div className="space-y-3" data-testid="local-church-admins">
                {localChurch.memberships.map((membership) => (
                  <div
                    key={membership.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{membership.user.name || membership.user.email}</p>
                      <p className="text-sm text-gray-600">{membership.user.email}</p>
                      <p className="text-xs text-gray-500">Role: {membership.role}</p>
                    </div>
                    <form action={handleRemoveAdmin}>
                      <input type="hidden" name="membershipId" value={membership.id} />
                      <Button
                        type="submit"
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:text-red-700 focus-ring"
                        aria-label={`Remove ${membership.user.name || membership.user.email}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </form>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Add New Administrator</CardTitle>
            <p className="text-sm text-gray-600">
              A temporary password will be generated for the new administrator. They must change it on first login.
            </p>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="mb-4 p-4 bg-destructive/10 border border-destructive/30 rounded-lg">
                <div className="flex items-center gap-2 text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  <p className="text-sm font-medium">Error</p>
                </div>
                <p className="text-sm text-destructive/80 mt-1">{error}</p>
              </div>
            )}
            
            <form id="invite-form" action={handleInviteAdmin} className="space-y-4" data-testid="invite-admin-form">
              <div>
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  placeholder="admin@example.com"
                  disabled={isSubmitting}
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="role">Role *</Label>
                <select
                  id="role"
                  name="role"
                  required
                  disabled={isSubmitting}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background disabled:opacity-50"
                  value={formData.role}
                  onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value as UserRole }))}
                >
                  <option value={UserRole.ADMIN}>Admin</option>
                  <option value={UserRole.PASTOR}>Pastor</option>
                </select>
              </div>

              <div>
                <Label htmlFor="name">Name (optional)</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="John Doe"
                  disabled={isSubmitting}
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>

              <div className="flex gap-4">
                <Button type="submit" disabled={isSubmitting}>
                  <UserPlus className="mr-2 h-4 w-4" />
                  {isSubmitting ? 'Creating Account...' : 'Create Admin Account'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      {credentials && (
        <CredentialsDisplay
          credentials={credentials}
          open={showCredentials}
          onOpenChange={(open) => {
            setShowCredentials(open)
            if (!open) {
              setCredentials(null)
            }
          }}
        />
      )}
    </>
  )
}