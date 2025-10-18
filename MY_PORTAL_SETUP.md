# My Portal Setup Guide

## Overview
The **My Portal** feature allows individual church members to view their own personal dashboard with attendance records, profile information, and upcoming sessions.

## How It Works

### User-to-Member Linking
The system links authenticated users to member profiles using **email addresses**. When a user logs into "My Portal", the system:

1. Gets the user's email from Firebase Authentication
2. Searches the `members` collection for a member with matching email
3. Displays that member's personal information and attendance history

### Important Setup Steps

#### For Administrators/Leaders:

When registering new members, **make sure to include their email address** in the member profile. This email should match the email they use to log into the system.

**Steps:**
1. Go to **Members** page
2. Click **Add Member**
3. Fill in all details including the **Email** field (this is critical!)
4. The email entered here should be the same email the member uses to log in

#### For Members:

1. Log in using your email and password
2. Click **My Portal** in the sidebar
3. View your:
   - Personal profile information
   - Attendance statistics (total sessions, present, absent, percentage)
   - Recent attendance history
   - Upcoming church sessions
   - Personal QR code for quick check-in

### If "No Profile Found" Message Appears

If a user sees "No Profile Found" when accessing My Portal, it means:

**Problem:** Their login email doesn't match any member profile email in the database.

**Solution:**
1. Contact a church administrator or leader
2. Ask them to update your member profile with your correct email address
3. The email in your member profile must match your login email exactly

### Features Available in My Portal

✅ **Personal Dashboard** - Welcome screen with your photo and details  
✅ **Attendance Statistics** - Visual cards showing your attendance metrics  
✅ **Personal Information** - Phone, email, department, membership type  
✅ **Upcoming Sessions** - See what church events are coming up  
✅ **Recent Attendance** - Your last 10 attendance records  
✅ **Personal QR Code** - Download your QR code for quick check-in  

### Privacy & Security

- Users can **only see their own data** in My Portal
- Members cannot view other members' personal information
- All data is protected by Firebase authentication
- Firestore security rules ensure users can only read their own records

### Technical Notes

**Email Matching:**
```javascript
// The system queries members by email
const membersQuery = query(
  collection(db, 'members'),
  where('email', '==', currentUser.email)
);
```

**Best Practices:**
- Always use lowercase emails for consistency
- Ensure email is provided when creating member profiles
- Verify email accuracy before saving member records
- Users should use the same email for login and member profile

### Troubleshooting

**Issue:** User can't see their portal data  
**Fix:** Verify the email in their member profile matches their login email

**Issue:** Attendance stats show zero  
**Fix:** This is normal if no attendance has been recorded yet

**Issue:** No upcoming sessions shown  
**Fix:** This means no future sessions are scheduled in the system

---

## For Developers

### File Structure
- **Component:** `src/pages/MyPortal.jsx`
- **Route:** `/my-portal`
- **Navigation:** Added to `src/components/Layout.jsx`

### Database Collections Used
- `members` - User profile data
- `attendance_sessions` - Church events/sessions
- `attendance_records` - Individual attendance records

### Key Functions
- `fetchUserData()` - Links user to member profile via email
- `fetchAttendanceData()` - Calculates attendance statistics
- `fetchUpcomingSessions()` - Gets future scheduled sessions
