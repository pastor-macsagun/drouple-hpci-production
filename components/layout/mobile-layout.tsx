"use client";

import { ReactNode } from "react";
import { UserRole } from "@prisma/client";
import { NavigationLoader } from "../navigation/navigation-loader";
import { ServiceWorkerRegistration } from "../pwa/service-worker-registration";
import { NotificationBanner } from "../notifications/notification-banner";
import { InstallPrompt } from "../pwa/install-prompt";
import { OfflineIndicator } from "../offline/offline-indicator";
import { MobileHeader } from "./mobile-header";
import { MobileNavigation } from "./mobile-navigation";

interface MobileLayoutProps {
  children: ReactNode;
  user?: {
    email?: string | null;
    name?: string | null;
    role?: UserRole;
  };
}

export function MobileLayout({ children, user }: MobileLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col bg-bg">
      <NavigationLoader />
      <ServiceWorkerRegistration />
      <NotificationBanner />
      <InstallPrompt />
      
      <MobileHeader user={user} />
      
      <main id="main-content" className="flex-1 overflow-y-auto bg-surface">
        <div className="p-4">{children}</div>
      </main>
      
      <MobileNavigation user={user} />
      <OfflineIndicator />
    </div>
  );
}