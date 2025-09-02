export const dynamic = 'force-dynamic'

import { redirect } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { getCurrentUser } from "@/lib/rbac";
import { UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { AppLayout } from "@/components/layout/app-layout";
import { Users, Building2, Church, Calendar } from "lucide-react";
import { unstable_noStore as noStore } from 'next/cache';

export default async function SuperDashboardPage() {
  noStore(); // Opt out of static generation for authenticated pages
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
      <div className="container py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Super Admin Dashboard</h1>
          <p className="text-ink-muted mt-2">
            Platform-wide overview and management across all churches
          </p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8" data-testid="oversight-kpis">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-accent/10 rounded-xl">
                  <Building2 className="h-6 w-6 text-accent" />
                </div>
                <h3 className="font-semibold">Total Churches</h3>
              </div>
            </div>
            <div className="text-2xl font-bold mb-1">{totalChurches}</div>
            <p className="text-sm text-ink-muted">Active church organizations</p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-accent-secondary/10 rounded-xl">
                  <Church className="h-6 w-6 text-accent-secondary" />
                </div>
                <h3 className="font-semibold">Local Churches</h3>
              </div>
            </div>
            <div className="text-2xl font-bold mb-1">{totalLocalChurches}</div>
            <p className="text-sm text-ink-muted">Branch locations</p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-success/10 rounded-xl">
                  <Users className="h-6 w-6 text-success" />
                </div>
                <h3 className="font-semibold">Total Members</h3>
              </div>
            </div>
            <div className="text-2xl font-bold mb-1">{totalMembers}</div>
            <p className="text-sm text-ink-muted">Registered users platform-wide</p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-danger/10 rounded-xl">
                  <Calendar className="h-6 w-6 text-danger" />
                </div>
                <h3 className="font-semibold">Total Events</h3>
              </div>
            </div>
            <div className="text-2xl font-bold mb-1">{totalEvents}</div>
            <p className="text-sm text-ink-muted">Events across all churches</p>
          </Card>
        </div>

        {/* Management Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-accent/10 rounded-xl">
                  <Building2 className="h-6 w-6 text-accent" />
                </div>
                <h3 className="font-semibold">Churches</h3>
              </div>
            </div>
            <p className="text-sm text-ink-muted mb-4">
              Manage church organizations and their administrative settings
            </p>
            <Button asChild className="w-full">
              <Link href="/super/churches">Manage Churches</Link>
            </Button>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-accent-secondary/10 rounded-xl">
                  <Church className="h-6 w-6 text-accent-secondary" />
                </div>
                <h3 className="font-semibold">Local Churches</h3>
              </div>
            </div>
            <p className="text-sm text-ink-muted mb-4">
              Manage local church branches and their specific configurations
            </p>
            <Button asChild className="w-full">
              <Link href="/super/local-churches">Manage Local Churches</Link>
            </Button>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}