# Birthday & Anniversary Tracking System

## Overview
The Celebrations Tracking system helps churches remember and celebrate important dates in members' lives including birthdays, wedding anniversaries, baptisms, dedications, and other special occasions. The system provides calendar views, automated reminders, and comprehensive tracking features.

---

## Features Implemented

### 1. **Celebrations Page** (`/celebrations`)
**Access:** All authenticated users

#### Main Features:
- ✅ **Calendar View** - Monthly calendar of all celebrations
- ✅ **Upcoming View** - Next 30 days of celebrations
- ✅ **Today's Celebrations** - Highlighted alert banner
- ✅ **Search & Filter** - Find specific celebrations
- ✅ **Statistics Dashboard** - Quick overview of celebrations
- ✅ **Special Occasions Management** - Add custom events

---

### 2. **Celebration Types**

#### **Automatic Celebrations** (from Member Profiles):
1. **Birthdays** 🎂
   - Pulled from member's Date of Birth
   - Shows age/years
   - Recurring annually
   - Pink color theme

2. **Wedding Anniversaries** 💕
   - Pulled from member's Wedding Anniversary date
   - Shows years married
   - Recurring annually
   - Red color theme

#### **Custom Special Occasions**:
3. **Baptism** 💧
   - Member baptism dates
   - Blue color theme

4. **Dedication** 🎁
   - Child dedication dates
   - Purple color theme

5. **Other** 🎉
   - Any custom celebration
   - Orange color theme

---

### 3. **Statistics Dashboard**

Four real-time stat cards:

**Today** (Pink)
- Count of celebrations happening today
- Immediate attention alert

**This Month** (Purple)
- Total celebrations in current month
- Monthly planning overview

**Next 30 Days** (Blue)
- Upcoming celebrations count
- Advance planning

**Total Events** (Orange)
- All celebrations in system
- Complete overview

---

### 4. **Calendar View**

#### Features:
- ✅ **Month Navigation** - Previous/Next month buttons
- ✅ **Today Button** - Quick return to current month
- ✅ **Sorted by Date** - Chronological order
- ✅ **Days Until** - Countdown to each celebration
- ✅ **Age/Years Display** - Shows turning age or years
- ✅ **Color-Coded Icons** - Visual type identification
- ✅ **Edit/Delete** - Manage special occasions (Leaders only)

#### Display Information:
- Celebration title
- Date (Month Day format)
- Years/Age (for birthdays and anniversaries)
- Days until celebration
- Icon based on type
- Color-coded background

---

### 5. **Upcoming View**

#### Features:
- ✅ **30-Day Forecast** - Next month of celebrations
- ✅ **Sorted by Proximity** - Closest dates first
- ✅ **Today Highlight** - Special styling for today
- ✅ **Turning Age** - Shows upcoming age/years
- ✅ **Notes Display** - Additional celebration details

#### Special Styling:
- Today's celebrations: Pink/purple gradient with border
- Future celebrations: Gray background
- Days until counter
- Full date display

---

### 6. **Search & Filter System**

#### Search:
- Search by celebration title
- Search by member name
- Real-time filtering

#### Filter Options:
- **All Celebrations** - Show everything
- **Birthdays Only** - Filter to birthdays
- **Anniversaries Only** - Filter to anniversaries
- **Special Occasions** - Custom events only

#### View Toggle:
- **Upcoming** - Next 30 days view
- **Calendar** - Monthly calendar view

---

### 7. **Today's Celebrations Alert**

#### Features:
- ✅ **Prominent Banner** - Top of page
- ✅ **Pink/Purple Gradient** - Eye-catching design
- ✅ **Party Popper Icon** - Festive visual
- ✅ **List of Celebrations** - All today's events
- ✅ **Auto-Hide** - Only shows when there are celebrations

#### Purpose:
- Immediate notification of today's celebrations
- Ensures no celebrations are missed
- Encourages timely wishes

---

### 8. **Special Occasions Management**

#### Add Special Occasion (Leaders Only):
**Form Fields:**
- **Title*** - Event name (e.g., "John's Baptism")
- **Type*** - Select from 5 types
- **Date*** - Event date
- **Member** - Link to specific member (optional)
- **Notes** - Additional details (optional)
- **Recurring** - Annual repetition checkbox

#### Features:
- ✅ **Create** - Add new occasions
- ✅ **Edit** - Update existing occasions
- ✅ **Delete** - Remove occasions
- ✅ **Member Linking** - Associate with member
- ✅ **Recurring Option** - Annual celebrations

---

### 9. **Member Profile Integration**

