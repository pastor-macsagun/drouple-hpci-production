// RBAC (Role-Based Access Control) utilities
import { UserRole } from '../types/enums';
// Role hierarchy - higher number = higher permission level
const ROLE_HIERARCHY = {
    [UserRole.MEMBER]: 1,
    [UserRole.LEADER]: 2,
    [UserRole.VIP]: 3,
    [UserRole.ADMIN]: 4,
    [UserRole.PASTOR]: 5,
    [UserRole.SUPER_ADMIN]: 6,
};
/**
 * Check if a user role has permission to access a resource requiring a minimum role
 */
export function hasPermission(userRole, requiredRole) {
    return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}
/**
 * Check if a user role has permission to access any of the required roles
 */
export function hasAnyPermission(userRole, requiredRoles) {
    return requiredRoles.some(role => hasPermission(userRole, role));
}
/**
 * Get the minimum role from a list of roles
 */
export function getMinimumRole(roles) {
    return roles.reduce((min, role) => ROLE_HIERARCHY[role] < ROLE_HIERARCHY[min] ? role : min);
}
/**
 * Get the maximum role from a list of roles
 */
export function getMaximumRole(roles) {
    return roles.reduce((max, role) => ROLE_HIERARCHY[role] > ROLE_HIERARCHY[max] ? role : max);
}
/**
 * Check if user can manage another user based on role hierarchy
 */
export function canManageUser(managerRole, targetUserRole) {
    // Can't manage users of equal or higher role, except SUPER_ADMIN
    if (managerRole === UserRole.SUPER_ADMIN)
        return true;
    return ROLE_HIERARCHY[managerRole] > ROLE_HIERARCHY[targetUserRole];
}
/**
 * Get roles that a user can assign to others
 */
export function getAssignableRoles(userRole) {
    const userLevel = ROLE_HIERARCHY[userRole];
    return Object.entries(ROLE_HIERARCHY)
        .filter(([_, level]) => level < userLevel)
        .map(([role, _]) => role);
}
/**
 * Role-based route access configuration
 */
export const ROUTE_PERMISSIONS = {
    // Admin routes
    '/admin': [UserRole.ADMIN, UserRole.PASTOR, UserRole.SUPER_ADMIN],
    '/admin/members': [UserRole.ADMIN, UserRole.PASTOR, UserRole.SUPER_ADMIN],
    '/admin/services': [UserRole.ADMIN, UserRole.PASTOR, UserRole.SUPER_ADMIN],
    '/admin/lifegroups': [UserRole.ADMIN, UserRole.PASTOR, UserRole.SUPER_ADMIN],
    '/admin/events': [UserRole.ADMIN, UserRole.PASTOR, UserRole.SUPER_ADMIN],
    '/admin/pathways': [UserRole.ADMIN, UserRole.PASTOR, UserRole.SUPER_ADMIN],
    // VIP routes
    '/vip': [UserRole.VIP, UserRole.ADMIN, UserRole.PASTOR, UserRole.SUPER_ADMIN],
    '/vip/firsttimers': [UserRole.VIP, UserRole.ADMIN, UserRole.PASTOR, UserRole.SUPER_ADMIN],
    // Leader routes
    '/leader': [UserRole.LEADER, UserRole.VIP, UserRole.ADMIN, UserRole.PASTOR, UserRole.SUPER_ADMIN],
    '/leader/lifegroups': [UserRole.LEADER, UserRole.VIP, UserRole.ADMIN, UserRole.PASTOR, UserRole.SUPER_ADMIN],
    // Super Admin routes
    '/super': [UserRole.SUPER_ADMIN],
    '/super/churches': [UserRole.SUPER_ADMIN],
    '/super/system': [UserRole.SUPER_ADMIN],
    // Member routes (accessible to all authenticated users)
    '/checkin': [UserRole.MEMBER, UserRole.LEADER, UserRole.VIP, UserRole.ADMIN, UserRole.PASTOR, UserRole.SUPER_ADMIN],
    '/events': [UserRole.MEMBER, UserRole.LEADER, UserRole.VIP, UserRole.ADMIN, UserRole.PASTOR, UserRole.SUPER_ADMIN],
    '/directory': [UserRole.MEMBER, UserRole.LEADER, UserRole.VIP, UserRole.ADMIN, UserRole.PASTOR, UserRole.SUPER_ADMIN],
    '/pathways': [UserRole.MEMBER, UserRole.LEADER, UserRole.VIP, UserRole.ADMIN, UserRole.PASTOR, UserRole.SUPER_ADMIN],
    '/lifegroups': [UserRole.MEMBER, UserRole.LEADER, UserRole.VIP, UserRole.ADMIN, UserRole.PASTOR, UserRole.SUPER_ADMIN],
};
/**
 * Check if user role can access a specific route
 */
export function canAccessRoute(userRole, route) {
    const allowedRoles = ROUTE_PERMISSIONS[route];
    if (!allowedRoles) {
        // If route not defined, default to MEMBER access
        return true;
    }
    return allowedRoles.includes(userRole);
}
/**
 * Get default redirect route based on user role
 */
export function getDefaultRoute(userRole) {
    switch (userRole) {
        case UserRole.SUPER_ADMIN:
            return '/super';
        case UserRole.ADMIN:
        case UserRole.PASTOR:
            return '/admin';
        case UserRole.VIP:
            return '/vip';
        case UserRole.LEADER:
            return '/leader';
        case UserRole.MEMBER:
        default:
            return '/dashboard';
    }
}
