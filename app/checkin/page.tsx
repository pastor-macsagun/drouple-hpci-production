export const dynamic = 'force-dynamic'

import { AppLayout } from "@/components/layout/app-layout";
import { PageHeader } from "@/components/layout/page-header";
import { getCurrentUser } from "@/lib/rbac";
import { redirect } from "next/navigation";
import { getTodayService, getUserCheckin } from "./actions";
import { CheckInForm } from "./checkin-form";
import { RealtimeAttendanceList } from "./realtime-attendance-list";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "lucide-react";
import { format } from "date-fns";

export default async function CheckInPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth/signin");
  }

  const serviceResult = await getTodayService();
  const isAdmin = ['ADMIN', 'PASTOR', 'SUPER_ADMIN'].includes(user.role);

  if (!serviceResult.success || !serviceResult.data) {
    return (
      <AppLayout user={user}>
        <PageHeader 
          title="Sunday Check-In" 
          description="Check in for today's service"
        />
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <div className="flex items-center gap-2 text-ink-muted">
              <Calendar className="h-5 w-5" />
              <CardTitle>No Service Today</CardTitle>
            </div>
            <CardDescription>
              There is no service scheduled for today. Please check back on Sunday.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-ink-muted">
              Today is {format(new Date(), 'EEEE, MMMM d, yyyy')}
            </p>
          </CardContent>
        </Card>
      </AppLayout>
    );
  }

  const service = serviceResult.data;
  
  // Get user's check-in status if not admin
  let userCheckin = null;
  if (!isAdmin && user.id) {
    const checkinResult = await getUserCheckin(service.id);
    if (checkinResult.success) {
      userCheckin = checkinResult.data;
    }
  }

  return (
    <AppLayout user={user}>
      <PageHeader 
        title="Sunday Check-In" 
        description="Check in for today's service"
      />
      
      <div className="space-y-6">
        {!isAdmin && (
          <CheckInForm 
            service={service} 
            existingCheckin={userCheckin}
          />
        )}

        {isAdmin && (
          <RealtimeAttendanceList 
            serviceId={service.id}
            serviceName={`${service.localChurch.name} - ${format(new Date(service.date), 'MMMM d, yyyy')}`}
          />
        )}
      </div>
    </AppLayout>
  );
}