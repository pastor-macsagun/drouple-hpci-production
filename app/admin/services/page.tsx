import { AppLayout } from "@/components/layout/app-layout";
import { getCurrentUser } from "@/lib/rbac";
import { redirect } from "next/navigation";
import { UserRole } from "@prisma/client";
import { ServicesManager } from "./services-manager";
import { listServices, getLocalChurches } from "./actions";

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
      <div className="container py-8">
        <h1 className="text-3xl font-bold mb-6">Admin Services</h1>
        <ServicesManager 
          initialServices={servicesResult.success && servicesResult.data ? servicesResult.data : { items: [], nextCursor: null, hasMore: false }}
          churches={churchesResult.success && churchesResult.data ? churchesResult.data : []}
          userRole={user.role}
          userChurchId={user.tenantId}
        />
      </div>
    </AppLayout>
  );
}