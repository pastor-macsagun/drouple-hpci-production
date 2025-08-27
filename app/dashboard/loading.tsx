import { AppLayout } from "@/components/layout/app-layout"
import { DashboardSkeleton } from "@/components/patterns/loading-skeletons"

export default function DashboardLoading() {
  return (
    <AppLayout user={undefined}>
      <DashboardSkeleton />
    </AppLayout>
  )
}