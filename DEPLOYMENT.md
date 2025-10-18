# Deployment Guide

This guide covers different deployment options for the Greater Works Attendance Tracker.

## Option 1: Firebase Hosting (Recommended)

Firebase Hosting provides fast, secure hosting with SSL certificate included.

### Prerequisites
- Firebase CLI installed
- Firebase project created and configured
- App built successfully

### Steps

1. **Install Firebase CLI** (if not already installed)
   ```bash
   npm install -g firebase-tools
   ```

2. **Login to Firebase**
   ```bash
   firebase login
   ```

3. **Initialize Firebase Hosting**
   ```bash
   firebase init hosting
   ```
   
   Answer the prompts:
   - **Project**: Select your existing Firebase project
   - **Public directory**: Enter `dist`
   - **Single-page app**: `Yes`
   - **Automatic builds with GitHub**: `No` (unless you want CI/CD)
   - **Overwrite index.html**: `No`

4. **Build the app**
   ```bash
   npm run build
   ```

5. **Deploy to Firebase**
   ```bash
   firebase deploy --only hosting
   ```

6. **Access your app**
   - Your app will be available at: `https://YOUR_PROJECT_ID.web.app`
   - Or custom domain: `https://YOUR_PROJECT_ID.firebaseapp.com`

### Custom Domain (Optional)

1. Go to Firebase Console > Hosting
2. Click **Add custom domain**
3. Enter your domain name
4. Follow DNS configuration instructions
5. Wait for SSL certificate provisioning (can take up to 24 hours)

---

## Option 2: Netlify

Netlify offers easy deployment with continuous deployment from Git.

### Steps

1. **Build the app**
   ```bash
   npm run build
   ```

2. **Install Netlify CLI**
   ```bash
   npm install -g netlify-cli
   ```

3. **Deploy**
   ```bash
   netlify deploy
   ```
   
   - Choose **Create & configure a new site**
   - Select your team
   - Enter site name
   - Publish directory: `dist`

4. **Deploy to production**
   ```bash
   netlify deploy --prod
   ```

### Continuous Deployment from GitHub

