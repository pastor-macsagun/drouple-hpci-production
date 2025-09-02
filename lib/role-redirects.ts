import { UserRole } from "@prisma/client";

/**
 * Maps user roles to their appropriate dashboard URLs
 * Used for post-authentication redirects to ensure users land on the correct dashboard
 * 
 * @param role - The user's role from the session
 * @returns The appropriate dashboard URL for the user's role
 */
export function getRoleBasedRedirectUrl(role: UserRole): string {
  switch (role) {
    case "SUPER_ADMIN":
      return "/super";
    case "PASTOR":
    case "ADMIN":
      return "/admin";
    case "VIP":
      return "/vip";
    case "LEADER":
      return "/leader";
    case "MEMBER":
      return "/dashboard";
    default:
      // Fallback for any unexpected roles
      return "/dashboard";
  }
}

/**
 * Determines the appropriate redirect URL after successful authentication
 * Prioritizes explicit callback URLs over role-based defaults
 * 
 * @param role - The user's role from the session
 * @param callbackUrl - Optional callback URL from the authentication flow
 * @returns The URL to redirect to after authentication
 */
export function getPostAuthRedirectUrl(role: UserRole, callbackUrl?: string | null): string {
  // If there's a specific callback URL and it's not just the home page, use it
  if (callbackUrl && callbackUrl !== "/" && callbackUrl !== "") {
    return callbackUrl;
  }
  
  // Otherwise, redirect based on role
  return getRoleBasedRedirectUrl(role);
}