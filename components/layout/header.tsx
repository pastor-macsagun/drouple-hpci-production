"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Menu, Moon, Sun } from "lucide-react";
import { UserRole } from "@prisma/client";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { OfflineIndicator } from "@/components/pwa/offline-indicator";

interface HeaderProps {
  user?: {
    email?: string | null;
    name?: string | null;
    role?: UserRole;
  };
  onMenuClick?: () => void;
  showMenuButton?: boolean;
  sidebarOpen?: boolean;
}

export function Header({ user, onMenuClick, showMenuButton = false, sidebarOpen = false }: HeaderProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <header className="border-b border-border bg-bg">
      <div className="flex h-16 items-center px-4 sm:px-6">
        {showMenuButton && (
          <Button
            variant="ghost"
            size="icon"
            className="mr-2 lg:hidden hover:bg-elevated focus-ring"
            onClick={onMenuClick}
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle sidebar</span>
          </Button>
        )}

        {!sidebarOpen && (
          <div className="mr-4 flex lg:hidden">
            <Link href="/" className="flex items-center space-x-2 focus-ring rounded">
              <span className="text-lg font-bold bg-gradient-to-r from-accent to-accent/80 bg-clip-text text-transparent">Drouple</span>
            </Link>
          </div>
        )}

        <div className="ml-auto flex items-center space-x-2">
          <OfflineIndicator />
          
          {mounted && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="hover:bg-elevated focus-ring"
            >
              {theme === "dark" ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
              <span className="sr-only">Toggle theme</span>
            </Button>
          )}
          
          {user && (
            <div className="hidden sm:flex items-center space-x-3">
              <span className="text-sm text-ink-muted">
                {user.name || user.email}
              </span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}