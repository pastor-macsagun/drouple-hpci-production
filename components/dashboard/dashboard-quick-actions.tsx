import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { UserRole } from "@prisma/client";
import { Users, Building2, Church, Activity, Calendar, UserCheck, Route, UserPlus } from "lucide-react";

interface DashboardQuickActionsProps {
  user: {
    role: UserRole
  }
}

export function DashboardQuickActions({ user }: DashboardQuickActionsProps) {
  return (
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
              <Link href="/vip/firsttimers">
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
  )
}