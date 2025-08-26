import { AppLayout } from "@/components/layout/app-layout";
import { getCurrentUser } from "@/lib/rbac";
import { redirect } from "next/navigation";
import { UserRole } from "@prisma/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Users, Calendar, Heart, MapPin, BarChart3, Settings } from "lucide-react";

export default async function AdminDashboard() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth/signin");
  }

  if (!([UserRole.ADMIN, UserRole.PASTOR, UserRole.SUPER_ADMIN] as UserRole[]).includes(user.role)) {
    redirect("/dashboard");
  }

  return (
    <AppLayout user={user}>
      <div className="container py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Manage your church operations and oversee all ministry activities
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Members Management */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="font-semibold">Members</h3>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Manage member accounts, roles, and church assignments
            </p>
            <Button asChild className="w-full">
              <Link href="/admin/members">Manage Members</Link>
            </Button>
          </Card>

          {/* Services Management */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Calendar className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="font-semibold">Services</h3>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Create services, track attendance, and manage check-ins
            </p>
            <Button asChild className="w-full">
              <Link href="/admin/services">Manage Services</Link>
            </Button>
          </Card>

          {/* LifeGroups Management */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Heart className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="font-semibold">LifeGroups</h3>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Create and manage life groups, leaders, and memberships
            </p>
            <Button asChild className="w-full">
              <Link href="/admin/lifegroups">Manage LifeGroups</Link>
            </Button>
          </Card>

          {/* Events Management */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <MapPin className="h-6 w-6 text-orange-600" />
                </div>
                <h3 className="font-semibold">Events</h3>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Organize church events, manage RSVPs, and track attendance
            </p>
            <Button asChild className="w-full">
              <Link href="/admin/events">Manage Events</Link>
            </Button>
          </Card>

          {/* Pathways Management */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <Settings className="h-6 w-6 text-indigo-600" />
                </div>
                <h3 className="font-semibold">Pathways</h3>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Manage discipleship pathways and track member progress
            </p>
            <Button asChild className="w-full">
              <Link href="/admin/pathways">Manage Pathways</Link>
            </Button>
          </Card>

          {/* Reports */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <BarChart3 className="h-6 w-6 text-red-600" />
                </div>
                <h3 className="font-semibold">Reports</h3>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              View analytics and generate reports for ministry oversight
            </p>
            <Button asChild className="w-full">
              <Link href="/admin/reports">View Reports</Link>
            </Button>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}