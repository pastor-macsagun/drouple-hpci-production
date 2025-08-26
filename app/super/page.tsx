export const dynamic = 'force-dynamic'

import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { getCurrentUser } from "@/lib/rbac";
import { UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { AppLayout } from "@/components/layout/app-layout";
import { PageHeader } from "@/components/layout/page-header";
import { Users, Building2, Church, Calendar } from "lucide-react";

export default async function SuperDashboardPage() {
  const user = await getCurrentUser();

  if (!user || user.role !== UserRole.SUPER_ADMIN) {
    redirect("/dashboard");
  }

  // Get platform-wide statistics
  const [totalChurches, totalLocalChurches, totalMembers, totalEvents] = await Promise.all([
    prisma.church.count(),
    prisma.localChurch.count(),
    prisma.user.count(),
    prisma.event.count()
  ]);

  return (
    <AppLayout user={user}>
      <PageHeader
        title="Super Admin Dashboard"
        description="Platform-wide overview and management"
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Churches</CardTitle>
            <Building2 className="h-4 w-4 text-ink-muted" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalChurches}</div>
            <p className="text-xs text-ink-muted">Active church organizations</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Local Churches</CardTitle>
            <Church className="h-4 w-4 text-ink-muted" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalLocalChurches}</div>
            <p className="text-xs text-ink-muted">Branch locations</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Members</CardTitle>
            <Users className="h-4 w-4 text-ink-muted" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalMembers}</div>
            <p className="text-xs text-ink-muted">Registered users platform-wide</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Events</CardTitle>
            <Calendar className="h-4 w-4 text-ink-muted" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalEvents}</div>
            <p className="text-xs text-ink-muted">Events across all churches</p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Manage platform resources</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2">
            <Button asChild variant="outline" className="justify-start">
              <Link href="/super/churches">
                <Building2 className="mr-2 h-4 w-4" />
                Manage Churches
              </Link>
            </Button>
            <Button asChild variant="outline" className="justify-start">
              <Link href="/super/local-churches">
                <Church className="mr-2 h-4 w-4" />
                Manage Local Churches
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Platform Status</CardTitle>
            <CardDescription>System health and activity</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">System Status</span>
                <span className="text-sm font-medium text-green-600">Operational</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Database</span>
                <span className="text-sm font-medium text-green-600">Connected</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Last Backup</span>
                <span className="text-sm text-ink-muted">Auto-managed</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}