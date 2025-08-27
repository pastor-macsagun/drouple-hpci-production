import { Suspense } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { PageHeader } from "@/components/layout/page-header";
import { getCurrentUser } from "@/lib/rbac";
import { redirect } from "next/navigation";
import { UserRole } from "@prisma/client";
import { ServicesManager } from "./services-manager";
import { listServices, getLocalChurches } from "./actions";
import { DataFetchErrorBoundary } from "@/components/patterns/error-boundary";
import { TableSkeleton, FormSkeleton } from "@/components/patterns/loading-skeletons";

function ServicesLoadingSkeleton() {
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

export default async function AdminServicesPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth/signin");
  }

  if (!([UserRole.ADMIN, UserRole.PASTOR, UserRole.SUPER_ADMIN] as UserRole[]).includes(user.role)) {
    redirect("/dashboard");
  }

  const [servicesResult, churchesResult] = await Promise.all([
    listServices(),
    getLocalChurches()
  ]);

  return (
    <AppLayout user={user}>
      <PageHeader
        title="Service Management"
        description="Manage Sunday services and track attendance"
      />
      
      <DataFetchErrorBoundary>
        <Suspense fallback={<ServicesLoadingSkeleton />}>
          <ServicesManager 
            initialServices={servicesResult.success && servicesResult.data ? servicesResult.data : { items: [], nextCursor: null, hasMore: false }}
            churches={churchesResult.success && churchesResult.data ? churchesResult.data : []}
            userRole={user.role}
            userChurchId={user.tenantId}
          />
        </Suspense>
      </DataFetchErrorBoundary>
    </AppLayout>
  );
}