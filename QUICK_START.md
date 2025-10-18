# Quick Start Guide

Get the Greater Works Attendance Tracker up and running in 10 minutes!

## Prerequisites

- Node.js 16+ installed
- Firebase account (free tier is sufficient)
- Basic command line knowledge

## Step-by-Step Setup

### 1. Install Dependencies (2 minutes)

Open terminal in the project folder and run:

```bash
npm install
```

Wait for all packages to install.

### 2. Create Firebase Project (3 minutes)

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **Create a project**
3. Name it: `greater-works-attendance`
4. Disable Google Analytics (optional)
5. Click **Create project**

### 3. Enable Firebase Services (2 minutes)

**Authentication:**
1. Click **Authentication** → **Get started**
2. Enable **Email/Password**
3. Click **Save**

**Firestore:**
1. Click **Firestore Database** → **Create database**
2. Select **Production mode**
3. Choose location closest to Ghana
4. Click **Enable**

**Storage:**
1. Click **Storage** → **Get started**
2. Select **Production mode**
3. Click **Done**

### 4. Get Firebase Config (1 minute)

1. Click the **Web** icon (`</>`) on project overview
2. Register app: `Greater Works Attendance`
3. Copy the `firebaseConfig` object
4. Click **Continue to console**

### 5. Configure the App (1 minute)

1. Open `src/config/firebase.js`
2. Replace the config with your copied values:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

3. Save the file

### 6. Deploy Security Rules (1 minute)

**Firestore Rules:**
1. In Firebase Console → **Firestore Database** → **Rules**
2. Copy content from `firestore.rules` file
3. Paste and **Publish**

**Storage Rules:**
1. In Firebase Console → **Storage** → **Rules**
2. Copy content from `storage.rules` file
3. Paste and **Publish**

### 7. Create Admin User (2 minutes)

**Create User:**
1. Firebase Console → **Authentication** → **Add user**
2. Email: `admin@greaterworks.com`
3. Password: Choose a strong password
4. Click **Add user**
5. **Copy the User UID**

**Create User Document:**
1. Go to **Firestore Database**
2. Click **Start collection**
3. Collection ID: `users`
4. Document ID: Paste the User UID
5. Add fields:
   - `email`: `admin@greaterworks.com`
   - `role`: `admin`
   - `name`: `Admin User`
   - `createdAt`: `2025-01-01T00:00:00.000Z`
6. Click **Save**

### 8. Start the App (30 seconds)

```bash
npm run dev
```

Open browser to: `http://localhost:3000`

### 9. Login

- Email: `admin@greaterworks.com`
- Password: Your chosen password

### 10. Test the App

1. **Add a Member:**
   - Go to Members
   - Click "Add Member"
   - Fill in details
   - Save

2. **Create a Session:**
   - Go to Attendance
   - Click "Create Session"
   - Fill in details
   - Save

3. **Mark Attendance:**
   - Click on the session
   - Mark a member present

4. **View Reports:**
   - Go to Reports
   - See your data visualized

## ✅ You're Done!

The app is now running locally. 

## Next Steps

- [ ] Add more church members
- [ ] Create user accounts for leaders
- [ ] Customize church branding (optional)
- [ ] Deploy to production (see DEPLOYMENT.md)
- [ ] Train your team (see USER_GUIDE.md)

## Common Issues

**Can't login?**
- Verify user exists in Authentication
- Check user document exists in Firestore
- Ensure role is set to "admin"

**"Permission denied" errors?**
- Deploy Firestore and Storage rules
- Check rules are published

**App won't start?**
- Run `npm install` again
- Check Node.js version (16+)
- Delete `node_modules` and reinstall

## Need Help?

- Check `README.md` for detailed documentation
- See `SETUP_GUIDE.md` for comprehensive setup
- Review `USER_GUIDE.md` for usage instructions

---

**Congratulations! 🎉**

Your Greater Works Attendance Tracker is ready to use!
