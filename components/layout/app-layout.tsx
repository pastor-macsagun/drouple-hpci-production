"use client";

import { ReactNode, useState, useEffect } from "react";
import { Header } from "./header";
import { Sidebar } from "./sidebar";
import { NativeHeader } from "./native-header";
import { NativeNavigation } from "./native-navigation";
import { NavigationLoader } from "../navigation/navigation-loader";
import { InstallPrompt } from "../pwa/install-prompt";
import { ServiceWorkerRegistration } from "../pwa/service-worker-registration";
import { NotificationBanner } from "../notifications/notification-banner";
import { OfflineIndicator } from "../offline/offline-indicator";
import { UserRole } from "@prisma/client";
import { cn } from "@/lib/utils";
import { triggerHapticFeedback } from "@/lib/mobile-utils";

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
  const [isMobile, setIsMobile] = useState(false);

  // Check device type and PWA status
  useEffect(() => {
    const checkDeviceAndPWAStatus = () => {
      if (typeof window === 'undefined') return;
      
      // Check if mobile device
      const isMobileDevice = window.matchMedia('(max-width: 1023px)').matches;
      setIsMobile(isMobileDevice);
      
      // Check PWA status
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      const isInWebAppiOS = (window.navigator as { standalone?: boolean }).standalone === true;
      setIsPWAInstalled(isStandalone || isInWebAppiOS);
    };

    checkDeviceAndPWAStatus();
    
    // Listen for changes
    const mediaQuery = window.matchMedia('(max-width: 1023px)');
    const pwaQuery = window.matchMedia('(display-mode: standalone)');
    
    const handleChange = () => checkDeviceAndPWAStatus();
    
    mediaQuery.addEventListener('change', handleChange);
    pwaQuery.addEventListener('change', handleChange);
    
    return () => {
      mediaQuery.removeEventListener('change', handleChange);
      pwaQuery.removeEventListener('change', handleChange);
    };
  }, []);

  const handleMenuClick = () => {
    triggerHapticFeedback('tap');
    setSidebarOpen(!sidebarOpen);
  };

  const handleSidebarClose = () => {
    triggerHapticFeedback('tap');
    setSidebarOpen(false);
  };

  // Native mobile layout for small screens or PWA
  if (isMobile || isPWAInstalled) {
    return (
      <div className="flex min-h-screen-safe flex-col bg-bg relative overflow-hidden">
        <NavigationLoader />
        <ServiceWorkerRegistration />
        <NotificationBanner />
        <InstallPrompt />
        
        {/* Native Mobile Header */}
        <NativeHeader user={user} />
        
        {/* Main Content with native styling */}
        <main id="main-content" className="flex-1 overflow-y-auto bg-surface pb-safe-area-bottom">
          <div className="p-4 animate-fade-in-up">{children}</div>
        </main>
        
        {/* Native Bottom Navigation */}
        <NativeNavigation user={user} />
        
        <OfflineIndicator />
      </div>
    );
  }

  // Native desktop layout with enhanced interactions
  return (
    <div className="flex min-h-screen flex-col bg-bg native-desktop-layout">
      <NavigationLoader />
      <ServiceWorkerRegistration />
      <NotificationBanner />
      <InstallPrompt />
      
      <div className="flex flex-1 relative">
        {showSidebar && (
          <>
            {/* Enhanced Desktop sidebar */}
            <div className="hidden lg:block relative">
              <Sidebar user={user} className="native-sidebar" />
            </div>

            {/* Native Mobile sidebar overlay with backdrop blur */}
            {sidebarOpen && (
              <>
                <div
                  className={cn(
                    "fixed inset-0 z-40 lg:hidden",
                    "bg-ink/20 backdrop-blur-md",
                    "animate-[fadeInUp_0.2s_ease-out]",
                    "touch-none" // Prevent scroll behind overlay
                  )}
                  onClick={handleSidebarClose}
                />
                <div className="fixed inset-y-0 left-0 z-50 lg:hidden animate-slide-in-from-right">
                  <Sidebar
                    user={user}
                    className="h-full shadow-2xl border-r border-border/20 glass-native"
                    onClose={handleSidebarClose}
                  />
                </div>
              </>
            )}
          </>
        )}

        <div className="flex flex-1 flex-col min-w-0">
          {/* Native-enhanced Header */}
          <Header
            user={user}
            showMenuButton={showSidebar}
            sidebarOpen={sidebarOpen}
            onMenuClick={handleMenuClick}
            className="native-header"
          />
          
          {/* Native-styled Main Content */}
          <main id="main-content" className="flex-1 overflow-y-auto bg-surface relative">
            <div className={cn(
              "page-container animate-fade-in-up",
              "transition-all duration-300 ease-standard"
            )}>
              {children}
            </div>
          </main>
        </div>
      </div>
      
      <OfflineIndicator />
    </div>
  );
}

// Add responsive breakpoint styles
if (typeof document !== 'undefined') {
  const existingStyle = document.getElementById('native-layout-styles');
  if (!existingStyle) {
    const styleSheet = document.createElement('style');
    styleSheet.id = 'native-layout-styles';
    styleSheet.textContent = `
      .native-desktop-layout {
        position: relative;
      }
      
      .native-sidebar {
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
      }
      
      .native-header {
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        border-bottom: 1px solid rgb(var(--color-border) / 0.1);
      }
      
      @media (max-width: 1023px) {
        .native-desktop-layout {
          padding-top: env(safe-area-inset-top);
          padding-bottom: env(safe-area-inset-bottom);
          padding-left: env(safe-area-inset-left);
          padding-right: env(safe-area-inset-right);
        }
      }
    `;
    document.head.appendChild(styleSheet);
  }
}