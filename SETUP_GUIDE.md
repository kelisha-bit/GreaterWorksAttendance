# Firebase Setup Guide

This guide will walk you through setting up Firebase for the Greater Works Attendance Tracker.

## Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **Add project** or **Create a project**
3. Enter project name: `greater-works-attendance` (or your preferred name)
4. Click **Continue**
5. Disable Google Analytics (optional) or configure it
6. Click **Create project**
7. Wait for project creation to complete
8. Click **Continue**

## Step 2: Register Web App

1. In your Firebase project dashboard, click the **Web** icon (`</>`)
2. Enter app nickname: `Greater Works Attendance Tracker`
3. Check **"Also set up Firebase Hosting"** (optional)
4. Click **Register app**
5. Copy the Firebase configuration object (you'll need this later)
6. Click **Continue to console**

## Step 3: Enable Authentication

1. In the left sidebar, click **Build** > **Authentication**
2. Click **Get started**
3. Click on **Email/Password** in the Sign-in method tab
4. Toggle **Enable** to ON
5. Click **Save**

### Optional: Enable Google Sign-In
1. Click on **Google** in the Sign-in method tab
2. Toggle **Enable** to ON
3. Enter project support email
4. Click **Save**

## Step 4: Set Up Firestore Database

1. In the left sidebar, click **Build** > **Firestore Database**
2. Click **Create database**
3. Select **Start in production mode** (we'll add custom rules)
4. Click **Next**
5. Choose your Cloud Firestore location (select closest to Ghana, e.g., `europe-west1`)
6. Click **Enable**

### Configure Firestore Rules

1. Click on the **Rules** tab
2. Replace the default rules with the contents of `firestore.rules` from the project
3. Click **Publish**

## Step 5: Set Up Firebase Storage

1. In the left sidebar, click **Build** > **Storage**
2. Click **Get started**
3. Select **Start in production mode**
4. Click **Next**
5. Choose the same location as Firestore
6. Click **Done**

### Configure Storage Rules

1. Click on the **Rules** tab
2. Replace the default rules with the contents of `storage.rules` from the project
3. Click **Publish**

## Step 6: Configure the App

1. Open `src/config/firebase.js` in your code editor
2. Replace the placeholder configuration with your Firebase config:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY_HERE",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

3. Save the file

## Step 7: Create Admin User

### Method 1: Using Firebase Console

1. Go to **Authentication** in Firebase Console
2. Click **Add user**
3. Enter email: `admin@greaterworks.com` (or your preferred email)
4. Enter a strong password
5. Click **Add user**
6. Copy the **User UID** (you'll need it next)

### Method 2: Using the App (After First Run)

1. Start the app: `npm run dev`
2. Try to log in - it will fail
3. Go to Firebase Console > Authentication
4. Find the user and copy their UID

### Create User Document in Firestore

1. Go to **Firestore Database** in Firebase Console
2. Click **Start collection**
3. Collection ID: `users`
4. Click **Next**
5. Document ID: Paste the User UID you copied
6. Add fields:
   - Field: `email`, Type: string, Value: `admin@greaterworks.com`
   - Field: `role`, Type: string, Value: `admin`
   - Field: `name`, Type: string, Value: `Admin User`
   - Field: `createdAt`, Type: string, Value: `2025-01-01T00:00:00.000Z`
7. Click **Save**

## Step 8: Test the Setup

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Open browser to `http://localhost:3000`

3. Log in with your admin credentials

4. You should see the dashboard

5. Test creating a member:
   - Go to Members page
   - Click "Add Member"
   - Fill in details
   - Click "Add Member"
   - Check Firestore to see if the member was created

## Step 9: Optional - Set Up Firebase Hosting

1. Install Firebase CLI:
   ```bash
   npm install -g firebase-tools
   ```

2. Login to Firebase:
   ```bash
   firebase login
   ```

3. Initialize Firebase in your project:
   ```bash
   firebase init
   ```

4. Select:
   - Hosting
   - Use existing project
   - Select your project
   - Public directory: `dist`
   - Single-page app: `Yes`
   - GitHub deploys: `No`

5. Build your app:
   ```bash
   npm run build
   ```

6. Deploy:
   ```bash
   firebase deploy
   ```

## Step 10: Create Sample Data (Optional)

### Add Sample Departments

1. Go to Firestore Database
2. Create collection: `departments`
3. Add documents with these fields:
   - `name`: "Choir", `createdAt`: [timestamp]
   - `name`: "Ushering", `createdAt`: [timestamp]
   - `name`: "Media", `createdAt`: [timestamp]

### Add Sample Members

Use the app's "Add Member" feature to create sample members, or add directly to Firestore:

1. Collection: `members`
2. Auto-generate document ID
3. Add fields:
   ```
   memberId: "GW123456789"
   fullName: "John Doe"
   gender: "Male"
   phoneNumber: "+233123456789"
   email: "john@example.com"
   department: "Choir"
   membershipType: "Adult"
   createdAt: [timestamp]
   updatedAt: [timestamp]
   ```

## Troubleshooting

### Issue: "Firebase: Error (auth/configuration-not-found)"
**Solution**: Make sure you've enabled Email/Password authentication in Firebase Console

### Issue: "Missing or insufficient permissions"
**Solution**: Check that you've deployed the Firestore security rules correctly

### Issue: "Storage: User does not have permission"
**Solution**: Check that you've deployed the Storage security rules correctly

### Issue: Can't create admin user document
**Solution**: 
1. Go to Firestore Rules
2. Temporarily change to test mode:
   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /{document=**} {
         allow read, write: if true;
       }
     }
   }
   ```
3. Create the admin user document
4. Restore the production rules from `firestore.rules`

## Security Checklist

Before going live, ensure:

- [ ] Firestore security rules are deployed
- [ ] Storage security rules are deployed
- [ ] Admin user is created with strong password
- [ ] Firebase API keys are not exposed in public repositories
- [ ] Email/Password authentication is enabled
- [ ] Test all user roles (Admin, Leader, Viewer)

## Next Steps

1. Create additional user accounts for church leaders
2. Add church members
3. Create your first attendance session
4. Customize church branding if needed
5. Train users on how to use the system

## Support

If you encounter any issues during setup:
1. Check the Firebase Console for error messages
2. Review the browser console for JavaScript errors
3. Verify all configuration steps were completed
4. Check that all dependencies are installed: `npm install`

---

**Setup Complete!** 🎉

Your Greater Works Attendance Tracker is now ready to use.