1. Push your code to GitHub
2. Go to [Netlify](https://app.netlify.com/)
3. Click **New site from Git**
4. Connect to GitHub
5. Select your repository
6. Build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`
7. Click **Deploy site**

---

## Option 3: Vercel

Vercel provides excellent performance and easy deployment.

### Steps

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Deploy**
   ```bash
   vercel
   ```
   
   Follow the prompts:
   - Set up and deploy: `Yes`
   - Which scope: Select your account
   - Link to existing project: `No`
   - Project name: `greater-works-attendance`
   - Directory: `./`
   - Override settings: `No`

3. **Deploy to production**
   ```bash
   vercel --prod
   ```

---

## Option 4: Traditional Web Hosting

For shared hosting or VPS (cPanel, Apache, Nginx, etc.)

### Steps

1. **Build the app**
   ```bash
   npm run build
   ```

2. **Upload files**
   - Upload all files from the `dist` folder to your web server
   - Typically to `public_html` or `www` directory

3. **Configure server**

   **For Apache (.htaccess)**
   Create `.htaccess` in your web root:
   ```apache
   <IfModule mod_rewrite.c>
     RewriteEngine On
     RewriteBase /
     RewriteRule ^index\.html$ - [L]
     RewriteCond %{REQUEST_FILENAME} !-f
     RewriteCond %{REQUEST_FILENAME} !-d
     RewriteRule . /index.html [L]
   </IfModule>
   ```

   **For Nginx**
   Add to your nginx config:
   ```nginx
   location / {
     try_files $uri $uri/ /index.html;
   }
   ```

4. **Access your app**
   - Navigate to your domain

---

## Environment Variables

If you need different Firebase configs for different environments:

### Create Environment Files

**.env.development**
```
VITE_FIREBASE_API_KEY=your_dev_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_dev_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_dev_project
VITE_FIREBASE_STORAGE_BUCKET=your_dev_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_dev_sender_id
VITE_FIREBASE_APP_ID=your_dev_app_id
```

**.env.production**
```
VITE_FIREBASE_API_KEY=your_prod_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_prod_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_prod_project
VITE_FIREBASE_STORAGE_BUCKET=your_prod_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_prod_sender_id
VITE_FIREBASE_APP_ID=your_prod_app_id
```

### Update firebase.js

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

---

## Post-Deployment Checklist

After deploying, verify:

- [ ] App loads correctly
- [ ] Login works
- [ ] Can create members
- [ ] Can create attendance sessions
- [ ] Can mark attendance
- [ ] QR code scanning works (requires HTTPS)
- [ ] Reports generate correctly
- [ ] PDF/CSV export works
- [ ] All user roles function properly
- [ ] Mobile responsiveness works
- [ ] Firebase security rules are active
- [ ] SSL certificate is valid (HTTPS)

---

## Performance Optimization

### Before Deployment

1. **Optimize Images**
   - Compress profile photos
   - Use appropriate image formats

2. **Code Splitting**
   - Already handled by Vite
   - Lazy load routes if needed

3. **Enable Compression**
   - Firebase Hosting: Automatic
   - Other hosts: Enable gzip/brotli

### After Deployment

1. **Monitor Performance**
   - Use Firebase Performance Monitoring
   - Check Google PageSpeed Insights

2. **Set up Caching**
   - Firebase Hosting: Automatic
   - Configure cache headers for static assets

---

## Continuous Deployment (CI/CD)

### GitHub Actions for Firebase

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Firebase Hosting

on:
  push:
    branches:
      - main

jobs:
  build_and_deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build
        run: npm run build
      
      - name: Deploy to Firebase
        uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: '${{ secrets.GITHUB_TOKEN }}'
          firebaseServiceAccount: '${{ secrets.FIREBASE_SERVICE_ACCOUNT }}'
          channelId: live
          projectId: your-project-id
```

---

## Rollback Strategy

If something goes wrong after deployment:

### Firebase Hosting
```bash
# View deployment history
firebase hosting:channel:list

# Rollback to previous version
firebase hosting:clone SOURCE_SITE_ID:SOURCE_CHANNEL_ID TARGET_SITE_ID:live
```

### Netlify
- Go to Deploys tab
- Click on previous successful deploy
- Click "Publish deploy"

### Vercel
- Go to Deployments
- Find previous working deployment
- Click "Promote to Production"

---

## Monitoring and Maintenance

### Set up Monitoring

1. **Firebase Performance Monitoring**
   ```bash
   npm install firebase/performance
   ```

2. **Error Tracking**
   - Use Firebase Crashlytics
   - Or integrate Sentry

3. **Analytics**
   - Enable Google Analytics in Firebase
   - Track user engagement

### Regular Maintenance

- **Weekly**: Check error logs
- **Monthly**: Review performance metrics
- **Quarterly**: Update dependencies
- **Yearly**: Review and update security rules

---

## Troubleshooting Deployment Issues

### Build Fails

**Error**: Module not found
```bash
# Solution: Clean install
rm -rf node_modules package-lock.json
npm install
npm run build
```

**Error**: Out of memory
```bash
# Solution: Increase Node memory
NODE_OPTIONS=--max_old_space_size=4096 npm run build
```

### Deployment Fails

**Firebase Error**: Authentication failed
```bash
# Solution: Re-login
firebase logout
firebase login
```

**Netlify Error**: Build command failed
- Check build logs in Netlify dashboard
- Ensure all dependencies are in package.json
- Verify build command is correct

### Runtime Issues

**Blank page after deployment**
- Check browser console for errors
- Verify Firebase config is correct
- Check that base URL is set correctly

**404 on refresh**
- Configure server for SPA routing
- See server configuration above

---

## Security Considerations

Before going live:

1. **Review Firebase Rules**
   - Test with Firebase Emulator
   - Ensure no public write access

2. **Environment Variables**
   - Never commit `.env` files
   - Use platform-specific env var management

3. **HTTPS Only**
   - Ensure SSL is enabled
   - Redirect HTTP to HTTPS

4. **Content Security Policy**
   - Add CSP headers if needed
   - Whitelist Firebase domains

---

## Support

For deployment issues:
- Check platform-specific documentation
- Review Firebase Console logs
- Contact platform support

---

**Your app is ready to deploy! 🚀**

Choose the deployment option that best fits your needs and follow the steps above.
