/**
 * Socket.IO Server Infrastructure for Realtime Mobile Features
 * Provides WebSocket server with JWT authentication and mobile namespaces
 */

import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { verifyAccessToken, type MobileJWTPayload } from './mobile-jwt';
import { prisma } from './db';
import { createTenantWhereClause } from './auth/rbac';

export interface AuthenticatedSocket extends Socket {
  user: MobileJWTPayload;
}

// Socket.IO server instance
let io: SocketIOServer | null = null;

export interface RealtimeConfig {
  cors: {
    origin: string[];
    methods: string[];
    credentials: boolean;
  };
  transports: string[];
  pingTimeout: number;
  pingInterval: number;
}

const defaultConfig: RealtimeConfig = {
  cors: {
    origin: [
      'http://localhost:3000',
      'http://localhost:19006', // Expo dev server
      'https://*.vercel.app',
      process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '',
    ].filter(Boolean),
    methods: ['GET', 'POST'],
    credentials: true,
  },
  transports: ['websocket', 'polling'],
  pingTimeout: 60000, // 60 seconds
  pingInterval: 25000, // 25 seconds
};

/**
 * Initialize Socket.IO server with HTTP server
 */
export function initializeSocketServer(
  httpServer: HTTPServer,
  config: Partial<RealtimeConfig> = {}
): SocketIOServer {
  if (io) {
    console.warn('Socket.IO server already initialized');
    return io;
  }

  const finalConfig = { ...defaultConfig, ...config };
  
  io = new SocketIOServer(httpServer, {
    cors: finalConfig.cors,
    transports: finalConfig.transports,
    pingTimeout: finalConfig.pingTimeout,
    pingInterval: finalConfig.pingInterval,
  });

  // Set up mobile realtime namespace
  setupMobileRealtimeNamespace();

  console.log('Socket.IO server initialized');
  return io;
}

/**
 * Get the Socket.IO server instance
 */
export function getSocketServer(): SocketIOServer {
  if (!io) {
    throw new Error('Socket.IO server not initialized. Call initializeSocketServer first.');
  }
  return io;
}

/**
 * JWT Authentication middleware for Socket.IO
 */
async function authenticateSocket(socket: any, next: any) {
  try {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return next(new Error('Authentication token required'));
    }

    // Verify JWT token
    const user = await verifyAccessToken(token);
    
    // Verify user is still active in database
    const dbUser = await prisma.user.findUnique({
      where: { id: user.sub },
      select: { isActive: true },
    });

    if (!dbUser || !dbUser.isActive) {
      return next(new Error('User not found or inactive'));
    }

    // Attach user to socket
    socket.user = user;
    
    console.log(`Socket authenticated for user: ${user.email} (${user.sub})`);
    next();
  } catch (error) {
    console.error('Socket authentication error:', error);
    next(new Error('Authentication failed'));
  }
}

/**
 * Set up the mobile realtime namespace with authentication and channels
 */
function setupMobileRealtimeNamespace() {
  if (!io) return;

  const mobileNS = io.of('/realtime');

  // Apply JWT authentication middleware
  mobileNS.use(authenticateSocket);

  mobileNS.on('connection', (socket: AuthenticatedSocket) => {
    const { user } = socket;
    
    console.log(`Mobile client connected: ${user.email} (${user.sub})`);

    // Join tenant-specific room for isolation
    const tenantRoom = `tenant:${user.tenantId}`;
    socket.join(tenantRoom);

    // Join church-specific room for church-level broadcasts
    const churchRoom = `church:${user.churchId}`;
    socket.join(churchRoom);

    // Join role-specific rooms for role-based notifications
    user.roles.forEach(role => {
      socket.join(`role:${role}`);
    });

    // Handle client subscription to specific channels
    socket.on('subscribe', (data: { channels: string[] }) => {
      if (!data.channels || !Array.isArray(data.channels)) {
        socket.emit('error', { message: 'Invalid channels array' });
        return;
      }

      data.channels.forEach(channel => {
        if (isAllowedChannel(channel, user)) {
          socket.join(channel);
          console.log(`User ${user.email} subscribed to channel: ${channel}`);
        } else {
          socket.emit('error', { 
            message: `Not authorized to subscribe to channel: ${channel}` 
          });
        }
      });

      socket.emit('subscribed', { channels: data.channels });
    });

    // Handle unsubscription
    socket.on('unsubscribe', (data: { channels: string[] }) => {
      if (!data.channels || !Array.isArray(data.channels)) {
        socket.emit('error', { message: 'Invalid channels array' });
        return;
      }

      data.channels.forEach(channel => {
        socket.leave(channel);
        console.log(`User ${user.email} unsubscribed from channel: ${channel}`);
      });

      socket.emit('unsubscribed', { channels: data.channels });
    });

    // Handle heartbeat/ping
    socket.on('ping', () => {
      socket.emit('pong', { timestamp: new Date().toISOString() });
    });

    // Clean up on disconnect
    socket.on('disconnect', (reason) => {
      console.log(`Mobile client disconnected: ${user.email} (${reason})`);
    });
  });

  console.log('Mobile realtime namespace configured');
}

