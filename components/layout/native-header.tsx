"use client";

import { UserRole } from "@prisma/client";
import { cn } from "@/lib/utils";

interface NativeHeaderProps {
  user?: {
    email?: string | null;
    name?: string | null;
    role?: UserRole;
  };
  title?: string;
  showBackButton?: boolean;
  onBackClick?: () => void;
  rightContent?: React.ReactNode;
  className?: string;
}

export function NativeHeader({
  user,
  title,
  showBackButton = false,
  onBackClick,
  rightContent,
  className
}: NativeHeaderProps) {
  return (
    <header className={cn(
      "sticky top-0 z-30 bg-bg/80 backdrop-blur-md border-b border-border/10",
      "px-4 py-3 pt-safe-area-top",
      "flex items-center justify-between",
      "min-h-[60px] touch-target",
      className
    )}>
      <div className="flex items-center gap-3">
        {showBackButton ? (
          <button
            onClick={onBackClick}
            className="touch-target-48 rounded-xl hover:bg-surface active:scale-95 transition-all duration-150"
          >
            <svg className="w-6 h-6 text-ink" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        ) : (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-accent rounded-xl flex items-center justify-center">
              <span className="text-accent-ink font-semibold text-sm">D</span>
            </div>
          </div>
        )}
        
        {title && (
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-semibold text-ink truncate">
              {title}
            </h1>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        {rightContent}
        
        {user && (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-accent/10 rounded-full flex items-center justify-center">
              <span className="text-accent font-medium text-sm">
                {user.name?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase()}
              </span>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}