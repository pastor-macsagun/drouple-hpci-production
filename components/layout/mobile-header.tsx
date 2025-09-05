"use client";

import { UserRole } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Moon, Sun, Bell } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { OfflineIndicator } from "@/components/offline/offline-indicator";

interface MobileHeaderProps {
  user?: {
    email?: string | null;
    name?: string | null;
    role?: UserRole;
  };
}

export function MobileHeader({ user }: MobileHeaderProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <header className="sticky top-0 z-50 bg-bg border-b border-border">
      <div className="flex h-14 items-center justify-between px-4">
        <div className="flex items-center space-x-2">
          <span className="text-lg font-bold bg-gradient-to-r from-accent to-accent/80 bg-clip-text text-transparent">
            Drouple
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <OfflineIndicator />
          
          <Button
            variant="ghost"
            size="icon"
            className="hover:bg-elevated focus-ring h-8 w-8"
          >
            <Bell className="h-4 w-4" />
            <span className="sr-only">Notifications</span>
          </Button>

          {mounted && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="hover:bg-elevated focus-ring h-8 w-8"
            >
              {theme === "dark" ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
              <span className="sr-only">Toggle theme</span>
            </Button>
          )}
        </div>
      </div>
      
      {user && (
        <div className="px-4 py-2 border-b border-border">
          <p className="text-sm font-medium text-ink truncate">
            Welcome, {user.name || user.email}
          </p>
          {user.role && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-accent/10 text-accent">
              {user.role}
            </span>
          )}
        </div>
      )}
    </header>
  );
}