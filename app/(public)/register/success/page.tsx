import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { CheckCircle, Mail } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default function RegistrationSuccessPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <CardTitle className="text-2xl">Registration Successful!</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <div className="space-y-2">
            <p className="text-gray-600">
              Thank you for registering! We&apos;ve sent you a welcome email.
            </p>
            <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
              <Mail className="h-4 w-4" />
              <span>Check your inbox to sign in</span>
            </div>
          </div>

          <div className="pt-4 space-y-2">
            <Link href="/auth/signin" className="block">
              <Button className="w-full">
                Go to Sign In
              </Button>
            </Link>
            <Link href="/" className="block">
              <Button variant="outline" className="w-full">
                Return Home
              </Button>
            </Link>
          </div>

          <p className="text-xs text-gray-500 pt-4">
            Didn&apos;t receive the email? Check your spam folder or try signing in 
            with your email address to request a new magic link.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}