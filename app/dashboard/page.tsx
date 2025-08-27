export const dynamic = 'force-dynamic'

import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getCurrentUser } from "@/lib/rbac";
import { AppLayout } from "@/components/layout/app-layout";
import { PageHeader } from "@/components/layout/page-header";
import { DashboardStats } from "@/components/dashboard/dashboard-stats";
import { DashboardQuickActions } from "@/components/dashboard/dashboard-quick-actions";
import { DashboardActivity } from "@/components/dashboard/dashboard-activity";
import { StatCardSkeleton } from "@/components/patterns/loading-skeletons";
import { DataFetchErrorBoundary } from "@/components/patterns/error-boundary";

function StatsSkeleton() {
  return (
    <div className="grid gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <StatCardSkeleton key={i} />
      ))}
    </div>
  )
}

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

      {/* Dashboard Stats with Suspense and Error Boundary */}
      <DataFetchErrorBoundary>
        <Suspense fallback={<StatsSkeleton />}>
          <DashboardStats user={user} />
        </Suspense>
      </DataFetchErrorBoundary>

      {/* Quick Actions & Activities */}
      <div className="grid gap-4 md:gap-6 mt-6 grid-cols-1 lg:grid-cols-3">
        <DashboardQuickActions user={user} />
        <DashboardActivity />
      </div>
    </AppLayout>
  );
}