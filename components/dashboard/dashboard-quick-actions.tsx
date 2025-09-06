import { 
  NativeCard, 
  NativeCardContent, 
  NativeCardDescription, 
  NativeCardHeader, 
  NativeCardTitle,
  NativeButton 
} from "@/components/ui/native";
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
    <NativeCard className="lg:col-span-2">
      <NativeCardHeader>
        <NativeCardTitle>Quick Actions</NativeCardTitle>
        <NativeCardDescription>Frequently used features</NativeCardDescription>
      </NativeCardHeader>
      <NativeCardContent>
        <div className="grid gap-3 sm:grid-cols-2">
          {user.role !== UserRole.SUPER_ADMIN && (
            <>
              <NativeButton asChild variant="secondary" className="justify-start">
                <Link href="/checkin">
                  <UserCheck className="mr-2 h-4 w-4" />
                  Sunday Check-In
                </Link>
              </NativeButton>
              <NativeButton asChild variant="secondary" className="justify-start">
                <Link href="/lifegroups">
                  <Users className="mr-2 h-4 w-4" />
                  {user.role === UserRole.LEADER || user.role === UserRole.ADMIN ? "Manage" : "Browse"} LifeGroups
                </Link>
              </NativeButton>
              <NativeButton asChild variant="secondary" className="justify-start">
                <Link href="/events">
                  <Calendar className="mr-2 h-4 w-4" />
                  {user.role === UserRole.ADMIN ? "Manage" : "View"} Events
                </Link>
              </NativeButton>
              <NativeButton asChild variant="secondary" className="justify-start">
                <Link href="/pathways">
                  <Route className="mr-2 h-4 w-4" />
                  Discipleship Pathways
                </Link>
              </NativeButton>
            </>
          )}
          {(user.role === UserRole.ADMIN || user.role === UserRole.SUPER_ADMIN) && (
            <>
              <NativeButton asChild variant="secondary" className="justify-start">
                <Link href="/admin/services">
                  <Activity className="mr-2 h-4 w-4" />
                  Manage Services
                </Link>
              </NativeButton>
              <NativeButton asChild variant="secondary" className="justify-start">
                <Link href="/admin/pathways">
                  <Route className="mr-2 h-4 w-4" />
                  Manage Pathways
                </Link>
              </NativeButton>
            </>
          )}
          {user.role === UserRole.VIP && (
            <NativeButton asChild variant="secondary" className="justify-start">
              <Link href="/vip/firsttimers">
                <UserPlus className="mr-2 h-4 w-4" />
                First Timers
              </Link>
            </NativeButton>
          )}
          {user.role === UserRole.SUPER_ADMIN && (
            <>
              <NativeButton asChild variant="secondary" className="justify-start">
                <Link href="/super/churches">
                  <Building2 className="mr-2 h-4 w-4" />
                  Manage Churches
                </Link>
              </NativeButton>
              <NativeButton asChild variant="secondary" className="justify-start">
                <Link href="/super/local-churches">
                  <Church className="mr-2 h-4 w-4" />
                  Local Churches
                </Link>
              </NativeButton>
            </>
          )}
        </div>
      </NativeCardContent>
    </NativeCard>
  )
}