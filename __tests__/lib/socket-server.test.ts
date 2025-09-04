/**
 * @file Tests for Socket.IO server infrastructure
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createServer, Server as HTTPServer } from 'http';
import { AddressInfo } from 'net';
import { io as ClientIO, Socket as ClientSocket } from 'socket.io-client';
import {
  initializeSocketServer,
  getSocketServer,
  broadcastToChannel,
  broadcastToUser,
  broadcastAnnouncement,
  broadcastServiceCounts,
  getConnectedClientsCount,
  shutdownSocketServer,
} from '@/lib/socket-server';
import { generateAccessToken } from '@/lib/mobile-jwt';

// Mock mobile-jwt module
vi.mock('@/lib/mobile-jwt', () => ({
  verifyAccessToken: vi.fn(),
  generateAccessToken: vi.fn(),
}));

// Mock prisma
vi.mock('@/lib/db', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
  },
}));

describe('Socket.IO Server Infrastructure', () => {
  let httpServer: HTTPServer;
  let serverUrl: string;
  let clientSocket: ClientSocket;

  beforeEach(() => {
    // Create HTTP server for testing
    httpServer = createServer();
    
    return new Promise<void>((resolve) => {
      httpServer.listen(() => {
        const port = (httpServer.address() as AddressInfo).port;
        serverUrl = `http://localhost:${port}`;
        resolve();
      });
    });
  });

  afterEach(async () => {
    // Clean up client socket
    if (clientSocket) {
      clientSocket.close();
    }

    // Shutdown socket server
    await shutdownSocketServer();

    // Close HTTP server
    return new Promise<void>((resolve) => {
      httpServer.close(() => resolve());
    });
  });

  describe('Server Initialization', () => {
    it('should initialize socket server with default config', () => {
      const socketServer = initializeSocketServer(httpServer);
      expect(socketServer).toBeDefined();
    });

    it('should initialize socket server with custom config', () => {
      const customConfig = {
        cors: {
          origin: ['http://localhost:3001'],
          methods: ['GET'],
          credentials: false,
        },
      };

      const socketServer = initializeSocketServer(httpServer, customConfig);
      expect(socketServer).toBeDefined();
    });

    it('should return existing server on multiple calls', () => {
      const server1 = initializeSocketServer(httpServer);
      const server2 = initializeSocketServer(httpServer);
      expect(server1).toBe(server2);
    });

    it('should get socket server instance', () => {
      initializeSocketServer(httpServer);
      const server = getSocketServer();
      expect(server).toBeDefined();
    });

    it('should throw error when getting uninitialized server', () => {
      expect(() => getSocketServer()).toThrow('Socket.IO server not initialized');
    });
  });

  describe('Authentication', () => {
    beforeEach(() => {
      initializeSocketServer(httpServer);
    });

    it('should reject connection without token', (done) => {
      clientSocket = ClientIO(`${serverUrl}/realtime`);
      
      clientSocket.on('connect_error', (error) => {
        expect(error.message).toContain('Authentication token required');
        done();
      });
    });

    it('should reject connection with invalid token', (done) => {
      const { verifyAccessToken } = vi.mocked(await import('@/lib/mobile-jwt'));
      verifyAccessToken.mockRejectedValueOnce(new Error('Invalid token'));

      clientSocket = ClientIO(`${serverUrl}/realtime`, {
        auth: { token: 'invalid-token' }
      });
      
      clientSocket.on('connect_error', (error) => {
        expect(error.message).toContain('Authentication failed');
        done();
      });
    });

    it('should accept connection with valid token', (done) => {
      const { verifyAccessToken } = vi.mocked(await import('@/lib/mobile-jwt'));
      const { prisma } = vi.mocked(await import('@/lib/db'));

      const mockUser = {
        sub: 'user123',
        email: 'test@example.com',
        roles: ['MEMBER'],
        tenantId: 'tenant123',
        churchId: 'church123',
      };

      verifyAccessToken.mockResolvedValueOnce(mockUser as any);
      prisma.user.findUnique.mockResolvedValueOnce({ isActive: true } as any);

      clientSocket = ClientIO(`${serverUrl}/realtime`, {
        auth: { token: 'valid-token' }
      });
      
      clientSocket.on('connect', () => {
        expect(clientSocket.connected).toBe(true);
        done();
      });
    });
  });

  describe('Channel Subscriptions', () => {
    beforeEach(async () => {
      initializeSocketServer(httpServer);
      
      const { verifyAccessToken } = vi.mocked(await import('@/lib/mobile-jwt'));
      const { prisma } = vi.mocked(await import('@/lib/db'));

      const mockUser = {
        sub: 'user123',
        email: 'test@example.com',
        roles: ['MEMBER'],
        tenantId: 'tenant123',
        churchId: 'church123',
      };

      verifyAccessToken.mockResolvedValueOnce(mockUser as any);
      prisma.user.findUnique.mockResolvedValueOnce({ isActive: true } as any);

      return new Promise<void>((resolve) => {
        clientSocket = ClientIO(`${serverUrl}/realtime`, {
          auth: { token: 'valid-token' }
        });
        
        clientSocket.on('connect', () => resolve());
      });
    });

    it('should allow subscription to public channels', (done) => {
      clientSocket.emit('subscribe', { channels: ['service:counts', 'announcements'] });
      
      clientSocket.on('subscribed', (data) => {
        expect(data.channels).toEqual(['service:counts', 'announcements']);
        done();
      });
    });

    it('should reject subscription to unauthorized channels', (done) => {
      clientSocket.emit('subscribe', { channels: ['admin:alerts'] });
      
      clientSocket.on('error', (error) => {
        expect(error.message).toContain('Not authorized to subscribe');
        done();
      });
    });

    it('should handle unsubscription', (done) => {
      clientSocket.emit('unsubscribe', { channels: ['service:counts'] });
      
      clientSocket.on('unsubscribed', (data) => {
        expect(data.channels).toEqual(['service:counts']);
        done();
      });
    });

    it('should respond to heartbeat', (done) => {
      clientSocket.emit('ping');
      
      clientSocket.on('pong', (data) => {
        expect(data.timestamp).toBeDefined();
        done();
      });
    });
  });

  describe('Broadcasting', () => {
    beforeEach(async () => {
      initializeSocketServer(httpServer);
      
      const { verifyAccessToken } = vi.mocked(await import('@/lib/mobile-jwt'));
      const { prisma } = vi.mocked(await import('@/lib/db'));

      const mockUser = {
        sub: 'user123',
        email: 'test@example.com',
        roles: ['MEMBER'],
        tenantId: 'tenant123',
        churchId: 'church123',
      };

      verifyAccessToken.mockResolvedValueOnce(mockUser as any);
      prisma.user.findUnique.mockResolvedValueOnce({ isActive: true } as any);

      return new Promise<void>((resolve) => {
        clientSocket = ClientIO(`${serverUrl}/realtime`, {
          auth: { token: 'valid-token' }
        });
        
        clientSocket.on('connect', () => resolve());
      });
    });

    it('should broadcast to channel', (done) => {
      // Subscribe to channel first
      clientSocket.emit('subscribe', { channels: ['service:counts'] });
      
      clientSocket.on('subscribed', () => {
        // Broadcast message
        broadcastToChannel('service:counts', 'test:event', { message: 'test' });
      });

      clientSocket.on('test:event', (data) => {
        expect(data.message).toBe('test');
        done();
      });
    });

    it('should broadcast service counts', (done) => {
      clientSocket.emit('subscribe', { channels: ['service:counts'] });
      
      clientSocket.on('subscribed', () => {
        broadcastServiceCounts('tenant123', 'church123', {
          serviceId: 'service123',
          totalCheckins: 10,
          currentAttendance: 8,
          timestamp: new Date().toISOString(),
        });
      });

      clientSocket.on('service:count_update', (data) => {
        expect(data.serviceId).toBe('service123');
        expect(data.totalCheckins).toBe(10);
        expect(data.currentAttendance).toBe(8);
        done();
      });
    });

    it('should broadcast announcements', (done) => {
      clientSocket.emit('subscribe', { channels: ['announcements'] });
      
      clientSocket.on('subscribed', () => {
        broadcastAnnouncement('tenant123', 'church123', {
          id: 'ann123',
          title: 'Test Announcement',
          content: 'This is a test',
          priority: 'MEDIUM',
          createdAt: new Date().toISOString(),
        });
      });

      clientSocket.on('announcement:new', (data) => {
        expect(data.id).toBe('ann123');
        expect(data.title).toBe('Test Announcement');
        done();
      });
    });
  });

  describe('Client Management', () => {
    it('should get connected clients count', async () => {
      initializeSocketServer(httpServer);
      const count = await getConnectedClientsCount();
      expect(typeof count).toBe('number');
      expect(count).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle broadcast without initialized server', () => {
      // Should not throw error, just log warning
      expect(() => {
        broadcastToChannel('test', 'event', {});
      }).not.toThrow();
    });

    it('should handle invalid channel subscription gracefully', (done) => {
      initializeSocketServer(httpServer);
      
      const { verifyAccessToken } = vi.mocked(await import('@/lib/mobile-jwt'));
      const { prisma } = vi.mocked(await import('@/lib/db'));

      verifyAccessToken.mockResolvedValueOnce({
        sub: 'user123',
        roles: ['MEMBER'],
        tenantId: 'tenant123',
        churchId: 'church123',
      } as any);
      prisma.user.findUnique.mockResolvedValueOnce({ isActive: true } as any);

      clientSocket = ClientIO(`${serverUrl}/realtime`, {
        auth: { token: 'valid-token' }
      });
      
      clientSocket.on('connect', () => {
        // Send invalid subscription data
        clientSocket.emit('subscribe', { channels: 'invalid' });
      });

      clientSocket.on('error', (error) => {
        expect(error.message).toContain('Invalid channels array');
        done();
      });
    });
  });

  describe('Graceful Shutdown', () => {
    it('should shutdown gracefully', async () => {
      initializeSocketServer(httpServer);
      await expect(shutdownSocketServer()).resolves.toBeUndefined();
    });

    it('should handle shutdown without initialized server', async () => {
      await expect(shutdownSocketServer()).resolves.toBeUndefined();
    });
  });
});