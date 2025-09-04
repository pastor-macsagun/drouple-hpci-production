/**
 * API Services Export Index
 * Centralized export for all API services
 */

export { AuthService } from './auth';
export type { LoginRequest, LoginResponse, ProfileUpdateRequest, ProfileResponse } from './auth';

export { CheckinService } from './checkin';
export type { Service, CheckInHistory } from './checkin';

export { EventsService } from './events';
export type { Event, RSVPResponse } from './events';

// Re-export HTTP client and utilities for convenience
export { httpClient, TokenManager, NetworkManager } from '../http';
export type { APIResponse, APIError, NetworkError, AuthenticationError } from '../http';

// Re-export contracts for type consistency
export type {
  UserDTO,
  Role,
  CheckInRequest,
  CheckInResult,
  EventDTO,
  RSVPRequest,
  DirectoryEntry,
  PathwayProgress,
  GroupDTO,
  DeviceRegisterRequest,
} from '@drouple/contracts';