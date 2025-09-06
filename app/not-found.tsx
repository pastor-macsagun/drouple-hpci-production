import { BackButton } from '@/components/ui/back-button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FileQuestion } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-surface">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-elevated flex items-center justify-center">
            <FileQuestion className="h-8 w-8 text-ink-muted" />
          </div>
          <CardTitle className="text-2xl">Page Not Found</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-ink-muted">
            The page you&apos;re looking for doesn&apos;t exist or has been moved.
          </p>
          <div className="flex gap-2 justify-center pt-4">
            <BackButton />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}