/**
 * API Endpoints Configuration
 * Production-ready configuration connecting to Drouple backend mobile API endpoints
 */

import Constants from 'expo-constants';

// Get API URL from environment with fallback
const getApiUrl = (): string => {
  const envUrl = Constants.expoConfig?.extra?.apiUrl;
  
  if (envUrl) {
    return envUrl;
  }
  
  // Fallback based on environment
  if (__DEV__) {
    return 'http://localhost:3000';
  }
  
  return 'https://drouple-hpci-prod.vercel.app';
};

export const API_BASE_URL = getApiUrl();

// Production mode - disable mocks and use real backend
export const USE_MOCKS = false;

// HTTPS enforcement for production
export const ENFORCE_HTTPS = !__DEV__;

// API configuration
export const API_CONFIG = {
  timeout: 30000,
  retries: 3,
  baseURL: API_BASE_URL,
  enforceHttps: ENFORCE_HTTPS,
};

export const ENDPOINTS = {
  // Unified Authentication API
  AUTH: {
    LOGIN: `${API_BASE_URL}/api/v1/auth/login`,
    REFRESH: `${API_BASE_URL}/api/v1/auth/refresh`,
    LOGOUT: `${API_BASE_URL}/api/v1/auth/logout`,
    HEALTH: `${API_BASE_URL}/api/health`,
  },

  // Unified Check-in System
  CHECKIN: {
    SERVICES: `${API_BASE_URL}/api/v1/services`,
    CHECKIN: `${API_BASE_URL}/api/v1/checkins`,
    BULK: `${API_BASE_URL}/api/v1/checkins/bulk`,
    HISTORY: `${API_BASE_URL}/api/v1/checkins`,
  },

  // Unified Events & RSVP
  EVENTS: {
    LIST: `${API_BASE_URL}/api/v1/events`,
    DETAILS: (id: string) => `${API_BASE_URL}/api/v1/events/${id}`,
    RSVP: (id: string) => `${API_BASE_URL}/api/v1/events/${id}/rsvp`,
    RSVP_BULK: (id: string) => `${API_BASE_URL}/api/v1/events/${id}/rsvp/bulk`,
  },

  // Life Groups (Mobile-specific, will migrate later)
  GROUPS: {
    LIST: `${API_BASE_URL}/api/mobile/v1/lifegroups`,
    DETAILS: (id: string) => `${API_BASE_URL}/api/mobile/v1/lifegroups/${id}`,
    JOIN_REQUEST: (id: string) => `${API_BASE_URL}/api/mobile/v1/lifegroups/${id}/join`,
  },

  // Discipleship Pathways (Mobile-specific, will migrate later)  
  PATHWAYS: {
    LIST: `${API_BASE_URL}/api/mobile/v1/pathways`,
    DETAILS: (id: string) => `${API_BASE_URL}/api/mobile/v1/pathways/${id}`,
    PROGRESS: (id: string) => `${API_BASE_URL}/api/mobile/v1/pathways/${id}/progress`,
    COMPLETE_STEP: (pathwayId: string, stepId: string) =>
      `${API_BASE_URL}/api/mobile/v1/pathways/${pathwayId}/steps/${stepId}/complete`,
  },

  // Unified Member Directory
  MEMBERS: {
    SEARCH: `${API_BASE_URL}/api/v1/members/search`,
  },

  // Unified Push Notifications
  DEVICES: {
    REGISTER: `${API_BASE_URL}/api/v1/devices`,
  },

  // Unified Sync endpoints
  SYNC: {
    MEMBERS: `${API_BASE_URL}/api/v1/sync/members`,
    EVENTS: `${API_BASE_URL}/api/v1/sync/events`,
  },

  // Unified Live/Realtime
  LIVE: {
    SERVICE_COUNTS: `${API_BASE_URL}/api/v1/live/service-counts`,
  },

  // WebSocket for realtime updates
  WEBSOCKET: `${API_BASE_URL.replace('http', 'ws')}/realtime`,
} as const;

export default ENDPOINTS;
