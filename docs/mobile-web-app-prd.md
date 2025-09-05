# Drouple Mobile Web App - Simple PRD

**Version:** 1.0 (Simple)  
**Date:** September 5, 2025  
**Goal:** Get churches using mobile ASAP - 3 weeks  

---

## 🎯 **Vision**

Make the existing Drouple web app work great on mobile phones. Simple, fast, effective.

## 📱 **What We're Building**

### Week 1: Mobile-Friendly Web
- Make all pages work on phone screens
- Bigger buttons, easier navigation  
- QR scanning works on mobile browsers
- Fast loading on mobile data

### Week 2: "Install Like an App"
- Add "Add to Home Screen" button
- Works like a native app when installed
- App icon on phone home screen
- Opens without browser chrome

### Week 3: Basic Notifications
- Simple push notifications for announcements
- In-app notification banner
- Basic offline message for check-ins

## ✅ **Requirements (Keep It Simple)**

### Mobile Optimization
1. **Touch-Friendly**: 44px minimum button size
2. **Readable Text**: 16px minimum font size
3. **Easy Navigation**: Hamburger menu on mobile
4. **Fast Loading**: Under 3 seconds on mobile data
5. **Camera Access**: QR scanning works in mobile browsers

### Core Functions (Mobile-Optimized)
1. **Check-In**: Big button, camera QR scanning, clear success message
2. **Events**: See upcoming events, easy RSVP
3. **Directory**: Search members, tap to call/message  
4. **Admin**: All current features work on mobile screens

### PWA Basics
1. **Install Button**: "Add to Home Screen" 
2. **App Icon**: Custom icon when installed
3. **Standalone Mode**: Opens without browser bar
4. **Basic Offline**: Show "offline" message when needed

## 🚫 **What We're NOT Building (Keep Simple)**

- ❌ Complex offline database
- ❌ Advanced conflict resolution  
- ❌ Enterprise observability
- ❌ Performance monitoring dashboards
- ❌ Feature flags and canary rollouts
- ❌ Comprehensive audit logging

## 🛠️ **Technical Approach (Simple)**

### Use What Exists
- ✅ Current Next.js web app
- ✅ Add responsive CSS  
- ✅ Add PWA manifest file
- ✅ Simple service worker
- ✅ Basic push notification setup

### Don't Rebuild
- ❌ No separate mobile codebase
- ❌ No complex offline systems
- ❌ No advanced caching strategies
- ❌ No separate mobile APIs

## 📋 **Success Criteria**

1. **Week 1**: Church members can use all features on their phones
2. **Week 2**: Members can install app on home screen  
3. **Week 3**: Basic notifications work, ready for church rollout

## 🧪 **Simple Testing**

- Pastor tests on his phone ✅
- Leadership team tests key functions ✅  
- One pilot church tests for 1 week ✅
- Fix any issues found ✅
- Roll out to all churches ✅

## 📅 **Timeline**

**Week 1**: Mobile responsive design
**Week 2**: PWA install capability  
**Week 3**: Basic push notifications and launch

**Total: 3 weeks to launch**

---

**This PRD is focused on getting churches using mobile quickly. We can add advanced features later if needed, but the goal is simple: make it work great on phones in 3 weeks.**