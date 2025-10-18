# Mobile App - Quick Start Guide

## 🚀 Get Started with Greater Works Mobile App

Quick reference guide for developing the React Native mobile app.

---

## 📱 Quick Setup (5 Minutes)

### Prerequisites
```bash
# Check Node.js
node --version  # Should be 16+

# Install React Native CLI
npm install -g react-native-cli
```

### Create Project
```bash
# Create new React Native project
npx react-native init GreaterWorksMobile --template react-native-template-typescript

# Navigate to project
cd GreaterWorksMobile

# Install dependencies
npm install
```

### Run App
```bash
# iOS (Mac only)
npm run ios

# Android
npm run android
```

---

## 🔥 Firebase Setup (10 Minutes)

### 1. Install Firebase
```bash
npm install @react-native-firebase/app @react-native-firebase/auth @react-native-firebase/firestore @react-native-firebase/storage
```

### 2. iOS Configuration
```bash
# Download GoogleService-Info.plist from Firebase Console
# Place in: ios/GreaterWorksMobile/

# Install pods
cd ios && pod install && cd ..
```

### 3. Android Configuration
```bash
# Download google-services.json from Firebase Console
# Place in: android/app/
```

---

## 🎨 Essential Dependencies

### Navigation
```bash
npm install @react-navigation/native @react-navigation/stack @react-navigation/bottom-tabs
npm install react-native-screens react-native-safe-area-context react-native-gesture-handler
```

### UI Components
```bash
npm install react-native-paper react-native-vector-icons
```

### Camera & QR
```bash
npm install react-native-camera react-native-qrcode-scanner
```

### Storage
```bash
npm install @react-native-async-storage/async-storage
```

---

## 📁 Project Structure

```
src/
├── screens/          # App screens
├── components/       # Reusable components
├── navigation/       # Navigation setup
├── services/         # API services
├── contexts/         # React contexts
├── hooks/            # Custom hooks
├── utils/            # Utilities
└── assets/           # Images, fonts
```

---

## 🔐 Quick Auth Setup

### Create AuthContext
```typescript
// src/contexts/AuthContext.tsx
import auth from '@react-native-firebase/auth';

export const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const subscriber = auth().onAuthStateChanged(setUser);
    return subscriber;
  }, []);

  const login = async (email, password) => {
    await auth().signInWithEmailAndPassword(email, password);
  };

  const logout = async () => {
    await auth().signOut();
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
```

---

## 📱 Quick Screen Template

```typescript
// src/screens/DashboardScreen.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Button } from 'react-native-paper';

const DashboardScreen = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Dashboard</Text>
      <Button mode="contained" onPress={() => navigation.navigate('Attendance')}>
        Mark Attendance
      </Button>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
});

export default DashboardScreen;
```

---

## 🧭 Quick Navigation Setup

```typescript
// src/navigation/AppNavigator.tsx
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

const Stack = createStackNavigator();

const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Dashboard" component={DashboardScreen} />
        <Stack.Screen name="Attendance" component={AttendanceScreen} />
        <Stack.Screen name="Members" component={MembersScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};
```

---

## 📸 Quick QR Scanner

```typescript
// src/screens/QRScannerScreen.tsx
import { RNCamera } from 'react-native-camera';

const QRScannerScreen = () => {
  const onBarCodeRead = (scanResult) => {
    console.log('QR Code:', scanResult.data);
    // Mark attendance
  };

  return (
    <RNCamera
      style={{ flex: 1 }}
      onBarCodeRead={onBarCodeRead}
      barCodeTypes={[RNCamera.Constants.BarCodeType.qr]}
    />
  );
};
```

---

## 🎨 Quick Theme Setup

```typescript
// src/utils/theme.ts
export const theme = {
  colors: {
    primary: '#D4AF37',    // Church Gold
    secondary: '#1a1a1a',  // Dark
    background: '#FFFFFF',
    text: '#000000',
  },
  spacing: {
    small: 8,
    medium: 16,
    large: 24,
  },
};
```

---

## 🔔 Quick Push Notifications

```bash
# Install
npm install @react-native-firebase/messaging

# Request permission
import messaging from '@react-native-firebase/messaging';

const requestPermission = async () => {
  await messaging().requestPermission();
  const token = await messaging().getToken();
  console.log('FCM Token:', token);
};
```

---

## 🧪 Quick Testing

```bash
# Run tests
npm test

# Run with coverage
npm test -- --coverage

# E2E tests
npm run e2e:ios
npm run e2e:android
```

---

## 📦 Quick Build

### iOS
```bash
# Open Xcode
open ios/GreaterWorksMobile.xcworkspace

# Product → Archive → Distribute
```

### Android
```bash
# Build AAB
cd android && ./gradlew bundleRelease

# Output: android/app/build/outputs/bundle/release/app-release.aab
```

---

## 🐛 Quick Debugging

### Clear Cache
```bash
npm start -- --reset-cache
```

### iOS Issues
```bash
cd ios && pod install && cd ..
```

### Android Issues
```bash
cd android && ./gradlew clean && cd ..
```

### Metro Bundler
```bash
# Kill process
killall -9 node

# Restart
npm start
```

---

## 📚 Quick Resources

### Documentation
- React Native: https://reactnative.dev/
- Firebase: https://rnfirebase.io/
- React Navigation: https://reactnavigation.org/

### Tools
- React Native Debugger
- Flipper
- Reactotron

### Community
- GitHub: https://github.com/react-native-community
- Discord: React Native Community
- Stack Overflow: #react-native

---

## ✅ Development Checklist

### Daily
- [ ] Pull latest code
- [ ] Run tests
- [ ] Check console warnings
- [ ] Test on device

### Before Commit
- [ ] Code formatted
- [ ] Tests passing
- [ ] No console errors
- [ ] Reviewed changes

### Before Release
- [ ] All features tested
- [ ] Performance checked
- [ ] Build successful
- [ ] Screenshots updated

---

## 🎯 Next Steps

1. **Review** full documentation:
   - `MOBILE_APP_OVERVIEW.md`
   - `MOBILE_APP_SETUP.md`
   - `MOBILE_APP_FEATURES.md`
   - `MOBILE_APP_DEPLOYMENT.md`

2. **Set up** development environment

3. **Create** project structure

4. **Implement** features phase by phase

5. **Test** thoroughly

6. **Deploy** to app stores

---

## 💡 Pro Tips

- **Use TypeScript** for better type safety
- **Test on real devices** not just simulators
- **Optimize images** to reduce app size
- **Use AsyncStorage** for offline data
- **Monitor performance** with Firebase
- **Handle permissions** gracefully
- **Test offline mode** thoroughly
- **Keep dependencies updated**

---

**Quick Start Version:** 1.0  
**Last Updated:** October 2024
