import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/rbac";
import { UserRole } from "@prisma/client";
import { Metadata } from "next";
import LandingPage from "./public-landing";
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
  
  // Redirect authenticated users based on role
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
  
  // Show public landing page for non-authenticated users
  return <LandingPage />;
}