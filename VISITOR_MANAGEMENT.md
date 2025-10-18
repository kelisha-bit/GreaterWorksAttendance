# Visitor Management System

## Overview
The Visitor Management system helps churches track first-time visitors, manage follow-ups, and convert visitors into members. This feature provides comprehensive tools for welcoming and integrating new people into the church community.

---

## Features Implemented

### 1. **Visitor Registration** (`/visitors`)
**Access:** Admin & Leader roles only

#### Registration Form Fields:
**Personal Information:**
- ✅ Full Name (required)
- ✅ Gender (required)
- ✅ Phone Number (required)
- ✅ Email (optional)
- ✅ Address (optional)

**Visit Information:**
- ✅ Visit Date (required)
- ✅ Visit Type: First Time, Second Visit, Third Visit, Regular Visitor
- ✅ How Did You Hear About Us? (Friend/Family, Social Media, Google Search, etc.)
- ✅ Interested in Membership (checkbox)
- ✅ Follow-up Status (Pending, Contacted, Scheduled, Completed, No Response)

**Additional Information:**
- ✅ Prayer Request (optional)
- ✅ Notes (optional)

#### Auto-Generated:
- **Visitor ID** - Unique identifier (format: V123456789)
- **Created/Updated timestamps**
- **Recorded by** - Tracks who registered the visitor

---

### 2. **Visitor Dashboard Statistics**

Real-time statistics displayed in colorful cards:

- **Total Visitors** - All registered visitors
- **First Time** - Visitors on their first visit
- **Returning** - Visitors who came back but aren't members yet
- **Converted** - Visitors who became members
- **Needs Follow-up** - Visitors with pending or scheduled follow-ups

---

### 3. **Visitor List & Filtering**

#### Search Capabilities:
- Search by name
- Search by phone number
- Search by email

#### Filter Options:
- All Visitors
- First Time Only
- Returning Visitors
- Converted to Members
- Needs Follow-up

#### Visitor Table Columns:
- Visitor ID
- Name
- Phone
- Visit Date (with "days ago" indicator)
- Visit Type (badge)
- Follow-up Status (color-coded badge)
- Status (Member/Urgent/Active)
- Actions (View, Edit, Delete)

---

### 4. **Visitor Profile Page** (`/visitors/:visitorId`)

#### Detailed Information Display:
- ✅ Full visitor profile with all details
- ✅ Days since visit counter
- ✅ Status badges (visit type, follow-up status, membership interest)
- ✅ Prayer request display (highlighted section)
- ✅ Notes section
- ✅ Follow-up history timeline

#### Status Alerts:
- **Converted to Member** - Green alert showing conversion date and member ID
- **Urgent Follow-up Required** - Red alert if >7 days without follow-up

---

### 5. **Follow-up Management**

#### Follow-up Statuses:
- **Pending** - Yellow badge - Not yet contacted
- **Contacted** - Blue badge - Initial contact made
- **Scheduled** - Purple badge - Follow-up meeting scheduled
- **Completed** - Green badge - Follow-up completed
- **No Response** - Gray badge - Unable to reach visitor

#### Follow-up Features:
- ✅ Add follow-up notes
- ✅ Update follow-up status
- ✅ Track follow-up history with timestamps
- ✅ Record who made the follow-up
- ✅ Automatic urgent alerts for overdue follow-ups

#### Follow-up History:
Each follow-up record includes:
- Date and time
- Status at that time
- Detailed notes
- Who recorded it

---

### 6. **Visitor-to-Member Conversion**

#### Conversion Process:
1. Click "Convert to Member" button on visitor profile
2. Select department for the new member
3. Select membership type (Adult, Youth, Child)
4. System automatically:
   - Creates new member record
   - Generates member ID
   - Transfers all visitor information
   - Marks visitor as converted
   - Records conversion date
   - Links visitor record to member record

#### Conversion Data Transfer:
All visitor information is transferred:
- Full name
- Gender
- Phone number
- Email
- Address
- Plus new member-specific fields (department, membership type)

#### Post-Conversion:
- Visitor profile shows "Converted to Member" status
- Visitor remains in visitors list for historical tracking
- Member appears in Members section
- Conversion date and member ID are recorded

