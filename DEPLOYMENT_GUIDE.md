# Deployment Guide - Firebase Hosting

## 🚀 Complete Deployment Instructions

**App:** Greater Works Attendance Tracker  
**Version:** 2.4.0  
**Platform:** Firebase Hosting  
**Status:** Ready to Deploy ✅

---

## 📋 Pre-Deployment Checklist

Before deploying, ensure:
- ✅ Firebase CLI installed (v14.20.0 detected)
- ✅ Firebase project configured (gwccapp-fc67c)
- ✅ Build successful (tested ✅)
- ✅ Latest code pushed to GitHub
- ✅ All features tested locally

---

## 🚀 Quick Deployment (3 Commands)

```bash
# 1. Login to Firebase (if not already logged in)
firebase login

# 2. Build the app
npm run build

# 3. Deploy everything
firebase deploy
```

**That's it!** Your app will be live in 2-3 minutes.

---

## 📖 Detailed Step-by-Step Guide

### Step 1: Login to Firebase

```bash
firebase login
```

**What happens:**
- Opens browser for Google authentication
- Logs you into Firebase CLI
- Grants deployment permissions

**If already logged in:**
```bash
firebase login:list  # Check current login
```

---

### Step 2: Verify Firebase Project

```bash
firebase projects:list
```

**Expected output:**
```
┌──────────────────────┬────────────────┬────────────────┐
│ Project Display Name │ Project ID     │ Resource       │
├──────────────────────┼────────────────┼────────────────┤
│ GWCC App             │ gwccapp-fc67c  │ ...            │
└──────────────────────┴────────────────┴────────────────┘
```

**Verify current project:**
```bash
firebase use
```

**Should show:** `gwccapp-fc67c (current)`

---

### Step 3: Build the Application

```bash
npm run build
```

**What happens:**
- Vite builds production bundle
- Creates optimized files in `dist/` folder
- Takes ~15-20 seconds
- Output shows bundle sizes

**Expected output:**
```
✓ 2915 modules transformed.
dist/index.html                   0.60 kB
dist/assets/index-xxx.css        37.11 kB
dist/assets/index-xxx.js      2,229.59 kB
✓ built in 17.36s
```

---

### Step 4: Deploy to Firebase

#### Option A: Deploy Everything (Recommended)

```bash
firebase deploy
```

**Deploys:**
- ✅ Hosting (website)
- ✅ Firestore rules
- ✅ Storage rules

**Time:** 30-60 seconds

#### Option B: Deploy Only Hosting

```bash
firebase deploy --only hosting
```

**Use when:** Only website files changed

#### Option C: Deploy Only Rules

```bash
firebase deploy --only firestore:rules,storage:rules
```

**Use when:** Only security rules changed

---

### Step 5: Verify Deployment

After deployment completes, you'll see:

```
✔  Deploy complete!

Project Console: https://console.firebase.google.com/project/gwccapp-fc67c/overview
Hosting URL: https://gwccapp-fc67c.web.app
```

**Test your app:**
1. Open the Hosting URL
2. Try logging in
3. Test key features
4. Check on mobile device

---

## 🔧 Deployment Commands Reference

### Basic Commands

```bash
# Login
firebase login

# Logout
firebase logout

# Check current project
firebase use

# Switch project
firebase use <project-id>

# List all projects
firebase projects:list
```

### Build Commands

```bash
# Development build
npm run dev

# Production build
npm run build

# Preview production build locally
npm run preview
```

### Deployment Commands

```bash
# Deploy everything
firebase deploy

# Deploy hosting only
firebase deploy --only hosting

# Deploy rules only
firebase deploy --only firestore:rules,storage:rules

# Deploy with message
firebase deploy -m "Version 2.4.0 - Added member import"
```

### Rollback Commands

```bash
# List deployment history
firebase hosting:channel:list

# Rollback to previous version
firebase hosting:rollback
```

---

## 🌐 Your App URLs

