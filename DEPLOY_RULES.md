# Deploy Firestore Rules - Quick Guide

## Issue
You're seeing "Missing or insufficient permissions" errors because the Firestore security rules haven't been deployed to Firebase yet.

## Solution: Deploy Rules via Firebase Console

### Step-by-Step Instructions:

1. **Open Firebase Console**
   - Go to: https://console.firebase.google.com/
   - Login with your Google account

2. **Select Your Project**
   - Click on project: **gwccapp-fc67c**

3. **Navigate to Firestore Rules**
   - Click **"Firestore Database"** in the left sidebar
   - Click the **"Rules"** tab at the top

4. **Copy and Paste New Rules**
   - Delete all existing rules
   - Copy the rules from `firestore.rules` file in your project
   - Or copy from below:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper function to check if user is authenticated
    function isAuthenticated() {
      return request.auth != null;
    }
    
    // Helper function to check user role
    function hasRole(role) {
      return isAuthenticated() && 
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == role;
    }
    
    // Helper function to check if user is admin or leader
    function isAdminOrLeader() {
      return isAuthenticated() && 
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['admin', 'leader'];
    }
    
    // Users collection - stores user roles and permissions
    match /users/{userId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated() && request.auth.uid == userId;
      allow update, delete: if hasRole('admin');
    }
    
    // Members collection - church member profiles
    match /members/{memberId} {
      allow read: if isAuthenticated();
      allow create, update: if isAdminOrLeader();
      allow delete: if hasRole('admin');
    }
    
    // Attendance sessions collection
    match /attendance_sessions/{sessionId} {
      allow read: if isAuthenticated();
      allow create, update: if isAdminOrLeader();
      allow delete: if hasRole('admin');
    }
    
    // Attendance records collection
    match /attendance_records/{recordId} {
      allow read: if isAuthenticated();
      allow create, update: if isAdminOrLeader();
      allow delete: if hasRole('admin');
    }
    
    // Departments collection
    match /departments/{departmentId} {
      allow read: if isAuthenticated();
      allow create, update, delete: if hasRole('admin');
    }
    
    // Contributions collection - financial records
    match /contributions/{contributionId} {
      allow read: if isAuthenticated();
      allow create, update: if isAdminOrLeader();
      allow delete: if hasRole('admin');
    }
  }
}
```

5. **Publish the Rules**
   - Click the blue **"Publish"** button
   - Wait for confirmation message

6. **Test Your App**
   - Refresh your application
   - The permissions errors should be resolved
   - Try accessing My Portal contributions section

---

## What Changed?

Added security rules for the new **contributions** collection:
- All authenticated users can **read** (needed for My Portal)
- Only admins and leaders can **create/update** contributions
- Only admins can **delete** contributions

---

## Verification

After deploying, you should be able to:
- ✅ View personal contributions in My Portal
- ✅ Record new contributions (if admin/leader)
- ✅ View financial reports (if admin/leader)
- ✅ No more "permission denied" errors

---

## Alternative: CLI Deployment (if Firebase CLI is installed)

If you have Firebase CLI installed, you can deploy from terminal:

```bash
firebase login
firebase deploy --only firestore:rules
```

But the **Firebase Console method above is faster and easier**!
