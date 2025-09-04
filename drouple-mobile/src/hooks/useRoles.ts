/**
 * Role Detection System
 * React hooks for role-based access control and user permissions
 * Provides convenient access to user roles and permission checking
 */

import React, { useMemo } from 'react';
import { useAuthStore } from '@/lib/store/authStore';
import type { UserRole, RolePermissions } from '@/types/auth';
import { ROLE_HIERARCHY } from '@/types/auth';

// Hook for basic role checking
export const useRoles = () => {
  const { user, isAuthenticated } = useAuthStore();

  const roles = useMemo(() => {
    return user?.roles || [];
  }, [user?.roles]);

  const hasRole = (role: UserRole): boolean => {
    return roles.includes(role);
  };

  const hasMinRole = (minRole: UserRole): boolean => {
    if (!roles.length) return false;

    const minHierarchy = ROLE_HIERARCHY[minRole];
    return roles.some(role => ROLE_HIERARCHY[role] >= minHierarchy);
  };

  const hasAnyRole = (targetRoles: UserRole[]): boolean => {
    return targetRoles.some(role => hasRole(role));
  };

  const hasAllRoles = (targetRoles: UserRole[]): boolean => {
    return targetRoles.every(role => hasRole(role));
  };

  const getHighestRole = (): UserRole | null => {
    if (!roles.length) return null;

    return roles.reduce((highest, current) => {
      return ROLE_HIERARCHY[current] > ROLE_HIERARCHY[highest]
        ? current
        : highest;
    });
  };

  const getRoleHierarchyLevel = (role?: UserRole): number => {
    if (!role) {
      const highestRole = getHighestRole();
      return highestRole ? ROLE_HIERARCHY[highestRole] : 0;
    }
    return ROLE_HIERARCHY[role];
  };

  return {
    roles,
    isAuthenticated,
    hasRole,
    hasMinRole,
    hasAnyRole,
    hasAllRoles,
    getHighestRole,
    getRoleHierarchyLevel,
    user,
  };
};

// Hook for specific permission checking
export const usePermissions = (): RolePermissions & { isLoading: boolean } => {
  const { user, isAuthenticated, isLoading } = useAuthStore();
  const { hasMinRole, hasRole, hasAnyRole } = useRoles();

  const permissions = useMemo((): RolePermissions => {
    if (!isAuthenticated || !user) {
      return {
        canManageUsers: false,
        canViewReports: false,
        canManageEvents: false,
        canManageGroups: false,
        canViewDirectory: false,
        canAccessAdmin: false,
      };
    }

    const canManageUsers = hasMinRole('ADMIN');
    const canViewReports = hasMinRole('LEADER');
    const canManageEvents = hasMinRole('LEADER');
    const canManageGroups = hasMinRole('LEADER');
    const canViewDirectory = hasMinRole('VIP');
    const canAccessAdmin = hasMinRole('ADMIN');

    return {
      canManageUsers,
      canViewReports,
      canManageEvents,
      canManageGroups,
      canViewDirectory,
      canAccessAdmin,
    };
  }, [isAuthenticated, user, hasMinRole]);

  return {
    ...permissions,
    isLoading,
  };
};

// Hook for admin access checking
export const useAdminAccess = () => {
  const { hasMinRole, user, isAuthenticated } = useRoles();
  const { canAccessAdmin } = usePermissions();

  const canAccessSuperAdmin = hasMinRole('SUPER_ADMIN');
  const canAccessChurchAdmin = hasMinRole('ADMIN');
  const canAccessVipDashboard = hasMinRole('VIP');
  const canAccessLeaderDashboard = hasMinRole('LEADER');

  const adminLevel = useMemo(() => {
    if (!isAuthenticated) return null;

    if (canAccessSuperAdmin) return 'super_admin';
    if (canAccessChurchAdmin) return 'admin';
    if (canAccessVipDashboard) return 'vip';
    if (canAccessLeaderDashboard) return 'leader';

    return 'member';
  }, [
    isAuthenticated,
    canAccessSuperAdmin,
    canAccessChurchAdmin,
    canAccessVipDashboard,
    canAccessLeaderDashboard,
  ]);

  const getDefaultRoute = (): string => {
    switch (adminLevel) {
      case 'super_admin':
        return '/super';
      case 'admin':
        return '/admin';
      case 'vip':
        return '/vip';
      case 'leader':
        return '/leader';
      default:
        return '/dashboard';
    }
  };

  return {
    canAccessAdmin,
    canAccessSuperAdmin,
    canAccessChurchAdmin,
    canAccessVipDashboard,
    canAccessLeaderDashboard,
    adminLevel,
    getDefaultRoute,
    user,
    isAuthenticated,
  };
};

// Hook for feature access based on roles
export const useFeatureAccess = () => {
  const { hasRole, hasMinRole, hasAnyRole } = useRoles();
  const permissions = usePermissions();

  const features = useMemo(
    () => ({
      // Core Features
      checkin: true, // All authenticated users can check in
      events: true, // All users can view events
      pathways: true, // All users can access pathways
      directory: permissions.canViewDirectory, // VIP and above

      // Management Features
      manageMembers: permissions.canManageUsers, // ADMIN and above
      manageEvents: permissions.canManageEvents, // LEADER and above
      manageGroups: permissions.canManageGroups, // LEADER and above

      // Reporting Features
      viewReports: permissions.canViewReports, // LEADER and above
      exportData: hasMinRole('ADMIN'), // ADMIN and above

      // VIP Features
      manageFirstTimers: hasMinRole('VIP'), // VIP and above
      viewMemberDetails: hasMinRole('VIP'), // VIP and above

      // Super Admin Features
      manageTenants: hasRole('SUPER_ADMIN'), // SUPER_ADMIN only
      systemSettings: hasRole('SUPER_ADMIN'), // SUPER_ADMIN only

      // Special Features
      biometricAuth: true, // All users can use biometric auth
      pushNotifications: true, // All users can receive notifications
    }),
    [hasRole, hasMinRole, permissions]
  );

  const canAccessFeature = (feature: keyof typeof features): boolean => {
    return features[feature];
  };

  const getAccessibleFeatures = (): (keyof typeof features)[] => {
    return Object.entries(features)
      .filter(([, canAccess]) => canAccess)
      .map(([feature]) => feature as keyof typeof features);
  };

  return {
    features,
    canAccessFeature,
    getAccessibleFeatures,
  };
};

// Hook for conditional rendering based on roles
export const useRoleBasedContent = () => {
  const { hasRole, hasMinRole, hasAnyRole, user } = useRoles();

  const RoleGuard = ({
    roles,
    minRole,
    anyRole,
    children,
    fallback = null,
  }: {
    roles?: UserRole[];
    minRole?: UserRole;
    anyRole?: UserRole[];
    children: React.ReactNode;
    fallback?: React.ReactNode;
  }) => {
    let hasAccess = false;

    if (roles) {
      hasAccess = roles.every(role => hasRole(role));
    } else if (minRole) {
      hasAccess = hasMinRole(minRole);
    } else if (anyRole) {
      hasAccess = hasAnyRole(anyRole);
    }

    return hasAccess
      ? (children as React.ReactElement)
      : (fallback as React.ReactElement);
  };

  return {
    RoleGuard,
    user,
    hasRole,
    hasMinRole,
    hasAnyRole,
  };
};

// Export all hooks as default
export default {
  useRoles,
  usePermissions,
  useAdminAccess,
  useFeatureAccess,
  useRoleBasedContent,
};
