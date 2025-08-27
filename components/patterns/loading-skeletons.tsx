import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
}

// Skeleton for dashboard stat cards
export function StatCardSkeleton({ className }: SkeletonProps) {
  return (
    <Card className={cn("border-0 shadow-md", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <Skeleton className="h-4 w-20" /> {/* Title */}
        <Skeleton className="h-8 w-8 rounded-xl" /> {/* Icon */}
      </CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-16 mb-2" /> {/* Large number */}
        <Skeleton className="h-3 w-24" /> {/* Subtitle */}
      </CardContent>
    </Card>
  );
}

// Skeleton for data table rows
export function TableSkeleton({ 
  columns = 4, 
  rows = 5, 
  className 
}: SkeletonProps & { columns?: number; rows?: number }) {
  return (
    <div className={cn("table-container", className)}>
      <div className="w-full">
        {/* Header */}
        <div className="border-b flex">
          {Array.from({ length: columns }).map((_, i) => (
            <div key={i} className="px-4 py-3 flex-1">
              <Skeleton className="h-4 w-full max-w-24" />
            </div>
          ))}
        </div>
        
        {/* Rows */}
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="border-b flex">
            {Array.from({ length: columns }).map((_, colIndex) => (
              <div key={colIndex} className="px-4 py-3 flex-1">
                <Skeleton className="h-4 w-full max-w-32" />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// Skeleton for mobile card view of data table
export function MobileTableSkeleton({ 
  items = 3, 
  className 
}: SkeletonProps & { items?: number }) {
  return (
    <div className={cn("md:hidden space-y-3", className)}>
      {Array.from({ length: items }).map((_, index) => (
        <Card key={index} className="p-4">
          <CardContent className="p-0 space-y-2">
            {Array.from({ length: 3 }).map((_, fieldIndex) => (
              <div key={fieldIndex} className="flex justify-between items-start gap-2">
                <Skeleton className="h-4 w-16" /> {/* Label */}
                <Skeleton className="h-4 w-24" /> {/* Value */}
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// Skeleton for list items
export function ListSkeleton({ 
  items = 5, 
  className 
}: SkeletonProps & { items?: number }) {
  return (
    <div className={cn("space-y-3", className)}>
      {Array.from({ length: items }).map((_, index) => (
        <Card key={index} className="p-4">
          <div className="flex items-start space-x-4">
            <Skeleton className="h-10 w-10 rounded-full" /> {/* Avatar */}
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-32" /> {/* Title */}
              <Skeleton className="h-3 w-48" /> {/* Description */}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

// Skeleton for forms
export function FormSkeleton({ className }: SkeletonProps) {
  return (
    <Card className={cn("p-6", className)}>
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-5 w-20" /> {/* Label */}
          <Skeleton className="h-10 w-full" /> {/* Input */}
        </div>
        <div className="space-y-2">
          <Skeleton className="h-5 w-24" /> {/* Label */}
          <Skeleton className="h-10 w-full" /> {/* Input */}
        </div>
        <div className="space-y-2">
          <Skeleton className="h-5 w-28" /> {/* Label */}
          <Skeleton className="h-20 w-full" /> {/* Textarea */}
        </div>
        <div className="flex justify-end space-x-2">
          <Skeleton className="h-10 w-20" /> {/* Button */}
          <Skeleton className="h-10 w-24" /> {/* Button */}
        </div>
      </div>
    </Card>
  );
}

// Skeleton for page header
export function PageHeaderSkeleton({ className }: SkeletonProps) {
  return (
    <div className={cn("mb-6", className)}>
      <Skeleton className="h-8 w-48 mb-2" /> {/* Title */}
      <Skeleton className="h-4 w-64" /> {/* Description */}
    </div>
  );
}

// Combined skeleton for dashboard
export function DashboardSkeleton({ className }: SkeletonProps) {
  return (
    <div className={cn("space-y-6", className)}>
      <PageHeaderSkeleton />
      
      {/* Stat cards grid */}
      <div className="grid gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>
      
      {/* Quick actions and activity */}
      <div className="grid gap-4 md:gap-6 grid-cols-1 lg:grid-cols-3">
        <Card className="lg:col-span-2 border-0 shadow-md">
          <CardHeader>
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-48" />
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-0 shadow-md">
          <CardHeader>
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-24" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-start space-x-3">
                  <Skeleton className="h-6 w-6 rounded-lg" />
                  <div className="flex-1 space-y-1">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}