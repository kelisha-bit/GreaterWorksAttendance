# Firebase Storage CORS Fix Guide

## 🔧 Fixing CORS Errors for Firebase Storage

This guide helps you resolve CORS (Cross-Origin Resource Sharing) errors when uploading files to Firebase Storage from localhost.

---

## ❌ The Error

```
Access to XMLHttpRequest at 'https://firebasestorage.googleapis.com/...' 
from origin 'http://localhost:3000' has been blocked by CORS policy
```

---

## ✅ Solution Options

### **Option 1: Using Google Cloud Console (Easiest)**

**Step 1: Install Google Cloud SDK**

1. Download from: https://cloud.google.com/sdk/docs/install
2. Install the SDK
3. Restart your terminal/command prompt

**Step 2: Authenticate**

```bash
gcloud auth login
```

**Step 3: Set Your Project**

```bash
gcloud config set project gwccapp-fc67c
```

**Step 4: Apply CORS Configuration**

```bash
gsutil cors set cors.json gs://gwccapp-fc67c.firebasestorage.app
```

**Step 5: Verify CORS Configuration**

```bash
gsutil cors get gs://gwccapp-fc67c.firebasestorage.app
```

---

### **Option 2: Using Firebase Console (Manual)**

**Step 1: Go to Firebase Console**
1. Visit: https://console.firebase.google.com
2. Select your project: `gwccapp-fc67c`
3. Go to Storage

**Step 2: Open Google Cloud Console**
1. Click "Open in Google Cloud Console"
2. Or visit: https://console.cloud.google.com/storage

**Step 3: Configure CORS**
1. Select your storage bucket
2. Click "Permissions" tab
3. Add CORS configuration manually

---

### **Option 3: Temporary Workaround (Development Only)**

If you need to continue development immediately while setting up CORS:

**Use Firebase SDK Upload Method:**

Instead of direct HTTP upload, use Firebase SDK:

```javascript
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from './config/firebase';

// Upload file using Firebase SDK (handles CORS internally)
const uploadFile = async (file, userId) => {
  try {
    const timestamp = Date.now();
    const fileName = `${timestamp}_${file.name}`;
    const storageRef = ref(storage, `profile_photos/${userId}/${fileName}`);
    
    // Upload using Firebase SDK (no CORS issues)
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    return downloadURL;
  } catch (error) {
    console.error('Upload error:', error);
    throw error;
  }
};
```

---

## 📋 CORS Configuration File

The `cors.json` file has been created with the following configuration:

```json
[
  {
    "origin": [
      "http://localhost:3000",
      "http://localhost:5173",
      "https://gwccapp-fc67c.web.app",
      "https://gwccapp-fc67c.firebaseapp.com"
    ],
    "method": ["GET", "POST", "PUT", "DELETE", "HEAD"],
    "maxAgeSeconds": 3600,
    "responseHeader": [
      "Content-Type",
      "Authorization",
      "Content-Length",
      "User-Agent",
      "X-Requested-With"
    ]
  }
]
```

**This allows:**
- ✅ Localhost development (ports 3000 and 5173)
- ✅ Production Firebase hosting domains
- ✅ All necessary HTTP methods
- ✅ Required headers for file uploads

---

## 🚀 Quick Fix Steps

### **For Windows (PowerShell):**

```powershell
# 1. Install Google Cloud SDK (if not installed)
# Download from: https://cloud.google.com/sdk/docs/install-sdk

# 2. Authenticate
gcloud auth login

# 3. Set project
gcloud config set project gwccapp-fc67c

# 4. Apply CORS
gsutil cors set cors.json gs://gwccapp-fc67c.firebasestorage.app

# 5. Verify
gsutil cors get gs://gwccapp-fc67c.firebasestorage.app
```

---

## 🔍 Verify the Fix

After applying CORS configuration:

1. **Clear browser cache** (Ctrl + Shift + Delete)
2. **Restart your dev server**
3. **Try uploading again**

The error should be resolved!

---

## 🆘 Troubleshooting

### **Issue: gsutil command not found**

**Solution:**
- Install Google Cloud SDK
- Restart terminal
- Add to PATH if needed

### **Issue: Permission denied**

**Solution:**
```bash
# Re-authenticate
gcloud auth login

# Verify project
gcloud config get-value project
```

### **Issue: Bucket not found**

**Solution:**
```bash
# List your buckets
gsutil ls

# Use the correct bucket name
gsutil cors set cors.json gs://[YOUR-BUCKET-NAME]
```

### **Issue: Still getting CORS error**

**Solutions:**
1. Clear browser cache completely
2. Try incognito/private window
3. Restart dev server
4. Wait 5-10 minutes for changes to propagate
5. Verify CORS was applied: `gsutil cors get gs://gwccapp-fc67c.firebasestorage.app`

---

## 📱 For Production

When deploying to production:

1. **Update cors.json** to include your production domain
2. **Reapply CORS configuration**
3. **Test thoroughly**

Example for production:

```json
[
  {
    "origin": [
      "https://yourdomain.com",
      "https://www.yourdomain.com",
      "https://gwccapp-fc67c.web.app"
    ],
    "method": ["GET", "POST", "PUT", "DELETE", "HEAD"],
    "maxAgeSeconds": 3600,
    "responseHeader": ["Content-Type", "Authorization"]
  }
]
```

---

## 🔐 Security Considerations

**CORS Configuration:**
- ✅ Only allow trusted origins
- ✅ Use HTTPS in production
- ✅ Limit to necessary methods
- ✅ Set appropriate maxAgeSeconds

**Storage Rules:**
- ✅ Keep authentication required
- ✅ Validate file types
- ✅ Enforce size limits
- ✅ Restrict by user ID

---

## 📚 Additional Resources

**Google Cloud CORS Documentation:**
- https://cloud.google.com/storage/docs/configuring-cors

**Firebase Storage Documentation:**
- https://firebase.google.com/docs/storage

**gsutil CORS Command:**
- https://cloud.google.com/storage/docs/gsutil/commands/cors

---

## ✅ Checklist

Before uploading files:

- [ ] Google Cloud SDK installed
- [ ] Authenticated with gcloud
- [ ] Project set correctly
- [ ] CORS configuration applied
- [ ] CORS configuration verified
- [ ] Browser cache cleared
- [ ] Dev server restarted
- [ ] Upload tested successfully

---

## 🎯 Expected Result

After applying CORS configuration, you should be able to:

✅ Upload profile photos from localhost  
✅ Upload gallery photos from localhost  
✅ Upload files from production domain  
✅ No CORS errors in console  
✅ Successful file uploads  

---

**CORS Fix Guide Version:** 1.0  
**Last Updated:** October 2024  
**Status:** Ready to Use
