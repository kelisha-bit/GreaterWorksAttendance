# Offline Support - Quick Start Guide

## 🚀 What's New?

The Greater Works Attendance app now works **offline**! You can mark attendance even without internet, and it will sync automatically when you're back online.

## 📱 How to Use

### Marking Attendance Offline

1. **Open the Attendance page**
2. **Select a session**
3. **Mark attendance as usual** - even if offline!
4. **See the offline indicator** (bottom-right corner)
5. **Wait for sync** when connection returns

### Understanding the Indicator

#### 🟢 Online (No Pending)
- No indicator shown - everything is synced!

#### 🔵 Online (Pending Records)
- Blue indicator with number badge
- Click to see details and sync manually

#### 🔴 Offline
- Red pulsing indicator
- Shows how many records are waiting
- Will sync automatically when online

### Manual Sync

1. **Click the indicator** in the bottom-right
2. **Click "Sync Now"** button
3. **Wait for confirmation** toast

## ✨ Features

- ✅ **Works Offline**: Mark attendance without internet
- ✅ **Auto Sync**: Syncs when connection returns
- ✅ **Visual Feedback**: See sync status in real-time
- ✅ **No Data Loss**: All records are saved locally
- ✅ **Background Sync**: Syncs even when app is closed (if supported)

## 🎯 Best Practices

### For Leaders/Admins

1. **Test offline mode** before events
2. **Monitor the indicator** during events
3. **Verify sync** after events complete
4. **Keep app open** until sync completes

### For Users

1. **Trust the system** - offline saves work!
2. **Check the indicator** to see pending records
3. **Stay on the page** until sync completes
4. **Report issues** if sync fails

## 🔧 Troubleshooting

### "Records not syncing"
- **Check connection**: Make sure you're actually online
- **Manual sync**: Click indicator → "Sync Now"
- **Refresh page**: Sometimes helps trigger sync
- **Wait**: Background sync may take a few minutes

### "Offline indicator not showing"
- **Refresh the page**: Service worker may need to activate
- **Check browser**: Must support Service Workers
- **Clear cache**: Try hard refresh (Ctrl+Shift+R)

### "Duplicate records"
- **Don't panic**: System prevents duplicates
- **Check Firebase**: Verify actual records
- **Contact admin**: If issues persist

## 📊 What Gets Saved Offline?

### ✅ Saved Offline
- Attendance records
- Member information (cached)
- Session details (cached)

### ❌ Not Saved Offline
- New sessions (requires online)
- Member edits (requires online)
- Reports and analytics (requires online)

## 🌐 Browser Support

### Fully Supported
- Chrome/Edge 49+
- Firefox 44+
- Safari 11.1+

### Partially Supported
- Older browsers: Manual sync only
- No Service Workers: Online-only mode

## 💡 Tips

1. **Test before events**: Try offline mode in advance
2. **Keep app open**: Until sync completes
3. **Monitor indicator**: Watch for pending records
4. **Stable connection**: Sync works best with stable WiFi
5. **Report issues**: Help us improve!

## 📞 Need Help?

1. Check the full guide: `OFFLINE_SUPPORT_GUIDE.md`
2. Look at browser console for errors
3. Contact your system administrator
4. Report bugs to the development team

---

**Quick Tip**: The offline indicator only shows when needed. If you don't see it, everything is synced! ✅
