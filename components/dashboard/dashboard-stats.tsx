import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { Users, Building2, Church, Calendar, UserCheck, Route, TrendingUp, UserPlus, Heart } from "lucide-react";

interface DashboardStatsProps {
  user: {
    id: string
    role: UserRole
    tenantId: string | null
    memberships: Array<{
      localChurchId: string
      localChurch: {
        id: string
        name: string
      }
    }>
  }
}

export async function DashboardStats({ user }: DashboardStatsProps) {
  // Get statistics based on role
  const stats = {
    totalChurches: 0,
    totalMembers: 0,
    totalLocalChurches: 0,
    myChurches: user.memberships.map(m => m.localChurch),
  };

  try {
    if (user.role === UserRole.SUPER_ADMIN) {
      const [churchCount, localChurchCount, memberCount] = await Promise.all([
        prisma.church.count(),
        prisma.localChurch.count(),
        prisma.user.count()
      ]);
      stats.totalChurches = churchCount;
      stats.totalLocalChurches = localChurchCount;
      stats.totalMembers = memberCount;
    } else if (user.role === UserRole.ADMIN) {
      const churchIds = user.memberships.map(m => m.localChurchId);
      stats.totalMembers = await prisma.membership.count({
        where: {
          localChurchId: { in: churchIds }
        }
      });
    }
  } catch (error) {
    console.error('Failed to fetch dashboard stats:', error);
    // Stats will remain at default values of 0
  }

  return (
    <div className="grid gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
      {/* Super Admin Stats */}
      {user.role === UserRole.SUPER_ADMIN && (
        <>
          <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-ink-muted">Churches</CardTitle>
              <div className="p-2 bg-primary/10 rounded-xl">
                <Building2 className="h-4 w-4 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.totalChurches}</div>
              <p className="text-xs text-ink-muted mt-1">
                <span className="text-success">+12%</span> from last month
              </p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-ink-muted">Locations</CardTitle>
              <div className="p-2 bg-secondary/10 rounded-xl">
                <Church className="h-4 w-4 text-secondary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.totalLocalChurches}</div>
              <p className="text-xs text-ink-muted mt-1">
                <span className="text-success">+2</span> new branches
              </p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-ink-muted">Total Users</CardTitle>
              <div className="p-2 bg-info/10 rounded-xl">
                <Users className="h-4 w-4 text-info" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.totalMembers}</div>
              <p className="text-xs text-ink-muted mt-1">
                <span className="text-success">+185</span> this week
              </p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-ink-muted">Active Today</CardTitle>
              <div className="p-2 bg-success/10 rounded-xl">
                <TrendingUp className="h-4 w-4 text-success" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">142</div>
              <p className="text-xs text-ink-muted mt-1">Currently online</p>
            </CardContent>
          </Card>
        </>
      )}

      {/* Admin Stats */}
      {user.role === UserRole.ADMIN && (
        <>
          <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-ink-muted">Members</CardTitle>
              <div className="p-2 bg-primary/10 rounded-xl">
                <Users className="h-4 w-4 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.totalMembers}</div>
              <p className="text-xs text-ink-muted mt-1">Active in your church</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-ink-muted">This Sunday</CardTitle>
              <div className="p-2 bg-secondary/10 rounded-xl">
                <UserCheck className="h-4 w-4 text-secondary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">234</div>
              <p className="text-xs text-ink-muted mt-1">Expected attendance</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-ink-muted">LifeGroups</CardTitle>
              <div className="p-2 bg-info/10 rounded-xl">
                <Heart className="h-4 w-4 text-info" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">12</div>
              <p className="text-xs text-ink-muted mt-1">Active groups</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-ink-muted">Events</CardTitle>
              <div className="p-2 bg-success/10 rounded-xl">
                <Calendar className="h-4 w-4 text-success" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">8</div>
              <p className="text-xs text-ink-muted mt-1">This month</p>
            </CardContent>
          </Card>
        </>
      )}

      {/* VIP Stats */}
      {user.role === UserRole.VIP && (
        <>
          <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-ink-muted">First Timers</CardTitle>
              <div className="p-2 bg-primary/10 rounded-xl">
                <UserPlus className="h-4 w-4 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">23</div>
              <p className="text-xs text-ink-muted mt-1">This month</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-ink-muted">Gospel Shared</CardTitle>
              <div className="p-2 bg-secondary/10 rounded-xl">
                <Heart className="h-4 w-4 text-secondary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">18</div>
              <p className="text-xs text-ink-muted mt-1">78% conversion rate</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-ink-muted">ROOTS Enrolled</CardTitle>
              <div className="p-2 bg-info/10 rounded-xl">
                <Route className="h-4 w-4 text-info" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">15</div>
              <p className="text-xs text-ink-muted mt-1">Active in pathway</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-ink-muted">Follow-ups</CardTitle>
              <div className="p-2 bg-warning/10 rounded-xl">
                <UserCheck className="h-4 w-4 text-warning" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">5</div>
              <p className="text-xs text-ink-muted mt-1">Pending this week</p>
            </CardContent>
          </Card>
        </>
      )}

      {/* Leader Stats */}
      {user.role === UserRole.LEADER && (
        <>
          <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-ink-muted">My Groups</CardTitle>
              <div className="p-2 bg-primary/10 rounded-xl">
                <Users className="h-4 w-4 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">3</div>
              <p className="text-xs text-ink-muted mt-1">Active LifeGroups</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-ink-muted">Members</CardTitle>
              <div className="p-2 bg-secondary/10 rounded-xl">
                <Heart className="h-4 w-4 text-secondary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">42</div>
              <p className="text-xs text-ink-muted mt-1">Under your care</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-ink-muted">Attendance</CardTitle>
              <div className="p-2 bg-success/10 rounded-xl">
                <TrendingUp className="h-4 w-4 text-success" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">89%</div>
              <p className="text-xs text-ink-muted mt-1">Average this month</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-ink-muted">Next Meeting</CardTitle>
              <div className="p-2 bg-info/10 rounded-xl">
                <Calendar className="h-4 w-4 text-info" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Tomorrow</div>
              <p className="text-xs text-ink-muted mt-1">7:00 PM</p>
            </CardContent>
          </Card>
        </>
      )}

      {/* Member Stats */}
      {user.role === UserRole.MEMBER && (
        <>
          <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-ink-muted">Check-ins</CardTitle>
              <div className="p-2 bg-primary/10 rounded-xl">
                <UserCheck className="h-4 w-4 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">12</div>
              <p className="text-xs text-ink-muted mt-1">This year</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-ink-muted">LifeGroups</CardTitle>
              <div className="p-2 bg-secondary/10 rounded-xl">
                <Users className="h-4 w-4 text-secondary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">2</div>
              <p className="text-xs text-ink-muted mt-1">Active membership</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-ink-muted">Events</CardTitle>
              <div className="p-2 bg-info/10 rounded-xl">
                <Calendar className="h-4 w-4 text-info" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">3</div>
              <p className="text-xs text-ink-muted mt-1">RSVP&apos;d this month</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-ink-muted">Pathway</CardTitle>
              <div className="p-2 bg-success/10 rounded-xl">
                <Route className="h-4 w-4 text-success" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">75%</div>
              <p className="text-xs text-ink-muted mt-1">ROOTS progress</p>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}