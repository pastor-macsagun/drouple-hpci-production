# PUSH-PILOT: Push Notification Setup & Testing Guide

## Overview

This document covers the complete push notification implementation for Drouple Mobile, following the PRD requirements for Android channels, iOS categories with actions, deep linking, and CTR tracking.

## Implementation Summary

### Core Features Implemented
- ✅ **Permission Request**: After onboarding with gentle rationale
- ✅ **Android Channels**: General, Prayer Requests, Announcements
- ✅ **iOS Categories**: RSVP and Prayer actions
- ✅ **Deep Linking**: Routes to correct screens based on notification type
- ✅ **CTR Tracking**: Records notification display and tap metrics
- ✅ **Platform Setup**: Automated channel/category configuration

## Architecture

### Files Created
```
drouple-mobile/
├── lib/notifications/
│   ├── register.ts     # Permission, token, device registration
│   └── handlers.ts     # Deep linking, actions, CTR tracking
├── docs/mobile/
│   └── PUSH.md        # This documentation
└── app.json           # Platform permissions and config
```

### Backend API Endpoints
```
POST /api/v2/auth/token              # JWT token exchange
POST /api/v2/notifications/register  # Device registration
GET  /api/v2/notifications/register  # Get registration status
```

## Platform Configuration

### Android Channels

| Channel ID | Name | Importance | Description |
|------------|------|------------|-------------|
| `general` | General | Default | General church notifications |
| `prayer_requests` | Prayer Requests | High | Prayer request notifications |
| `announcements` | Announcements | High | Important church announcements |

### iOS Categories with Actions

#### RSVP Category
- **Action 1**: "Going" (opens app)
- **Action 2**: "Not Going" (background)

#### Prayer Category  
- **Action 1**: "Mark as Prayed" (background)
- **Action 2**: "View Request" (opens app)

## Setup Instructions

### 1. Onboarding Permission Flow

```typescript
import { setupNotifications } from '@/lib/notifications/register';

// After onboarding completion
const result = await setupNotifications(apiClient, {
  general: true,
  prayerRequests: true,
  announcements: true,
  events: true,
  pathways: true,
});

if (result.success) {
  console.log('Notifications enabled with token:', result.token);
} else {
  console.warn('Notification setup failed:', result.error);
}
```

### 2. App Initialization

```typescript
// In App.tsx or root component
import { initializeNotifications } from '@/lib/notifications/handlers';

export default function App() {
  useEffect(() => {
    const cleanup = initializeNotifications();
    return cleanup; // Clean up listeners on unmount
  }, []);
  
  return <YourAppContent />;
}
```

### 3. Deep Link Routing

Notifications automatically route to correct screens:

- **Announcements**: `/announcements` or `/announcements/{id}`
- **Events**: `/events` or `/events/{id}`
- **Prayer Requests**: `/prayer-requests/{id}`
- **Pathways**: `/pathways` or `/pathways/{id}`
- **General**: `/dashboard`

## Testing Guide

### Local Development Testing

#### 1. Push Token Generation
```bash
# In drouple-mobile directory
npm start
# Follow Expo CLI instructions to get push token
```

#### 2. Test Notification Send
```bash
curl -X POST https://exp.host/--/api/v2/push/send \
  -H "Content-Type: application/json" \
  -d '{
    "to": "ExponentPushToken[YOUR_TOKEN_HERE]",
    "title": "Test Announcement",
    "body": "This is a test notification",
    "data": {
      "id": "test-123",
      "type": "announcement", 
      "targetId": "announce-456"
    },
    "categoryId": "RSVP",
    "channelId": "announcements"
  }'
```

#### 3. Deep Link Testing
```bash
# Test custom scheme (iOS/Android)
npx uri-scheme open drouple://events/123 --ios
npx uri-scheme open drouple://events/123 --android

# Test Universal Links (iOS) / App Links (Android)
adb shell am start \
  -W -a android.intent.action.VIEW \
  -d "https://drouple.com/events/123" \
  com.hpci.drouple.mobile
```

### Production Testing Scenarios

