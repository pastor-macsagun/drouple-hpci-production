"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserRole } from "@prisma/client";
import { cn } from "@/lib/utils";
import { triggerHapticFeedback } from "@/lib/mobile-utils";
import { 
  Home,
  Calendar,
  Users,
  GraduationCap,
  User,
  BarChart3
} from "lucide-react";

interface NativeNavigationProps {
  user?: {
    email?: string | null;
    name?: string | null;
    role?: UserRole;
  };
}

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: UserRole[];
}

const navigationItems: NavItem[] = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: Home,
    roles: [UserRole.MEMBER, UserRole.LEADER, UserRole.VIP, UserRole.ADMIN, UserRole.SUPER_ADMIN]
  },
  {
    name: "Events",
    href: "/events",
    icon: Calendar,
    roles: [UserRole.MEMBER, UserRole.LEADER, UserRole.VIP, UserRole.ADMIN, UserRole.SUPER_ADMIN]
  },
  {
    name: "Groups",
    href: "/lifegroups",
    icon: Users,
    roles: [UserRole.MEMBER, UserRole.LEADER, UserRole.VIP, UserRole.ADMIN, UserRole.SUPER_ADMIN]
  },
  {
    name: "Pathways",
    href: "/pathways",
    icon: GraduationCap,
    roles: [UserRole.MEMBER, UserRole.LEADER, UserRole.VIP, UserRole.ADMIN, UserRole.SUPER_ADMIN]
  },
  {
    name: "Admin",
    href: "/admin",
    icon: BarChart3,
    roles: [UserRole.ADMIN, UserRole.SUPER_ADMIN]
  },
  {
    name: "Profile",
    href: "/profile",
    icon: User,
    roles: [UserRole.MEMBER, UserRole.LEADER, UserRole.VIP, UserRole.ADMIN, UserRole.SUPER_ADMIN]
  }
];

export function NativeNavigation({ user }: NativeNavigationProps) {
  const pathname = usePathname();

  const handleNavClick = () => {
    triggerHapticFeedback('tap');
  };

  // Filter navigation items based on user role
  const visibleItems = navigationItems.filter(item =>
    !user?.role || item.roles.includes(user.role)
  );

  // Limit to 5 items for optimal mobile UX
  const displayItems = visibleItems.slice(0, 5);

  return (
    <nav className={cn(
      "sticky bottom-0 z-30 bg-bg/80 backdrop-blur-md border-t border-border/10",
      "px-2 py-2 pb-safe-area-bottom",
      "flex items-center justify-around",
      "min-h-[72px]"
    )}>
      {displayItems.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
        const Icon = item.icon;
        
        return (
          <Link
            key={item.name}
            href={item.href}
            onClick={handleNavClick}
            className={cn(
              "flex flex-col items-center justify-center gap-1",
              "touch-target-48 rounded-xl px-3 py-2",
              "transition-all duration-200 ease-standard",
              "active:scale-95",
              isActive 
                ? "text-accent bg-accent/10" 
                : "text-ink-muted hover:text-ink hover:bg-surface/50"
            )}
          >
            <Icon className="w-5 h-5" />
            <span className="text-xs font-medium truncate max-w-[60px]">
              {item.name}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}