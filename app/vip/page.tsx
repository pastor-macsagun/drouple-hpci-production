import { AppLayout } from "@/components/layout/app-layout";
import { getCurrentUser } from "@/lib/rbac";
import { redirect } from "next/navigation";
import { UserRole } from "@prisma/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Heart, Users, Calendar, BookOpen } from "lucide-react";

export default async function VipDashboard() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth/signin");
  }

  if (user.role !== UserRole.VIP) {
    redirect("/dashboard");
  }

  return (
    <AppLayout user={user}>
      <div className="container py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">VIP Team Dashboard</h1>
          <p className="text-ink-muted mt-2">
            Welcome new believers and manage first-time visitor follow-up
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* First Timers Management */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-pink-100 rounded-xl">
                  <Heart className="h-6 w-6 text-pink-600" />
                </div>
                <h3 className="font-semibold">First Timers</h3>
              </div>
            </div>
            <p className="text-sm text-ink-muted mb-4">
              Manage first-time visitors, track gospel sharing, and follow up on new believers
            </p>
            <Button asChild className="w-full">
              <Link href="/vip/firsttimers">Manage First Timers</Link>
            </Button>
          </Card>

          {/* Member Directory */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-xl">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="font-semibold">Members</h3>
              </div>
            </div>
            <p className="text-sm text-ink-muted mb-4">
              View member directory and contact information for follow-up
            </p>
            <Button asChild className="w-full">
              <Link href="/members">View Members</Link>
            </Button>
          </Card>

          {/* Events */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-xl">
                  <Calendar className="h-6 w-6 text-orange-600" />
                </div>
                <h3 className="font-semibold">Events</h3>
              </div>
            </div>
            <p className="text-sm text-ink-muted mb-4">
              View upcoming church events and special programs for new members
            </p>
            <Button asChild className="w-full">
              <Link href="/events">View Events</Link>
            </Button>
          </Card>

          {/* Pathways */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-xl">
                  <BookOpen className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="font-semibold">Discipleship</h3>
              </div>
            </div>
            <p className="text-sm text-ink-muted mb-4">
              Track ROOTS pathway progress and help connect new believers to growth resources
            </p>
            <Button asChild className="w-full">
              <Link href="/pathways">View Pathways</Link>
            </Button>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}