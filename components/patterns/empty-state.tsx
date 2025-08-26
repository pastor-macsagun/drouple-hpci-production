'use client'

import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick?: () => void;
    href?: string;
  };
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn(
      "flex flex-col items-center justify-center py-12 px-4 text-center",
      className
    )}>
      {icon && (
        <div className="mb-4 p-3 rounded-full bg-muted">
          <div className="h-10 w-10 text-ink-muted">
            {icon}
          </div>
        </div>
      )}
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      {description && (
        <p className="text-sm text-ink-muted max-w-sm mb-6">
          {description}
        </p>
      )}
      {action && (
        <div>
          {action.href ? (
            <Button asChild className="shadow-sm">
              <a href={action.href}>{action.label}</a>
            </Button>
          ) : (
            <Button onClick={action.onClick} className="shadow-sm">
              {action.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}