# Mobile App Deployment Guide

## 🚀 Complete Deployment Guide for iOS and Android

This guide covers the complete deployment process for the Greater Works mobile app to the Apple App Store and Google Play Store.

---

## 📋 Pre-Deployment Checklist

### Code Quality
- [ ] All features implemented and tested
- [ ] No console warnings or errors
- [ ] Code reviewed and optimized
- [ ] Performance tested
- [ ] Memory leaks checked
- [ ] Battery usage optimized

### Testing
- [ ] Unit tests passing
- [ ] Integration tests passing
- [ ] E2E tests passing
- [ ] Tested on multiple iOS devices
- [ ] Tested on multiple Android devices
- [ ] Tested on different OS versions
- [ ] Offline mode tested
- [ ] Push notifications tested

### Assets
- [ ] App icons generated (all sizes)
- [ ] Splash screen created
- [ ] Screenshots prepared (all required sizes)
- [ ] App Store graphics created
- [ ] Promotional materials ready

### Legal & Compliance
- [ ] Privacy policy created
- [ ] Terms of service created
- [ ] GDPR compliance verified
- [ ] Age rating determined
- [ ] Content reviewed

### Accounts
- [ ] Apple Developer account active ($99/year)
- [ ] Google Play Developer account active ($25 one-time)
- [ ] Firebase project configured
- [ ] Analytics set up
- [ ] Crashlytics configured

---

## 🍎 iOS Deployment

### Step 1: Prepare App for Release

#### 1.1 Update Version and Build Number

Edit `ios/GreaterWorksMobile/Info.plist`:
```xml
<key>CFBundleShortVersionString</key>
<string>1.0.0</string>
<key>CFBundleVersion</key>
<string>1</string>
```

#### 1.2 Configure App Icons

1. Generate icons using https://appicon.co/
2. Replace contents of `ios/GreaterWorksMobile/Images.xcassets/AppIcon.appiconset/`
3. Ensure all required sizes are included

#### 1.3 Configure Splash Screen

1. Create splash screen image (2048x2048)
2. Add to `ios/GreaterWorksMobile/Images.xcassets/LaunchImage.launchimage/`
3. Configure LaunchScreen.storyboard

### Step 2: Create App ID and Provisioning Profile

#### 2.1 Create App ID

1. Go to https://developer.apple.com/account/
2. Navigate to Certificates, Identifiers & Profiles
3. Click Identifiers → + button
4. Select App IDs → Continue
5. Enter details:
   - Description: Greater Works Attendance
   - Bundle ID: com.greaterworks.attendance
6. Select capabilities:
   - Push Notifications
   - Sign in with Apple (if needed)
7. Click Continue → Register

#### 2.2 Create Distribution Certificate

1. In Certificates section → + button
2. Select iOS Distribution → Continue
3. Follow instructions to create CSR
4. Upload CSR
5. Download certificate
6. Double-click to install in Keychain

#### 2.3 Create Provisioning Profile

1. In Profiles section → + button
2. Select App Store → Continue
3. Select your App ID
4. Select your Distribution Certificate
5. Name it: Greater Works Distribution
6. Download and double-click to install

### Step 3: Configure Xcode Project

#### 3.1 Open Project in Xcode

```bash
cd ios
open GreaterWorksMobile.xcworkspace
```

#### 3.2 Configure Signing

1. Select project in navigator
2. Select target: GreaterWorksMobile
3. Go to Signing & Capabilities
4. Uncheck "Automatically manage signing"
5. Select your Distribution profile
6. Verify Team is correct

#### 3.3 Configure Build Settings

1. Select project → Build Settings
2. Set:
   - Code Signing Identity: iOS Distribution
   - Provisioning Profile: Greater Works Distribution
   - Enable Bitcode: Yes (if required)

### Step 4: Create App in App Store Connect

#### 4.1 Create New App

1. Go to https://appstoreconnect.apple.com/
2. Click My Apps → + button → New App
3. Fill in details:
   - Platform: iOS
   - Name: Greater Works Attendance
   - Primary Language: English
   - Bundle ID: com.greaterworks.attendance
   - SKU: greaterworks-attendance-001
4. Click Create

#### 4.2 Fill App Information

**App Information:**
- Privacy Policy URL: https://yourchurch.com/privacy
- Category: Productivity or Lifestyle
- Content Rights: Check if applicable

**Pricing and Availability:**
- Price: Free
- Availability: All countries (or specific)

