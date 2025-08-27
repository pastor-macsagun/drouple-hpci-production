import { db } from '@/app/lib/db'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { registerMember } from './actions'
import Link from 'next/link'
import { UserPlus } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function RegisterPage() {
  // Get all local churches for the dropdown
  const localChurches = await db.localChurch.findMany({
    include: {
      church: true,
    },
    orderBy: [
      { church: { name: 'asc' } },
      { name: 'asc' },
    ],
  })

  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-surface">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
            <UserPlus className="h-8 w-8 text-blue-600" />
          </div>
          <CardTitle className="text-2xl">Member Registration</CardTitle>
          <p className="text-sm text-ink-muted mt-2">
            Join your local church community
          </p>
        </CardHeader>
        <CardContent>
          <form action={registerMember} className="space-y-4">
            <div>
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                placeholder="your@email.com"
              />
            </div>

            <div>
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                name="name"
                required
                placeholder="John Doe"
              />
            </div>

            <div>
              <Label htmlFor="password">Password *</Label>
              <Input
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

            <div>
              <Label htmlFor="confirmPassword">Confirm Password *</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                placeholder="Confirm your password"
                minLength={8}
              />
            </div>

            <div>
              <Label htmlFor="localChurchId">Select Your Local Church *</Label>
              <select
                id="localChurchId"
                name="localChurchId"
                required
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
              >
                <option value="">Choose a church...</option>
                {localChurches.map((localChurch) => (
                  <option key={localChurch.id} value={localChurch.id}>
                    {localChurch.church.name} - {localChurch.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="isNewBeliever"
                name="isNewBeliever"
                value="true"
              />
              <Label
                htmlFor="isNewBeliever"
                className="text-sm font-normal cursor-pointer"
              >
                I am a new believer (accepted Christ recently)
              </Label>
            </div>

            <Button type="submit" className="w-full">
              Register
            </Button>

            <div className="text-center text-sm">
              <span className="text-ink-muted">Already have an account? </span>
              <Link href="/auth/signin" className="text-blue-600 hover:underline">
                Sign In
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </main>
  )
}