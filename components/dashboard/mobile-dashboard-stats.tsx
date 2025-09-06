"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserCheck, Calendar, Users, Route } from "lucide-react";

interface MobileDashboardStatsProps {
  stats?: {
    todayCheckins?: number;
    upcomingEvents?: number;
    activeLifeGroups?: number;
    pathwaysProgress?: number;
  };
}

export function MobileDashboardStats({ stats }: MobileDashboardStatsProps) {
  const statCards = [
    {
      title: "Today's Check-ins",
      value: stats?.todayCheckins || 0,
      icon: UserCheck,
      color: "text-green-600",
      bgColor: "bg-green-50 dark:bg-green-950",
    },
    {
      title: "Upcoming Events",
      value: stats?.upcomingEvents || 0,
      icon: Calendar,
      color: "text-blue-600",
      bgColor: "bg-blue-50 dark:bg-blue-950",
    },
    {
      title: "Active Groups",
      value: stats?.activeLifeGroups || 0,
      icon: Users,
      color: "text-purple-600",
      bgColor: "bg-purple-50 dark:bg-purple-950",
    },
    {
      title: "Pathway Progress",
      value: stats?.pathwaysProgress || 0,
      icon: Route,
      color: "text-orange-600",
      bgColor: "bg-orange-50 dark:bg-orange-950",
      suffix: "%",
    },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className="bg-elevated border-border">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                    <Icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-ink-muted truncate">
                      {stat.title}
                    </p>
                    <p className="text-lg font-bold text-ink">
                      {stat.value}{stat.suffix || ''}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
      
      <Card className="bg-elevated border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Link
            href="/checkin"
            className="flex items-center justify-between p-3 rounded-lg bg-accent/10 hover:bg-accent/20 transition-colors"
          >
            <div className="flex items-center space-x-3">
              <UserCheck className="h-5 w-5 text-accent" />
              <span className="font-medium text-accent">Sunday Check-In</span>
            </div>
            <span className="text-xs text-accent">→</span>
          </Link>
          
          <Link
            href="/events"
            className="flex items-center justify-between p-3 rounded-lg hover:bg-elevated/50 transition-colors"
          >
            <div className="flex items-center space-x-3">
              <Calendar className="h-5 w-5 text-ink-muted" />
              <span className="font-medium text-ink">View Events</span>
            </div>
            <span className="text-xs text-ink-muted">→</span>
          </Link>
          
          <Link
            href="/members"
            className="flex items-center justify-between p-3 rounded-lg hover:bg-elevated/50 transition-colors"
          >
            <div className="flex items-center space-x-3">
              <Users className="h-5 w-5 text-ink-muted" />
              <span className="font-medium text-ink">Member Directory</span>
            </div>
            <span className="text-xs text-ink-muted">→</span>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}