#### New Fields Added to Members:
1. **Date of Birth** (Optional)
   - Date picker field
   - Automatically creates birthday celebration
   - Shows age in celebrations

2. **Wedding Anniversary** (Optional)
   - Date picker field
   - Automatically creates anniversary celebration
   - Shows years married

#### Location in Form:
- Added after Membership Type field
- Before Profile Photo upload
- Optional fields (not required)

---

### 10. **Smart Calculations**

#### Days Until Calculation:
```javascript
// Calculates days until next occurrence
// Accounts for past dates (shows next year)
// Returns 0 for today
```

#### Age/Years Calculation:
```javascript
// Calculates current age from birth date
// Calculates years married from anniversary
// Accounts for month/day comparison
```

---

## Database Structure

### Firestore Collection: `special_occasions`

```javascript
{
  title: "John's Baptism",              // Event title
  type: "Baptism",                      // Type of celebration
  date: "2020-05-15",                   // Event date (YYYY-MM-DD)
  memberId: "GW123456789",              // Linked member ID (optional)
  memberName: "John Doe",               // Member name (optional)
  notes: "Special ceremony details",    // Additional notes (optional)
  recurring: true,                      // Annual repetition
  createdAt: "2025-10-18T05:00:00Z"    // Creation timestamp
}
```

### Updated Members Collection:

```javascript
{
  // ... existing fields
  dateOfBirth: "1990-01-15",           // Birthday (optional)
  weddingAnniversary: "2015-06-20",    // Anniversary (optional)
  // ... other fields
}
```

---

## Security & Permissions

### Firestore Rules:
```javascript
match /special_occasions/{occasionId} {
  allow read: if isAuthenticated();           // All users can view
  allow create, update: if isAdminOrLeader(); // Leaders can manage
  allow delete: if hasRole('admin');          // Only admins delete
}
```

### Access Control:
- **All Users:** View all celebrations
- **Leaders/Admins:** Add/edit/delete special occasions
- **Admins Only:** Delete special occasions

---

## Usage Guide

### For All Users:

#### Viewing Celebrations:
1. Click **Celebrations** in sidebar
2. See today's celebrations at top (if any)
3. View statistics cards
4. Browse calendar or upcoming view

#### Searching:
1. Use search box to find specific celebrations
2. Type member name or celebration title
3. Results filter in real-time

#### Filtering:
1. Select filter type from dropdown
2. Choose: All, Birthdays, Anniversaries, or Occasions
3. View updates automatically

#### Switching Views:
1. Click **Upcoming** for 30-day forecast
2. Click **Calendar** for monthly view
3. Use month navigation arrows
4. Click **Today** to return to current month

---

### For Leaders/Admins:

#### Adding Special Occasions:
1. Click **Add Occasion** button
2. Fill in form:
   - Enter title
   - Select type
   - Choose date
   - Link to member (optional)
   - Add notes (optional)
   - Check recurring if annual
3. Click **Add Occasion**

#### Editing Occasions:
1. Find occasion in calendar/upcoming view
2. Click **Edit** icon (pencil)
3. Update information
4. Click **Update Occasion**

#### Deleting Occasions:
1. Find occasion in list
2. Click **Delete** icon (trash)
3. Confirm deletion
4. Occasion removed

#### Adding Member Birthdays/Anniversaries:
1. Go to **Members** page
2. Click **Register Member** or edit existing
3. Fill in **Date of Birth** (optional)
4. Fill in **Wedding Anniversary** (optional)
5. Save member
6. Celebrations auto-appear in Celebrations page

---

## Celebration Workflow

### Daily Routine:
1. **Check Today's Alert** - See if anyone has celebration today
2. **Send Wishes** - Contact members with celebrations
3. **Plan Ahead** - Review upcoming celebrations

### Weekly Planning:
1. **Review Next 30 Days** - See upcoming celebrations
2. **Prepare Cards/Gifts** - Plan for special occasions
3. **Schedule Announcements** - Plan church announcements

### Monthly Review:
1. **Check Month Calendar** - See all month's celebrations
2. **Update Special Occasions** - Add new events
3. **Verify Member Data** - Ensure dates are correct

---

## Best Practices

### Data Entry:
- ✅ Always add member birthdays when registering
- ✅ Ask about wedding anniversaries
- ✅ Record baptism and dedication dates
- ✅ Add notes for special circumstances
- ✅ Use recurring for annual events

### Celebration Management:
- ✅ Check celebrations daily
- ✅ Send wishes on the actual day
- ✅ Plan special recognition for milestones
- ✅ Update member data when informed of changes
- ✅ Archive old non-recurring events