### Production URL
**Primary:** `https://gwccapp-fc67c.web.app`  
**Alternative:** `https://gwccapp-fc67c.firebaseapp.com`

### Firebase Console
**Project:** `https://console.firebase.google.com/project/gwccapp-fc67c`

### Custom Domain (Optional)
You can add a custom domain like `attendance.greaterworkschurch.com`

**Steps:**
1. Go to Firebase Console → Hosting
2. Click "Add custom domain"
3. Follow DNS configuration steps

---

## 🔒 Security - Deploy Firestore Rules

Your Firestore rules are already configured in `firestore.rules`. Deploy them:

```bash
firebase deploy --only firestore:rules
```

**Rules include:**
- Authentication required for all operations
- Role-based access (admin, leader, member)
- Member management permissions
- Attendance tracking permissions
- Visitor management permissions
- Event management permissions

---

## 📦 What Gets Deployed

### Hosting Files (from `dist/` folder)
```
dist/
├── index.html
├── assets/
│   ├── index-xxx.css
│   ├── index-xxx.js
│   └── other bundles
└── favicon files
```

### Firestore Rules
```
firestore.rules → Firebase Firestore
```

### Storage Rules
```
storage.rules → Firebase Storage
```

---

## 🎯 Post-Deployment Tasks

### 1. Create Admin User

**In Firebase Console:**
1. Go to Authentication → Users
2. Click "Add user"
3. Enter email and password
4. Copy the User UID

**In Firestore:**
1. Go to Firestore Database
2. Create collection: `users`
3. Add document with User UID as ID:
```json
{
  "email": "admin@greaterworks.com",
  "role": "admin",
  "fullName": "Church Administrator",
  "createdAt": "2025-10-19T00:00:00.000Z"
}
```

### 2. Test the Deployment

**Test Checklist:**
- [ ] App loads successfully
- [ ] Login works
- [ ] Dashboard displays
- [ ] Members page loads
- [ ] Attendance marking works
- [ ] QR scanner works (requires HTTPS ✅)
- [ ] PDF export works
- [ ] CSV export works
- [ ] Member import works
- [ ] Mobile responsive

### 3. Configure Firebase Services

**Enable Analytics:**
```bash
firebase init analytics
```

**Enable Performance Monitoring:**
1. Go to Firebase Console
2. Enable Performance Monitoring
3. Add SDK to app (optional)

### 4. Share with Team

**Send to church administrators:**
- 🔗 App URL: `https://gwccapp-fc67c.web.app`
- 📧 Admin credentials
- 📖 User Guide: Share `USER_GUIDE.md`
- 🎓 Training: Schedule training session

---

## 🔄 Continuous Deployment Workflow

### For Future Updates:

```bash
# 1. Make changes to code
# 2. Test locally
npm run dev

# 3. Build
npm run build

# 4. Test build locally
npm run preview

# 5. Commit changes
git add .
git commit -m "Description of changes"
git push

# 6. Deploy
firebase deploy
```

---

## 🚨 Troubleshooting

### Issue: "Firebase command not found"
**Solution:**
```bash
npm install -g firebase-tools
```

### Issue: "Not authorized"
**Solution:**
```bash
firebase logout
firebase login
```

### Issue: "Build failed"
**Solution:**
```bash
# Clear cache and rebuild
rm -rf node_modules dist
npm install
npm run build
```

### Issue: "Deployment failed"
**Solution:**
```bash
# Check Firebase project
firebase use

# Try deploying hosting only
firebase deploy --only hosting
```

### Issue: "App shows old version"
**Solution:**
- Clear browser cache (Ctrl+Shift+R)
- Wait 5 minutes for CDN propagation
- Check deployment was successful

### Issue: "QR Scanner not working"
**Solution:**
- QR scanner requires HTTPS (Firebase provides this ✅)
- Check camera permissions in browser
- Test on different device

---

## 📊 Monitoring & Analytics

### Firebase Console Monitoring

**Hosting Metrics:**
- Go to Hosting → Dashboard
- View traffic, bandwidth, requests

