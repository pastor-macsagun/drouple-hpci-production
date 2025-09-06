"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Home, UserCheck, Calendar, Users, User } from "lucide-react";
import { UserRole } from "@prisma/client";

interface MobileNavigationProps {
  user?: {
    role?: UserRole;
    email?: string | null;
    name?: string | null;
  };
}

export function MobileNavigation({ user }: MobileNavigationProps) {
  const pathname = usePathname();

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

  // Core mobile navigation - only essential features
  const navigation = [
    {
      name: "Home",
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
      name: "Directory",
      href: "/members",
      icon: Users,
      roles: [UserRole.MEMBER, UserRole.LEADER, UserRole.VIP, UserRole.ADMIN, UserRole.PASTOR, UserRole.SUPER_ADMIN],
    },
    {
      name: "Profile",
      href: "/profile",
      icon: User,
      roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.VIP, UserRole.LEADER, UserRole.MEMBER, UserRole.PASTOR],
    },
  ];

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  const filteredNavigation = navigation.filter(
    (item) => !user?.role || item.roles.includes(user.role)
  );

  return (
    <nav className="sticky bottom-0 z-50 bg-bg border-t border-border">
      <div className="flex items-center justify-around px-2 py-2">
        {filteredNavigation.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center min-w-0 flex-1 px-2 py-2 text-xs font-medium rounded-lg transition-all duration-fast focus-ring",
                isActive(item.href)
                  ? "text-accent bg-accent/10"
                  : "text-ink-muted hover:text-ink hover:bg-elevated/50"
              )}
            >
              <Icon className={cn(
                "h-5 w-5 mb-1",
                isActive(item.href) ? "text-accent" : "text-ink-muted"
              )} />
              <span className="truncate">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}