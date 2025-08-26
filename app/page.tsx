import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/rbac";
import { UserRole } from "@prisma/client";
import LandingPage from "./public-landing";

export default async function HomePage() {
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