### Communication:
- ✅ Send birthday wishes personally
- ✅ Announce anniversaries in church
- ✅ Recognize special milestones publicly
- ✅ Send cards or gifts for significant years
- ✅ Pray for members on special days

---

## Celebration Ideas

### Birthdays:
- 🎂 Send birthday card/message
- 🎁 Small gift for milestone ages (50, 60, 70, etc.)
- 📢 Church announcement
- 🎵 Birthday song during service
- 🍰 Birthday cake after service

### Anniversaries:
- 💐 Flowers for couple
- 🎊 Recognition for milestone years (25, 50, etc.)
- 📸 Photo display of couple
- 🙏 Special prayer for marriage
- 🎉 Anniversary celebration event

### Baptisms/Dedications:
- 📜 Certificate presentation
- 📸 Photo commemoration
- 🎁 Symbolic gift
- 🙏 Prayer of remembrance
- 📖 Scripture reading

---

## Automated Reminders (Future Enhancement)

### Planned Features:
- 📧 Email notifications 1 week before
- 📱 SMS reminders 1 day before
- 🔔 Dashboard notifications
- 📅 Calendar export (iCal)
- 🤖 Automated birthday wishes
- 📊 Monthly celebration reports

---

## Integration Points

### Dashboard Integration:
- Today's celebrations widget
- Upcoming celebrations preview
- Quick link to celebrations page

### Member Profile Integration:
- Birthday and anniversary fields
- Automatic celebration creation
- Age calculation

### My Portal Integration:
- Personal upcoming celebrations
- Days until next birthday
- Anniversary countdown

---

## Statistics & Analytics

### Available Metrics:
- Total celebrations tracked
- Birthdays this month
- Anniversaries this year
- Most common birth month
- Upcoming milestone birthdays
- Recent baptisms/dedications

---

## Mobile Responsiveness

### Optimized For:
- ✅ Mobile phones (1 column layout)
- ✅ Tablets (2 column layout)
- ✅ Desktop (4 column layout)
- ✅ Touch-friendly buttons
- ✅ Scrollable tables
- ✅ Responsive modals

---

## Color Coding System

### Celebration Types:
- **Birthday** - Pink (`bg-pink-500`)
- **Anniversary** - Red (`bg-red-500`)
- **Baptism** - Blue (`bg-blue-500`)
- **Dedication** - Purple (`bg-purple-500`)
- **Other** - Orange (`bg-orange-500`)

### Icons:
- **Birthday** - Cake 🎂
- **Anniversary** - Heart 💕
- **Baptism** - Star ⭐
- **Dedication** - Gift 🎁
- **Other** - Party Popper 🎉

---

## Troubleshooting

### Common Issues:

**Issue:** Birthday not showing in celebrations  
**Solution:** Ensure Date of Birth is filled in member profile

**Issue:** Can't add special occasion  
**Solution:** Check that you have Leader or Admin role

**Issue:** Wrong age showing  
**Solution:** Verify Date of Birth format is correct (YYYY-MM-DD)

**Issue:** Anniversary not appearing  
**Solution:** Ensure Wedding Anniversary field is populated

**Issue:** Celebration showing wrong date  
**Solution:** Check date format and timezone settings

---

## Privacy Considerations

### Data Visibility:
- All authenticated users can see celebrations
- Ages are calculated and displayed
- Personal dates are visible to all members
- Consider privacy preferences for sensitive dates

### Recommendations:
- Ask permission before adding personal dates
- Respect privacy requests
- Allow members to opt-out
- Keep celebration notes appropriate

---

## Technical Details

### Files Created:
- `src/pages/Celebrations.jsx` - Main celebrations page

### Files Modified:
- `src/pages/Members.jsx` - Added birthday/anniversary fields
- `src/App.jsx` - Added Celebrations route
- `src/components/Layout.jsx` - Added Celebrations menu item
- `firestore.rules` - Added special_occasions security rules

### Routes Added:
- `/celebrations` - Celebrations page

### Navigation:
- **Celebrations** (Cake icon) - Available to all users

---

## Future Enhancements

Potential improvements:
- 📧 Automated email birthday wishes
- 📱 SMS notifications
- 🎨 Custom celebration themes
- 📸 Photo galleries for celebrations
- 🎵 Birthday song player
- 📊 Celebration analytics dashboard
- 🎁 Gift tracking system
- 📅 Google Calendar integration
- 🤖 AI-generated birthday messages
- 🏆 Celebration leaderboards

---

## Support

For questions about celebrations tracking:
1. Check this documentation
2. Verify member data is complete
3. Ensure proper role permissions
4. Contact system administrator

---

**Last Updated:** October 18, 2025  
**Version:** 1.0  
**Feature Status:** ✅ Production Ready
