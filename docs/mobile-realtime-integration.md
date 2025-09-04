# Mobile Realtime + Notifications + Offline Sync Integration Guide

This document provides comprehensive integration instructions for the production-ready realtime, push notification, and offline sync features for Drouple Mobile.

## 🚀 Overview

The backend implementation provides three core capabilities:

### 1. **WebSocket Realtime Communications**
- JWT-authenticated `/realtime` namespace
- Live service check-in counts broadcasting
- Announcement notifications
- Auto-fallback to HTTP polling

### 2. **Push Notifications**
- Firebase Cloud Messaging (FCM) integration
- Bull/Redis queue for reliable delivery
- Device registration with auto-topic subscription
- Multiple notification priorities and topics

### 3. **Offline Sync**
- Delta sync endpoints for events and members
- Bulk operation endpoints with conflict resolution
- Last-write-wins and fail-on-conflict strategies

---

## 📋 Prerequisites

### Environment Variables Required

```bash
# Firebase Configuration (Required for Push Notifications)
FIREBASE_PROJECT_ID=your-firebase-project
FIREBASE_CLIENT_EMAIL=your-service-account@project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Redis Configuration (Required for Bull Queue)
REDIS_URL=redis://localhost:6379
# OR for hosted Redis:
KV_URL=redis://user:password@host:port

# Mobile JWT Configuration (Optional - falls back to NEXTAUTH_SECRET)
MOBILE_JWT_SECRET=your-jwt-secret-minimum-32-chars

# Frontend URLs for CORS (Optional)
FRONTEND_URL=https://your-app.com
```

### Firebase Setup

1. **Create Firebase Project**
   ```bash
   # Install Firebase CLI
   npm install -g firebase-tools
   
   # Login and create project
   firebase login
   firebase projects:create your-project-id
   ```

2. **Enable Cloud Messaging**
   - Go to Firebase Console → Project Settings → Cloud Messaging
   - Generate server key for FCM integration

3. **Create Service Account**
   - Go to Firebase Console → Project Settings → Service Accounts
   - Generate new private key
   - Download JSON and extract credentials for environment variables

### Redis Setup

**Option 1: Local Redis**
```bash
# Install Redis locally
brew install redis
redis-server
```

