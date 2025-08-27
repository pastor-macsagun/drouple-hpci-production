import { Suspense } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { PageHeader } from "@/components/layout/page-header";
import { getCurrentUser } from "@/lib/rbac";
import { redirect } from "next/navigation";
import { UserRole } from "@prisma/client";
import { MembersManager } from "./members-manager";
import { listMembers, getLocalChurches } from "./actions";
import { DataFetchErrorBoundary } from "@/components/patterns/error-boundary";
import { TableSkeleton, FormSkeleton } from "@/components/patterns/loading-skeletons";

function MembersLoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <FormSkeleton className="w-80" />
        <div className="w-32 h-10 bg-muted rounded" />
      </div>
      <TableSkeleton columns={6} rows={8} />
    </div>
  );
}

export default async function AdminMembersPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth/signin");
  }

  if (!([UserRole.ADMIN, UserRole.PASTOR, UserRole.SUPER_ADMIN] as UserRole[]).includes(user.role)) {
    redirect("/dashboard");
  }

  const [membersResult, churchesResult] = await Promise.all([
    listMembers(),
    getLocalChurches()
  ]);

  return (
    <AppLayout user={user}>
      <PageHeader
        title="Member Management"
        description="Manage church members, roles, and permissions"
      />
      
      <DataFetchErrorBoundary>
        <Suspense fallback={<MembersLoadingSkeleton />}>
          <MembersManager
            initialMembers={membersResult.success && membersResult.data ? membersResult.data : { items: [], nextCursor: null, hasMore: false }}
            churches={churchesResult.success && churchesResult.data ? churchesResult.data : []}
            userRole={user.role}
            userChurchId={user.tenantId}
          />
        </Suspense>
      </DataFetchErrorBoundary>
    </AppLayout>
  );
}