/**
 * Check if user is allowed to subscribe to a specific channel
 */
function isAllowedChannel(channel: string, user: MobileJWTPayload): boolean {
  // Service counts - all authenticated users can subscribe
  if (channel === 'service:counts') {
    return true;
  }

  // Announcements - all authenticated users can subscribe
  if (channel === 'announcements') {
    return true;
  }

  // Admin-specific channels
  if (channel.startsWith('admin:')) {
    return user.roles.some(role => ['SUPER_ADMIN', 'PASTOR', 'ADMIN'].includes(role));
  }

  // Leader-specific channels
  if (channel.startsWith('leader:')) {
    return user.roles.some(role => ['SUPER_ADMIN', 'PASTOR', 'ADMIN', 'LEADER'].includes(role));
  }

  // Tenant-specific channels (must match user's tenant)
  if (channel.startsWith('tenant:')) {
    const [, channelTenantId] = channel.split(':');
    return user.tenantId === channelTenantId || user.roles.includes('SUPER_ADMIN');
  }

  // Church-specific channels (must match user's church)
  if (channel.startsWith('church:')) {
    const [, channelChurchId] = channel.split(':');
    return user.churchId === channelChurchId || user.roles.includes('SUPER_ADMIN');
  }

  // Default: deny unknown channels
  return false;
}

/**
 * Broadcast message to specific channel
 */
export function broadcastToChannel(
  channel: string, 
  event: string, 
  data: any,
  tenantId?: string,
  churchId?: string
) {
  if (!io) {
    console.warn('Socket.IO server not initialized, cannot broadcast');
    return;
  }

  const mobileNS = io.of('/realtime');
  
  // If tenant/church specified, broadcast to those rooms
  if (tenantId) {
    mobileNS.to(`tenant:${tenantId}`).emit(event, data);
  } else if (churchId) {
    mobileNS.to(`church:${churchId}`).emit(event, data);
  } else {
    // Broadcast to the channel
    mobileNS.to(channel).emit(event, data);
  }

  console.log(`Broadcasted ${event} to channel: ${channel}`, data);
}

/**
 * Broadcast message to specific user
 */
export function broadcastToUser(userId: string, event: string, data: any) {
  if (!io) {
    console.warn('Socket.IO server not initialized, cannot broadcast');
    return;
  }

  const mobileNS = io.of('/realtime');
  
  // Find socket by user ID
  mobileNS.sockets.forEach(socket => {
    if ((socket as AuthenticatedSocket).user?.sub === userId) {
      socket.emit(event, data);
    }
  });

  console.log(`Broadcasted ${event} to user: ${userId}`, data);
}

/**
 * Broadcast announcement to all users in tenant
 */
export function broadcastAnnouncement(
  tenantId: string,
  churchId: string | null,
  announcement: {
    id: string;
    title: string;
    content: string;
    priority: 'LOW' | 'MEDIUM' | 'HIGH';
    createdAt: string;
  }
) {
  const event = 'announcement:new';
  
  if (churchId) {
    broadcastToChannel('announcements', event, announcement, undefined, churchId);
  } else {
    broadcastToChannel('announcements', event, announcement, tenantId);
  }
}

/**
 * Broadcast live service count update
 */
export function broadcastServiceCounts(
  tenantId: string,
  churchId: string,
  counts: {
    serviceId: string;
    totalCheckins: number;
    currentAttendance: number;
    timestamp: string;
  }
) {
  broadcastToChannel(
    'service:counts', 
    'service:count_update', 
    counts, 
    undefined, 
    churchId
  );
}

/**
 * Get connected clients count
 */
export function getConnectedClientsCount(): Promise<number> {
  if (!io) return Promise.resolve(0);
  
  return new Promise((resolve, reject) => {
    io!.of('/realtime').allSockets()
      .then(sockets => resolve(sockets.size))
      .catch(reject);
  });
}

/**
 * Get connected clients by tenant
 */
export function getConnectedClientsByTenant(tenantId: string): Promise<number> {
  if (!io) return Promise.resolve(0);
  
  return new Promise((resolve, reject) => {
    io!.of('/realtime').in(`tenant:${tenantId}`).allSockets()
      .then(sockets => resolve(sockets.size))
      .catch(reject);
  });
}

/**
 * Gracefully shutdown Socket.IO server
 */
export function shutdownSocketServer(): Promise<void> {
  return new Promise((resolve) => {
    if (!io) {
      resolve();
      return;
    }

    console.log('Shutting down Socket.IO server...');
    
    io.close(() => {
      console.log('Socket.IO server shutdown complete');
      io = null;
      resolve();
    });
  });
}