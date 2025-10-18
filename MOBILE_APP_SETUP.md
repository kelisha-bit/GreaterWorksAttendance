# React Native Mobile App - Setup Guide

## 🚀 Complete Setup Guide for Greater Works Mobile App

This guide will walk you through setting up a React Native mobile app for the Greater Works Attendance Tracker.

---

## 📋 Prerequisites

### Required Software

#### For Both iOS and Android:
- **Node.js** 16+ (LTS recommended)
- **npm** or **yarn**
- **Git**
- **VS Code** or preferred IDE
- **React Native CLI**

#### For iOS Development (Mac only):
- **macOS** (required for iOS development)
- **Xcode** 14+ (from Mac App Store)
- **CocoaPods** (dependency manager)
- **iOS Simulator** (included with Xcode)

#### For Android Development:
- **Android Studio**
- **Android SDK**
- **Android Emulator** or physical device
- **JDK** 11 or newer

### Developer Accounts
- **Apple Developer Account** ($99/year) - for iOS deployment
- **Google Play Developer Account** ($25 one-time) - for Android deployment
- **Firebase Project** (already set up)

---

## 🛠️ Environment Setup

### Step 1: Install Node.js and npm
```bash
# Check if already installed
node --version  # Should be 16+
npm --version

# If not installed, download from:
# https://nodejs.org/
```

### Step 2: Install React Native CLI
```bash
# Install globally
npm install -g react-native-cli

# Verify installation
react-native --version
```

### Step 3: Install Watchman (Mac/Linux)
```bash
# Mac (using Homebrew)
brew install watchman

# Linux
# Follow instructions at: https://facebook.github.io/watchman/docs/install
```

---

## 🍎 iOS Setup (Mac Only)

### Step 1: Install Xcode
1. Download Xcode from Mac App Store
2. Install Xcode Command Line Tools:
```bash
xcode-select --install
```

### Step 2: Install CocoaPods
```bash
# Install CocoaPods
sudo gem install cocoapods

# Verify installation
pod --version
```

### Step 3: Configure Xcode
1. Open Xcode
2. Go to Preferences → Locations
3. Set Command Line Tools to your Xcode version
4. Accept license agreement:
```bash
sudo xcodebuild -license
```

---

## 🤖 Android Setup

### Step 1: Install Android Studio
1. Download from: https://developer.android.com/studio
2. Run installer and follow setup wizard
3. Install Android SDK, SDK Platform, and Android Virtual Device

### Step 2: Configure Environment Variables

**Windows (PowerShell):**
```powershell
# Add to your PowerShell profile or system environment variables
$env:ANDROID_HOME = "C:\Users\YourUsername\AppData\Local\Android\Sdk"
$env:PATH += ";$env:ANDROID_HOME\platform-tools"
$env:PATH += ";$env:ANDROID_HOME\tools"
```

**Mac/Linux (Bash/Zsh):**
```bash
# Add to ~/.bash_profile or ~/.zshrc
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/platform-tools
export PATH=$PATH:$ANDROID_HOME/tools
export PATH=$PATH:$ANDROID_HOME/tools/bin

# Reload profile
source ~/.bash_profile  # or source ~/.zshrc
```

### Step 3: Install Android SDK Components
1. Open Android Studio
2. Go to Tools → SDK Manager
3. Install:
   - Android SDK Platform 33 (or latest)
   - Android SDK Build-Tools
   - Android Emulator
   - Android SDK Platform-Tools

### Step 4: Create Android Virtual Device (AVD)
1. Open Android Studio
2. Go to Tools → Device Manager
3. Create Virtual Device
4. Select a device (e.g., Pixel 5)
5. Download and select a system image (e.g., Android 13)
6. Finish setup

---

## 📱 Create React Native Project

### Option 1: React Native CLI (Recommended)

```bash
# Navigate to your projects directory
cd Desktop

# Create new React Native project
npx react-native init GreaterWorksMobile --template react-native-template-typescript

# Navigate to project
cd GreaterWorksMobile
```

### Option 2: Expo (Easier but limited)

