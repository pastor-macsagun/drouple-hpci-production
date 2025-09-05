# HPCI ChMS Mobile App

A React Native mobile application for HPCI Church Management System, built with Expo SDK 53 and the New Architecture.

## 📱 Features

- **Dashboard**: Quick stats and recent activity overview
- **Check-ins**: QR code scanning and manual check-in functionality
- **Directory**: Member search and contact management
- **Events**: RSVP management and event discovery
- **Announcements**: Church bulletin and important updates
- **Settings**: Profile management and app configuration

## 🚀 Tech Stack

- **Expo SDK 53** with development build
- **React Native 0.76.3** with New Architecture (Hermes + Fabric)
- **TypeScript** for type safety
- **Expo Router** for file-based navigation
- **React Query** with MMKV persistence for data management
- **FlashList** for performant scrolling lists
- **Expo Image** for optimized image loading

## 🛠 Prerequisites

- Node.js 18+ and npm 8+
- Expo CLI: `npm install -g @expo/cli eas-cli`
- iOS: Xcode 15+ and iOS Simulator
- Android: Android Studio with Android 13+ SDK

## 📋 Setup Checklist

### 1. Install Dependencies
```bash
cd apps/mobile
npm install
```

### 2. Environment Configuration
```bash
# Copy environment template
cp .env.example .env.local

# Configure variables
EXPO_PUBLIC_API_BASE=http://localhost:3000  # Your backend URL
EXPO_PUBLIC_BUILD_ENV=dev
```

### 3. Backend Requirements
Ensure the main HPCI ChMS backend is running with JWT authentication endpoints:
- `POST /api/auth/token` - JWT token issuance
- Authentication and user management APIs

### 4. First Build Setup

#### iOS Development
```bash
# Install development build
npx expo install --fix
npx expo run:ios

# Or build with EAS (requires Apple Developer account)
eas build --profile dev --platform ios
```

#### Android Development
```bash
# Install development build
npx expo run:android

# Or build with EAS
eas build --profile dev --platform android
```

## 🏃‍♂️ Development

### Start Development Server
```bash
npm start                    # Start Expo dev server
npm run start:dev           # Start with dev client
npm run start:tunnel        # Start with tunnel (for testing on physical devices)
```

### Platform-Specific Commands
```bash
npm run ios                 # Run on iOS simulator
npm run android             # Run on Android emulator
npm run web                 # Run on web (limited functionality)
```

### Testing
```bash
npm test                    # Run unit tests
npm run test:watch          # Run tests in watch mode
npm run test:coverage       # Run tests with coverage report
```

### Code Quality
```bash
npm run lint                # ESLint checks
npm run type-check          # TypeScript checks
npm run a11y-ci             # Accessibility validation
```

## 📁 Project Structure

```
apps/mobile/
├── src/
│   ├── app/                 # Expo Router pages
│   │   ├── (tabs)/         # Tab navigation screens
│   │   │   ├── home.tsx    # Dashboard
│   │   │   ├── checkins.tsx
│   │   │   ├── directory.tsx
│   │   │   ├── events.tsx
│   │   │   ├── announcements.tsx
│   │   │   └── settings.tsx
│   │   ├── (modals)/       # Modal screens
│   │   └── _layout.tsx     # Root layout
│   ├── components/         # Reusable components
│   │   ├── common/        # Common UI components
│   │   └── forms/         # Form components
│   ├── hooks/             # Custom React hooks
│   ├── lib/               # Utilities and services
│   │   ├── api/          # API client
│   │   ├── auth/         # Authentication
│   │   ├── storage/      # Local storage
│   │   └── performance/  # Performance utilities
│   └── types/             # TypeScript definitions
├── assets/                # Static assets
├── scripts/               # Build and utility scripts
└── app.config.js         # Expo configuration
```

## 🔧 Configuration Files

- `app.config.js` - Main Expo configuration
- `eas.json` - EAS Build profiles (dev/beta/prod)
- `babel.config.js` - Babel configuration
- `metro.config.js` - Metro bundler configuration
- `tsconfig.json` - TypeScript configuration

## 🚀 Building for Production

### Beta Build
```bash
# Build for internal testing
eas build --profile beta

# Submit to TestFlight/Internal Testing
eas submit --profile beta
```

### Production Build
```bash
# Build for app stores
eas build --profile prod

# Submit to App Store/Google Play
eas submit --profile prod
```

## 🔐 Authentication Flow

1. **Initial Setup**: User logs into web app and gets authenticated session
2. **JWT Token**: Mobile app requests JWT token from `POST /api/auth/token`
3. **Secure Storage**: Token stored in Expo SecureStore with biometric protection
4. **Silent Refresh**: Automatic token refresh before expiration
5. **Gentle Logout**: Graceful session cleanup on logout/expiration

## 🎯 Performance Features

- **React Query**: Intelligent caching and background updates
- **FlashList**: 60fps scrolling for large datasets
- **Image Optimization**: Automatic image caching and optimization
- **Bundle Analysis**: Monitoring bundle size and optimization
- **Memory Management**: Automatic cleanup and memory optimization

## ♿ Accessibility

- **WCAG 2.1 AA Compliance**: Full accessibility support
- **Dynamic Type**: Automatic font scaling support
- **Screen Reader**: VoiceOver and TalkBack compatibility
- **High Contrast**: Support for high contrast mode
- **Keyboard Navigation**: Full keyboard accessibility

## 🔍 Debugging

### React Native Debugger
```bash
# Install React Native Debugger
# Enable "Debug with Chrome" in development menu
```

### Flipper Integration
```bash
# Flipper is automatically configured for development builds
# Open Flipper app and connect to your running app
```

### Development Tools
- **React Query Devtools**: Built-in query debugging
- **Expo Dev Tools**: Web-based development interface
- **Metro Logs**: Real-time bundler logs

## 📱 Deep Linking

### Universal Links (iOS)
- Configure in Apple Developer Console
- Add associated domains in `app.config.js`

### App Links (Android)
- Configure Digital Asset Links
- Add intent filters in `app.config.js`

### URL Scheme
```
hpci-chms://home
hpci-chms://events/123
hpci-chms://checkin
```

## 🚨 Troubleshooting

### Common Issues

#### Build Failures
```bash
# Clear cache and reinstall
npx expo install --fix
rm -rf node_modules && npm install
```

#### Metro Issues
```bash
# Reset Metro cache
npx expo start --clear
```

#### iOS Simulator Issues
```bash
# Reset iOS Simulator
Device > Erase All Content and Settings
```

#### Android Emulator Issues
```bash
# Cold boot Android emulator
# Wipe emulator data in Android Studio
```

### Debug Logs
```bash
# View device logs
npx expo logs --type=device

# View Metro logs
npx expo logs --type=metro
```

## 📞 Support

- **Issues**: Report bugs and feature requests
- **Documentation**: Check Expo and React Native docs
- **Community**: Expo Discord and Stack Overflow

## 🔄 Version History

- **v1.0.0** - Initial release with core functionality
  - Dashboard, Check-ins, Directory, Events, Announcements, Settings
  - JWT authentication integration
  - Offline-first data synchronization
  - Full accessibility support

---

Built with ❤️ using Expo and React Native