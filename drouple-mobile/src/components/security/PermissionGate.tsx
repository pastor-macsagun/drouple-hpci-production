/**
 * Permission Gate Component
 * Conditionally renders content based on user permissions
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Surface } from 'react-native-paper';

import { useAuthStore } from '@/lib/store/authStore';
import {
  Permission,
  Role,
  hasPermission,
  hasAnyPermission,
  isRoleHigherOrEqual,
} from '@/lib/security/permissions';
import { colors } from '@/theme/colors';

interface PermissionGateProps {
  children: React.ReactNode;

  // Permission-based access
  permission?: Permission;
  permissions?: Permission[];
  requireAll?: boolean; // If true, user must have ALL permissions. If false, ANY permission.

  // Role-based access
  role?: Role;
  roles?: Role[];
  minRole?: Role; // User must have this role or higher

  // Fallback content
  fallback?: React.ReactNode;
  showFallback?: boolean; // Show fallback UI instead of null

  // Custom validation
  customValidation?: (user: any) => boolean;
}

export const PermissionGate: React.FC<PermissionGateProps> = ({
  children,
  permission,
  permissions,
  requireAll = false,
  role,
  roles,
  minRole,
  fallback,
  showFallback = false,
  customValidation,
}) => {
  const { user } = useAuthStore();

  // User must be authenticated
  if (!user || !user.role) {
    return showFallback
      ? fallback || (
          <UnauthorizedFallback message='Please log in to access this content.' />
        )
      : null;
  }

  const userRole = user.role as Role;
  let hasAccess = true;

  // Check single permission
  if (permission && !hasPermission(userRole, permission)) {
    hasAccess = false;
  }

  // Check multiple permissions
  if (permissions && permissions.length > 0) {
    if (requireAll) {
      // User must have ALL permissions
      if (!permissions.every(perm => hasPermission(userRole, perm))) {
        hasAccess = false;
      }
    } else {
      // User must have ANY permission
      if (!hasAnyPermission(userRole, permissions)) {
        hasAccess = false;
      }
    }
  }

  // Check single role
  if (role && userRole !== role) {
    hasAccess = false;
  }

  // Check multiple roles
  if (roles && roles.length > 0 && !roles.includes(userRole)) {
    hasAccess = false;
  }

  // Check minimum role requirement
  if (minRole && !isRoleHigherOrEqual(userRole, minRole)) {
    hasAccess = false;
  }

  // Check custom validation
  if (customValidation && !customValidation(user)) {
    hasAccess = false;
  }

  if (!hasAccess) {
    return showFallback
      ? fallback || (
          <UnauthorizedFallback message="You don't have permission to access this content." />
        )
      : null;
  }

  return <>{children}</>;
};

// Default fallback component for unauthorized access
const UnauthorizedFallback: React.FC<{ message: string }> = ({ message }) => (
  <Surface style={styles.fallbackContainer} elevation={0}>
    <View style={styles.fallbackContent}>
      <Text variant='bodyMedium' style={styles.fallbackMessage}>
        {message}
      </Text>
    </View>
  </Surface>
);

// Convenience components for common permission checks
export const AdminOnly: React.FC<{
  children: React.ReactNode;
  fallback?: React.ReactNode;
}> = ({ children, fallback }) => (
  <PermissionGate
    minRole={Role.ADMIN}
    fallback={fallback}
    showFallback={!!fallback}
  >
    {children}
  </PermissionGate>
);

export const LeaderOnly: React.FC<{
  children: React.ReactNode;
  fallback?: React.ReactNode;
}> = ({ children, fallback }) => (
  <PermissionGate
    minRole={Role.LEADER}
    fallback={fallback}
    showFallback={!!fallback}
  >
    {children}
  </PermissionGate>
);

export const VIPOnly: React.FC<{
  children: React.ReactNode;
  fallback?: React.ReactNode;
}> = ({ children, fallback }) => (
  <PermissionGate
    minRole={Role.VIP}
    fallback={fallback}
    showFallback={!!fallback}
  >
    {children}
  </PermissionGate>
);

export const MemberOnly: React.FC<{
  children: React.ReactNode;
  fallback?: React.ReactNode;
}> = ({ children, fallback }) => (
  <PermissionGate
    minRole={Role.MEMBER}
    fallback={fallback}
    showFallback={!!fallback}
  >
    {children}
  </PermissionGate>
);

// Hook for permission checking in components
export const usePermissions = () => {
  const { user } = useAuthStore();

  const checkPermission = (permission: Permission): boolean => {
    if (!user?.role) return false;
    return hasPermission(user.role as Role, permission);
  };

  const checkAnyPermission = (permissions: Permission[]): boolean => {
    if (!user?.role) return false;
    return hasAnyPermission(user.role as Role, permissions);
  };

  const checkRole = (role: Role): boolean => {
    return user?.role === role;
  };

  const checkMinRole = (minRole: Role): boolean => {
    if (!user?.role) return false;
    return isRoleHigherOrEqual(user.role as Role, minRole);
  };

  return {
    user,
    userRole: user?.role as Role | undefined,
    checkPermission,
    checkAnyPermission,
    checkRole,
    checkMinRole,
    isAuthenticated: !!user,
    isAdmin: checkMinRole(Role.ADMIN),
    isLeader: checkMinRole(Role.LEADER),
    isVIP: checkMinRole(Role.VIP),
    isMember: checkMinRole(Role.MEMBER),
  };
};

const styles = StyleSheet.create({
  fallbackContainer: {
    padding: 16,
    margin: 8,
    borderRadius: 8,
    backgroundColor: colors.surface.variant,
    borderWidth: 1,
    borderColor: colors.outline,
  },
  fallbackContent: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 60,
  },
  fallbackMessage: {
    color: colors.text.secondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default PermissionGate;
