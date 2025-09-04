/**
 * Security and Permissions Management
 * Role-based access control and permission validation
 */

export enum Role {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  PASTOR = 'PASTOR',
  VIP = 'VIP',
  LEADER = 'LEADER',
  MEMBER = 'MEMBER',
}

export enum Permission {
  // Admin permissions
  MANAGE_CHURCH = 'MANAGE_CHURCH',
  MANAGE_USERS = 'MANAGE_USERS',
  VIEW_ALL_REPORTS = 'VIEW_ALL_REPORTS',
  MANAGE_SERVICES = 'MANAGE_SERVICES',

  // Leader permissions
  MANAGE_EVENTS = 'MANAGE_EVENTS',
  MANAGE_LIFEGROUPS = 'MANAGE_LIFEGROUPS',
  VIEW_GROUP_REPORTS = 'VIEW_GROUP_REPORTS',
  MANAGE_PATHWAYS = 'MANAGE_PATHWAYS',

  // VIP permissions
  MANAGE_FIRSTTIMERS = 'MANAGE_FIRSTTIMERS',
  VIEW_VIP_DASHBOARD = 'VIEW_VIP_DASHBOARD',

  // Member permissions
  JOIN_EVENTS = 'JOIN_EVENTS',
  JOIN_LIFEGROUPS = 'JOIN_LIFEGROUPS',
  CHECKIN = 'CHECKIN',
  VIEW_PATHWAYS = 'VIEW_PATHWAYS',
  VIEW_DIRECTORY = 'VIEW_DIRECTORY',
}

// Role hierarchy (higher roles inherit lower role permissions)
const ROLE_HIERARCHY: Record<Role, number> = {
  [Role.SUPER_ADMIN]: 100,
  [Role.ADMIN]: 80,
  [Role.PASTOR]: 70,
  [Role.VIP]: 40,
  [Role.LEADER]: 30,
  [Role.MEMBER]: 10,
};

// Permission mapping for each role
const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  [Role.SUPER_ADMIN]: [
    Permission.MANAGE_CHURCH,
    Permission.MANAGE_USERS,
    Permission.VIEW_ALL_REPORTS,
    Permission.MANAGE_SERVICES,
    Permission.MANAGE_EVENTS,
    Permission.MANAGE_LIFEGROUPS,
    Permission.VIEW_GROUP_REPORTS,
    Permission.MANAGE_PATHWAYS,
    Permission.MANAGE_FIRSTTIMERS,
    Permission.VIEW_VIP_DASHBOARD,
    Permission.JOIN_EVENTS,
    Permission.JOIN_LIFEGROUPS,
    Permission.CHECKIN,
    Permission.VIEW_PATHWAYS,
    Permission.VIEW_DIRECTORY,
  ],
  [Role.ADMIN]: [
    Permission.MANAGE_USERS,
    Permission.VIEW_ALL_REPORTS,
    Permission.MANAGE_SERVICES,
    Permission.MANAGE_EVENTS,
    Permission.MANAGE_LIFEGROUPS,
    Permission.VIEW_GROUP_REPORTS,
    Permission.MANAGE_PATHWAYS,
    Permission.MANAGE_FIRSTTIMERS,
    Permission.VIEW_VIP_DASHBOARD,
    Permission.JOIN_EVENTS,
    Permission.JOIN_LIFEGROUPS,
    Permission.CHECKIN,
    Permission.VIEW_PATHWAYS,
    Permission.VIEW_DIRECTORY,
  ],
  [Role.PASTOR]: [
    Permission.VIEW_ALL_REPORTS,
    Permission.MANAGE_SERVICES,
    Permission.MANAGE_EVENTS,
    Permission.MANAGE_LIFEGROUPS,
    Permission.VIEW_GROUP_REPORTS,
    Permission.MANAGE_PATHWAYS,
    Permission.MANAGE_FIRSTTIMERS,
    Permission.VIEW_VIP_DASHBOARD,
    Permission.JOIN_EVENTS,
    Permission.JOIN_LIFEGROUPS,
    Permission.CHECKIN,
    Permission.VIEW_PATHWAYS,
    Permission.VIEW_DIRECTORY,
  ],
  [Role.VIP]: [
    Permission.MANAGE_FIRSTTIMERS,
    Permission.VIEW_VIP_DASHBOARD,
    Permission.JOIN_EVENTS,
    Permission.JOIN_LIFEGROUPS,
    Permission.CHECKIN,
    Permission.VIEW_PATHWAYS,
    Permission.VIEW_DIRECTORY,
  ],
  [Role.LEADER]: [
    Permission.MANAGE_EVENTS,
    Permission.MANAGE_LIFEGROUPS,
    Permission.VIEW_GROUP_REPORTS,
    Permission.JOIN_EVENTS,
    Permission.JOIN_LIFEGROUPS,
    Permission.CHECKIN,
    Permission.VIEW_PATHWAYS,
    Permission.VIEW_DIRECTORY,
  ],
  [Role.MEMBER]: [
    Permission.JOIN_EVENTS,
    Permission.JOIN_LIFEGROUPS,
    Permission.CHECKIN,
    Permission.VIEW_PATHWAYS,
    Permission.VIEW_DIRECTORY,
  ],
};

