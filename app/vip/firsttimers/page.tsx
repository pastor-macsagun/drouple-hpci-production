import { AppLayout } from "@/components/layout/app-layout";
import { getCurrentUser } from "@/lib/rbac";
import { redirect } from "next/navigation";
import { UserRole } from "@prisma/client";
import { FirstTimersManager } from "./firsttimers-manager";
import { getFirstTimers, getVipTeamMembers } from "@/app/actions/firsttimers";
import { unstable_noStore as noStore } from 'next/cache';

export default async function VipFirstTimersPage() {
  noStore(); // Opt out of static generation for authenticated pages
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth/signin");
  }

  const hasVipAccess = user.role === UserRole.SUPER_ADMIN ||
    user.role === UserRole.PASTOR ||
    user.role === UserRole.ADMIN ||
    user.role === UserRole.VIP;

  if (!hasVipAccess) {
    redirect("/dashboard");
  }

  const [firstTimers, vipMembers] = await Promise.all([
    getFirstTimers(),
    getVipTeamMembers()
  ]);

  return (
    <AppLayout user={user}>
      <div className="container py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">First Timers</h1>
          <p className="text-ink-muted mt-2">
            Manage and track follow-up with first-time visitors
          </p>
        </div>
        <FirstTimersManager 
          initialFirstTimers={firstTimers}
          vipMembers={vipMembers}
          userRole={user.role}
        />
      </div>
    </AppLayout>
  );
}