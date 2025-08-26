import { AppLayout } from "@/components/layout/app-layout";
import { getCurrentUser } from "@/lib/rbac";
import { redirect } from "next/navigation";
import { UserRole } from "@prisma/client";
import { LifeGroupsManager } from "./lifegroups-manager";
import { listLifeGroups, getLocalChurches, getLeaders } from "./actions";

export default async function AdminLifeGroupsPage() {
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
      <div className="container py-8">
        <h1 className="text-3xl font-bold mb-6">Admin LifeGroups</h1>
        <LifeGroupsManager 
          initialLifeGroups={lifeGroupsResult.success && lifeGroupsResult.data ? lifeGroupsResult.data : { items: [], nextCursor: null, hasMore: false }}
          churches={churchesResult.success && churchesResult.data ? churchesResult.data : []}
          leaders={leadersResult.success && leadersResult.data ? leadersResult.data : []}
          userRole={user.role}
          userChurchId={user.tenantId}
        />
      </div>
    </AppLayout>
  );
}