export * from './client';
export declare const API_VERSIONS: {
    readonly V1: "v1";
    readonly V2: "v2";
};
export declare const API_ENDPOINTS: {
    readonly AUTH: {
        readonly LOGIN: "/auth/login";
        readonly LOGOUT: "/auth/logout";
        readonly REFRESH: "/auth/refresh";
        readonly TOKEN: "/auth/token";
        readonly SESSION: "/auth/session";
    };
    readonly USERS: "/users";
    readonly PROFILE: "/profile";
    readonly CHURCHES: "/churches";
    readonly SERVICES: "/services";
    readonly MEMBERS: "/members";
    readonly DIRECTORY: "/directory/search";
    readonly EVENTS: "/events";
    readonly RSVP: "/events/rsvp";
    readonly LIFEGROUPS: "/lifegroups";
    readonly LIFEGROUP_JOIN: "/lifegroups/join";
    readonly LIFEGROUP_ATTENDANCE: "/lifegroups/attendance";
    readonly PATHWAYS: "/pathways";
    readonly PATHWAY_ENROLL: "/pathways/enroll";
    readonly PATHWAY_PROGRESS: "/pathways/progress";
    readonly CHECKIN: "/checkin";
    readonly CHECKIN_QR: "/checkin/qr/validate";
    readonly CHECKIN_HISTORY: "/checkin/history";
    readonly NOTIFICATIONS: "/notifications";
    readonly DEVICE_REGISTER: "/devices/register";
    readonly PUSH_REGISTER: "/notifications/push/register";
    readonly SYNC: "/sync";
    readonly SYNC_EVENTS: "/sync/events";
    readonly SYNC_CHECKINS: "/sync/checkins/bulk";
    readonly SYNC_MEMBERS: "/sync/members";
    readonly LIVE: {
        readonly SERVICE_COUNTS: "/live/service-counts";
        readonly WEBSOCKET: "/ws";
    };
};
export declare function buildEndpoint(version: keyof typeof API_VERSIONS, endpoint: string): string;
export declare const API_ERROR_CODES: {
    readonly UNAUTHORIZED: "UNAUTHORIZED";
    readonly FORBIDDEN: "FORBIDDEN";
    readonly NOT_FOUND: "NOT_FOUND";
    readonly VALIDATION_ERROR: "VALIDATION_ERROR";
    readonly TENANT_ISOLATION_ERROR: "TENANT_ISOLATION_ERROR";
    readonly RATE_LIMITED: "RATE_LIMITED";
    readonly SERVER_ERROR: "SERVER_ERROR";
    readonly NETWORK_ERROR: "NETWORK_ERROR";
    readonly TIMEOUT_ERROR: "TIMEOUT_ERROR";
};
