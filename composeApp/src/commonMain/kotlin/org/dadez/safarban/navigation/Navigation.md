# ComposeApp Navigation & Decompose Wiring

This README explains how the app's enhanced navigation and lifecycle wiring work across Android and iOS.
It focuses on the `RootComponent` (Decompose router) initialization, deep linking support, navigation animations, and how platform entrypoints provide an Essenty lifecycle -> `DefaultComponentContext`.

## Overview
- The app uses Ark Ivanov's Decompose for component-based navigation with enhanced features
- A `RootComponent` owns a Decompose stack router (`childStack`) with proper back stack management
- Home, Details, Settings, and Profile are implemented as Decompose components exposing `StateFlow` UI state
- Direct component injection eliminates the need for navigation service abstraction
- Smooth slide animations enhance the user experience
- Deep linking support handles external navigation requests

## Enhanced Navigation Features

### 1. Proper Back Stack Management
- Uses `pushNew()` for forward navigation to maintain proper back stack
- Uses `bringToFront()` only for home navigation to clear the stack
- Uses `pop()` for back navigation
- Automatic back button handling on Android

### 2. Deep Linking Support
- `RootComponent.DeepLink` sealed class defines supported deep link types
- `handleDeepLink()` method processes external navigation requests
- Platform-specific deep link handling in MainActivity and MainViewController

### 3. Navigation Animations
- Smooth slide animations between screens using `stackAnimation(slide())`
- Enhances user experience with polished transitions

### 4. Simplified Architecture
- Removed NavigationService abstraction layer for better performance and simplicity
- Direct RootComponent injection into screens
- Cleaner dependency graph

## Core initialization (platforms)

### Android (in `MainActivity`) - enhanced
1. `MainActivity.onCreate()` creates an Essenty `AndroidLifecycle` from the Android `lifecycle`
2. `DefaultComponentContext(essentyLifecycle)` is created and passed into `RootComponent`
3. `RootComponent` constructs the Decompose router (`childStack`) with `initialConfiguration = Config.Home`
4. Deep link handling from Intent data via `handleIntent()` and `handleDeepLink()`
5. `setContent { RootApp(componentContext) }` is called with enhanced animations

Files:
- `composeApp/src/androidMain/kotlin/org/dadez/safarban/MainActivity.kt`
- `composeApp/src/commonMain/kotlin/org/dadez/safarban/navigation/RootComponent.kt`

### iOS (in `MainViewController`) - enhanced
1. `MainViewController()` (iOS) constructs an Essenty `LifecycleRegistry()` and forwards UIKit lifecycle events
2. `DefaultComponentContext(lifecycleRegistry)` is created and passed to `RootComponent`
3. Global `handleiOSDeepLink()` function processes URL schemes from iOS app delegate
4. `ComposeUIViewController { RootApp(componentContext) }` with enhanced animations

Files:
- `composeApp/src/iosMain/kotlin/org/dadez/safarban/MainViewController.kt`
- `composeApp/src/commonMain/kotlin/org/dadez/safarban/navigation/RootComponent.kt`

## `RootComponent` behavior - enhanced
- Uses `StackNavigation<Config>()` and `childStack(...)` with `initialConfiguration = Config.Home`
- `childFactory` creates component implementations using the `ctx` (child `ComponentContext`) and a `CoroutineScope`
- Enhanced navigation methods:
  - `navigateToHome()` - clears back stack
  - `navigateToDetails(id)` - pushes new screen to back stack
  - `navigateToSettings()` - pushes new screen to back stack
  - `navigateToProfile(userId)` - pushes new screen to back stack
  - `navigateBack()` - pops from back stack
  - `handleDeepLink(deepLink)` - processes external navigation
- Serializable configurations ensure state restoration works correctly
- Automatic back button handling

## `RootApp()` composable - simplified
- The Compose entrypoint is `@Composable fun RootApp(componentContext: ComponentContext)`
- Direct RootComponent instantiation without NavigationService abstraction
- Enhanced with smooth slide animations using `stackAnimation(slide())`
- Direct method references for navigation callbacks (e.g., `rootComponent::navigateToDetails`)
- Platform entrypoints create the ComponentContext and call `RootApp(componentContext)`

## Deep Linking

### Supported URL Patterns
- `/home` - Navigate to home screen
- `/details?id=<itemId>` - Navigate to details with specific item
- `/settings` - Navigate to settings screen
- `/profile?userId=<userId>` - Navigate to profile with specific user

### Platform Implementation
- **Android**: Handled in `MainActivity.handleDeepLink()` via Intent data
- **iOS**: Handled via `handleiOSDeepLink()` function called from app delegate

## Navigation Animations
- Smooth slide transitions between all screens
- Consistent animation timing and easing
- Enhances perceived performance and user experience

## How to run locally

Android (Android Studio):
1. Open the project in Android Studio and let Gradle sync
2. Run the `composeApp` module on an emulator or device
3. Test deep links using ADB:
   ```bash
   adb shell am start -W -a android.intent.action.VIEW -d "safarban://details?id=test123" org.dadez.safarban
   ```

From command line:
```bash
# Build debug APK for the composeApp module
./gradlew :composeApp:assembleDebug

# Install on a connected device/emulator
./gradlew :composeApp:installDebug
```

iOS (Xcode):
1. Open the iOS workspace/project under `iosApp` in Xcode
2. Gradle should build the Kotlin framework automatically
3. Run the iOS app in the Simulator
4. Test deep links via Simulator menu: Device -> URL Scheme

## Testing Deep Links

### Android
Add intent filter to AndroidManifest.xml:
```xml
<intent-filter>
    <action android:name="android.intent.action.VIEW" />
    <category android:name="android.intent.category.DEFAULT" />
    <category android:name="android.intent.category.BROWSABLE" />
    <data android:scheme="safarban" />
</intent-filter>
```

### iOS
Add URL scheme to Info.plist and call `handleiOSDeepLink()` from app delegate.

## Architecture Benefits
- ✅ Simplified dependency graph without NavigationService abstraction
- ✅ Better performance with direct component injection
- ✅ Enhanced user experience with smooth animations
- ✅ Robust deep linking support for external navigation
- ✅ Proper back stack management
- ✅ Cross-platform compatibility maintained
- ✅ State restoration support preserved

## Troubleshooting
- If the IDE shows unresolved references for Compose or Decompose, ensure Gradle sync completes
- The static checker used in automation may report unresolved imports; build with Gradle for accurate results
- For deep link testing, ensure URL schemes are properly configured in platform manifests
- Animation issues may indicate missing Decompose animation dependencies
