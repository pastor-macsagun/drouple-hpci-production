import { AppLayout } from '@/components/layout/app-layout'
import { PageHeader } from '@/components/layout/page-header'
import { getCurrentUser } from '@/lib/rbac'
import { DemoInteractive } from './demo-interactive'
import {
  NativeCard,
  NativeCardHeader,
  NativeCardTitle,
  NativeCardDescription,
  NativeCardContent
} from "@/components/ui/native";

export default async function NativeDemoPage() {
  const user = await getCurrentUser()

  return (
    <AppLayout user={user ? {email: user.email || '', name: user.name, role: user.role} : undefined}>
      <PageHeader 
        title="Native Components"
        description="Universal native-like components that work seamlessly across all platforms - web, PWA, mobile, and desktop."
      />
      
      <div className="space-y-6">
        <DemoInteractive />
        
        {/* Static Platform Info */}
        <NativeCard>
          <NativeCardHeader>
            <NativeCardTitle>Platform Detection</NativeCardTitle>
            <NativeCardDescription>
              Components adapt to different platforms automatically
            </NativeCardDescription>
          </NativeCardHeader>
          <NativeCardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Framework:</span>
                <span className="text-accent font-medium">Next.js 15 + React</span>
              </div>
              <div className="flex justify-between">
                <span>Styling:</span>
                <span className="text-accent font-medium">Tailwind CSS + Native Classes</span>
              </div>
              <div className="flex justify-between">
                <span>PWA Ready:</span>
                <span className="text-green-600 font-medium">✓ Yes</span>
              </div>
              <div className="flex justify-between">
                <span>Offline Support:</span>
                <span className="text-green-600 font-medium">✓ Yes</span>
              </div>
              <div className="flex justify-between">
                <span>Haptic Feedback:</span>
                <span className="text-green-600 font-medium">✓ Yes</span>
              </div>
            </div>
          </NativeCardContent>
        </NativeCard>

        <div className="text-center py-8">
          <p className="text-sm text-ink-muted">
            These components work seamlessly across web, PWA, mobile, and desktop platforms.
          </p>
        </div>
      </div>
    </AppLayout>
  );
}