#### Scenario 1: Event RSVP Notification
```json
{
  "to": "ExponentPushToken[...]",
  "title": "Youth Service Tonight", 
  "body": "Don't forget about tonight's youth service at 7 PM!",
  "data": {
    "id": "notif-001",
    "type": "event",
    "targetId": "event-123"
  },
  "categoryId": "RSVP",
  "channelId": "general"
}
```

**Expected Behavior**:
- iOS: Shows "Going" and "Not Going" action buttons
- Android: Routes to event detail when tapped
- CTR: Records "displayed" and "tapped" metrics
- Deep Link: Opens `/events/event-123`

#### Scenario 2: Prayer Request
```json
{
  "to": "ExponentPushToken[...]",
  "title": "Prayer Request from John",
  "body": "Please pray for my job interview tomorrow",
  "data": {
    "id": "notif-002", 
    "type": "prayer_request",
    "targetId": "prayer-456"
  },
  "categoryId": "PRAYER",
  "channelId": "prayer_requests"
}
```

**Expected Behavior**:
- iOS: Shows "Mark as Prayed" and "View Request" actions
- Android: High importance notification with vibration
- Actions: Background API calls for mark as prayed
- Deep Link: Opens `/prayer-requests/prayer-456`

#### Scenario 3: Urgent Announcement
```json
{
  "to": "ExponentPushToken[...]",
  "title": "Service Cancelled",
  "body": "Sunday service cancelled due to weather. Stay safe!",
  "data": {
    "id": "notif-003",
    "type": "announcement",
    "targetId": "announce-789"
  },
  "channelId": "announcements",
  "priority": "high"
}
```

### CTR Metric Validation

Check that these metrics are recorded:

1. **Notification Displayed**: When notification appears
2. **Notification Tapped**: When user taps notification  
3. **Action Taken**: When user uses iOS action buttons

```typescript
// Example metric payload
{
  "notificationId": "notif-001",
  "action": "tapped",
  "actionIdentifier": "rsvp_yes",
  "timestamp": "2025-09-05T15:30:00.000Z"
}
```

## Permission Copy (Gentle Tone)

### Initial Request
> **Stay Connected with Your Church Family**
> 
> Get notified about upcoming events, prayer requests from your community, and important announcements. You can customize which types of notifications you receive in Settings.

### Rationale Examples
- **Events**: "Never miss a church event or service update"
- **Prayer Requests**: "Join your community in prayer with real-time requests"  
- **Announcements**: "Stay informed about important church news"

## Troubleshooting

### Common Issues

#### Push Token Not Generated
- Ensure device is physical (not simulator)
- Check internet connection
- Verify Expo configuration in app.json

#### Notifications Not Received
- Check device notification settings
- Verify channel/category setup
- Test with Expo push tool first

#### Deep Links Not Working
- Verify URL scheme in app.json
- Check router configuration
- Test with URI scheme tools

#### Actions Not Responding (iOS)
- Verify category setup with correct identifiers
- Check action handler implementation
- Test notification response listener

### Debug Commands

```bash
# Check notification permissions
npx expo install expo-permissions
# Test in Expo Go or development build

# Verify push token
console.log('Push token:', await Notifications.getExpoPushTokenAsync());

# Test deep link handling
Linking.openURL('drouple://events/123');
```

## Performance Considerations

- **Token Refresh**: Implement token refresh logic for long-lived apps
- **Batch Metrics**: Send CTR metrics in batches to reduce API calls  
- **Deep Link Caching**: Cache frequently accessed screens for faster navigation
- **Permission Retry**: Implement smart retry logic for denied permissions

## Security Notes

- Push tokens are stored securely in device registration
- Deep links validate target IDs before navigation
- CTR metrics exclude PII and sensitive data
- Background actions use proper authentication

## Production Checklist

- [ ] Notification permissions requested after onboarding
- [ ] Android channels configured with proper importance
- [ ] iOS categories set up with required actions
- [ ] Deep linking tested for all notification types
- [ ] CTR tracking implemented and verified
- [ ] Push token registration working
- [ ] Background actions functioning (mark as prayed, RSVP)
- [ ] Error handling and fallbacks implemented
- [ ] Performance metrics within acceptable ranges

---

**Implementation Status**: ✅ Complete  
**Last Updated**: September 5, 2025  
**PRD Compliance**: Full