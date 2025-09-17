import {
  NativeCard,
  NativeCardContent,
  NativeButton
} from '@/components/ui/native'
import Link from 'next/link'
import { CheckCircle, Mail } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default function RegistrationSuccessPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-success/5 via-bg to-success/10 flex flex-col">
      {/* Native App Header */}
      <div className="relative flex items-center justify-center p-4 pt-safe-area-top">
        <div className="text-lg font-semibold text-ink">Registration Complete</div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col justify-center px-6 py-8">
        {/* Success Icon */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-success flex items-center justify-center shadow-lg">
            <CheckCircle className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-ink mb-2">Registration Successful!</h1>
          <p className="text-ink-muted">
            Welcome to the church community
          </p>
        </div>

        <NativeCard className="max-w-md mx-auto w-full">
          <NativeCardContent className="text-center space-y-6">
            <div className="space-y-3">
              <p className="text-ink">
                Thank you for registering! We&apos;ve sent you a welcome email.
              </p>
              <div className="flex items-center justify-center gap-2 text-sm text-ink-muted">
                <Mail className="h-4 w-4" />
                <span>Check your inbox to sign in</span>
              </div>
            </div>

            <div className="space-y-3">
              <Link href="/auth/signin" className="block">
                <NativeButton 
                  className="w-full h-14 text-lg font-semibold"
                  hapticFeedback
                >
                  Go to Sign In
                </NativeButton>
              </Link>
              <Link href="/" className="block">
                <NativeButton 
                  variant="secondary" 
                  className="w-full h-14 text-lg font-semibold"
                  hapticFeedback
                >
                  Return Home
                </NativeButton>
              </Link>
            </div>

            <p className="text-xs text-ink-muted pt-4">
              Didn&apos;t receive the email? Check your spam folder or try signing in 
              with your email address to request a new magic link.
            </p>
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