**App Privacy:**
- Complete privacy questionnaire
- Specify data collection practices

### Step 5: Prepare App Metadata

#### 5.1 App Store Information

**Name:** Greater Works Attendance  
**Subtitle:** Church Attendance Tracker  
**Description:**
```
Greater Works Attendance is the official mobile app for Greater Works City Church, Ghana. 
Track attendance, view member directory, access your personal portal, and stay connected 
with your church family.

Features:
• Quick QR code attendance marking
• Member directory with contact info
• Personal attendance history and achievements
• Event photo gallery
• Push notifications for events
• Offline mode for reliable tracking
• Biometric authentication

Perfect for church members, leaders, and administrators to stay organized and connected.
```

**Keywords:** church, attendance, tracking, members, christian, worship, community

**Support URL:** https://yourchurch.com/support  
**Marketing URL:** https://yourchurch.com

#### 5.2 Screenshots

Required sizes:
- 6.7" (iPhone 14 Pro Max): 1290 x 2796
- 6.5" (iPhone 11 Pro Max): 1242 x 2688
- 5.5" (iPhone 8 Plus): 1242 x 2208
- 12.9" iPad Pro: 2048 x 2732

Prepare 3-5 screenshots showing:
1. Login/Dashboard
2. QR Code Scanner
3. Member Directory
4. My Portal
5. Photo Gallery

#### 5.3 App Preview Video (Optional)

- Length: 15-30 seconds
- Show key features
- No audio required
- Same sizes as screenshots

### Step 6: Archive and Upload

#### 6.1 Archive App

1. In Xcode, select "Any iOS Device" as target
2. Product → Archive
3. Wait for archive to complete
4. Organizer window opens automatically

#### 6.2 Validate Archive

1. Select archive
2. Click "Validate App"
3. Select distribution method: App Store Connect
4. Select distribution options:
   - Upload app symbols: Yes
   - Manage version and build number: Yes
5. Click Next → Validate
6. Fix any errors if found

#### 6.3 Upload to App Store Connect

1. Click "Distribute App"
2. Select App Store Connect
3. Select Upload
4. Select distribution options (same as validation)
5. Click Next → Upload
6. Wait for upload to complete (can take 10-30 minutes)

### Step 7: Submit for Review

#### 7.1 Select Build

1. In App Store Connect, go to your app
2. Click + Version or Platform → iOS
3. Enter version number: 1.0.0
4. In Build section, click + button
5. Select the uploaded build
6. Click Done

#### 7.2 Complete Review Information

**App Review Information:**
- First Name: [Your name]
- Last Name: [Your name]
- Phone: [Your phone]
- Email: [Your email]
- Sign-in required: Yes
- Demo account:
  - Username: demo@greaterworks.com
  - Password: [Demo password]
- Notes: Provide any special instructions

**Version Release:**
- Automatically release this version
- Or: Manually release this version

#### 7.3 Submit

1. Click "Add for Review"
2. Review all information
3. Click "Submit for Review"
4. Wait for review (typically 1-7 days)

### Step 8: Monitor Review Status

**Review Statuses:**
- Waiting for Review
- In Review
- Pending Developer Release
- Ready for Sale
- Rejected (if issues found)

**If Rejected:**
1. Read rejection reason carefully
2. Fix issues
3. Increment build number
4. Re-upload
5. Submit again

---

## 🤖 Android Deployment

### Step 1: Prepare App for Release

#### 1.1 Update Version

Edit `android/app/build.gradle`:
```gradle
android {
    defaultConfig {
        versionCode 1
        versionName "1.0.0"
    }
}
```

#### 1.2 Configure App Icons

1. Generate icons using https://appicon.co/
2. Replace files in:
   - `android/app/src/main/res/mipmap-hdpi/`
   - `android/app/src/main/res/mipmap-mdpi/`
   - `android/app/src/main/res/mipmap-xhdpi/`
   - `android/app/src/main/res/mipmap-xxhdpi/`
   - `android/app/src/main/res/mipmap-xxxhdpi/`

### Step 2: Generate Signing Key

#### 2.1 Create Keystore

```bash
cd android/app
keytool -genkeypair -v -storetype PKCS12 -keystore greaterworks-release.keystore -alias greaterworks -keyalg RSA -keysize 2048 -validity 10000
```

Enter details when prompted:
- Password: [Create strong password]
- First and Last Name: Greater Works
- Organizational Unit: IT
- Organization: Greater Works City Church
- City: Accra
- State: Greater Accra
- Country Code: GH

