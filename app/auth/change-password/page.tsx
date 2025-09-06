'use client'

import { useState } from 'react'
import { signOut } from 'next-auth/react'
import { 
  NativeButton,
  NativeInput,
  NativeCard,
  NativeCardContent,
  NativeCardDescription,
  NativeCardHeader,
  NativeCardTitle
} from '@/components/ui/native'
import { useToast } from '@/components/ui/use-toast'
import { Lock } from 'lucide-react'
import { changePassword } from './actions'

export default function ChangePasswordPage() {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    const result = await changePassword(formData)

    if (result.success) {
      toast({
        title: 'Success',
        description: 'Your password has been changed successfully. Please sign in again.'
      })
      // Sign out and redirect to login to refresh session
      await signOut({ 
        callbackUrl: '/auth/signin?message=password-changed',
        redirect: true 
      })
    } else {
      toast({
        title: 'Error',
        description: result.error,
        variant: 'destructive'
      })
    }

    setIsLoading(false)
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-warning/5 via-bg to-warning/10 flex flex-col">
      {/* Native App Header */}
      <div className="relative flex items-center justify-center p-4 pt-safe-area-top">
        <div className="text-lg font-semibold text-ink">Change Password</div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col justify-center px-6 py-8">
        {/* Warning Icon */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-warning flex items-center justify-center shadow-lg">
            <Lock className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-ink mb-2">Change Password Required</h1>
          <p className="text-ink-muted">
            You must change your password before continuing
          </p>
        </div>

        <NativeCard className="max-w-md mx-auto w-full">
          <NativeCardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <NativeInput
                  label="Current Password"
                  id="currentPassword"
                  type="password"
                  value={formData.currentPassword}
                  onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                  required
                  disabled={isLoading}
                />

                <div>
                  <NativeInput
                    label="New Password"
                    id="newPassword"
                    type="password"
                    value={formData.newPassword}
                    onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                    required
                    minLength={8}
                    disabled={isLoading}
                  />
                  <p className="text-sm text-ink-muted mt-1">
                    Must be at least 8 characters
                  </p>
                </div>

                <NativeInput
                  label="Confirm New Password"
                  id="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  required
                  disabled={isLoading}
                />
              </div>

              <NativeButton 
                type="submit" 
                className="w-full h-14 text-lg font-semibold" 
                disabled={isLoading}
                loading={isLoading}
                hapticFeedback
              >
                {isLoading ? 'Changing...' : 'Change Password'}
              </NativeButton>
            </form>
          </NativeCardContent>
        </NativeCard>
      </div>

      {/* Footer */}
      <div className="px-6 pb-safe-area-bottom pb-4 text-center">
        <p className="text-sm text-ink-muted">
          For security reasons, you must create a new password
        </p>
      </div>
    </main>
  )
}