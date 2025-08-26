"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Menu, Moon, Sun } from "lucide-react";
import { UserRole } from "@prisma/client";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

interface HeaderProps {
  user?: {
    email?: string | null;
    name?: string | null;
    role?: UserRole;
  };
  onMenuClick?: () => void;
  showMenuButton?: boolean;
}

export function Header({ user, onMenuClick, showMenuButton = false }: HeaderProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="flex h-14 items-center px-4">
        {showMenuButton && (
          <Button
            variant="ghost"
            size="icon"
            className="mr-2 lg:hidden hover:bg-accent"
            onClick={onMenuClick}
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle sidebar</span>
          </Button>
        )}

        <div className="mr-4 flex lg:hidden">
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-lg font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">HPCI</span>
          </Link>
        </div>

        <div className="ml-auto flex items-center space-x-2">
          {mounted && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="hover:bg-accent"
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
              <span className="text-sm text-muted-foreground">
                {user.name || user.email}
              </span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}