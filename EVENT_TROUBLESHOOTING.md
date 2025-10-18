# Event Calendar Troubleshooting Guide

## 🔍 Issue: Saved Events Not Showing

### Quick Fixes

#### 1. Check Browser Console (F12)
Open the browser console and look for:
- Number of events fetched
- Date range being queried
- Any error messages

**Expected Output:**
```
Fetched events: X events
Date range: [start date] to [end date]
Events: [array of events]
```

#### 2. Verify Event Date
**Problem:** Event might be outside the current view's date range

**Solution:**
- If you created an event for December but viewing October, it won't show
- Navigate to the correct month/week/day
- Or switch to **Agenda View** which shows next 30 days

**Steps:**
1. Click the "Today" button to go to current date
2. Use Previous/Next arrows to navigate to event date
3. Or switch to Agenda view to see all upcoming events

#### 3. Check Event Visibility
**Problem:** Event visibility might be set to "Private"

**Solution:**
- Private events only visible to admins/leaders
- Log in as admin or leader to see private events
- Or change event visibility to "Public" or "Members Only"

**Check in Firebase Console:**
1. Go to Firestore Database
2. Open `events` collection
3. Find your event
4. Check `visibility` field (should be "public", "members", or "private")
5. Check `status` field (should be "published", not "draft")

#### 4. Check Event Status
**Problem:** Event might be saved as "Draft"

**Solution:**
- Draft events only visible to admins/leaders
- Change status to "Published" to make visible to all

#### 5. Refresh the Page
**Simple Fix:**
- Hard refresh: `Ctrl + Shift + R` (Windows) or `Cmd + Shift + R` (Mac)
- This clears cache and reloads everything

#### 6. Check User Role
**Problem:** User might not have permission to view certain events

**Solution:**
- Verify user role in Firebase Console
- Go to `users` collection → find user → check `role` field
- Should be: "member", "leader", or "admin"

---

## 🔧 Detailed Troubleshooting

### Step 1: Open Browser Console
1. Press `F12` or right-click → Inspect
2. Go to "Console" tab
3. Refresh the Events Calendar page
4. Look for console logs

### Step 2: Check Console Output

**Good Output (Events Found):**
```
Fetched events: 5 events
Date range: Mon Oct 01 2024 to Wed Oct 31 2024
Events: [{id: "abc123", title: "Sunday Service", ...}, ...]
```

**Bad Output (No Events):**
```
Fetched events: 0 events
Date range: Mon Oct 01 2024 to Wed Oct 31 2024
Events: []
```

### Step 3: Diagnose the Issue

#### If "Fetched events: 0 events"

**Possible Causes:**
1. No events in that date range
2. Event date is outside current view
3. Firestore security rules blocking access
4. Event visibility/status preventing access

**Solutions:**

**A. Check Date Range**
- Look at the date range in console
- Is your event's date within this range?
- Navigate to the correct month/week

**B. Check Firestore Console**
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project: `gwccapp-fc67c`
3. Go to Firestore Database
4. Check `events` collection
5. Verify events exist

**C. Check Event Data**
Click on an event document and verify:
```javascript
{
  title: "Sunday Service",
  startDate: Timestamp (Oct 20, 2024 09:00:00),
  endDate: Timestamp (Oct 20, 2024 11:00:00),
  visibility: "public",  // ← Should be "public" or "members"
  status: "published",   // ← Should be "published"
  eventType: "worship_service",
  // ... other fields
}
```

#### If "FirebaseError" in Console

**Error: Missing or insufficient permissions**
- Security rules not deployed
- User not authenticated
- User role not set

**Solution:**
```bash
# Re-deploy security rules
firebase deploy --only firestore:rules
```

**Error: Invalid query**
- Date format issue
- Missing required fields

**Solution:**
- Check that event has `startDate` field as Timestamp
- Re-create the event if necessary

---

## 🎯 Common Scenarios

### Scenario 1: "I just created an event but can't see it"

**Checklist:**
- [ ] Is the event date within the current view?
- [ ] Is the event status "Published" (not "Draft")?
- [ ] Is the event visibility "Public" or "Members Only"?
- [ ] Did you refresh the page?
- [ ] Are you viewing the correct month/week/day?

**Quick Fix:**
1. Click "Today" button
2. Switch to "Agenda" view
3. Look for your event in the list
4. If not there, check Firestore Console

### Scenario 2: "Events show in Firestore but not in calendar"

**Possible Causes:**
- Security rules issue
- Date format issue
- Query range issue

**Debug Steps:**
1. Open browser console
2. Check for errors
3. Look at "Fetched events" count
4. Verify date range matches event date

