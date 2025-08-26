export const dynamic = 'force-dynamic'

import { AppLayout } from "@/components/layout/app-layout";
import { PageHeader } from "@/components/layout/page-header";
import { getCurrentUser } from "@/lib/rbac";
import { redirect } from "next/navigation";
import { getMyLifeGroups, getAvailableLifeGroups } from "./actions";
import { LeaderView } from "./leader-view";
import { Plus } from "lucide-react";
import { LifeGroupsTabs } from "./lifegroups-tabs";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function LifeGroupsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth/signin");
  }

  const [myGroupsResult, availableGroupsResult] = await Promise.all([
    getMyLifeGroups(),
    getAvailableLifeGroups()
  ]);

  const myGroups = myGroupsResult.success ? myGroupsResult.data || [] : [];
  const availableGroups = availableGroupsResult.success ? availableGroupsResult.data || [] : [];

  // Check if user is a leader of any life groups
  const ledGroups = user.id ? await prisma.lifeGroup.findMany({
    where: {
      leaderId: user.id,
      isActive: true
    },
    include: {
      leader: {
        select: {
          id: true,
          name: true,
          email: true
        }
      },
      _count: {
        select: {
          memberships: {
            where: {
              status: 'ACTIVE'
            }
          }
        }
      }
    }
  }) : [];

  const isAdmin = ['ADMIN', 'PASTOR', 'SUPER_ADMIN'].includes(user.role);

  return (
    <AppLayout user={user}>
      <PageHeader 
        title="LifeGroups" 
        description="Connect with others in small group communities"
      >
        {isAdmin && (
          <Button asChild>
            <Link href="/admin/lifegroups">
              <Plus className="mr-2 h-4 w-4" />
              Manage LifeGroups
            </Link>
          </Button>
        )}
      </PageHeader>

      <div className="space-y-6">
        {/* Leader Section */}
        {ledGroups.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Groups You Lead</h2>
            {ledGroups.map(group => (
              <LeaderView
                key={group.id}
                lifeGroupId={group.id}
                lifeGroupName={group.name}
              />
            ))}
          </div>
        )}

        {/* Member Section */}
        <LifeGroupsTabs 
          myGroups={myGroups}
          availableGroups={availableGroups}
          isAdmin={isAdmin}
        />
      </div>
    </AppLayout>
  );
}