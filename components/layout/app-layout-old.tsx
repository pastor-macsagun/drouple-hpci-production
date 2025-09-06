"use client";

import { ReactNode, useState, useEffect } from "react";
import { Header } from "./header";
import { Sidebar } from "./sidebar";
import { MobileLayout } from "./mobile-layout";
import { NavigationLoader } from "../navigation/navigation-loader";
import { InstallPrompt } from "../pwa/install-prompt";
import { ServiceWorkerRegistration } from "../pwa/service-worker-registration";
import { NotificationBanner } from "../notifications/notification-banner";
import { OfflineIndicator } from "../offline/offline-indicator";
import { UserRole } from "@prisma/client";

interface AppLayoutProps {
  children: ReactNode;
  user?: {
    email?: string | null;
    name?: string | null;
    role?: UserRole;
  };
  showSidebar?: boolean;
}

export function AppLayout({ children, user, showSidebar = true }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isPWAInstalled, setIsPWAInstalled] = useState(false);

  // Check if app is installed as PWA
  useEffect(() => {
    const checkPWAStatus = () => {
      if (typeof window === 'undefined') return;
      
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      const isInWebAppiOS = (window.navigator as { standalone?: boolean }).standalone === true;
      setIsPWAInstalled(isStandalone || isInWebAppiOS);
    };

    checkPWAStatus();
    
    // Listen for changes in display mode
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    mediaQuery.addListener(checkPWAStatus);
    
    return () => mediaQuery.removeListener(checkPWAStatus);
  }, []);

  // Use mobile layout when installed as PWA
  if (isPWAInstalled) {
    return <MobileLayout user={user}>{children}</MobileLayout>;
  }

  return (
    <div className="flex min-h-screen flex-col bg-bg">
      <NavigationLoader />
      <ServiceWorkerRegistration />
      <NotificationBanner />
      <InstallPrompt />
      <div className="flex flex-1">
        {showSidebar && (
          <>
            {/* Desktop sidebar */}
            <div className="hidden lg:block">
              <Sidebar user={user} />
            </div>

            {/* Mobile sidebar overlay */}
            {sidebarOpen && (
              <>
                <div
                  className="fixed inset-0 z-40 bg-ink/80 backdrop-blur-sm lg:hidden"
                  onClick={() => setSidebarOpen(false)}
                />
                <div className="fixed inset-y-0 left-0 z-50 lg:hidden">
                  <Sidebar
                    user={user}
                    className="h-full shadow-lg"
                    onClose={() => setSidebarOpen(false)}
                  />
                </div>
              </>
            )}
          </>
        )}

        <div className="flex flex-1 flex-col">
          <Header
            user={user}
            showMenuButton={showSidebar}
            sidebarOpen={sidebarOpen}
            onMenuClick={() => setSidebarOpen(!sidebarOpen)}
          />
          <main id="main-content" className="flex-1 overflow-y-auto bg-surface">
            <div className="page-container">{children}</div>
          </main>
        </div>
      </div>
      <OfflineIndicator />
    </div>
  );
}