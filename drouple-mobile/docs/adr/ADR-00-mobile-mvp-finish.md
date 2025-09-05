# ADR-00: Mobile MVP Completion Strategy

**Status:** Accepted  
**Date:** 2025-01-06  
**Deciders:** Mobile Team  

## Context

Completing Drouple Mobile MVP with existing Expo SDK 53 + React Native 0.79.5 foundation. Core authentication, check-in flows, and technical infrastructure are complete. Need to finish MVP features for production launch.

## Decision

### Architecture Decisions

1. **No major refactors** - Work within existing patterns:
   - React Navigation 7 + role-based routing
   - React Native Paper UI components  
   - Zustand state management
   - React Query for data fetching
   - SQLite offline-first architecture

2. **Feature Flags** - Use existing featureFlags.ts structure:
   - `eventCalendarSync: true` - Enable add-to-calendar
   - `eventWaitlist: true` - Already enabled for waitlist management
   - `pushNotifications: true` - Already enabled for MVP features
   - All other core flags remain enabled

3. **Dependency Strategy** - Minimal new dependencies:
   - `expo-calendar` for add-to-calendar feature
   - No other external libraries unless absolutely required

### Implementation Strategy

1. **Push Notifications** - Use existing expo-notifications:
   - Role-based topic subscriptions
   - Announcement alerts, event reminders, pathway milestones
   - Server-side preferences if endpoints exist, otherwise local storage

2. **Dashboards** - Card-based, role-specific:
   - Reuse existing components and data patterns
   - React Query for data, skeleton loaders
   - Offline cached with timestamps

3. **Events Enhancement** - Complete existing RSVP:
   - Add waitlist states and promotion flow
   - Integrate expo-calendar for add-to-calendar
   - Enhanced status management

4. **Member Directory** - Lightweight completion:
   - Search + call/text via Linking API
   - No device contacts import
   - Respect existing privacy patterns

5. **Pathways Progress** - Visual progress only:
   - Progress bars, step completion checkboxes
   - Leader verification via push notifications
   - Offline queue for step completions

6. **Life Groups Minimal** - Discovery + attendance:
   - Group list and join requests
   - Leader attendance marking
   - No messaging features

### Trade-offs

**Chosen:**
- Speed over feature completeness
- Existing patterns over optimal architecture
- Minimal dependencies over comprehensive solutions
- Conservative feature flags over aggressive rollout

**Rejected:**
- Major architectural changes (would delay launch)
- Heavy UI libraries (performance impact)
- Complex offline sync (existing patterns sufficient)
- Social/messaging features (out of MVP scope)

### Testing Strategy

- Unit tests for new services and state management
- Integration tests for UI components with mock data
- E2E tests for critical user flows
- Performance testing on mid-range devices
- Accessibility smoke tests with VoiceOver/TalkBack

### Release Strategy

- EAS Build for both iOS + Android
- Managed workflow (no prebuild unless necessary)
- Conservative app permissions (camera for QR only)
- Store submission ready artifacts

## Consequences

### Positive
- Faster time to market
- Lower technical risk
- Consistent user experience
- Maintainable codebase

### Negative  
- Some features remain basic (can be enhanced post-MVP)
- Dependency on existing backend API patterns
- Limited customization compared to native solutions

### Monitoring
- Feature flag usage analytics
- Performance metrics via Sentry
- User adoption by role type
- Crash-free session rates

## Notes

This ADR focuses on shipping a reliable MVP quickly while maintaining code quality and user experience standards. Post-MVP enhancements can address any limitations discovered during initial usage.