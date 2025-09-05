// Export API utilities
export * from './client';
// Constants for API versioning
export const API_VERSIONS = {
    V1: 'v1',
    V2: 'v2',
};
export const API_ENDPOINTS = {
    // Auth endpoints
    AUTH: {
        LOGIN: '/auth/login',
        LOGOUT: '/auth/logout',
        REFRESH: '/auth/refresh',
        TOKEN: '/auth/token',
        SESSION: '/auth/session',
    },
    // User endpoints
    USERS: '/users',
    PROFILE: '/profile',
    // Church data endpoints
    CHURCHES: '/churches',
    SERVICES: '/services',
    MEMBERS: '/members',
    DIRECTORY: '/directory/search',
    // Events endpoints
    EVENTS: '/events',
    RSVP: '/events/rsvp',
    // Life Groups endpoints
    LIFEGROUPS: '/lifegroups',
    LIFEGROUP_JOIN: '/lifegroups/join',
    LIFEGROUP_ATTENDANCE: '/lifegroups/attendance',
    // Pathways endpoints
    PATHWAYS: '/pathways',
    PATHWAY_ENROLL: '/pathways/enroll',
    PATHWAY_PROGRESS: '/pathways/progress',
    // Check-in endpoints
    CHECKIN: '/checkin',
    CHECKIN_QR: '/checkin/qr/validate',
    CHECKIN_HISTORY: '/checkin/history',
    // Notification endpoints
    NOTIFICATIONS: '/notifications',
    DEVICE_REGISTER: '/devices/register',
    PUSH_REGISTER: '/notifications/push/register',
    // Sync endpoints
    SYNC: '/sync',
    SYNC_EVENTS: '/sync/events',
    SYNC_CHECKINS: '/sync/checkins/bulk',
    SYNC_MEMBERS: '/sync/members',
    // Real-time endpoints
    LIVE: {
        SERVICE_COUNTS: '/live/service-counts',
        WEBSOCKET: '/ws',
    },
};
// Helper to build versioned endpoints
export function buildEndpoint(version, endpoint) {
    return `/api/${API_VERSIONS[version]}${endpoint}`;
}
// Error codes for consistent error handling
export const API_ERROR_CODES = {
    UNAUTHORIZED: 'UNAUTHORIZED',
    FORBIDDEN: 'FORBIDDEN',
    NOT_FOUND: 'NOT_FOUND',
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    TENANT_ISOLATION_ERROR: 'TENANT_ISOLATION_ERROR',
    RATE_LIMITED: 'RATE_LIMITED',
    SERVER_ERROR: 'SERVER_ERROR',
    NETWORK_ERROR: 'NETWORK_ERROR',
    TIMEOUT_ERROR: 'TIMEOUT_ERROR',
};
