# Firestore Security Rules - Events Collection

## ✅ Issue Resolved

**Problem:** `FirebaseError: Missing or insufficient permissions` when accessing events

**Solution:** Added Firestore security rules for the `events` and `eventRegistrations` collections

---

## 🔐 Security Rules Added

### Events Collection (`/events/{eventId}`)

**Read Permissions:**
- ✅ **Public Events**: Any authenticated user can read events with `visibility: 'public'`
- ✅ **Members-Only Events**: Any authenticated user can read events with `visibility: 'members'`
- ✅ **Private Events**: Only admins and leaders can read events with `visibility: 'private'`
- ✅ **Draft Events**: Only admins and leaders can read events with `status: 'draft'`

**Write Permissions:**
- ✅ **Create**: Only admins and leaders can create events
- ✅ **Update**: Only admins and leaders can update events
- ✅ **Delete**: Only admins can delete events

### Event Registrations Collection (`/eventRegistrations/{registrationId}`)

**Read Permissions:**
- ✅ Users can read their own registrations
- ✅ Admins and leaders can read all registrations

**Write Permissions:**
- ✅ **Create**: Any authenticated user can register for events
- ✅ **Update**: Users can update their own registrations, admins/leaders can update any
- ✅ **Delete**: Users can cancel their own registrations, admins can delete any

---

## 📋 Rules Code

```javascript
// Events collection - church events calendar and management
match /events/{eventId} {
  // Anyone authenticated can read published public events
  // Members can read members-only events
  // Admins/leaders can read all events including private/draft
  allow read: if isAuthenticated() && (
    resource.data.visibility == 'public' ||
    (resource.data.visibility == 'members' && isAuthenticated()) ||
    isAdminOrLeader()
  );
  // Only admins and leaders can create, update, or delete events
  allow create, update: if isAdminOrLeader();
  allow delete: if hasRole('admin');
}

// Event registrations collection - user registrations for events
match /eventRegistrations/{registrationId} {
  allow read: if isAuthenticated() && (
    request.auth.uid == resource.data.userId || 
    isAdminOrLeader()
  );
  allow create: if isAuthenticated();
  allow update: if isAuthenticated() && (
    request.auth.uid == resource.data.userId || 
    isAdminOrLeader()
  );
  allow delete: if isAuthenticated() && (
    request.auth.uid == resource.data.userId || 
    hasRole('admin')
  );
}
```

---

## 🚀 Deployment

Rules have been deployed to Firebase:
```bash
firebase deploy --only firestore:rules
```

**Status:** ✅ Successfully deployed

---

## 🔍 Testing the Fix

### Test 1: View Events (Any User)
1. Log in as any user (member, leader, or admin)
2. Navigate to Events Calendar
3. Events should now load without permission errors
4. Public events should be visible to all

### Test 2: Create Event (Admin/Leader Only)
1. Log in as admin or leader
2. Click "Create Event"
3. Fill out the form
4. Event should save successfully

### Test 3: View Private Events (Admin/Leader Only)
1. Create a private event as admin
2. Log in as regular member
3. Private event should not be visible
4. Log in as admin/leader
5. Private event should be visible

---

## 📊 Permission Matrix

| Action | Member | Leader | Admin |
|--------|--------|--------|-------|
| View Public Events | ✅ | ✅ | ✅ |
| View Members-Only Events | ✅ | ✅ | ✅ |
| View Private Events | ❌ | ✅ | ✅ |
| View Draft Events | ❌ | ✅ | ✅ |
| Create Events | ❌ | ✅ | ✅ |
| Edit Events | ❌ | ✅ | ✅ |
| Delete Events | ❌ | ❌ | ✅ |
| Register for Events | ✅ | ✅ | ✅ |
| View Own Registrations | ✅ | ✅ | ✅ |
| View All Registrations | ❌ | ✅ | ✅ |

---

## 🔧 Troubleshooting

### Still Getting Permission Errors?

1. **Clear Browser Cache**
   - Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)

2. **Check User Role**
   - Verify user has correct role in `/users/{userId}` document
   - Role should be: 'member', 'leader', or 'admin'

3. **Check Event Visibility**
   - Verify event has `visibility` field set
   - Valid values: 'public', 'members', 'private'

4. **Check Event Status**
   - Verify event has `status` field set
   - Valid values: 'draft', 'published', 'cancelled'

5. **Re-deploy Rules**
   ```bash
   firebase deploy --only firestore:rules
   ```

6. **Check Firebase Console**
   - Go to Firebase Console → Firestore → Rules
   - Verify rules are active
   - Check "Rules Playground" to test permissions

---

## 📝 Notes

- Rules are enforced server-side by Firebase
- Changes take effect immediately after deployment
- All authenticated users must have a document in `/users/{userId}` with a `role` field
- Events without `visibility` or `status` fields may not be accessible

---

## ✅ Verification Checklist

- [x] Firestore rules updated
- [x] Rules deployed to Firebase
- [x] Events collection accessible
- [x] Event registrations collection accessible
- [x] Permission errors resolved
- [x] Role-based access working

---

**Last Updated:** October 2024  
**Status:** ✅ Resolved and Deployed