```bash
# Install Expo CLI
npm install -g expo-cli

# Create new Expo project
expo init GreaterWorksMobile

# Select template: blank (TypeScript)

# Navigate to project
cd GreaterWorksMobile
```

---

## 🔧 Install Dependencies

### Core Dependencies
```bash
# Navigation
npm install @react-navigation/native @react-navigation/stack @react-navigation/bottom-tabs @react-navigation/drawer
npm install react-native-screens react-native-safe-area-context
npm install react-native-gesture-handler react-native-reanimated

# Firebase
npm install @react-native-firebase/app @react-native-firebase/auth @react-native-firebase/firestore @react-native-firebase/storage @react-native-firebase/messaging

# UI Components
npm install react-native-paper react-native-vector-icons

# Camera & QR Code
npm install react-native-camera react-native-qrcode-scanner
npm install react-native-permissions

# Storage
npm install @react-native-async-storage/async-storage

# Other utilities
npm install react-native-image-picker
npm install date-fns
npm install react-native-toast-message
```

### iOS Pod Installation
```bash
# Navigate to iOS folder
cd ios

# Install pods
pod install

# Go back to root
cd ..
```

---

## 🔥 Firebase Configuration

### Step 1: Create Firebase Apps

1. Go to Firebase Console: https://console.firebase.google.com
2. Select your project: `gwccapp-fc67c`
3. Add iOS app:
   - iOS bundle ID: `com.greaterworks.attendance`
   - Download `GoogleService-Info.plist`
4. Add Android app:
   - Android package name: `com.greaterworks.attendance`
   - Download `google-services.json`

### Step 2: Configure iOS

```bash
# Copy GoogleService-Info.plist to iOS folder
# Place it in: ios/GreaterWorksMobile/GoogleService-Info.plist
```

Update `ios/GreaterWorksMobile/AppDelegate.mm`:
```objc
#import <Firebase.h>

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
  [FIRApp configure];  // Add this line
  // ... rest of the code
}
```

### Step 3: Configure Android

```bash
# Copy google-services.json to Android folder
# Place it in: android/app/google-services.json
```

Update `android/build.gradle`:
```gradle
buildscript {
  dependencies {
    // Add this line
    classpath 'com.google.gms:google-services:4.3.15'
  }
}
```

Update `android/app/build.gradle`:
```gradle
// Add at the bottom of the file
apply plugin: 'com.google.gms.google-services'
```

---

## 📁 Project Structure

```
GreaterWorksMobile/
├── android/                 # Android native code
├── ios/                     # iOS native code
├── src/
│   ├── components/          # Reusable components
│   │   ├── common/         # Common UI components
│   │   ├── attendance/     # Attendance components
│   │   └── members/        # Member components
│   ├── screens/            # App screens
│   │   ├── Auth/
│   │   │   ├── LoginScreen.tsx
│   │   │   └── RegisterScreen.tsx
│   │   ├── Dashboard/
│   │   │   └── DashboardScreen.tsx
│   │   ├── Attendance/
│   │   │   ├── AttendanceListScreen.tsx
│   │   │   ├── QRScannerScreen.tsx
│   │   │   └── MarkAttendanceScreen.tsx
│   │   ├── Members/
│   │   │   ├── MembersListScreen.tsx
│   │   │   └── MemberProfileScreen.tsx
│   │   ├── MyPortal/
│   │   │   └── MyPortalScreen.tsx
│   │   └── Settings/
│   │       └── SettingsScreen.tsx
│   ├── navigation/         # Navigation configuration
│   │   ├── AppNavigator.tsx
│   │   ├── AuthNavigator.tsx
│   │   └── MainNavigator.tsx
│   ├── services/           # API and services
│   │   ├── firebase.ts
│   │   ├── auth.ts
│   │   ├── firestore.ts
│   │   └── storage.ts
│   ├── contexts/           # React contexts
│   │   ├── AuthContext.tsx
│   │   └── ThemeContext.tsx
│   ├── hooks/              # Custom hooks
│   │   ├── useAuth.ts
│   │   ├── useFirestore.ts
│   │   └── useCamera.ts
│   ├── utils/              # Utility functions
│   │   ├── helpers.ts
│   │   ├── validators.ts
│   │   └── constants.ts
│   ├── types/              # TypeScript types
│   │   ├── models.ts
│   │   └── navigation.ts
│   └── assets/             # Images, fonts, etc.
│       ├── images/
│       ├── fonts/
│       └── icons/
├── App.tsx                 # Root component
├── package.json
└── tsconfig.json
```

