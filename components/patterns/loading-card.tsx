import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface LoadingCardProps {
  title?: string;
  description?: string;
  className?: string;
  children?: React.ReactNode;
}

export function LoadingCard({ title, description, className, children }: LoadingCardProps) {
  return (
    <Card className={cn("border-0 shadow-md", className)}>
      {(title || description) && (
        <CardHeader>
          {title && (
            <div className="text-lg font-semibold text-center text-muted-foreground">
              {title}
            </div>
          )}
          {description && (
            <div className="text-sm text-center text-muted-foreground">
              {description}
            </div>
          )}
        </CardHeader>
      )}
      <CardContent className="space-y-4">
        {children || (
          <>
            <div className="flex items-center space-x-4">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-[250px]" />
                <Skeleton className="h-4 w-[200px]" />
              </div>
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-[100px]" />
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

// Specific loading variants
export function MemberLoadingCard() {
  return (
    <LoadingCard title="Loading Members..." description="Fetching member data">
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center space-x-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1 space-y-1">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-48" />
            </div>
          </div>
        ))}
      </div>
    </LoadingCard>
  );
}

export function ServiceLoadingCard() {
  return (
    <LoadingCard title="Loading Services..." description="Fetching service information">
      <div className="space-y-4">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-16" />
          </div>
        ))}
      </div>
    </LoadingCard>
  );
}

export function EventLoadingCard() {
  return (
    <LoadingCard title="Loading Events..." description="Fetching upcoming events">
      <div className="space-y-4">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <div className="flex space-x-4">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-16" />
            </div>
            <Skeleton className="h-3 w-32" />
          </div>
        ))}
      </div>
    </LoadingCard>
  );
}