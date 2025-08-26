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
import { Users, Building2, Church, Activity, Calendar, UserCheck, Route, TrendingUp, UserPlus, Heart } from "lucide-react";

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth/signin");
  }

  // Get statistics based on role
  const stats = {
    totalChurches: 0,
    totalMembers: 0,
    totalLocalChurches: 0,
    myChurches: user.memberships.map(m => m.localChurch),
  };

  if (user.role === UserRole.SUPER_ADMIN) {
    stats.totalChurches = await prisma.church.count();
    stats.totalLocalChurches = await prisma.localChurch.count();
    stats.totalMembers = await prisma.user.count();
  } else if (user.role === UserRole.ADMIN) {
    const churchIds = user.memberships.map(m => m.localChurchId);
    stats.totalMembers = await prisma.membership.count({
      where: {
        localChurchId: { in: churchIds }
      }
    });
  }

  return (
    <AppLayout user={user}>
      <PageHeader
        title={`Welcome back, ${user.name || user.email?.split('@')[0]}!`}
        description="Here's an overview of your church activities"
      />

      <div className="grid gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">

        {/* Super Admin Stats */}
        {user.role === UserRole.SUPER_ADMIN && (
          <>
            <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-semibold text-muted-foreground">Churches</CardTitle>
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Building2 className="h-4 w-4 text-primary" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.totalChurches}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  <span className="text-success">+12%</span> from last month
                </p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-semibold text-muted-foreground">Locations</CardTitle>
                <div className="p-2 bg-secondary/10 rounded-lg">
                  <Church className="h-4 w-4 text-secondary" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.totalLocalChurches}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  <span className="text-success">+2</span> new branches
                </p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-semibold text-muted-foreground">Total Users</CardTitle>
                <div className="p-2 bg-info/10 rounded-lg">
                  <Users className="h-4 w-4 text-info" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.totalMembers}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  <span className="text-success">+185</span> this week
                </p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-semibold text-muted-foreground">Active Today</CardTitle>
                <div className="p-2 bg-success/10 rounded-lg">
                  <TrendingUp className="h-4 w-4 text-success" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">142</div>
                <p className="text-xs text-muted-foreground mt-1">Currently online</p>
              </CardContent>
            </Card>
          </>
        )}

        {/* Admin Stats */}
        {user.role === UserRole.ADMIN && (
          <>
            <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-semibold text-muted-foreground">Members</CardTitle>
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Users className="h-4 w-4 text-primary" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.totalMembers}</div>
                <p className="text-xs text-muted-foreground mt-1">Active in your church</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-semibold text-muted-foreground">This Sunday</CardTitle>
                <div className="p-2 bg-secondary/10 rounded-lg">
                  <UserCheck className="h-4 w-4 text-secondary" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">234</div>
                <p className="text-xs text-muted-foreground mt-1">Expected attendance</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-semibold text-muted-foreground">LifeGroups</CardTitle>
                <div className="p-2 bg-info/10 rounded-lg">
                  <Heart className="h-4 w-4 text-info" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">12</div>
                <p className="text-xs text-muted-foreground mt-1">Active groups</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-semibold text-muted-foreground">Events</CardTitle>
                <div className="p-2 bg-success/10 rounded-lg">
                  <Calendar className="h-4 w-4 text-success" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">8</div>
                <p className="text-xs text-muted-foreground mt-1">This month</p>
              </CardContent>
            </Card>
          </>
        )}

        {/* VIP Stats */}
        {user.role === UserRole.VIP && (
          <>
            <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-semibold text-muted-foreground">First Timers</CardTitle>
                <div className="p-2 bg-primary/10 rounded-lg">
                  <UserPlus className="h-4 w-4 text-primary" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">23</div>
                <p className="text-xs text-muted-foreground mt-1">This month</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-semibold text-muted-foreground">Gospel Shared</CardTitle>
                <div className="p-2 bg-secondary/10 rounded-lg">
                  <Heart className="h-4 w-4 text-secondary" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">18</div>
                <p className="text-xs text-muted-foreground mt-1">78% conversion rate</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-semibold text-muted-foreground">ROOTS Enrolled</CardTitle>
                <div className="p-2 bg-info/10 rounded-lg">
                  <Route className="h-4 w-4 text-info" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">15</div>
                <p className="text-xs text-muted-foreground mt-1">Active in pathway</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-semibold text-muted-foreground">Follow-ups</CardTitle>
                <div className="p-2 bg-warning/10 rounded-lg">
                  <UserCheck className="h-4 w-4 text-warning" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">5</div>
                <p className="text-xs text-muted-foreground mt-1">Pending this week</p>
              </CardContent>
            </Card>
          </>
        )}

        {/* Leader Stats */}
        {user.role === UserRole.LEADER && (
          <>
            <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-semibold text-muted-foreground">My Groups</CardTitle>
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Users className="h-4 w-4 text-primary" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">3</div>
                <p className="text-xs text-muted-foreground mt-1">Active LifeGroups</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-semibold text-muted-foreground">Members</CardTitle>
                <div className="p-2 bg-secondary/10 rounded-lg">
                  <Heart className="h-4 w-4 text-secondary" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">42</div>
                <p className="text-xs text-muted-foreground mt-1">Under your care</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-semibold text-muted-foreground">Attendance</CardTitle>
                <div className="p-2 bg-success/10 rounded-lg">
                  <TrendingUp className="h-4 w-4 text-success" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">89%</div>
                <p className="text-xs text-muted-foreground mt-1">Average this month</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-semibold text-muted-foreground">Next Meeting</CardTitle>
                <div className="p-2 bg-info/10 rounded-lg">
                  <Calendar className="h-4 w-4 text-info" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">Tomorrow</div>
                <p className="text-xs text-muted-foreground mt-1">7:00 PM</p>
              </CardContent>
            </Card>
          </>
        )}

        {/* Member Stats */}
        {user.role === UserRole.MEMBER && (
          <>
            <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-semibold text-muted-foreground">Check-ins</CardTitle>
                <div className="p-2 bg-primary/10 rounded-lg">
                  <UserCheck className="h-4 w-4 text-primary" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">12</div>
                <p className="text-xs text-muted-foreground mt-1">This year</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-semibold text-muted-foreground">LifeGroups</CardTitle>
                <div className="p-2 bg-secondary/10 rounded-lg">
                  <Users className="h-4 w-4 text-secondary" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">2</div>
                <p className="text-xs text-muted-foreground mt-1">Active membership</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-semibold text-muted-foreground">Events</CardTitle>
                <div className="p-2 bg-info/10 rounded-lg">
                  <Calendar className="h-4 w-4 text-info" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">3</div>
                <p className="text-xs text-muted-foreground mt-1">RSVP&apos;d this month</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-semibold text-muted-foreground">Pathway</CardTitle>
                <div className="p-2 bg-success/10 rounded-lg">
                  <Route className="h-4 w-4 text-success" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">75%</div>
                <p className="text-xs text-muted-foreground mt-1">ROOTS progress</p>
              </CardContent>
            </Card>
          </>
        )}

      </div>

      {/* Quick Actions & Activities */}
      <div className="grid gap-4 md:gap-6 mt-6 grid-cols-1 lg:grid-cols-3">
        <Card className="lg:col-span-2 border-0 shadow-md">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Frequently used features</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2">
              {user.role !== UserRole.SUPER_ADMIN && (
                <>
                  <Button asChild variant="outline" className="justify-start hover:bg-primary hover:text-primary-foreground transition-colors">
                    <Link href="/checkin">
                      <UserCheck className="mr-2 h-4 w-4" />
                      Sunday Check-In
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="justify-start hover:bg-primary hover:text-primary-foreground transition-colors">
                    <Link href="/lifegroups">
                      <Users className="mr-2 h-4 w-4" />
                      {user.role === UserRole.LEADER || user.role === UserRole.ADMIN ? "Manage" : "Browse"} LifeGroups
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="justify-start hover:bg-primary hover:text-primary-foreground transition-colors">
                    <Link href="/events">
                      <Calendar className="mr-2 h-4 w-4" />
                      {user.role === UserRole.ADMIN ? "Manage" : "View"} Events
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="justify-start hover:bg-primary hover:text-primary-foreground transition-colors">
                    <Link href="/pathways">
                      <Route className="mr-2 h-4 w-4" />
                      Discipleship Pathways
                    </Link>
                  </Button>
                </>
              )}
              {(user.role === UserRole.ADMIN || user.role === UserRole.SUPER_ADMIN) && (
                <>
                  <Button asChild variant="outline" className="justify-start hover:bg-primary hover:text-primary-foreground transition-colors">
                    <Link href="/admin/services">
                      <Activity className="mr-2 h-4 w-4" />
                      Manage Services
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="justify-start hover:bg-primary hover:text-primary-foreground transition-colors">
                    <Link href="/admin/pathways">
                      <Route className="mr-2 h-4 w-4" />
                      Manage Pathways
                    </Link>
                  </Button>
                </>
              )}
              {user.role === UserRole.VIP && (
                <Button asChild variant="outline" className="justify-start hover:bg-primary hover:text-primary-foreground transition-colors">
                  <Link href="/vip/first-timers">
                    <UserPlus className="mr-2 h-4 w-4" />
                    First Timers
                  </Link>
                </Button>
              )}
              {user.role === UserRole.SUPER_ADMIN && (
                <>
                  <Button asChild variant="outline" className="justify-start hover:bg-primary hover:text-primary-foreground transition-colors">
                    <Link href="/super/churches">
                      <Building2 className="mr-2 h-4 w-4" />
                      Manage Churches
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="justify-start hover:bg-primary hover:text-primary-foreground transition-colors">
                    <Link href="/super/local-churches">
                      <Church className="mr-2 h-4 w-4" />
                      Local Churches
                    </Link>
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest updates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <UserCheck className="h-3 w-3 text-primary" />
                </div>
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium">New check-in</p>
                  <p className="text-xs text-muted-foreground">John Doe checked in • 2 hours ago</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="p-2 bg-secondary/10 rounded-lg">
                  <Calendar className="h-3 w-3 text-secondary" />
                </div>
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium">Event reminder</p>
                  <p className="text-xs text-muted-foreground">Youth Night tomorrow • 7 PM</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="p-2 bg-info/10 rounded-lg">
                  <Users className="h-3 w-3 text-info" />
                </div>
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium">LifeGroup update</p>
                  <p className="text-xs text-muted-foreground">5 new members joined • Yesterday</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}