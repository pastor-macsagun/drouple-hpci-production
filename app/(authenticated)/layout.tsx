import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/rbac";
import { AppLayout } from "@/components/layout/app-layout";

export default async function AuthenticatedLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth/signin");
  }

  return (
    <AppLayout user={{
      email: user.email,
      name: user.name,
      role: user.role,
    }}>
      {children}
    </AppLayout>
  );
}