/**
 * Check if a role has a specific permission
 */
export const hasPermission = (
  userRole: Role,
  permission: Permission
): boolean => {
  const rolePermissions = ROLE_PERMISSIONS[userRole];
  return rolePermissions?.includes(permission) ?? false;
};

/**
 * Check if a role has any of the specified permissions
 */
export const hasAnyPermission = (
  userRole: Role,
  permissions: Permission[]
): boolean => {
  return permissions.some(permission => hasPermission(userRole, permission));
};

/**
 * Check if a role has all of the specified permissions
 */
export const hasAllPermissions = (
  userRole: Role,
  permissions: Permission[]
): boolean => {
  return permissions.every(permission => hasPermission(userRole, permission));
};

/**
 * Check if a user role is higher or equal in hierarchy
 */
export const isRoleHigherOrEqual = (
  userRole: Role,
  targetRole: Role
): boolean => {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[targetRole];
};

/**
 * Check if user can access admin features
 */
export const canAccessAdminFeatures = (userRole: Role): boolean => {
  return isRoleHigherOrEqual(userRole, Role.LEADER);
};

/**
 * Check if user can manage church operations
 */
export const canManageChurch = (userRole: Role): boolean => {
  return hasPermission(userRole, Permission.MANAGE_CHURCH);
};

/**
 * Check if user can view reports
 */
export const canViewReports = (userRole: Role): boolean => {
  return hasAnyPermission(userRole, [
    Permission.VIEW_ALL_REPORTS,
    Permission.VIEW_GROUP_REPORTS,
  ]);
};

/**
 * Check if user can manage members
 */
export const canManageMembers = (userRole: Role): boolean => {
  return hasPermission(userRole, Permission.MANAGE_USERS);
};

/**
 * Check if user can manage events
 */
export const canManageEvents = (userRole: Role): boolean => {
  return hasPermission(userRole, Permission.MANAGE_EVENTS);
};

/**
 * Check if user can manage life groups
 */
export const canManageLifeGroups = (userRole: Role): boolean => {
  return hasPermission(userRole, Permission.MANAGE_LIFEGROUPS);
};

/**
 * Check if user can manage services
 */
export const canManageServices = (userRole: Role): boolean => {
  return hasPermission(userRole, Permission.MANAGE_SERVICES);
};

/**
 * Check if user can manage pathways
 */
export const canManagePathways = (userRole: Role): boolean => {
  return hasPermission(userRole, Permission.MANAGE_PATHWAYS);
};

/**
 * Check if user can manage first timers (VIP feature)
 */
export const canManageFirstTimers = (userRole: Role): boolean => {
  return hasPermission(userRole, Permission.MANAGE_FIRSTTIMERS);
};

/**
 * Get all permissions for a role
 */
export const getRolePermissions = (role: Role): Permission[] => {
  return ROLE_PERMISSIONS[role] || [];
};

/**
 * Get role hierarchy level
 */
export const getRoleLevel = (role: Role): number => {
  return ROLE_HIERARCHY[role] || 0;
};

/**
 * Filter available roles based on user's role
 * Users can only assign roles equal or lower than their own
 */
export const getAssignableRoles = (userRole: Role): Role[] => {
  const userLevel = getRoleLevel(userRole);

  return Object.entries(ROLE_HIERARCHY)
    .filter(([_, level]) => level <= userLevel)
    .map(([role]) => role as Role);
};

export default {
  Role,
  Permission,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  isRoleHigherOrEqual,
  canAccessAdminFeatures,
  canManageChurch,
  canViewReports,
  canManageMembers,
  canManageEvents,
  canManageLifeGroups,
  canManageServices,
  canManagePathways,
  canManageFirstTimers,
  getRolePermissions,
  getRoleLevel,
  getAssignableRoles,
};
