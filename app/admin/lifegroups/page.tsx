import { Suspense } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { PageHeader } from "@/components/layout/page-header";
import { getCurrentUser } from "@/lib/rbac";
import { redirect } from "next/navigation";
import { UserRole } from "@prisma/client";
import { LifeGroupsManager } from "./lifegroups-manager";
import { listLifeGroups, getLocalChurches, getLeaders } from "./actions";
import { DataFetchErrorBoundary } from "@/components/patterns/error-boundary";
import { TableSkeleton, FormSkeleton } from "@/components/patterns/loading-skeletons";
import { unstable_noStore as noStore } from 'next/cache';

function LifeGroupsLoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <FormSkeleton className="w-80" />
        <div className="w-32 h-10 bg-muted rounded" />
      </div>
      <TableSkeleton columns={5} rows={6} />
    </div>
  );
}

export default async function AdminLifeGroupsPage() {
  noStore(); // Opt out of static generation for authenticated pages
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth/signin");
  }

  if (!([UserRole.ADMIN, UserRole.PASTOR, UserRole.SUPER_ADMIN] as UserRole[]).includes(user.role)) {
    redirect("/dashboard");
  }

  const [lifeGroupsResult, churchesResult, leadersResult] = await Promise.all([
    listLifeGroups(),
    getLocalChurches(),
    getLeaders()
  ]);

  return (
    <AppLayout user={user}>
      <PageHeader
        title="LifeGroup Management"
        description="Manage LifeGroups, members, and attendance tracking"
      />
      
      <DataFetchErrorBoundary>
        <Suspense fallback={<LifeGroupsLoadingSkeleton />}>
          <LifeGroupsManager 
            initialLifeGroups={lifeGroupsResult.success && lifeGroupsResult.data ? lifeGroupsResult.data : { items: [], nextCursor: null, hasMore: false }}
            churches={churchesResult.success && churchesResult.data ? churchesResult.data : []}
            leaders={leadersResult.success && leadersResult.data ? leadersResult.data : []}
            userRole={user.role}
            userChurchId={user.tenantId}
          />
        </Suspense>
      </DataFetchErrorBoundary>
    </AppLayout>
  );
}