**Fix:**
```javascript
// Check event date format in Firestore
// Should be: Timestamp, not String
startDate: October 20, 2024 at 9:00:00 AM UTC+0
// NOT: "2024-10-20"
```

### Scenario 3: "Some events show, others don't"

**Likely Cause:** Visibility or status differences

**Check:**
1. Events with `visibility: "private"` → Only admins/leaders see
2. Events with `status: "draft"` → Only admins/leaders see
3. Events with `visibility: "public"` → Everyone sees

**Solution:**
- Edit events to change visibility to "public"
- Change status to "published"

### Scenario 4: "Events disappeared after changing month"

**This is Normal!** Events are filtered by date range.

**Solution:**
- Navigate to the month where events exist
- Use Previous/Next buttons
- Or use Agenda view to see all upcoming events

---

## 🛠️ Manual Fixes

### Fix 1: Re-deploy Security Rules

```bash
cd "c:\Users\Amasco DE-General\Desktop\GreaterWorksAttendance"
firebase deploy --only firestore:rules
```

### Fix 2: Clear Browser Cache

**Chrome/Edge:**
1. Press `Ctrl + Shift + Delete`
2. Select "Cached images and files"
3. Click "Clear data"
4. Refresh page

**Firefox:**
1. Press `Ctrl + Shift + Delete`
2. Select "Cache"
3. Click "Clear Now"
4. Refresh page

### Fix 3: Verify User Authentication

**Check in Console:**
```javascript
// Paste in browser console
firebase.auth().currentUser
// Should show user object, not null
```

### Fix 4: Manually Check Firestore

1. Go to Firebase Console
2. Firestore Database
3. `events` collection
4. Click on an event
5. Verify all fields are present:
   - `startDate`: Timestamp
   - `endDate`: Timestamp
   - `visibility`: "public", "members", or "private"
   - `status`: "published", "draft", or "cancelled"
   - `title`: String
   - `eventType`: String

---

## 📊 Debug Checklist

Use this checklist to systematically debug:

### Event Creation
- [ ] Event was created successfully (no error message)
- [ ] Event ID was generated
- [ ] Success toast appeared

### Event Data
- [ ] Event exists in Firestore Console
- [ ] `startDate` is a Timestamp (not string)
- [ ] `endDate` is a Timestamp (not string)
- [ ] `visibility` is set ("public", "members", or "private")
- [ ] `status` is "published" (not "draft")

### Security & Permissions
- [ ] Firestore rules deployed successfully
- [ ] User is authenticated (logged in)
- [ ] User has correct role in `/users/{userId}`
- [ ] User has permission to view event type

### Calendar View
- [ ] Viewing correct month/week/day
- [ ] Event date is within view range
- [ ] Browser console shows events fetched
- [ ] No errors in console

### Browser & Cache
- [ ] Page refreshed after creating event
- [ ] Browser cache cleared
- [ ] No JavaScript errors
- [ ] Network requests successful

---

## 🚨 Emergency Reset

If nothing works, try this complete reset:

### Step 1: Clear Everything
```bash
# Stop dev server (Ctrl+C)
# Clear node modules
rm -rf node_modules
npm install

# Re-deploy rules
firebase deploy --only firestore:rules
```

### Step 2: Clear Browser
1. Clear all browser cache
2. Close all browser tabs
3. Restart browser

### Step 3: Restart Dev Server
```bash
npm run dev
```

### Step 4: Test
1. Log in
2. Go to Events Calendar
3. Create a test event for TODAY
4. Set visibility to "Public"
5. Set status to "Published"
6. Save
7. Refresh page
8. Check if event appears

---

## 📞 Still Not Working?

### Collect Debug Information

1. **Browser Console Output:**
   - Copy all console logs
   - Include any errors

2. **Event Data from Firestore:**
   - Screenshot of event document
   - Include all fields

3. **User Information:**
   - User role
   - Authentication status

4. **Steps to Reproduce:**
   - What did you do?
   - What did you expect?
   - What actually happened?

### Contact Support
Provide the debug information above to your IT administrator or developer.

---

## ✅ Prevention Tips

### When Creating Events:
1. Always set visibility to "Public" for general events
2. Always set status to "Published" (not Draft)
3. Double-check the date and time
4. Use the "Today" button to navigate to current date
5. Refresh page after creating event

### Best Practices:
- Create events at least a day in advance
- Use Agenda view to verify all upcoming events
- Test with a simple event first
- Check Firestore Console if unsure

---

**Last Updated:** October 2024  
**Version:** 1.0
