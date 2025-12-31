# Safarban - Maritime Fleet Management

A React Native mobile application for managing maritime vessel operations, voyages, and document processing.

## Features

- **Fleet Overview**: View and manage your vessel fleet with real-time status
- **Voyage Management**: Create, track, and manage vessel voyages with ports and cargo
- **Document Processing**: Upload and process maritime documents with AI-powered extraction
- **Charter Party Management**: Handle time charter and voyage charter contracts
- **Noon Reports**: Track vessel status and operational reports

## Prerequisites

Before running the app, ensure you have the following installed:

- **Node.js** (v18 or higher)
- **npm** or **yarn**
- **Expo CLI**: `npm install -g expo-cli`

### For iOS Development
- **macOS** (required)
- **Xcode** (latest version from App Store)
- **CocoaPods**: `sudo gem install cocoapods`

### For Android Development
- **Android Studio** with Android SDK
- **Java Development Kit (JDK)** 17 or higher
- Android Emulator or physical device

## Environment Setup

Create a `.env` file in the root directory with the following variables:

```env
# API Configuration
EXPO_PUBLIC_API_URL=https://your-api-url.com

# Optional: Disable authentication for development
# EXPO_PUBLIC_DISABLE_AUTHENTICATION=true
```

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `EXPO_PUBLIC_API_URL` | Yes | Backend API URL (defaults to `https://w-shipping-api.onrender.com`) |
| `EXPO_PUBLIC_DISABLE_AUTHENTICATION` | No | Set to `true` to bypass login during development |

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd mobile-apps-team-07
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Install iOS dependencies** (macOS only)
   ```bash
   cd ios && pod install && cd ..
   ```

## Running the App

### iOS (macOS only)

```bash
# Run on iOS Simulator
npx expo run:ios

# Run on specific simulator
npx expo run:ios --device "iPhone 15 Pro"

# List available simulators
xcrun simctl list devices
```

### Android

```bash
# Run on Android Emulator or connected device
npx expo run:android

# Run on specific device
npx expo run:android --device
```

### Development Server (Expo Go)

```bash
# Start the Expo development server
npx expo start

# Then scan the QR code with:
# - iOS: Camera app
# - Android: Expo Go app
```

## Troubleshooting

### iOS Issues

- **Pod install fails**: Run `cd ios && pod install --repo-update && cd ..`
- **Build fails**: Open `ios/Safarban.xcworkspace` in Xcode and check for errors
- **Simulator not found**: Run `xcrun simctl list devices` to see available simulators

### Android Issues

- **Token/Auth errors**: Clear app data: `adb shell pm clear com.dadez.Safarban`
- **Build fails**: Run `cd android && ./gradlew clean && cd ..` then rebuild
- **Emulator networking issues**: Ensure emulator has internet access

### General Issues

- **Session expired errors**: Log out, force close app, log in again
- **API connection issues**: Verify `EXPO_PUBLIC_API_URL` in `.env` file
- **Cache issues**: Clear Metro cache: `npx expo start --clear`

## Project Structure

```
mobile-apps-team-07/
├── app/                    # App screens (file-based routing)
│   ├── (tabs)/            # Tab navigation screens
│   ├── document-processing/ # Document upload & review
│   └── vessel/            # Vessel details & voyages
├── components/            # Reusable UI components
│   ├── common/           # Shared components (Loader, ThemedView, etc.)
│   ├── vessel/           # Vessel-specific components
│   └── voyage/           # Voyage-specific components
├── hooks/                # Custom React hooks
│   └── queries/          # React Query hooks for API
├── services/             # API services and business logic
├── types/                # TypeScript type definitions
├── context/              # React Context providers
├── lib/                  # Utility functions and database
├── constants/            # App constants and configuration
├── android/              # Android native code
└── ios/                  # iOS native code
```

## Tech Stack

- **Framework**: React Native with Expo
- **Navigation**: Expo Router (file-based routing)
- **Styling**: NativeWind (Tailwind CSS for React Native)
- **State Management**: React Query (TanStack Query)
- **Storage**: Expo SecureStore (tokens), SQLite (cache)
- **UI Components**: Custom components with Lucide icons

## Team

Mobile Applications Project - Team 07

## License

This project is part of an academic course assignment.