---

## Database Structure

### Firestore Collection: `visitors`

```javascript
{
  visitorId: "V123456789",              // Auto-generated unique ID
  fullName: "John Doe",                 // Visitor's full name
  gender: "Male",                       // Gender
  phoneNumber: "+233123456789",         // Phone number
  email: "john@example.com",            // Email (optional)
  address: "123 Main St, Accra",        // Address (optional)
  visitDate: "2025-10-18",              // Date of visit
  visitType: "First Time",              // Type of visit
  howDidYouHear: "Friend/Family",       // How they heard about church
  interestedInMembership: true,         // Interest in membership
  prayerRequest: "Pray for my family",  // Prayer request (optional)
  followUpStatus: "Pending",            // Current follow-up status
  notes: "Very friendly visitor",       // Additional notes
  convertedToMember: false,             // Conversion status
  memberId: null,                       // Member ID if converted
  conversionDate: null,                 // Date of conversion
  followUpHistory: [                    // Array of follow-up records
    {
      date: "2025-10-20T10:00:00Z",
      note: "Called and scheduled meeting",
      status: "Scheduled",
      recordedBy: "admin@church.com"
    }
  ],
  lastFollowUpDate: "2025-10-20T10:00:00Z",
  recordedBy: "admin@church.com",       // Who registered the visitor
  createdAt: "2025-10-18T09:00:00Z",
  updatedAt: "2025-10-20T10:00:00Z"
}
```

---

## Security & Permissions

### Firestore Rules:
```javascript
match /visitors/{visitorId} {
  allow read: if isAuthenticated();           // All authenticated users can read
  allow create, update: if isAdminOrLeader(); // Only admins/leaders can create/update
  allow delete: if hasRole('admin');          // Only admins can delete
}
```

### Access Control:
- **Admins & Leaders:** Full access to all visitor management features
- **Regular Members:** Cannot access visitor management
- **Viewers:** Cannot access visitor management

---

## Usage Guide

### For Administrators/Leaders:

#### Registering a New Visitor:
1. Navigate to **Visitors** in the sidebar
2. Click **Register Visitor** button
3. Fill in the registration form:
   - Enter personal information (name, gender, phone, email, address)
   - Set visit date and type
   - Select how they heard about the church
   - Check "Interested in Membership" if applicable
   - Add prayer request or notes if provided
   - Set initial follow-up status
4. Click **Register Visitor**

#### Viewing Visitor Details:
1. Go to **Visitors** page
2. Click the **eye icon** next to any visitor
3. View complete profile with all information
4. See follow-up history and status alerts

#### Adding Follow-up Notes:
1. Open visitor profile
2. Click **Add Follow-up** button
3. Select follow-up status
4. Enter detailed notes about the interaction
5. Click **Save Follow-up**
6. Note is added to follow-up history with timestamp

#### Converting Visitor to Member:
1. Open visitor profile
2. Click **Convert to Member** button
3. Select department for the new member
4. Select membership type
5. Click **Convert to Member**
6. Visitor is now a member and appears in Members section

#### Editing Visitor Information:
1. Go to **Visitors** page
2. Click the **edit icon** (pencil) next to visitor
3. Update any information
4. Click **Update Visitor**

#### Deleting Visitor Records:
1. Go to **Visitors** page
2. Click the **delete icon** (trash) next to visitor
3. Confirm deletion
4. Record is permanently removed

---

## Best Practices

### Registration:
- ✅ Register visitors as soon as possible after their visit
- ✅ Collect accurate contact information
- ✅ Note any prayer requests or special needs
- ✅ Record how they heard about the church for marketing insights
- ✅ Ask about membership interest

### Follow-up:
- ✅ Follow up within 24-48 hours of first visit
- ✅ Update follow-up status after each contact
- ✅ Add detailed notes for continuity
- ✅ Schedule follow-up meetings when appropriate
- ✅ Mark as "No Response" after 3-4 attempts

### Conversion:
- ✅ Only convert when visitor expresses clear commitment
- ✅ Ensure they've attended multiple times
- ✅ Complete membership orientation if required
- ✅ Assign appropriate department based on interests
- ✅ Welcome them officially as new members

