export const dynamic = 'force-dynamic'

import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { getCurrentUser } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { AppLayout } from "@/components/layout/app-layout";
import { verifyPassword, hashPassword } from "@/lib/password";
import { MemberStatus } from "@prisma/client";

export default async function ProfilePage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth/signin");
  }

  async function updateProfile(formData: FormData) {
    "use server";
    
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      throw new Error("Unauthorized");
    }

    const name = formData.get("name") as string;
    
    await prisma.user.update({
      where: { id: currentUser.id },
      data: { name },
    });

    revalidatePath("/profile");
  }

  async function changePasswordAction(formData: FormData) {
    "use server";
    
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      throw new Error("Unauthorized");
    }

    const currentPassword = formData.get("currentPassword") as string;
    const newPassword = formData.get("newPassword") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    if (newPassword !== confirmPassword) {
      throw new Error("Passwords do not match");
    }

    if (newPassword.length < 8) {
      throw new Error("Password must be at least 8 characters");
    }

    // Get user with password hash
    const userWithPassword = await prisma.user.findUnique({
      where: { id: currentUser.id },
      select: { passwordHash: true, memberStatus: true }
    });

    if (!userWithPassword?.passwordHash) {
      throw new Error("User not found");
    }

    // Verify current password
    const isValid = await verifyPassword(currentPassword, userWithPassword.passwordHash);
    if (!isValid) {
      throw new Error("Current password is incorrect");
    }

    // Hash and update new password
    const newPasswordHash = await hashPassword(newPassword);
    await prisma.user.update({
      where: { id: currentUser.id },
      data: { 
        passwordHash: newPasswordHash,
        mustChangePassword: false,
        memberStatus: userWithPassword.memberStatus === MemberStatus.PENDING 
          ? MemberStatus.ACTIVE 
          : userWithPassword.memberStatus
      }
    });

    revalidatePath("/profile");
  }

  return (
    <AppLayout user={user}>
      <div className="min-h-screen p-8">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Profile</h1>
            <p className="text-muted-foreground">Manage your account settings</p>
          </div>

          <div className="grid gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>Update your profile details</CardDescription>
              </CardHeader>
              <CardContent>
                <form action={updateProfile} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={user.email}
                    disabled
                    className="bg-muted"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    defaultValue={user.name || ""}
                    placeholder="Enter your name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Global Role</Label>
                  <Input
                    id="role"
                    type="text"
                    value={user.role}
                    disabled
                    className="bg-muted"
                  />
                </div>
                <Button type="submit">Save Changes</Button>
                </form>
              </CardContent>
            </Card>

          {user.memberships.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Church Memberships</CardTitle>
                <CardDescription>Your church affiliations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {user.memberships.map((membership) => (
                    <div
                      key={membership.id}
                      className="border rounded-lg p-3 space-y-1"
                    >
                      <div className="font-medium">{membership.localChurch.name}</div>
                      <div className="text-sm text-muted-foreground">
                        Role: {membership.role}
                      </div>
                      {membership.localChurch.address && (
                        <div className="text-sm text-muted-foreground">
                          {membership.localChurch.address}, {membership.localChurch.city}
                        </div>
                      )}
                      <div className="text-sm text-muted-foreground">
                        Joined: {new Date(membership.joinedAt).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
              <CardDescription>Update your account password</CardDescription>
            </CardHeader>
            <CardContent>
              <form action={changePasswordAction} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <Input
                    id="currentPassword"
                    name="currentPassword"
                    type="password"
                    required
                    placeholder="Enter current password"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    name="newPassword"
                    type="password"
                    required
                    minLength={8}
                    placeholder="Enter new password (min 8 characters)"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    required
                    placeholder="Confirm new password"
                  />
                </div>
                <Button type="submit">Change Password</Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Account Details</CardTitle>
              <CardDescription>Technical information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div>
                <span className="font-medium">User ID:</span> {user.id}
              </div>
              <div>
                <span className="font-medium">Email Verified:</span>{" "}
                {user.emailVerified ? "Yes" : "No"}
              </div>
              <div>
                <span className="font-medium">Account Created:</span>{" "}
                {new Date(user.createdAt).toLocaleDateString()}
              </div>
              <div>
                <span className="font-medium">Last Updated:</span>{" "}
                {new Date(user.updatedAt).toLocaleDateString()}
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link href="/dashboard">Back to Dashboard</Link>
            </Button>
          </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}