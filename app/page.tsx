import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/rbac";
import { UserRole } from "@prisma/client";
import { Metadata } from "next";
import LandingPage from "./public-landing";
import SplashScreen from "@/components/splash-screen";
import { unstable_noStore as noStore } from 'next/cache';
import { BRAND_CONFIG } from "@/config/brand";

export const metadata: Metadata = {
  title: BRAND_CONFIG.name,
  description: BRAND_CONFIG.description,
  openGraph: {
    title: BRAND_CONFIG.name,
    description: BRAND_CONFIG.description,
    type: "website",
  },
};

export default async function HomePage() {
  noStore(); // Opt out of static generation for role-based routing
  const user = await getCurrentUser();
  
  return (
    <>
      {/* Splash screen - only shows for PWA mode */}
      <SplashScreen user={user} />
      
      {/* Landing page and redirects for web mode */}
      <WebHomePage user={user} />
    </>
  );
}

function WebHomePage({ user }: { user: { id: string; role: UserRole } | null }) {
  // For web users (non-PWA), handle redirects and show landing page
  if (user) {
    switch (user.role) {
      case UserRole.SUPER_ADMIN:
        redirect("/super");
      case UserRole.ADMIN:
      case UserRole.PASTOR:
        redirect("/admin");
      case UserRole.VIP:
        redirect("/vip");
      case UserRole.LEADER:
        redirect("/leader");
      case UserRole.MEMBER:
      default:
        redirect("/dashboard");
    }
  }
  
  // Show public landing page for non-authenticated web users
  return <LandingPage />;
}