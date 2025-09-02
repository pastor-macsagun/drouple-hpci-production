import { AppLayout } from "@/components/layout/app-layout";
import { getCurrentUser } from "@/lib/rbac";
import { redirect } from "next/navigation";
import { UserRole } from "@prisma/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Heart, Users, Calendar, BookOpen, UserCheck } from "lucide-react";
import { unstable_noStore as noStore } from 'next/cache';

export default async function LeaderDashboard() {
  noStore(); // Opt out of static generation for authenticated pages
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth/signin");
  }

  if (user.role !== UserRole.LEADER) {
    redirect("/dashboard");
  }

  return (
    <AppLayout user={user}>
      <div className="container py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Leader Dashboard</h1>
          <p className="text-ink-muted mt-2">
            Lead your ministry and manage your assigned responsibilities
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* LifeGroups Leadership */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-success/10 rounded-xl">
                  <Heart className="h-6 w-6 text-success" />
                </div>
                <h3 className="font-semibold">My LifeGroups</h3>
              </div>
            </div>
            <p className="text-sm text-ink-muted mb-4">
              Manage your life groups, track attendance, and approve new members
            </p>
            <Button asChild className="w-full">
              <Link href="/lifegroups">Manage Groups</Link>
            </Button>
          </Card>

          {/* Check-in Management */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-accent-secondary/10 rounded-xl">
                  <UserCheck className="h-6 w-6 text-accent-secondary" />
                </div>
                <h3 className="font-semibold">Check-in</h3>
              </div>
            </div>
            <p className="text-sm text-ink-muted mb-4">
              Personal check-in for services and ministry events
            </p>
            <Button asChild className="w-full">
              <Link href="/checkin">Check-in Now</Link>
            </Button>
          </Card>

          {/* Member Directory */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-accent/10 rounded-xl">
                  <Users className="h-6 w-6 text-accent" />
                </div>
                <h3 className="font-semibold">Members</h3>
              </div>
            </div>
            <p className="text-sm text-ink-muted mb-4">
              View member directory and contact information for ministry
            </p>
            <Button asChild className="w-full">
              <Link href="/members">View Members</Link>
            </Button>
          </Card>

          {/* Events */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-secondary/10 rounded-xl">
                  <Calendar className="h-6 w-6 text-secondary" />
                </div>
                <h3 className="font-semibold">Events</h3>
              </div>
            </div>
            <p className="text-sm text-ink-muted mb-4">
              View upcoming events and manage your ministry calendar
            </p>
            <Button asChild className="w-full">
              <Link href="/events">View Events</Link>
            </Button>
          </Card>

          {/* Pathways */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-accent/10 rounded-xl">
                  <BookOpen className="h-6 w-6 text-accent" />
                </div>
                <h3 className="font-semibold">Discipleship</h3>
              </div>
            </div>
            <p className="text-sm text-ink-muted mb-4">
              Track your own spiritual growth and help others in their journey
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