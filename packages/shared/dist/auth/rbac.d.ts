import { UserRole } from '../types/enums';
/**
 * Check if a user role has permission to access a resource requiring a minimum role
 */
export declare function hasPermission(userRole: UserRole, requiredRole: UserRole): boolean;
/**
 * Check if a user role has permission to access any of the required roles
 */
export declare function hasAnyPermission(userRole: UserRole, requiredRoles: UserRole[]): boolean;
/**
 * Get the minimum role from a list of roles
 */
export declare function getMinimumRole(roles: UserRole[]): UserRole;
/**
 * Get the maximum role from a list of roles
 */
export declare function getMaximumRole(roles: UserRole[]): UserRole;
/**
 * Check if user can manage another user based on role hierarchy
 */
export declare function canManageUser(managerRole: UserRole, targetUserRole: UserRole): boolean;
/**
 * Get roles that a user can assign to others
 */
export declare function getAssignableRoles(userRole: UserRole): UserRole[];
/**
 * Role-based route access configuration
 */
export declare const ROUTE_PERMISSIONS: Record<string, UserRole[]>;
/**
 * Check if user role can access a specific route
 */
export declare function canAccessRoute(userRole: UserRole, route: string): boolean;
/**
 * Get default redirect route based on user role
 */
export declare function getDefaultRoute(userRole: UserRole): string;
