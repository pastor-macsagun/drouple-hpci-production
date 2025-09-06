'use client'

import { 
  NativeCard, 
  NativeCardContent, 
  NativeCardHeader, 
  NativeCardTitle 
} from '@/components/ui/native'
import { ShieldOff } from 'lucide-react'

export default function ForbiddenPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-destructive/5 via-bg to-destructive/10 flex flex-col">
      {/* Native App Header */}
      <div className="relative flex items-center justify-center p-4 pt-safe-area-top">
        <div className="text-lg font-semibold text-ink">Access Denied</div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col justify-center px-6 py-8">
        {/* Error Icon */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-destructive flex items-center justify-center shadow-lg">
            <ShieldOff className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-ink mb-2">Access Denied</h1>
          <p className="text-ink-muted">
            Permission required to view this resource
          </p>
        </div>

        <NativeCard className="max-w-md mx-auto w-full">
          <NativeCardContent className="text-center space-y-6">
            <div className="space-y-3">
              <p className="text-ink">
                You don't have permission to access this resource.
              </p>
              <p className="text-sm text-ink-muted">
                If you believe this is an error, please contact your administrator.
              </p>
            </div>

            <div className="text-center">
              <button 
                onClick={() => window.history.back()}
                className="text-accent hover:underline font-medium"
              >
                Go Back
              </button>
            </div>
          </NativeCardContent>
        </NativeCard>
      </div>

      {/* Footer */}
      <div className="px-6 pb-safe-area-bottom pb-4 text-center">
        <p className="text-sm text-ink-muted">
          Need help? Contact your church administrator
        </p>
      </div>
    </main>
  )
}