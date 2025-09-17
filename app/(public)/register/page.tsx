import { prisma } from '@/lib/prisma'
import {
  NativeCard,
  NativeCardContent,
  NativeButton,
  NativeInput
} from '@/components/ui/native'
import { registerMember } from './actions'
import Link from 'next/link'
import { UserPlus } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function RegisterPage() {
  // Get all local churches for the dropdown
  const localChurches = await prisma.localChurch.findMany({
    include: {
      church: true,
    },
    orderBy: [
      { church: { name: 'asc' } },
      { name: 'asc' },
    ],
  })

  return (
    <main className="min-h-screen bg-gradient-to-br from-accent/5 via-bg to-accent/10 flex flex-col">
      {/* Native App Header */}
      <div className="relative flex items-center justify-center p-4 pt-safe-area-top">
        <div className="text-lg font-semibold text-ink">Member Registration</div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col justify-center px-6 py-8">
        {/* App Logo/Branding */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-accent flex items-center justify-center shadow-lg">
            <UserPlus className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-ink mb-2">Join Our Community</h1>
          <p className="text-ink-muted">
            Create your account to connect with your local church
          </p>
        </div>

        <NativeCard className="max-w-md mx-auto w-full">
          <NativeCardContent>
            <form action={registerMember} className="space-y-6">
              <div className="space-y-4">
                <NativeInput
                  label="Email Address"
                  id="email"
                  name="email"
                  type="email"
                  required
                  placeholder="your@email.com"
                />

                <NativeInput
                  label="Full Name"
                  id="name"
                  name="name"
                  required
                  placeholder="John Doe"
                />

                <div>
                  <NativeInput
                    label="Password"
                    id="password"
                    name="password"
                    type="password"
                    required
                    placeholder="Minimum 8 characters"
                    minLength={8}
                  />
                  <p className="text-xs text-ink-muted mt-1">
                    At least 8 characters with mixed case, number, and symbol
                  </p>
                </div>

                <NativeInput
                  label="Confirm Password"
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  placeholder="Confirm your password"
                  minLength={8}
                />

                <div>
                  <label htmlFor="localChurchId" className="block text-sm font-medium text-ink mb-2">
                    Select Your Local Church *
                  </label>
                  <select
                    id="localChurchId"
                    name="localChurchId"
                    required
                    className="input-native"
                  >
                    <option value="">Choose a church...</option>
                    {localChurches.map((localChurch) => (
                      <option key={localChurch.id} value={localChurch.id}>
                        {localChurch.church.name} - {localChurch.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center space-x-3">
                  <input
                    id="isNewBeliever"
                    name="isNewBeliever"
                    type="checkbox"
                    value="true"
                    className="h-5 w-5 rounded border-input bg-bg text-accent focus:ring-2 focus:ring-accent focus:ring-offset-2"
                  />
                  <label
                    htmlFor="isNewBeliever"
                    className="text-sm text-ink cursor-pointer"
                  >
                    I am a new believer (accepted Christ recently)
                  </label>
                </div>
              </div>

              <NativeButton 
                type="submit" 
                className="w-full h-14 text-lg font-semibold"
                hapticFeedback
              >
                Register
              </NativeButton>

              <div className="text-center text-sm">
                <span className="text-ink-muted">Already have an account? </span>
                <Link href="/auth/signin" className="text-accent hover:underline font-medium">
                  Sign In
                </Link>
              </div>
            </form>
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