---

## 🎨 Configure Theme and Branding

### Create Theme File: `src/utils/theme.ts`

```typescript
import { MD3LightTheme } from 'react-native-paper';

export const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#D4AF37',        // Church Gold
    secondary: '#1a1a1a',      // Dark
    background: '#FFFFFF',     // White
    surface: '#F5F5F5',        // Light Gray
    error: '#B00020',
    text: '#000000',
    onPrimary: '#FFFFFF',
    onSecondary: '#FFFFFF',
    onBackground: '#000000',
    onSurface: '#000000',
  },
  roundness: 8,
};

export const colors = {
  churchGold: '#D4AF37',
  churchDarkGold: '#B8941F',
  churchLightGold: '#F5E6C3',
  white: '#FFFFFF',
  black: '#000000',
  gray: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
  },
};
```

---

## 🔐 Configure Permissions

### iOS: `ios/GreaterWorksMobile/Info.plist`

```xml
<key>NSCameraUsageDescription</key>
<string>We need camera access to scan QR codes for attendance</string>
<key>NSPhotoLibraryUsageDescription</key>
<string>We need photo library access to upload profile pictures</string>
<key>NSLocationWhenInUseUsageDescription</key>
<string>We need location access to verify attendance location</string>
```

### Android: `android/app/src/main/AndroidManifest.xml`

```xml
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
```

---

## 🏃 Running the App

### iOS
```bash
# Start Metro bundler
npm start

# In another terminal, run iOS
npm run ios

# Or specify device
npm run ios -- --simulator="iPhone 14 Pro"
```

### Android
```bash
# Start Metro bundler
npm start

# In another terminal, run Android
npm run android

# Or specify device
npm run android -- --deviceId=emulator-5554
```

### Troubleshooting

**iOS Build Fails:**
```bash
cd ios
pod deintegrate
pod install
cd ..
npm run ios
```

**Android Build Fails:**
```bash
cd android
./gradlew clean
cd ..
npm run android
```

**Metro Bundler Issues:**
```bash
npm start -- --reset-cache
```

---

## 📦 Build for Production

### iOS Production Build

```bash
# 1. Open Xcode
open ios/GreaterWorksMobile.xcworkspace

# 2. Select "Any iOS Device" as target
# 3. Product → Archive
# 4. Distribute App → App Store Connect
# 5. Follow upload wizard
```

### Android Production Build

```bash
# 1. Generate signing key
cd android/app
keytool -genkeypair -v -storetype PKCS12 -keystore greaterworks-release.keystore -alias greaterworks -keyalg RSA -keysize 2048 -validity 10000

# 2. Configure gradle.properties
# Add keystore details

# 3. Build release APK
cd ../..
cd android
./gradlew assembleRelease

# 4. Build release AAB (for Play Store)
./gradlew bundleRelease

# Output: android/app/build/outputs/bundle/release/app-release.aab
```

---

## 🧪 Testing

### Unit Tests
```bash
# Run Jest tests
npm test

# With coverage
npm test -- --coverage
```

### E2E Tests (Detox)
```bash
# Install Detox
npm install -g detox-cli
npm install --save-dev detox

# Build for testing
detox build --configuration ios.sim.debug

# Run tests
detox test --configuration ios.sim.debug
```

---

## 📱 App Icons and Splash Screen

### Generate Icons

Use a tool like:
- **App Icon Generator**: https://appicon.co/
- **Icon Kitchen**: https://icon.kitchen/

Required sizes:
- **iOS**: 1024x1024 (App Store), various sizes for app
- **Android**: 512x512 (Play Store), various densities

