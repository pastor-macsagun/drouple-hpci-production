import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Calendar, UserCheck } from "lucide-react";

export function DashboardActivity() {
  return (
    <Card className="border-0 shadow-md">
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>Latest updates</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-start space-x-3">
            <div className="p-2 bg-primary/10 rounded-xl">
              <UserCheck className="h-3 w-3 text-primary" />
            </div>
            <div className="flex-1 space-y-1">
              <p className="text-sm font-medium">New check-in</p>
              <p className="text-xs text-ink-muted">John Doe checked in • 2 hours ago</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <div className="p-2 bg-secondary/10 rounded-xl">
              <Calendar className="h-3 w-3 text-secondary" />
            </div>
            <div className="flex-1 space-y-1">
              <p className="text-sm font-medium">Event reminder</p>
              <p className="text-xs text-ink-muted">Youth Night tomorrow • 7 PM</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <div className="p-2 bg-info/10 rounded-xl">
              <Users className="h-3 w-3 text-info" />
            </div>
            <div className="flex-1 space-y-1">
              <p className="text-sm font-medium">LifeGroup update</p>
              <p className="text-xs text-ink-muted">5 new members joined • Yesterday</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}