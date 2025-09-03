import { Suspense } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { PageHeader } from "@/components/layout/page-header";
import { getCurrentUser } from "@/lib/rbac";
import { redirect } from "next/navigation";
import { UserRole } from "@prisma/client";
import { AnnouncementsManager } from "./announcements-manager";
import { listAnnouncements, getLocalChurches } from "./actions";
import { DataFetchErrorBoundary } from "@/components/patterns/error-boundary";
import { TableSkeleton, FormSkeleton } from "@/components/patterns/loading-skeletons";
import { unstable_noStore as noStore } from 'next/cache';

function AnnouncementsLoadingSkeleton() {
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

export default async function AdminAnnouncementsPage() {
  noStore(); // Opt out of static generation for authenticated pages
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth/signin");
  }

  if (!([UserRole.ADMIN, UserRole.PASTOR, UserRole.SUPER_ADMIN] as UserRole[]).includes(user.role)) {
    redirect("/dashboard");
  }

  const [announcementsResult, churchesResult] = await Promise.all([
    listAnnouncements(),
    getLocalChurches()
  ]);

  return (
    <AppLayout user={user}>
      <PageHeader
        title="Announcement Management"
        description="Create and manage church announcements"
      />
      
      <DataFetchErrorBoundary>
        <Suspense fallback={<AnnouncementsLoadingSkeleton />}>
          <AnnouncementsManager 
            initialAnnouncements={announcementsResult.success && announcementsResult.data ? announcementsResult.data : { items: [], nextCursor: null, hasMore: false }}
            churches={churchesResult.success && churchesResult.data ? churchesResult.data : []}
            userRole={user.role}
            userChurchId={user.tenantId}
          />
        </Suspense>
      </DataFetchErrorBoundary>
    </AppLayout>
  );
}