"use client";

import { ReactNode, useState } from "react";
import { Header } from "./header";
import { Sidebar } from "./sidebar";
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

  return (
    <div className="min-h-screen bg-bg">
      <Header
        user={user}
        showMenuButton={showSidebar}
        onMenuClick={() => setSidebarOpen(!sidebarOpen)}
      />
      
      <div className="flex h-[calc(100vh-3.5rem)]">
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
                  className="fixed inset-0 z-40 bg-surface/80 backdrop-blur-sm lg:hidden"
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

        <main id="main-content" className="flex-1 overflow-y-auto bg-surface">
          <div className="page-container">{children}</div>
        </main>
      </div>
    </div>
  );
}