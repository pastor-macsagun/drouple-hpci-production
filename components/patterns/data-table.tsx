"use client";

import { ReactNode, memo } from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { SwipeActions } from "@/components/pwa/swipe-actions";
import { useHaptic } from "@/hooks/use-haptic";

interface Column<T> {
  key: string;
  header: string;
  cell: (item: T) => ReactNode;
  className?: string;
  mobileLabel?: string; // Optional label for mobile card view
  sortable?: boolean;
}

interface SwipeAction<T> {
  key: string;
  label: string;
  icon: ReactNode;
  variant?: 'primary' | 'secondary' | 'danger';
  onAction: (item: T) => void;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  emptyState?: ReactNode;
  className?: string;
  caption?: string;
  ariaLabel?: string;
  // PWA enhancements
  swipeActions?: SwipeAction<T>[];
  onRefresh?: () => void;
  refreshing?: boolean;
}

const DataTableComponent = <T extends { id?: string | number }>({
  data,
  columns,
  emptyState,
  className,
  caption,
  ariaLabel,
  swipeActions = [],
  onRefresh,
  refreshing = false,
}: DataTableProps<T>) => {
  const { triggerHaptic } = useHaptic();
  if (data.length === 0 && emptyState) {
    return <>{emptyState}</>;
  }

  return (
    <>
      {/* Desktop Table View */}
      <div className={cn("hidden md:block table-container", className)}>
        <table className="w-full" aria-label={ariaLabel}>
          {caption && <caption className="sr-only">{caption}</caption>}
          <thead>
            <tr className="border-b">
              {columns.map((column) => (
                <th
                  key={column.key}
                  scope="col"
                  className={cn(
                    "px-4 py-3 text-left text-sm font-medium text-muted-foreground",
                    column.sortable && "cursor-pointer hover:text-foreground transition-colors",
                    column.className
                  )}
                  onClick={() => {
                    if (column.sortable) {
                      triggerHaptic('light');
                    }
                  }}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((item, index) => (
              <tr
                key={item.id || index}
                className="border-b transition-colors hover:bg-muted/50"
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={cn("px-4 py-3 text-sm", column.className)}
                  >
                    {column.cell(item)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View - Enhanced for touch with PWA features */}
      <div className="md:hidden space-y-3">
        {data.map((item, index) => {
          const cardContent = (
            <Card className="p-4 mobile-scroll">
              <CardContent className="p-0 space-y-3">
                {columns.map((column) => (
                  <div key={column.key} className="flex justify-between items-start gap-3 min-h-[24px]">
                    <span className="text-sm font-medium text-muted-foreground min-w-[80px] flex-shrink-0">
                      {column.mobileLabel || column.header}:
                    </span>
                    <div className="text-sm text-right min-w-0 flex-1 break-words">
                      {column.cell(item)}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          );

          // Wrap with swipe actions if provided
          if (swipeActions.length > 0) {
            return (
              <SwipeActions
                key={item.id || index}
                actions={swipeActions.map(action => ({
                  key: action.key,
                  label: action.label,
                  icon: action.icon,
                  variant: action.variant || 'secondary',
                  onAction: () => action.onAction(item)
                }))}
              >
                {cardContent}
              </SwipeActions>
            );
          }

          return <div key={item.id || index}>{cardContent}</div>;
        })}
      </div>
    </>
  );
};

// Memoize the component to prevent unnecessary re-renders
export const DataTable = memo(DataTableComponent) as typeof DataTableComponent;