**Option 2: Hosted Redis (Recommended for Production)**
- [Upstash](https://upstash.com/) - Serverless Redis
- [Redis Cloud](https://redis.com/redis-enterprise-cloud/)
- [AWS ElastiCache](https://aws.amazon.com/elasticache/)

---

## 🛠️ Backend Integration

### 1. Custom Server Setup

Replace `npm run dev` with custom server for Socket.IO integration:

**package.json**
```json
{
  "scripts": {
    "dev": "node server.js",
    "build": "next build",
    "start": "node server.js"
  }
}
```

**server.js** (already created)
```javascript
const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { initializeSocketServer } = require('./lib/socket-server');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });

  // Initialize Socket.IO server
  initializeSocketServer(server);

  server.listen(3000, () => {
    console.log('> Ready on http://localhost:3000');
    console.log('> Socket.IO server running on same port');
  });
});
```

### 2. Initialize Services

**In your application startup (e.g., `app/layout.tsx` or similar):**

```typescript
import { initializeNotificationQueue } from '@/lib/notifications/queue';

// Initialize services on server startup
if (typeof window === 'undefined') {
  initializeNotificationQueue().catch(console.error);
}
```

### 3. Broadcasting Integration

**Integrate with existing check-in system:**

```typescript
import { broadcastServiceCounts } from '@/lib/socket-server';

// In your check-in server action
export async function handleCheckIn(serviceId: string, userId: string) {
  // ... existing check-in logic ...
  
  // Broadcast updated counts
  const counts = await getServiceCounts(serviceId);
  broadcastServiceCounts(tenantId, churchId, {
    serviceId,
    totalCheckins: counts.total,
    currentAttendance: counts.unique,
    timestamp: new Date().toISOString(),
  });
}
```

**Integrate with announcements system:**

```typescript
import { broadcastAnnouncement, sendNotificationToRoles } from '@/lib/notifications/service';

export async function createAnnouncement(data: AnnouncementData) {
  const announcement = await prisma.announcement.create({ data });
  
  // Broadcast to realtime clients
  broadcastAnnouncement(data.tenantId, data.churchId, {
    id: announcement.id,
    title: announcement.title,
    content: announcement.content,
    priority: announcement.priority,
    createdAt: announcement.createdAt.toISOString(),
  });
  
  // Send push notifications
  await sendNotificationToRoles(
    data.tenantId,
    ['MEMBER', 'LEADER', 'ADMIN'],
    announcement.title,
    announcement.content,
    { priority: announcement.priority }
  );
}
```

---

## 📱 Mobile Client Integration

### 1. Socket.IO Client Setup

**Install dependencies:**
```bash
npm install socket.io-client
```

**Connect to WebSocket:**
```typescript
import { io, Socket } from 'socket.io-client';

class RealtimeService {
  private socket: Socket | null = null;

  async connect(authToken: string) {
    this.socket = io('/realtime', {
      transports: ['websocket', 'polling'],
      auth: { token: authToken },
    });

    this.socket.on('connect', () => {
      console.log('Connected to realtime server');
      
      // Subscribe to channels
      this.socket?.emit('subscribe', {
        channels: ['service:counts', 'announcements']
      });
    });

    this.socket.on('service:count_update', (data) => {
      // Update UI with live service counts
      this.updateServiceCounts(data);
    });

    this.socket.on('announcement:new', (announcement) => {
      // Show new announcement
      this.showAnnouncement(announcement);
    });
  }

  disconnect() {
    this.socket?.disconnect();
    this.socket = null;
  }
}
```

### 2. Push Notifications Setup

**Register device for notifications:**
```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';
import messaging from '@react-native-firebase/messaging';

export async function registerForPushNotifications(authToken: string) {
  // Request permissions
  const permission = await messaging().requestPermission();
  if (permission === messaging.AuthorizationStatus.AUTHORIZED) {
    
    // Get FCM token
    const fcmToken = await messaging().getToken();
    
    // Register with backend
    const response = await fetch('/api/mobile/v1/devices/register', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token: fcmToken,
        platform: Platform.OS,
        appVersion: '1.0.0',
      }),
    });

    if (response.ok) {
      await AsyncStorage.setItem('fcm-token', fcmToken);
      console.log('Device registered for push notifications');
    }
  }
}
```

### 3. Offline Sync Implementation

**Delta sync for events:**
```typescript
export class OfflineSyncService {
  async syncEvents(lastSyncTime?: string): Promise<MobileEvent[]> {
    const params = new URLSearchParams();
    if (lastSyncTime) {
      params.append('updatedAfter', lastSyncTime);
    }
    params.append('limit', '50');

    const response = await fetch(`/api/mobile/v1/sync/events?${params}`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    const data = await response.json();
    
    // Store events in local database
    await this.storeEventsLocally(data.events);
    
    // Update last sync time
    await AsyncStorage.setItem('last-event-sync', data.timestamp);
    
    return data.events;
  }

  async syncOfflineCheckins(checkins: OfflineCheckin[]): Promise<void> {
    const response = await fetch('/api/mobile/v1/sync/checkins/bulk', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        checkins: checkins.map(c => ({
          serviceId: c.serviceId,
          checkinTime: c.checkinTime,
          offlineId: c.offlineId,
        })),
        conflictResolution: 'last-write-wins',
      }),
    });

    const result = await response.json();
    
    // Update local storage with server IDs
    await this.updateLocalCheckins(result.results);
  }
}
```

---

## 🔧 API Endpoints Reference

### Realtime Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/realtime` | WebSocket | JWT-authenticated Socket.IO namespace |
| `/api/mobile/v1/live/service-counts` | GET | Polling fallback for service counts |

### Push Notification Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/mobile/v1/devices/register` | POST | Register device for push notifications |

### Offline Sync Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/mobile/v1/sync/events` | GET | Delta sync for events |
| `/api/mobile/v1/sync/members` | GET | Delta sync for members |
| `/api/mobile/v1/sync/checkins/bulk` | POST | Bulk check-in operations |
| `/api/mobile/v1/sync/events/rsvp/bulk` | POST | Bulk RSVP operations |

---

## 🧪 Testing

### Unit Tests

```bash
# Run all mobile backend tests
npm run test:unit -- __tests__/lib/socket-server.test.ts
npm run test:unit -- __tests__/lib/notifications/
npm run test:unit -- __tests__/api/mobile/v1/sync/

# Run specific test suites
npm run test:unit -- --grep "Socket.IO"
npm run test:unit -- --grep "Push Notifications"
npm run test:unit -- --grep "Offline Sync"
```

### Integration Testing

```bash
# Test Socket.IO connection
curl -X GET http://localhost:3000/socket.io/?EIO=4&transport=polling

# Test device registration
curl -X POST http://localhost:3000/api/mobile/v1/devices/register \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"token":"fcm-token","platform":"android"}'

# Test delta sync
curl -X GET "http://localhost:3000/api/mobile/v1/sync/events?updatedAfter=2024-01-01T00:00:00.000Z" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## 📊 Monitoring & Health Checks

### Service Health

```typescript
import { checkQueueHealth } from '@/lib/notifications/queue';
import { getConnectedClientsCount } from '@/lib/socket-server';

export async function healthCheck() {
  return {
    timestamp: new Date().toISOString(),
    services: {
      websocket: {
        healthy: true,
        connectedClients: await getConnectedClientsCount(),
      },
      notifications: await checkQueueHealth(),
      database: await checkDatabaseConnection(),
    },
  };
}
```

### Metrics to Monitor

- **WebSocket Connections**: Active client count, connection errors
- **Push Notifications**: Queue length, delivery success rate, failed tokens
- **Sync Operations**: Request volume, response times, conflict resolution stats
- **Database**: Query performance, connection pool usage
- **Redis**: Memory usage, queue depths, connection health

---

## 🚀 Deployment Checklist

### Pre-Deployment

- [ ] Environment variables configured
- [ ] Firebase project set up with FCM enabled
- [ ] Redis instance provisioned and accessible
- [ ] SSL certificates configured for WSS connections
- [ ] CORS settings updated for production domains

### Post-Deployment

- [ ] Health check endpoints responding
- [ ] WebSocket connections working (test with dev client)
- [ ] Push notifications delivering successfully
- [ ] Queue processing working (check Redis dashboard)
- [ ] Monitoring and alerts configured

### Load Testing

```bash
# Test WebSocket connections
npm install -g artillery
artillery run tests/load/websocket-load-test.yml

# Test API endpoints
artillery run tests/load/api-load-test.yml
```

---

## 🔍 Troubleshooting

### Common Issues

**1. WebSocket Connection Failures**
```bash
# Check if Socket.IO server is running
curl http://localhost:3000/socket.io/

# Verify JWT token
node -e "console.log(require('jsonwebtoken').decode('YOUR_TOKEN'))"
```

**2. Push Notification Failures**
```bash
# Check Firebase credentials
node -e "console.log('Project:', process.env.FIREBASE_PROJECT_ID)"

# Test FCM token validity
# Use Firebase Console to send test message
```

**3. Redis Connection Issues**
```bash
# Test Redis connectivity
redis-cli ping

# Check Redis logs
tail -f /var/log/redis/redis-server.log
```

**4. Queue Processing Stuck**
```typescript
// Check queue stats
import { getQueueStats } from '@/lib/notifications/queue';
console.log(await getQueueStats());

// Clear stuck jobs
import { cleanFailedJobs } from '@/lib/notifications/queue';
await cleanFailedJobs();
```

---

## 📈 Performance Optimization

### WebSocket Optimization

- Use connection pooling for database queries
- Implement rate limiting per user/IP
- Cache frequently accessed data (Redis)
- Use clustering for horizontal scaling

### Push Notification Optimization

- Batch notifications when possible
- Use topic-based messaging for broad announcements
- Implement exponential backoff for retries
- Clean up expired device tokens regularly

### Sync Optimization

- Implement cursor-based pagination
- Use database indexes for sync queries
- Compress large sync payloads
- Implement incremental sync algorithms

---

## 🔒 Security Considerations

### Authentication & Authorization

- JWT tokens expire after 15 minutes
- Refresh tokens rotate on use
- Device tokens validated and sanitized
- Tenant isolation enforced at database level

### Data Protection

- Sensitive data filtered in API responses
- Push notification payloads exclude PII
- WebSocket messages scoped to user permissions
- All communications over HTTPS/WSS

### Rate Limiting

```typescript
// API rate limits (per user)
const RATE_LIMITS = {
  'device-register': '5/minute',
  'sync-events': '30/minute',
  'bulk-operations': '10/minute',
};
```

---

## 📚 Additional Resources

- [Socket.IO Documentation](https://socket.io/docs/)
- [Firebase Cloud Messaging](https://firebase.google.com/docs/cloud-messaging)
- [Bull Queue Documentation](https://optimalbits.github.io/bull/)
- [Redis Best Practices](https://redis.io/docs/manual/patterns/)

---

**Implementation Status**: ✅ **PRODUCTION READY**

All components have been implemented with comprehensive testing, error handling, and production-grade monitoring. The system is ready for mobile app integration and production deployment.