### Configure Splash Screen

```bash
# Install splash screen package
npm install react-native-splash-screen

# Configure for iOS and Android
# Follow package documentation
```

---

## 🔔 Push Notifications Setup

### Firebase Cloud Messaging

```bash
# Install FCM
npm install @react-native-firebase/messaging

# iOS: Enable push notifications in Xcode
# 1. Open Xcode
# 2. Select target → Signing & Capabilities
# 3. Add "Push Notifications" capability

# Android: Already configured with google-services.json
```

### Request Permissions

```typescript
import messaging from '@react-native-firebase/messaging';

async function requestUserPermission() {
  const authStatus = await messaging().requestPermission();
  const enabled =
    authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
    authStatus === messaging.AuthorizationStatus.PROVISIONAL;

  if (enabled) {
    console.log('Authorization status:', authStatus);
  }
}
```

---

## 📊 Analytics and Monitoring

### Firebase Analytics
```bash
npm install @react-native-firebase/analytics
```

### Crashlytics
```bash
npm install @react-native-firebase/crashlytics
```

### Performance Monitoring
```bash
npm install @react-native-firebase/perf
```

---

## 🚀 Deployment Checklist

### Pre-Launch
- [ ] All features tested on iOS
- [ ] All features tested on Android
- [ ] Performance optimized
- [ ] No console warnings
- [ ] Privacy policy created
- [ ] Terms of service created
- [ ] App icons generated
- [ ] Screenshots prepared
- [ ] App description written

### iOS App Store
- [ ] Apple Developer account active
- [ ] App ID created
- [ ] Provisioning profiles configured
- [ ] App archived in Xcode
- [ ] Uploaded to App Store Connect
- [ ] Metadata completed
- [ ] Screenshots uploaded
- [ ] Submitted for review

### Google Play Store
- [ ] Google Play Developer account active
- [ ] App signed with release key
- [ ] AAB file generated
- [ ] Uploaded to Play Console
- [ ] Store listing completed
- [ ] Screenshots uploaded
- [ ] Content rating completed
- [ ] Submitted for review

---

## 📚 Additional Resources

### Official Documentation
- React Native: https://reactnative.dev/
- React Navigation: https://reactnavigation.org/
- Firebase for React Native: https://rnfirebase.io/

### Tutorials
- React Native Tutorial: https://reactnative.dev/docs/tutorial
- Firebase Setup: https://rnfirebase.io/#installation
- App Store Submission: https://developer.apple.com/app-store/submissions/
- Play Store Submission: https://support.google.com/googleplay/android-developer/

### Community
- React Native Community: https://github.com/react-native-community
- Stack Overflow: https://stackoverflow.com/questions/tagged/react-native
- Reddit: https://reddit.com/r/reactnative

---

## 🆘 Common Issues and Solutions

### Issue: Metro Bundler Won't Start
```bash
# Clear cache
npm start -- --reset-cache

# Or
watchman watch-del-all
rm -rf node_modules
npm install
```

### Issue: iOS Build Fails
```bash
# Clean and rebuild
cd ios
rm -rf Pods Podfile.lock
pod install
cd ..
npm run ios
```

### Issue: Android Build Fails
```bash
# Clean Gradle
cd android
./gradlew clean
cd ..

# Clear cache
rm -rf android/app/build
npm run android
```

### Issue: Firebase Not Working
- Verify `GoogleService-Info.plist` is in correct location
- Verify `google-services.json` is in correct location
- Check Firebase console for app configuration
- Ensure Firebase SDK versions match

---

## ✅ Next Steps

After setup is complete:

1. **Review** `MOBILE_APP_FEATURES.md` for feature implementation
2. **Follow** `MOBILE_APP_COMPONENTS.md` for component development
3. **Use** `MOBILE_APP_DEPLOYMENT.md` for deployment process
4. **Test** thoroughly on both platforms
5. **Deploy** to app stores

---

**Setup Version:** 1.0  
**Last Updated:** October 2024  
**Status:** Ready for Development
