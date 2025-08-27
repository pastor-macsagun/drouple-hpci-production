"use client";

import { ReactNode, memo } from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";

interface Column<T> {
  key: string;
  header: string;
  cell: (item: T) => ReactNode;
  className?: string;
  mobileLabel?: string; // Optional label for mobile card view
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  emptyState?: ReactNode;
  className?: string;
  caption?: string;
  ariaLabel?: string;
}

const DataTableComponent = <T extends { id?: string | number }>({
  data,
  columns,
  emptyState,
  className,
  caption,
  ariaLabel,
}: DataTableProps<T>) => {
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
                    column.className
                  )}
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

      {/* Mobile Card View - Enhanced for touch */}
      <div className="md:hidden space-y-3">
        {data.map((item, index) => (
          <Card key={item.id || index} className="p-4 mobile-scroll">
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
        ))}
      </div>
    </>
  );
};

// Memoize the component to prevent unnecessary re-renders
export const DataTable = memo(DataTableComponent) as typeof DataTableComponent;