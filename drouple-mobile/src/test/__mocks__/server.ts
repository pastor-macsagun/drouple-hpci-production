/**
 * MSW Mock Server for API Testing
 * Provides realistic API responses for integration tests
 */

import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import {
  mockUsers,
  mockServices,
  mockEvents,
  mockMembers,
} from '../fixtures/mockData';

const baseUrl = 'https://api.drouple.com';

export const handlers = [
  // Auth endpoints
  http.post(`${baseUrl}/api/mobile/auth/login`, () => {
    return HttpResponse.json({
      success: true,
      data: {
        user: mockUsers.member,
        token: 'mock-jwt-token',
        refreshToken: 'mock-refresh-token',
      },
    });
  }),

  http.post(`${baseUrl}/api/mobile/auth/refresh`, () => {
    return HttpResponse.json({
      success: true,
      data: {
        token: 'new-mock-jwt-token',
        refreshToken: 'new-mock-refresh-token',
      },
    });
  }),

  // Services endpoints
  http.get(`${baseUrl}/api/mobile/services`, () => {
    return HttpResponse.json({
      success: true,
      data: mockServices,
    });
  }),

  http.post(
    `${baseUrl}/api/mobile/services/:serviceId/checkin`,
    ({ params }) => {
      return HttpResponse.json({
        success: true,
        data: {
          id: 'checkin-123',
          serviceId: params.serviceId,
          userId: mockUsers.member.id,
          checkedInAt: new Date().toISOString(),
        },
      });
    }
  ),

  // Events endpoints
  http.get(`${baseUrl}/api/mobile/events`, () => {
    return HttpResponse.json({
      success: true,
      data: mockEvents,
    });
  }),

  http.post(`${baseUrl}/api/mobile/events/:eventId/rsvp`, ({ params }) => {
    return HttpResponse.json({
      success: true,
      data: {
        id: 'rsvp-123',
        eventId: params.eventId,
        userId: mockUsers.member.id,
        status: 'CONFIRMED',
        rsvpedAt: new Date().toISOString(),
      },
    });
  }),

  // Members/Directory endpoints
  http.get(`${baseUrl}/api/mobile/members`, () => {
    return HttpResponse.json({
      success: true,
      data: mockMembers,
    });
  }),

  // Pathways endpoints
  http.get(`${baseUrl}/api/mobile/pathways`, () => {
    return HttpResponse.json({
      success: true,
      data: [],
    });
  }),

  // Groups endpoints
  http.get(`${baseUrl}/api/mobile/groups`, () => {
    return HttpResponse.json({
      success: true,
      data: [],
    });
  }),

  // Push notifications
  http.post(`${baseUrl}/api/mobile/notifications/register`, () => {
    return HttpResponse.json({
      success: true,
      data: { registered: true },
    });
  }),
];

export const server = setupServer(...handlers);
