import { AppLayout } from "@/components/layout/app-layout"
import { PageHeader } from "@/components/layout/page-header"
import { Skeleton } from "@/components/ui/skeleton"
import { EventLoadingCard } from "@/components/patterns/loading-card"

export default function EventsLoading() {
  return (
    <AppLayout user={undefined}>
      <PageHeader 
        title="Events" 
        description="Browse and RSVP for upcoming events"
      >
        <Skeleton className="h-10 w-32" />
      </PageHeader>

      <div className="card-grid">
        {Array.from({ length: 6 }).map((_, i) => (
          <EventLoadingCard key={i} />
        ))}
      </div>
    </AppLayout>
  )
}