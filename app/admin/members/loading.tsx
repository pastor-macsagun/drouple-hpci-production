import { AppLayout } from "@/components/layout/app-layout"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { TableSkeleton, MobileTableSkeleton } from "@/components/patterns/loading-skeletons"

export default function AdminMembersLoading() {
  return (
    <AppLayout user={undefined}>
      <div className="container py-8">
        {/* Page header skeleton */}
        <div className="mb-6">
          <Skeleton className="h-9 w-64 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>

        {/* Action buttons skeleton */}
        <div className="flex flex-wrap gap-4 mb-6">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-28" />
          <Skeleton className="h-10 w-24" />
        </div>

        {/* Search and filters skeleton */}
        <Card className="mb-6">
          <CardHeader>
            <Skeleton className="h-5 w-32" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Skeleton className="h-10 w-full" /> {/* Search */}
              <Skeleton className="h-10 w-full" /> {/* Role filter */}
              <Skeleton className="h-10 w-full" /> {/* Church filter */}
              <Skeleton className="h-10 w-full" /> {/* Status filter */}
            </div>
            <div className="flex justify-end">
              <Skeleton className="h-9 w-20" /> {/* Clear filters */}
            </div>
          </CardContent>
        </Card>

        {/* Members table skeleton */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <Skeleton className="h-6 w-32 mb-1" />
                <Skeleton className="h-4 w-48" />
              </div>
              <Skeleton className="h-10 w-24" /> {/* Export button */}
            </div>
          </CardHeader>
          <CardContent>
            {/* Desktop table */}
            <div className="hidden md:block">
              <TableSkeleton columns={6} rows={10} />
            </div>
            
            {/* Mobile cards */}
            <MobileTableSkeleton items={10} />
            
            {/* Pagination skeleton */}
            <div className="flex justify-between items-center mt-6 pt-4 border-t">
              <Skeleton className="h-4 w-32" />
              <div className="flex gap-2">
                <Skeleton className="h-9 w-20" />
                <Skeleton className="h-9 w-20" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}