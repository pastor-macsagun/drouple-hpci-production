"use client";

import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface Column<T> {
  key: string;
  header: string;
  cell: (item: T) => ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  emptyState?: ReactNode;
  className?: string;
  caption?: string;
  ariaLabel?: string;
}

export function DataTable<T extends { id?: string | number }>({
  data,
  columns,
  emptyState,
  className,
  caption,
  ariaLabel,
}: DataTableProps<T>) {
  if (data.length === 0 && emptyState) {
    return <>{emptyState}</>;
  }

  return (
    <div className={cn("table-container", className)}>
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
  );
}