**Important:** Store keystore and password securely!

#### 2.2 Configure Gradle

Create `android/gradle.properties` (if not exists):
```properties
MYAPP_RELEASE_STORE_FILE=greaterworks-release.keystore
MYAPP_RELEASE_KEY_ALIAS=greaterworks
MYAPP_RELEASE_STORE_PASSWORD=your_keystore_password
MYAPP_RELEASE_KEY_PASSWORD=your_key_password
```

**Important:** Add `gradle.properties` to `.gitignore`!

Edit `android/app/build.gradle`:
```gradle
android {
    ...
    signingConfigs {
        release {
            if (project.hasProperty('MYAPP_RELEASE_STORE_FILE')) {
                storeFile file(MYAPP_RELEASE_STORE_FILE)
                storePassword MYAPP_RELEASE_STORE_PASSWORD
                keyAlias MYAPP_RELEASE_KEY_ALIAS
                keyPassword MYAPP_RELEASE_KEY_PASSWORD
            }
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled true
            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
        }
    }
}
```

### Step 3: Build Release APK/AAB

#### 3.1 Build AAB (Recommended for Play Store)

```bash
cd android
./gradlew bundleRelease
```

Output: `android/app/build/outputs/bundle/release/app-release.aab`

#### 3.2 Build APK (For testing)

```bash
cd android
./gradlew assembleRelease
```

Output: `android/app/build/outputs/apk/release/app-release.apk`

#### 3.3 Test Release Build

```bash
# Install on device
adb install android/app/build/outputs/apk/release/app-release.apk

# Test thoroughly
```

### Step 4: Create App in Play Console

#### 4.1 Create Developer Account

1. Go to https://play.google.com/console/
2. Pay $25 one-time registration fee
3. Complete account setup

#### 4.2 Create New App

1. Click "Create app"
2. Fill in details:
   - App name: Greater Works Attendance
   - Default language: English (United States)
   - App or game: App
   - Free or paid: Free
3. Accept declarations
4. Click "Create app"

### Step 5: Complete Store Listing

#### 5.1 App Details

**Short description (80 characters):**
```
Official church attendance tracker for Greater Works City Church, Ghana
```

**Full description (4000 characters):**
```
Greater Works Attendance is the official mobile app for Greater Works City Church, Ghana. 
Stay connected with your church family and track your spiritual journey.

KEY FEATURES:

📱 Quick Attendance Marking
• Scan QR codes for instant check-in
• Manual attendance marking
• Offline mode for reliable tracking

👥 Member Directory
• Browse church members
• Contact members directly
• View member profiles

🏆 Personal Portal
• Track your attendance history
• Earn achievement badges
• View contribution records
• Display your QR code

📸 Photo Gallery
• Browse event photos
• Upload and share memories
• Download photos

🔔 Stay Connected
• Push notifications for events
• Birthday reminders
• Service announcements

🔒 Secure & Private
• Biometric authentication
• Secure data storage
• Privacy-focused design

Perfect for church members, leaders, and administrators to stay organized and connected 
with the Greater Works family.

Download now and be part of the community!
```

#### 5.2 Graphics

**App icon:**
- Size: 512 x 512 pixels
- Format: PNG (32-bit)
- No transparency

**Feature graphic:**
- Size: 1024 x 500 pixels
- Format: PNG or JPEG
- Showcase app features

**Phone screenshots (Required):**
- Minimum: 2 screenshots
- Recommended: 4-8 screenshots
- Size: 16:9 or 9:16 aspect ratio
- Minimum dimension: 320px
- Maximum dimension: 3840px

**Tablet screenshots (Optional):**
- 7-inch and 10-inch tablets
- Different layouts if applicable

#### 5.3 Categorization

- App category: Productivity
- Tags: church, attendance, community
- Content rating: Everyone

#### 5.4 Contact Details

- Email: support@greaterworks.com
- Phone: [Your phone number]
- Website: https://yourchurch.com
- Privacy policy: https://yourchurch.com/privacy

### Step 6: Content Rating

1. Click "Content rating"
2. Enter email address
3. Complete questionnaire:
   - Violence: None
   - Sexual content: None
   - Profanity: None
   - Controlled substances: None
   - Gambling: None
   - User interaction: Yes (user-generated content)
4. Submit
5. Receive rating (likely E for Everyone)

### Step 7: App Content

#### 7.1 Privacy Policy

- URL: https://yourchurch.com/privacy
- Must be accessible and specific to your app

