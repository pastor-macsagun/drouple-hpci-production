# PWA Splash Screen Testing Guide

## Overview
The splash screen should **ONLY** appear when the app is opened in PWA/standalone mode (installed app). Regular web browser users should see the landing page.

## Server Information
- **Local URL**: http://localhost:3000
- **Network URL**: http://192.168.0.53:3000

---

## 🖥️ DESKTOP TESTING

### Test 1: Desktop Browser (Should show LANDING PAGE)
1. Open Chrome/Edge/Firefox
2. Navigate to `http://localhost:3000`
3. **Expected**: Full landing page with "Drouple" hero section
4. **Should NOT see**: Splash screen with loading animation

### Test 2: Desktop PWA (Should show SPLASH SCREEN)
1. Open Chrome/Edge
2. Navigate to `http://localhost:3000`
3. Look for install prompt or click address bar install icon
4. Click "Install" to add to desktop
5. Open the installed PWA app (not browser tab)
6. **Expected**: 
   - Splash screen with Drouple logo and loading animation
   - 2-second display, then redirect to login (/auth/signin) if not logged in
   - OR redirect to appropriate dashboard if logged in

### Test PWA Detection (Desktop)
Open browser dev tools and run:
```javascript
// Check PWA detection
console.log('Display mode:', window.matchMedia('(display-mode: standalone)').matches);
console.log('Is PWA:', window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone);
```

---

## 📱 MOBILE TESTING

### Test 3: Mobile Browser (Should show LANDING PAGE)

#### iOS Safari:
1. Open Safari on iPhone/iPad
2. Navigate to `http://192.168.0.53:3000`
3. **Expected**: Full landing page (may be slower loading)
4. **Should NOT see**: Splash screen

#### Android Chrome:
1. Open Chrome on Android
2. Navigate to `http://192.168.0.53:3000`
3. **Expected**: Full landing page
4. **Should NOT see**: Splash screen

### Test 4: Mobile PWA (Should show SPLASH SCREEN)

#### iOS Safari PWA:
1. Open Safari, navigate to `http://192.168.0.53:3000`
2. Tap Share button (square with arrow)
3. Tap "Add to Home Screen"
4. Name it "Drouple" and tap "Add"
5. **Close Safari completely**
6. Tap the Drouple icon on home screen
7. **Expected**:
   - Splash screen with logo and loading dots
   - 2-second display, then redirect
   - Full-screen app experience (no Safari UI)

#### Android Chrome PWA:
1. Open Chrome, navigate to `http://192.168.0.53:3000`
2. Look for "Add to Home Screen" prompt or tap menu → "Add to Home Screen"
3. Confirm installation
4. **Close Chrome app completely**
5. Tap Drouple app icon on home screen
6. **Expected**:
   - Splash screen with logo and loading animation
   - 2-second display, then redirect
   - Full-screen app experience (no Chrome UI)

### Test PWA Detection (Mobile)
Open browser dev tools (if available) or use remote debugging:
```javascript
// Check mobile PWA detection
console.log('Standalone (iOS):', window.navigator.standalone);
console.log('Display mode standalone:', window.matchMedia('(display-mode: standalone)').matches);
console.log('Display mode fullscreen:', window.matchMedia('(display-mode: fullscreen)').matches);
```

---

## 🧪 DEBUGGING

### If Splash Screen Shows in Browser (BUG):
- Check browser dev tools console for PWA detection logs
- Verify `isPWA` is `false` in browser mode

### If Splash Screen Doesn't Show in PWA (BUG):
- Check if app is truly in standalone mode
- Verify PWA installation was successful
- Check dev tools for `isPWA` detection results

### Authentication Testing:
- **Not logged in**: Should redirect to `/auth/signin`
- **Logged in as MEMBER**: Should redirect to `/dashboard`
- **Logged in as ADMIN**: Should redirect to `/admin`
- **Logged in as SUPER_ADMIN**: Should redirect to `/super`

---

## ✅ SUCCESS CRITERIA

| Scenario | Expected Behavior |
|----------|------------------|
| Desktop Browser | Landing page, no splash screen |
| Desktop PWA | Splash screen → redirect |
| Mobile Browser | Landing page, no splash screen |
| Mobile PWA | Splash screen → redirect |
| PWA + Not logged in | Splash → `/auth/signin` |
| PWA + Logged in | Splash → role-based dashboard |

---

## 📝 REPORTING RESULTS

Please test and report:
1. ✅/❌ Desktop browser shows landing page
2. ✅/❌ Desktop PWA shows splash screen
3. ✅/❌ Mobile browser shows landing page  
4. ✅/❌ Mobile PWA shows splash screen
5. ✅/❌ Redirects work correctly
6. Any unexpected behavior or errors