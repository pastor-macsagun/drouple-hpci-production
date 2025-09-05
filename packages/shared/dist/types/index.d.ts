export * from './enums';
export * from './api';
export * from './entities';
export interface NotificationPreferences {
    general: boolean;
    prayerRequests: boolean;
    announcements: boolean;
    events: boolean;
    pathways: boolean;
}
export interface DeviceInfo {
    deviceId: string;
    platform: 'ios' | 'android';
    pushToken?: string;
    appVersion: string;
    osVersion: string;
    lastActive: string;
}
export interface SyncStatus {
    lastSync?: string;
    pendingOperations: number;
    isOnline: boolean;
    isSyncing: boolean;
    lastError?: string;
}