#### 7.2 App Access

- Provide demo account if login required:
  - Username: demo@greaterworks.com
  - Password: [Demo password]

#### 7.3 Ads

- Does your app contain ads? No (or Yes if applicable)

#### 7.4 Target Audience

- Target age group: All ages
- Appeals to children: No

### Step 8: Upload App Bundle

#### 8.1 Create Release

1. Go to Production → Create new release
2. Upload AAB file
3. Enter release name: 1.0.0
4. Enter release notes:
```
Initial release of Greater Works Attendance app!

Features:
• QR code attendance marking
• Member directory
• Personal portal with achievements
• Photo gallery
• Push notifications
• Offline mode
• Biometric authentication

We're excited to bring this app to our church family!
```

#### 8.2 Review Release

1. Review all information
2. Check for warnings or errors
3. Fix any issues

### Step 9: Submit for Review

1. Click "Review release"
2. Review all sections:
   - Store listing
   - Content rating
   - App content
   - Pricing & distribution
3. Click "Start rollout to Production"
4. Confirm submission

### Step 10: Monitor Review Status

**Review typically takes:**
- First review: Few hours to few days
- Updates: Usually faster

**Statuses:**
- Under review
- Approved
- Rejected (if issues found)

**If Rejected:**
1. Read rejection reason
2. Fix issues
3. Increment version code
4. Re-upload
5. Submit again

---

## 🔄 App Updates

### iOS Updates

1. Increment version/build number
2. Archive new build
3. Upload to App Store Connect
4. Create new version
5. Add "What's New" text
6. Submit for review

### Android Updates

1. Increment versionCode and versionName
2. Build new AAB
3. Create new release in Play Console
4. Upload AAB
5. Add release notes
6. Roll out to production

---

## 📊 Post-Launch Monitoring

### Analytics

**Firebase Analytics:**
- User engagement
- Screen views
- User retention
- Conversion events

**App Store Analytics:**
- Downloads
- Impressions
- Conversion rate
- Ratings and reviews

**Play Console Analytics:**
- Installs
- Uninstalls
- Ratings
- Crashes

### Crash Reporting

**Firebase Crashlytics:**
- Monitor crashes
- Fix critical issues
- Release hotfixes

### Performance Monitoring

**Firebase Performance:**
- App startup time
- Screen rendering
- Network requests
- Custom traces

---

## 🆘 Troubleshooting

### iOS Issues

**Build fails:**
```bash
cd ios
pod deintegrate
pod install
cd ..
```

**Archive fails:**
- Check provisioning profile
- Verify certificates
- Clean build folder

**Upload fails:**
- Check internet connection
- Verify Apple ID credentials
- Try Transporter app

### Android Issues

**Build fails:**
```bash
cd android
./gradlew clean
cd ..
```

**Signing fails:**
- Verify keystore path
- Check passwords
- Ensure keystore exists

**Upload fails:**
- Verify AAB is signed
- Check file size (<150MB)
- Try different browser

---

## ✅ Launch Checklist

### Pre-Launch
- [ ] All features working
- [ ] No critical bugs
- [ ] Performance optimized
- [ ] Screenshots prepared
- [ ] Descriptions written
- [ ] Privacy policy published
- [ ] Demo account created

### iOS Launch
- [ ] App uploaded
- [ ] Metadata completed
- [ ] Screenshots uploaded
- [ ] Submitted for review
- [ ] Approved
- [ ] Released

### Android Launch
- [ ] AAB uploaded
- [ ] Store listing completed
- [ ] Content rating received
- [ ] Submitted for review
- [ ] Approved
- [ ] Published

### Post-Launch
- [ ] Monitor analytics
- [ ] Respond to reviews
- [ ] Fix reported bugs
- [ ] Plan updates
- [ ] Gather user feedback

---

## 📞 Support Resources

### Apple
- Developer Support: https://developer.apple.com/support/
- App Store Connect: https://appstoreconnect.apple.com/
- Guidelines: https://developer.apple.com/app-store/review/guidelines/

### Google
- Play Console Help: https://support.google.com/googleplay/android-developer/
- Play Console: https://play.google.com/console/
- Guidelines: https://play.google.com/about/developer-content-policy/

### Firebase
- Documentation: https://firebase.google.com/docs
- Console: https://console.firebase.google.com/
- Support: https://firebase.google.com/support

---

**Deployment Version:** 1.0  
**Last Updated:** October 2024  
**Status:** Ready for Deployment
