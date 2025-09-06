"use client";

import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { PullToRefresh } from "./pull-to-refresh";
import { SwipeToDelete } from "./swipe-to-delete";

interface MobileListItem {
  id: string;
  content: ReactNode;
  onDelete?: () => void | Promise<void>;
  canDelete?: boolean;
}

interface MobileListProps {
  items: MobileListItem[];
  onRefresh?: () => Promise<void>;
  className?: string;
  emptyState?: ReactNode;
  loading?: boolean;
  loadingComponent?: ReactNode;
}

export function MobileList({
  items,
  onRefresh,
  className,
  emptyState,
  loading = false,
  loadingComponent,
}: MobileListProps) {
  const handleRefresh = async () => {
    if (onRefresh) {
      await onRefresh();
    }
  };

  const content = (
    <div className="space-y-2">
      {loading && loadingComponent ? (
        loadingComponent
      ) : items.length === 0 ? (
        emptyState || (
          <div className="text-center py-12 text-ink-muted">
            No items to display
          </div>
        )
      ) : (
        items.map((item) =>
          item.canDelete && item.onDelete ? (
            <SwipeToDelete
              key={item.id}
              onDelete={item.onDelete}
              className="border border-border rounded-lg bg-bg"
            >
              <div className="p-4">{item.content}</div>
            </SwipeToDelete>
          ) : (
            <div
              key={item.id}
              className="p-4 border border-border rounded-lg bg-bg"
            >
              {item.content}
            </div>
          )
        )
      )}
    </div>
  );

  if (onRefresh) {
    return (
      <PullToRefresh onRefresh={handleRefresh} className={cn("min-h-[400px]", className)}>
        {content}
      </PullToRefresh>
    );
  }

  return <div className={className}>{content}</div>;
}