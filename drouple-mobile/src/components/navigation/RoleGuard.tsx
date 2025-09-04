/**
 * Role-Based Access Control Guard
 * Protects screens and components based on user roles
 * Provides fallback UI for unauthorized access
 */

import React, { ReactNode } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button, Card } from 'react-native-paper';

import { useAuthStore } from '@/lib/store/authStore';
import { UserRole, ROLE_HIERARCHY } from '@/types/auth';
import { colors } from '@/theme/colors';

export interface RoleGuardProps {
  children: ReactNode;
  requiredRole?: UserRole;
  requiredRoles?: UserRole[];
  requireAll?: boolean; // If true, user must have ALL roles. If false, user needs ANY role
  fallback?: ReactNode;
  showFallback?: boolean;
  onUnauthorized?: () => void;
}

export const RoleGuard: React.FC<RoleGuardProps> = ({
  children,
  requiredRole,
  requiredRoles,
  requireAll = false,
  fallback,
  showFallback = true,
  onUnauthorized,
}) => {
  const user = useAuthStore(state => state.user);
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);

  // If not authenticated, don't show content
  if (!isAuthenticated || !user) {
    if (onUnauthorized) {
      onUnauthorized();
    }

    return showFallback
      ? fallback || (
          <UnauthorizedFallback message='Please sign in to access this content' />
        )
      : null;
  }

  // Check role requirements
  const hasRequiredAccess = checkRoleAccess(
    user.roles,
    requiredRole,
    requiredRoles,
    requireAll
  );

  if (!hasRequiredAccess) {
    if (onUnauthorized) {
      onUnauthorized();
    }

    return showFallback
      ? fallback || (
          <UnauthorizedFallback
            message="You don't have permission to access this content"
            userRole={user.roles[0]}
            requiredRole={requiredRole}
            requiredRoles={requiredRoles}
          />
        )
      : null;
  }

  return <>{children}</>;
};

/**
 * Hook to check if current user has required role access
 */
export const useRoleCheck = () => {
  const user = useAuthStore(state => state.user);
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);

  const hasRole = (role: UserRole): boolean => {
    if (!isAuthenticated || !user) return false;
    return user.roles.includes(role);
  };

  const hasAnyRole = (roles: UserRole[]): boolean => {
    if (!isAuthenticated || !user) return false;
    return roles.some(role => user.roles.includes(role));
  };

  const hasAllRoles = (roles: UserRole[]): boolean => {
    if (!isAuthenticated || !user) return false;
    return roles.every(role => user.roles.includes(role));
  };

  const hasMinimumRole = (minRole: UserRole): boolean => {
    if (!isAuthenticated || !user) return false;

    const minHierarchy = ROLE_HIERARCHY[minRole];
    return user.roles.some(role => ROLE_HIERARCHY[role] >= minHierarchy);
  };

  const canAccessAdmin = (): boolean => {
    return hasMinimumRole('ADMIN');
  };

  const canAccessVip = (): boolean => {
    return hasMinimumRole('VIP');
  };

  const canAccessLeader = (): boolean => {
    return hasMinimumRole('LEADER');
  };

  const checkAccess = (
    requiredRole?: UserRole,
    requiredRoles?: UserRole[],
    requireAll: boolean = false
  ): boolean => {
    return checkRoleAccess(
      user?.roles || [],
      requiredRole,
      requiredRoles,
      requireAll
    );
  };

  return {
    user,
    isAuthenticated,
    hasRole,
    hasAnyRole,
    hasAllRoles,
    hasMinimumRole,
    canAccessAdmin,
    canAccessVip,
    canAccessLeader,
    checkAccess,
  };
};

/**
 * Higher-order component for role-based protection
 */
export const withRoleGuard = <P extends object>(
  Component: React.ComponentType<P>,
  roleGuardProps: Omit<RoleGuardProps, 'children'>
) => {
  return (props: P) => (
    <RoleGuard {...roleGuardProps}>
      <Component {...props} />
    </RoleGuard>
  );
};

