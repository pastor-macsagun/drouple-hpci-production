export const dynamic = 'force-dynamic'

import { redirect } from "next/navigation";
import NextDynamic from "next/dynamic";
import { getCurrentUser } from "@/lib/rbac";
import { AppLayout } from "@/components/layout/app-layout";
import { PageHeader } from "@/components/layout/page-header";
import { DashboardQuickActions } from "@/components/dashboard/dashboard-quick-actions";
import { DashboardActivity } from "@/components/dashboard/dashboard-activity";
import { DataFetchErrorBoundary } from "@/components/patterns/error-boundary";
import { StatCardSkeleton } from "@/components/patterns/loading-skeletons";

// Lazy load realtime dashboard stats to improve initial page load
const RealtimeDashboardStats = NextDynamic(() => import("@/components/dashboard/realtime-dashboard-stats").then(mod => ({ default: mod.RealtimeDashboardStats })), {
  loading: () => (
    <div className="grid gap-4 md:gap-6 grid-cols-1 md:grid-cols-2 xl:grid-cols-4">
      <StatCardSkeleton />
      <StatCardSkeleton />
      <StatCardSkeleton />
      <StatCardSkeleton />
    </div>
  )
});

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth/signin");
  }

  return (
    <AppLayout user={user}>
      <PageHeader
        title={`Welcome back, ${user.name || user.email?.split('@')[0]}!`}
        description="Here's an overview of your church activities"
      />

      {/* Dashboard Stats with Real-time Updates */}
      <DataFetchErrorBoundary>
        <RealtimeDashboardStats user={user} />
      </DataFetchErrorBoundary>

      {/* Quick Actions & Activities */}
      <div className="grid gap-4 md:gap-6 mt-6 grid-cols-1 lg:grid-cols-3">
        <DashboardQuickActions user={user} />
        <DashboardActivity />
      </div>
    </AppLayout>
  );
}