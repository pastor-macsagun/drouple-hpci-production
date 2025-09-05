"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { signOutAction } from "@/app/actions/auth";
import {
  Home,
  Calendar,
  Users,
  Route,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Shield,
  UserCheck,
  UserPlus,
} from "lucide-react";
import { UserRole } from "@prisma/client";
import { useState } from "react";

interface SidebarProps {
  user?: {
    role?: UserRole;
    email?: string | null;
    name?: string | null;
  };
  className?: string;
  onClose?: () => void;
}

export function Sidebar({ user, className, onClose }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  // Helper function to get role-specific dashboard URL
  const getDashboardUrl = (role?: UserRole) => {
    switch (role) {
      case UserRole.SUPER_ADMIN:
        return "/super";
      case UserRole.ADMIN:
      case UserRole.PASTOR:
        return "/admin";
      case UserRole.VIP:
        return "/vip";
      case UserRole.LEADER:
        return "/leader";
      case UserRole.MEMBER:
      default:
        return "/dashboard";
    }
  };

  const navigation = [
    {
      name: "Dashboard",
      href: getDashboardUrl(user?.role),
      icon: Home,
      roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.VIP, UserRole.LEADER, UserRole.MEMBER, UserRole.PASTOR],
    },
    {
      name: "Check-In",
      href: "/checkin",
      icon: UserCheck,
      roles: [UserRole.MEMBER, UserRole.LEADER, UserRole.VIP, UserRole.ADMIN, UserRole.PASTOR, UserRole.SUPER_ADMIN],
    },
    {
      name: "Events",
      href: "/events",
      icon: Calendar,
      roles: [UserRole.MEMBER, UserRole.LEADER, UserRole.VIP, UserRole.ADMIN, UserRole.PASTOR, UserRole.SUPER_ADMIN],
    },
    {
      name: "LifeGroups",
      href: "/lifegroups",
      icon: Users,
      roles: [UserRole.MEMBER, UserRole.LEADER, UserRole.VIP, UserRole.ADMIN, UserRole.PASTOR, UserRole.SUPER_ADMIN],
    },
    {
      name: "Pathways",
      href: "/pathways",
      icon: Route,
      roles: [UserRole.MEMBER, UserRole.LEADER, UserRole.VIP, UserRole.ADMIN, UserRole.PASTOR, UserRole.SUPER_ADMIN],
    },
  ];

  const vipNavigation = [
    {
      name: "First Timers",
      href: "/vip/firsttimers",
      icon: UserPlus,
      roles: [UserRole.VIP, UserRole.ADMIN, UserRole.PASTOR, UserRole.SUPER_ADMIN],
    },
  ];

  const adminNavigation = [
    {
      name: "Members",
      href: "/admin/members",
      icon: Users,
      roles: [UserRole.ADMIN, UserRole.PASTOR, UserRole.SUPER_ADMIN],
    },
    {
      name: "Admin Services",
      href: "/admin/services",
      icon: Shield,
      roles: [UserRole.ADMIN, UserRole.PASTOR, UserRole.SUPER_ADMIN],
    },
    {
      name: "Admin Events",
      href: "/admin/events",
      icon: Calendar,
      roles: [UserRole.ADMIN, UserRole.PASTOR, UserRole.SUPER_ADMIN],
    },
    {
      name: "Admin LifeGroups",
      href: "/admin/lifegroups",
      icon: Users,
      roles: [UserRole.ADMIN, UserRole.PASTOR, UserRole.SUPER_ADMIN],
    },
    {
      name: "Admin Pathways",
      href: "/admin/pathways",
      icon: Route,
      roles: [UserRole.ADMIN, UserRole.PASTOR, UserRole.SUPER_ADMIN],
    },
  ];

  const superAdminNavigation = [
    {
      name: "Churches",
      href: "/super/churches",
      icon: Shield,
      roles: [UserRole.SUPER_ADMIN],
    },
    {
      name: "Local Churches",
      href: "/super/local-churches",
      icon: Users,
      roles: [UserRole.SUPER_ADMIN],
    },
  ];

  const bottomNavigation = [
    {
      name: "Profile",
      href: "/profile",
      icon: Settings,
      roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.VIP, UserRole.LEADER, UserRole.MEMBER],
    },
  ];

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  const filteredNavigation = navigation.filter(
    (item) => !user?.role || item.roles.includes(user.role)
  );

  const filteredVipNavigation = vipNavigation.filter(
    (item) => user?.role && item.roles.includes(user.role as any) // eslint-disable-line @typescript-eslint/no-explicit-any -- Role type casting
  );

  const filteredAdminNavigation = adminNavigation.filter(
    (item) => user?.role && item.roles.includes(user.role as any) // eslint-disable-line @typescript-eslint/no-explicit-any -- Role type casting
  );

  const filteredSuperAdminNavigation = superAdminNavigation.filter(
    (item) => user?.role && item.roles.includes(user.role as any) // eslint-disable-line @typescript-eslint/no-explicit-any -- Role type casting
  );

  const filteredBottomNavigation = bottomNavigation.filter(
    (item) => !user?.role || item.roles.includes(user.role as any) // eslint-disable-line @typescript-eslint/no-explicit-any -- Role type casting
  );

  return (
    <aside
      className={cn(
        "flex h-full flex-col bg-surface transition-all duration-base ease-standard border-r border-border",
        collapsed ? "w-16" : "w-64",
        className
      )}
    >
      <div className="flex h-16 items-center justify-between px-4 border-b border-border">
        {!collapsed && (
          <Link href="/" className="flex items-center space-x-2 focus-ring rounded">
            <span className="text-lg font-bold bg-gradient-to-r from-accent to-accent/80 bg-clip-text text-transparent">Drouple</span>
          </Link>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="hidden lg:flex hover:bg-elevated focus-ring h-8 w-8"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      <nav className="flex-1 space-y-1 px-2 py-5">
        {filteredNavigation.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-fast focus-ring",
                isActive(item.href)
                  ? "bg-elevated text-ink shadow-sm"
                  : "hover:bg-elevated/50 text-ink-muted hover:text-ink",
                collapsed && "justify-center"
              )}
              title={collapsed ? item.name : undefined}
            >
              <Icon className={cn(
                "h-4 w-4 flex-shrink-0",
                isActive(item.href) && "text-primary-foreground"
              )} />
              {!collapsed && <span>{item.name}</span>}
            </Link>
          );
        })}

        {filteredVipNavigation.length > 0 && (
          <>
            <div className="my-5 border-t border-border" />
            <div className={cn("px-3 py-2", collapsed && "px-0")}>
              {!collapsed && (
                <p className="text-xs font-semibold text-ink-muted uppercase tracking-wider">
                  VIP Team
                </p>
              )}
            </div>
            {filteredVipNavigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-fast focus-ring",
                    isActive(item.href)
                      ? "bg-elevated text-ink shadow-sm"
                      : "hover:bg-elevated/50 text-ink-muted hover:text-ink",
                    collapsed && "justify-center"
                  )}
                  title={collapsed ? item.name : undefined}
                >
                  <Icon className="h-4 w-4 flex-shrink-0" />
                  {!collapsed && <span>{item.name}</span>}
                </Link>
              );
            })}
          </>
        )}

        {filteredAdminNavigation.length > 0 && (
          <>
            <div className="my-5 border-t border-border" />
            <div className={cn("px-3 py-2", collapsed && "px-0")}>
              {!collapsed && (
                <p className="text-xs font-semibold text-ink-muted uppercase tracking-wider">
                  Administration
                </p>
              )}
            </div>
            {filteredAdminNavigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-fast focus-ring",
                    isActive(item.href)
                      ? "bg-elevated text-ink shadow-sm"
                      : "hover:bg-elevated/50 text-ink-muted hover:text-ink",
                    collapsed && "justify-center"
                  )}
                  title={collapsed ? item.name : undefined}
                >
                  <Icon className="h-4 w-4 flex-shrink-0" />
                  {!collapsed && <span>{item.name}</span>}
                </Link>
              );
            })}
          </>
        )}

        {filteredSuperAdminNavigation.length > 0 && (
          <>
            <div className="my-5 border-t border-border" />
            <div className={cn("px-3 py-2", collapsed && "px-0")}>
              {!collapsed && (
                <p className="text-xs font-semibold text-ink-muted uppercase tracking-wider">
                  Super Admin
                </p>
              )}
            </div>
            {filteredSuperAdminNavigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-fast focus-ring",
                    isActive(item.href)
                      ? "bg-elevated text-ink shadow-sm"
                      : "hover:bg-elevated/50 text-ink-muted hover:text-ink",
                    collapsed && "justify-center"
                  )}
                  title={collapsed ? item.name : undefined}
                >
                  <Icon className="h-4 w-4 flex-shrink-0" />
                  {!collapsed && <span>{item.name}</span>}
                </Link>
              );
            })}
          </>
        )}
      </nav>

      <div className="border-t border-border px-2 py-4">
        {filteredBottomNavigation.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-fast focus-ring",
                isActive(item.href)
                  ? "bg-elevated text-ink shadow-sm"
                  : "hover:bg-elevated/50 text-ink-muted hover:text-ink",
                collapsed && "justify-center"
              )}
              title={collapsed ? item.name : undefined}
            >
              <Icon className={cn(
                "h-4 w-4 flex-shrink-0",
                isActive(item.href) && "text-primary-foreground"
              )} />
              {!collapsed && <span>{item.name}</span>}
            </Link>
          );
        })}

        <form action={signOutAction}>
          <Button
            type="submit"
            variant="ghost"
            className={cn(
              "w-full justify-start gap-3 px-3 hover:bg-elevated/50 focus-ring",
              collapsed && "justify-center px-0"
            )}
            title={collapsed ? "Sign Out" : undefined}
          >
            <LogOut className="h-4 w-4 flex-shrink-0" />
            {!collapsed && <span>Sign Out</span>}
          </Button>
        </form>

        {user && !collapsed && (
          <div className="mt-4 px-3 py-2 border-t border-border">
            <p className="text-xs font-medium text-ink truncate">
              {user.name || user.email}
            </p>
            {user.role && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-accent/10 text-accent mt-1">
                {user.role}
              </span>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}