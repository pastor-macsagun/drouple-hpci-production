# Drouple Mobile

A React Native mobile application for the Drouple church management system, built with Expo and TypeScript.

## 📱 Features

- **TypeScript Strict Mode**: Full type safety with advanced TypeScript configuration
- **Material Design 3**: Using React Native Paper with custom Drouple branding
- **Offline-First**: Built for reliability with local data storage and sync
- **Multi-Platform**: iOS, Android, and web support via Expo
- **Modern Stack**: Latest React Native, TanStack Query, Zustand, and more

## 🛠 Tech Stack

### Core

- **React Native** 0.79.6 with **React** 19.0.0
- **Expo SDK** 53+ for simplified development and deployment
- **TypeScript** 5.8+ with strict mode and advanced checks

### UI & Design

- **React Native Paper** 5.14+ (Material Design 3)
- **Sacred Blue (#1e7ce8)** + **Soft Gold (#e5c453)** brand colors
- **Responsive Design** with platform-specific adaptations

### Navigation & State

- **React Navigation** 7 (Native Stack + Bottom Tabs)
- **Zustand** for lightweight state management
- **TanStack Query** for server state and caching

### Development Tools

- **ESLint** + **Prettier** for code quality
- **Jest** + **React Native Testing Library** for testing
- **TypeScript Path Aliases** (@/\* imports)

### Native Features

- **expo-secure-store** - Secure token storage
- **expo-sqlite** - Local database for offline support
- **expo-camera** - QR code scanning for check-ins
- **expo-notifications** - Push notifications
- **expo-local-authentication** - Biometric authentication
- **expo-device** & **expo-network** - Device info and connectivity

## 📁 Project Structure

```
src/
├── app/                    # Navigation setup
├── components/             # Reusable UI components
│   └── common/            # Common components (Button, etc.)
├── features/              # Feature-based organization
│   ├── auth/             # Authentication
│   ├── checkin/          # Sunday check-in system
│   ├── events/           # Events & RSVP
│   ├── notifications/    # Push notifications
│   ├── dashboard/        # Role-based dashboards
│   ├── directory/        # Member directory
│   ├── pathways/         # Discipleship pathways
│   ├── groups/           # Life groups
│   └── reports/          # Analytics & reports
├── lib/                   # Core utilities
│   ├── api/              # TanStack Query & API client
│   ├── db/               # SQLite database
│   ├── net/              # Network utilities
│   └── store/            # Zustand stores
├── config/               # App configuration
│   ├── endpoints.ts      # API endpoints
│   └── featureFlags.ts   # Feature toggles
├── theme/                # Design system
│   ├── colors.ts         # Brand colors
│   └── paperTheme.ts     # Material Design 3 theme
├── utils/                # Utility functions
├── types/                # TypeScript definitions
└── tests/                # Test setup and utilities
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Expo CLI: `npm install -g @expo/cli`
- iOS Simulator (Mac) or Android Emulator

### Installation

```bash
# Clone and install dependencies
git clone <repository-url>
cd drouple-mobile
npm install

# Start the development server
npm run start

# Run on specific platforms
npm run ios      # iOS Simulator
npm run android  # Android Emulator
npm run web      # Web browser
```

### Development Scripts

```bash
# Development
npm run dev                 # Start with dev client
npm run start              # Standard Expo start

# Code Quality
npm run typecheck          # TypeScript type checking
npm run lint               # ESLint with auto-fix
npm run lint:check         # ESLint check only
npm run format             # Prettier formatting
npm run format:check       # Prettier check only

# Testing
npm run test               # Run Jest tests
npm run test:watch         # Watch mode
npm run test:coverage      # With coverage report

# Build
npm run build              # Build for production
npm run build:android      # Android build
npm run build:ios          # iOS build
npm run prebuild           # Generate native code

# Maintenance
npm run clean              # Clear Expo cache
npm run reset              # Reset and reinstall
```

## 🎨 Design System

### Brand Colors

- **Primary**: Sacred Blue (#1e7ce8)
- **Secondary**: Soft Gold (#e5c453)
- **Error**: #ba1a1a
- **Success**: #006e1c
- **Warning**: #ff8f00

### Typography

- **iOS**: SF Pro Display (system font)
- **Android**: Roboto (system font)
- **Material Design 3** typography scale

## 🔧 Configuration

### Feature Flags

Control features via `src/config/featureFlags.ts`:

```typescript
export const featureFlags = {
  biometricAuth: true,
  checkinSystem: true,
  eventRsvp: true,
  // ... more features
};
```

### API Endpoints

Configure API endpoints in `src/config/endpoints.ts`:

```typescript
const API_BASE_URL = __DEV__
  ? 'http://localhost:3000'
  : 'https://api.drouple.com';
```

## 📱 Platform Support

### iOS

- iOS 13.0+
- Face ID / Touch ID support
- Native navigation feel
- SF Pro font system

### Android

- Android 6.0+ (API 23+)
- Fingerprint authentication
- Material Design 3
- Roboto font system

### Web (PWA)

- Modern browsers
- Responsive design
- Progressive Web App features

## 🧪 Testing

### Test Setup

- **Jest** with Expo preset
- **React Native Testing Library**
- **Comprehensive mocking** for Expo modules
- **Coverage thresholds** (50% minimum)

### Running Tests

```bash
npm run test              # Run all tests
npm run test:watch        # Watch mode
npm run test:coverage     # With coverage
```

## 🔐 Security

### Authentication

- JWT token storage in secure keychain
- Biometric authentication (Face ID, Touch ID, Fingerprint)
- Automatic token refresh
- Session management

### Data Protection

- Encrypted local storage
- HTTPS/TLS only
- No sensitive data in logs
- Secure API communication

## 🚀 Deployment

### Development

```bash
npm run start            # Local development
```

### Production Build

```bash
npm run build:android    # Android APK/AAB
npm run build:ios        # iOS IPA
```

### Over-the-Air Updates

Expo OTA updates for JavaScript changes without app store releases.

## 🤝 Development Guidelines

### Code Style

- **TypeScript strict mode** with advanced checks
- **ESLint** + **Prettier** for consistent formatting
- **Conventional commits** for changelog generation
- **Feature-based** folder structure

### Best Practices

- **Offline-first** architecture
- **Role-based access control** (RBAC)
- **Tenant isolation** for multi-church support
- **Performance optimization** with React Query caching
- **Accessibility** compliance (WCAG 2.1 AA)

## 📚 Documentation

- [Feature Flags](src/config/featureFlags.ts) - Feature toggle configuration
- [API Endpoints](src/config/endpoints.ts) - Backend API configuration
- [Theme System](src/theme/) - Design system and branding
- [Testing Setup](tests/setup.ts) - Test configuration and mocks

## 🔄 Roadmap

### MVP Phase 1 (Current)

- ✅ Project setup and configuration
- ⏳ Authentication system
- ⏳ Check-in system with QR codes
- ⏳ Basic navigation and routing

### MVP Phase 2 (Next)

- Events and RSVP system
- Discipleship pathways
- Member directory
- Push notifications

### Future Phases

- Life groups management
- Reports and analytics
- Dark mode support
- Offline synchronization

## 📄 License

This project is proprietary software for Drouple church management system.

---

**Built with ❤️ for church communities worldwide**