**Firestore Usage:**
- Go to Firestore → Usage
- Monitor reads, writes, deletes

**Authentication:**
- Go to Authentication → Users
- Track user signups and logins

### Performance Monitoring

**Enable in Firebase Console:**
1. Go to Performance
2. Click "Get started"
3. Monitor app performance

---

## 💰 Firebase Pricing

### Current Plan: Spark (Free)

**Limits:**
- **Hosting:** 10 GB storage, 360 MB/day bandwidth
- **Firestore:** 1 GB storage, 50K reads/day, 20K writes/day
- **Authentication:** Unlimited users
- **Storage:** 5 GB

**For a church with ~500 members:**
- Free plan is sufficient
- Monitor usage in console
- Upgrade to Blaze (pay-as-you-go) if needed

### Upgrade to Blaze Plan (if needed)

**When to upgrade:**
- More than 500 active members
- Heavy daily usage
- Need more storage

**Cost:** Pay only for what you use (very affordable)

---

## 🔐 Environment Variables (Optional)

For better security, move Firebase config to environment variables:

### 1. Create `.env` file:
```env
VITE_FIREBASE_API_KEY=AIzaSyBE_EskZ0E3r1XfnMumLBS207fHSawazVI
VITE_FIREBASE_AUTH_DOMAIN=gwccapp-fc67c.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=gwccapp-fc67c
VITE_FIREBASE_STORAGE_BUCKET=gwccapp-fc67c.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=766291132023
VITE_FIREBASE_APP_ID=1:766291132023:web:02f541656cc36967f11072
```

### 2. Update `firebase.js`:
```javascript
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};
```

### 3. Add to `.gitignore`:
```
.env
.env.local
```

**Note:** Current hardcoded config works fine for deployment. This is optional for enhanced security.

---

## 📱 Progressive Web App (PWA) - Future Enhancement

To make the app installable on mobile devices:

### 1. Add manifest.json
### 2. Add service worker
### 3. Configure icons
### 4. Redeploy

**Benefits:**
- Install on home screen
- Offline support
- Push notifications
- Native app feel

---

## 🎉 Deployment Checklist

### Before Deployment
- [x] Build successful
- [x] Firebase configured
- [x] Security rules defined
- [x] All features tested
- [x] Code pushed to GitHub

### During Deployment
- [ ] Login to Firebase
- [ ] Build app (`npm run build`)
- [ ] Deploy (`firebase deploy`)
- [ ] Note deployment URL

### After Deployment
- [ ] Test deployed app
- [ ] Create admin user
- [ ] Test all features
- [ ] Share with team
- [ ] Monitor usage

---

## 📞 Support & Maintenance

### Regular Maintenance
- **Weekly:** Check Firebase usage
- **Monthly:** Review analytics
- **Quarterly:** Update dependencies
- **As needed:** Deploy new features

### Backup Strategy
- Firebase automatic backups ✅
- Export Firestore data monthly
- Keep code in GitHub ✅

### Updates
```bash
# Update dependencies
npm update

# Check for outdated packages
npm outdated

# Update Firebase CLI
npm install -g firebase-tools@latest
```

---

## 🚀 Quick Reference Card

```bash
# Complete Deployment (Copy & Paste)
firebase login
npm run build
firebase deploy

# Your app will be live at:
# https://gwccapp-fc67c.web.app
```

---

## ✅ Success Indicators

After deployment, you should see:
- ✅ Green checkmarks in terminal
- ✅ Hosting URL displayed
- ✅ App accessible via URL
- ✅ Login works
- ✅ All features functional
- ✅ Mobile responsive

---

## 🎊 You're Ready!

Your app is production-ready and can be deployed right now!

**Next Steps:**
1. Run `firebase login`
2. Run `npm run build`
3. Run `firebase deploy`
4. Share the URL with your church!

---

**Version:** 2.4.0  
**Last Updated:** October 19, 2025  
**Greater Works City Church, Ghana**

**Questions?** Check `DEPLOYMENT_READINESS.md` for more details.
