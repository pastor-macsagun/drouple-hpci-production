import { AppLayout } from "@/components/layout/app-layout";
import { getCurrentUser } from "@/lib/rbac";
import { redirect } from "next/navigation";
import { UserRole } from "@prisma/client";
import { MembersManager } from "./members-manager";
import { listMembers, getLocalChurches } from "./actions";

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
      <div className="container py-8">
        <h1 className="text-3xl font-bold mb-6">Member Management</h1>
        <MembersManager
          initialMembers={membersResult.success && membersResult.data ? membersResult.data : { items: [], nextCursor: null, hasMore: false }}
          churches={churchesResult.success && churchesResult.data ? churchesResult.data : []}
          userRole={user.role}
          userChurchId={user.tenantId}
        />
      </div>
    </AppLayout>
  );
}