### Data Management:
- ✅ Keep visitor information up to date
- ✅ Maintain privacy and confidentiality
- ✅ Regular review of pending follow-ups
- ✅ Track conversion rates for ministry evaluation

---

## Follow-up Workflow

### Recommended Timeline:

**Day 1 (Visit Day):**
- Register visitor in system
- Status: Pending

**Day 2-3:**
- Make initial contact (call/text/email)
- Thank them for visiting
- Update status to "Contacted"
- Add follow-up note

**Day 7-10:**
- Schedule coffee/meeting if interested
- Update status to "Scheduled"
- Add meeting details in notes

**Day 14-21:**
- Complete follow-up meeting
- Discuss membership if interested
- Update status to "Completed"

**If No Response:**
- After 3-4 attempts, mark as "No Response"
- Keep in database for future reference

---

## Urgent Follow-up Alerts

The system automatically flags visitors needing urgent attention:

**Criteria for Urgent Alert:**
- More than 7 days since visit
- Follow-up status is still "Pending"

**Alert Display:**
- Red warning badge in visitor list
- Red alert banner on visitor profile
- Shows exact number of days since visit

**Action Required:**
- Prioritize these visitors for immediate follow-up
- Update status after contact attempt
- Add notes explaining delay if applicable

---

## Reporting & Analytics

### Available Statistics:
- Total number of visitors
- First-time vs. returning visitors
- Conversion rate (visitors → members)
- Follow-up completion rate
- Visitors needing urgent follow-up

### Tracking Metrics:
- Days since visit
- Follow-up response rate
- Conversion timeline
- Source of referrals (how they heard about church)

---

## Integration with Members System

### Automatic Data Transfer:
When converting a visitor to member:
- All personal information is copied
- Visitor ID is preserved in member record
- Conversion date is recorded
- Member ID is generated and linked back to visitor

### Dual Records:
- Visitor record remains for historical tracking
- Member record is created for ongoing management
- Both records are linked via IDs

### Benefits:
- Complete history of member's journey
- Track conversion effectiveness
- Maintain visitor statistics
- Preserve original visit information

---

## Troubleshooting

### Common Issues:

**Issue:** Can't see Visitors menu  
**Solution:** This feature is only visible to Admin and Leader roles

**Issue:** Visitor not appearing in list  
**Solution:** Check search filters and status filters

**Issue:** Can't convert visitor to member  
**Solution:** Ensure you select a department before converting

**Issue:** Follow-up history not showing  
**Solution:** Follow-up history only appears after adding at least one follow-up note

**Issue:** Urgent alert showing incorrectly  
**Solution:** Alert triggers after 7 days with "Pending" status - update status to clear alert

---

## Technical Details

### Files Created:
- `src/pages/Visitors.jsx` - Main visitors list and registration
- `src/pages/VisitorProfile.jsx` - Detailed visitor profile with conversion
- `firestore.rules` - Updated with visitors security rules

### Routes Added:
- `/visitors` - Visitors management page
- `/visitors/:visitorId` - Individual visitor profile

### Navigation:
- **Visitors** - UserPlus icon (Admin/Leader only)

### Dependencies:
- Firebase Firestore for data storage
- Lucide React for icons
- React Hot Toast for notifications
- React Router for navigation

---

## Future Enhancements

Potential additions to the visitor management system:
- 📧 Automated welcome emails
- 📱 SMS follow-up reminders
- 📊 Visitor analytics dashboard
- 🎯 Visitor journey mapping
- 📅 Automated follow-up scheduling
- 🏷️ Visitor tags/categories
- 📝 Visitor feedback forms
- 🎁 Welcome gift tracking
- 👥 Visitor referral tracking
- 📈 Conversion funnel analysis

---

## Support

For questions or issues with the visitor management feature:
1. Check this documentation
2. Review the Troubleshooting section
3. Ensure you have the correct role permissions
4. Contact your system administrator

---

**Last Updated:** October 18, 2025  
**Version:** 1.0  
**Feature Status:** ✅ Production Ready
