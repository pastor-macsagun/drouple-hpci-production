import Link from "next/link";
import { Button } from "@/components/ui/button";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/rbac";
import { UserRole } from "@prisma/client";

export default async function HomePage() {
  const user = await getCurrentUser();
  
  // Redirect based on user role
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
  
  // Show landing page for non-authenticated users
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="max-w-md text-center">
        <h1 className="mb-4 text-4xl font-bold">HPCI ChMS</h1>
        <p className="mb-8 text-muted-foreground">
          Church Management System
        </p>
        <div className="flex gap-4 justify-center">
          <Button asChild>
            <Link href="/auth/signin">Sign In</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/dashboard">Dashboard</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}