/**
 * Check if user roles meet access requirements
 */
const checkRoleAccess = (
  userRoles: UserRole[],
  requiredRole?: UserRole,
  requiredRoles?: UserRole[],
  requireAll: boolean = false
): boolean => {
  // If no requirements specified, allow access
  if (!requiredRole && (!requiredRoles || requiredRoles.length === 0)) {
    return true;
  }

  // Check single role requirement
  if (requiredRole) {
    const requiredHierarchy = ROLE_HIERARCHY[requiredRole];
    const hasMinimumRole = userRoles.some(
      role => ROLE_HIERARCHY[role] >= requiredHierarchy
    );

    if (!hasMinimumRole) {
      return false;
    }
  }

  // Check multiple role requirements
  if (requiredRoles && requiredRoles.length > 0) {
    if (requireAll) {
      // User must have ALL required roles (or higher)
      return requiredRoles.every(role => {
        const requiredHierarchy = ROLE_HIERARCHY[role];
        return userRoles.some(
          userRole => ROLE_HIERARCHY[userRole] >= requiredHierarchy
        );
      });
    } else {
      // User must have ANY of the required roles (or higher)
      return requiredRoles.some(role => {
        const requiredHierarchy = ROLE_HIERARCHY[role];
        return userRoles.some(
          userRole => ROLE_HIERARCHY[userRole] >= requiredHierarchy
        );
      });
    }
  }

  return true;
};

/**
 * Unauthorized access fallback component
 */
const UnauthorizedFallback: React.FC<{
  message: string;
  userRole?: UserRole;
  requiredRole?: UserRole;
  requiredRoles?: UserRole[];
}> = ({ message, userRole, requiredRole, requiredRoles }) => {
  const handleContactAdmin = () => {
    // Could open email or navigate to contact screen
    console.log('Contact admin requested');
  };

  return (
    <View style={styles.fallbackContainer}>
      <Card style={styles.fallbackCard}>
        <Card.Content>
          <Text variant='headlineSmall' style={styles.fallbackTitle}>
            Access Restricted
          </Text>

          <Text variant='bodyLarge' style={styles.fallbackMessage}>
            {message}
          </Text>

          {userRole && (requiredRole || requiredRoles) && (
            <View style={styles.roleInfo}>
              <Text variant='bodyMedium' style={styles.roleText}>
                Your role: <Text style={styles.roleBold}>{userRole}</Text>
              </Text>

              {requiredRole && (
                <Text variant='bodyMedium' style={styles.roleText}>
                  Required: <Text style={styles.roleBold}>{requiredRole}</Text>{' '}
                  or higher
                </Text>
              )}

              {requiredRoles && (
                <Text variant='bodyMedium' style={styles.roleText}>
                  Required:{' '}
                  <Text style={styles.roleBold}>
                    {requiredRoles.join(' or ')}
                  </Text>
                </Text>
              )}
            </View>
          )}

          <Button
            mode='outlined'
            onPress={handleContactAdmin}
            style={styles.contactButton}
          >
            Contact Administrator
          </Button>
        </Card.Content>
      </Card>
    </View>
  );
};

const styles = StyleSheet.create({
  fallbackContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: colors.background.main,
  },
  fallbackCard: {
    width: '100%',
    maxWidth: 400,
    elevation: 4,
  },
  fallbackTitle: {
    textAlign: 'center',
    color: colors.error.main,
    marginBottom: 16,
  },
  fallbackMessage: {
    textAlign: 'center',
    color: colors.text.primary,
    marginBottom: 20,
  },
  roleInfo: {
    backgroundColor: colors.background.paper,
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: colors.warning.main,
  },
  roleText: {
    color: colors.text.secondary,
    marginBottom: 4,
  },
  roleBold: {
    fontWeight: '600',
    color: colors.text.primary,
  },
  contactButton: {
    marginTop: 8,
  },
});

export default RoleGuard;
