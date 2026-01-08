# Safarban - Maritime Fleet Management

A React Native mobile application for managing maritime vessel operations, voyages, documents, and real-time vessel tracking.

## Features

- **Fleet Overview**: View and manage your vessel fleet with real-time status and position tracking
- **Voyage Management**: Create, track, and manage vessel voyages with ports and cargo
- **Document Processing**: Upload and process maritime documents (Q88, Form C) with AI-powered extraction
- **Charter Party Management**: Handle time charter and voyage charter contracts
- **Noon Reports**: Track vessel status, fuel consumption (ROB), and water inventory
- **Performance KPIs**: Compare actual vs charter party performance (speed, fuel, cargo temp)
- **Invoice Management**: View and manage voyage-related invoices

## Quick Start

### Prerequisites

- **Node.js** v18 or higher
- **npm** or **yarn**
- **Expo CLI**: `npm install -g expo-cli`

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd mobile-apps-team-07

# Install dependencies
npm install
```

## Running on iOS

### Requirements
- macOS (required for iOS development)
- Xcode (latest version from App Store)
- CocoaPods: `sudo gem install cocoapods`

### Steps

```bash
# Install iOS dependencies (first time only)
cd ios && pod install && cd ..

# Run on iOS Simulator
npx expo run:ios

# Run on specific simulator
npx expo run:ios --device "iPhone 15 Pro"

# List available simulators
xcrun simctl list devices
```

### iOS Troubleshooting

| Issue | Solution |
|-------|----------|
| Pod install fails | `cd ios && pod install --repo-update && cd ..` |
| Build fails | Open `ios/Safarban.xcworkspace` in Xcode and check errors |
| Simulator not found | `xcrun simctl list devices` |
| Map not showing | Ensure location permissions are granted |

## Running on Android

### Requirements
- Android Studio with Android SDK
- Java Development Kit (JDK) 17 or higher
- Android Emulator or physical device with USB debugging enabled

### Steps

```bash
# Run on Android Emulator or connected device
npx expo run:android

# Run on specific device
npx expo run:android --device

# List connected devices
adb devices
```

### Android Troubleshooting

| Issue | Solution |
|-------|----------|
| Build fails | `cd android && ./gradlew clean && cd ..` then rebuild |
| Token/Auth errors | Clear app data: `adb shell pm clear com.dadez.Safarban` |
| Emulator networking | Ensure emulator has internet access |
| SDK not found | Set `ANDROID_HOME` environment variable |

## Development Server (Expo Go)

For quick development without native builds:

```bash
# Start the Expo development server
npx expo start

# Then scan the QR code with:
# - iOS: Camera app
# - Android: Expo Go app
```

**Note**: Some native features may not work in Expo Go. Use `npx expo run:ios` or `npx expo run:android` for full functionality.

## Environment Configuration

Create a `.env` file in the root directory:

```env
# API Configuration (required)
EXPO_PUBLIC_API_URL=https://w-shipping-api.onrender.com

# Development options
EXPO_PUBLIC_DISABLE_AUTHENTICATION=false
```

| Variable | Required | Description |
|----------|----------|-------------|
| `EXPO_PUBLIC_API_URL` | Yes | Backend API URL |
| `EXPO_PUBLIC_DISABLE_AUTHENTICATION` | No | Set `true` to bypass login |

## App Usage Guide

### Login
- Use your credentials to log in
- Default test account: `admin@safarban.be` / `admin123`

### Fleet Overview
- View all vessels in your fleet
- Tap a vessel to see details
- Pull down to refresh

### Vessel Details
- **Overview Tab**: Position on map, performance KPIs, latest noon report data
- **Specs Tab**: Upload required documents (Q88, Form C for gas carriers)
- **Voyages Tab**: View and manage vessel voyages
- **Invoices Tab**: View voyage-related invoices

### Document Upload
1. Go to vessel's Specs tab
2. Tap "Upload" on Q88 or Form C
3. Select PDF file (max 25MB)
4. Document is processed automatically

### Performance vs Charter Party
The overview shows real-time comparison:
- **Speed**: Actual vs charter party speed (kts)
- **Fuel Cons.**: Daily consumption vs allowance (MT/day)
- **Cargo Temp**: Actual vs required temperature (°C)

## Running Tests

```bash
# Run all tests
npm test

# Run tests with coverage
npm test -- --coverage

# Run specific test file
npm test -- --testPathPattern="hooks"
```

## Project Structure

```
mobile-apps-team-07/
├── app/                    # App screens (file-based routing)
│   ├── (tabs)/            # Tab navigation (fleet, invoices, profile)
│   ├── document-processing/ # Document upload & review
│   └── vessel/            # Vessel details & voyages
├── components/            # Reusable UI components
│   ├── common/           # Shared components (Loader, Card, etc.)
│   ├── vessel/           # Vessel-specific components
│   └── voyage/           # Voyage-specific components
├── hooks/                # Custom React hooks
│   └── queries/          # React Query hooks for API
├── services/             # API services and business logic
├── types/                # TypeScript type definitions
├── context/              # React Context providers
├── lib/                  # Utility functions and database
└── __tests__/            # Test files
```

## Tech Stack

| Category | Technology |
|----------|------------|
| Framework | React Native with Expo |
| Navigation | Expo Router (file-based) |
| Styling | NativeWind (Tailwind CSS) |
| State Management | React Query (TanStack) |
| Storage | SecureStore (tokens), SQLite (cache) |
| Maps | React Native Maps |
| Icons | Lucide React Native |

## Common Issues

### Session Expired
Log out, force close the app, and log in again.

### API Connection Issues
1. Check `EXPO_PUBLIC_API_URL` in `.env`
2. Verify backend is running
3. Check network connectivity

### Cache Issues
Clear Metro cache: `npx expo start --clear`

### Build Issues
```bash
# Clean and rebuild
rm -rf node_modules
npm install
cd ios && pod install && cd ..
npx expo run:ios
```

## Team

Mobile Applications Project - Team 07

## License

This project is part of an academic course assignment.
