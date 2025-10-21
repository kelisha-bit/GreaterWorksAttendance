# Role-Based Dashboards

## Overview
The Greater Works Attendance application now features intelligent role-based dashboards that automatically adapt to show relevant information and actions based on the user's role (Admin, Leader, or Member). Each dashboard provides customized widgets, statistics, and quick actions tailored to the user's responsibilities.

---

## Dashboard Types

### 1. **Admin Dashboard** (Enhanced Dashboard)
**Access:** Admin role only

#### Features:
- ✅ **Complete System Overview** - All church statistics
- ✅ **Full Management Access** - All administrative functions
- ✅ **Financial Insights** - Contributions and giving trends
- ✅ **Visitor Tracking** - Recent visitors and follow-ups
- ✅ **Top Contributors** - Ranked giving list
- ✅ **Comprehensive Analytics** - All metrics visible

#### Statistics Displayed:
1. **Total Members** - Complete member count
2. **Today's Attendance** - Current day attendance
3. **Weekly Average** - 7-day attendance average
4. **Attendance Rate** - Percentage of members attending
5. **Total Visitors** - All registered visitors
6. **Pending Follow-ups** - Visitors needing contact
7. **This Month Giving** - Current month contributions
8. **Total Contributions** - All-time giving total

#### Quick Actions:
- Register Member
- Register Visitor
- Create Attendance Session
- Record Contribution
- View Reports

#### Widgets:
- Recent Visitors (last 5)
- Top Contributors (top 5)
- Recent Attendance Sessions (last 5)

---

### 2. **Leader Dashboard** (Enhanced Dashboard)
**Access:** Leader role only

#### Features:
- ✅ **Department Management** - Focus on assigned department
- ✅ **Team Oversight** - Department member tracking
- ✅ **Visitor Management** - Follow-up responsibilities
- ✅ **Financial Tracking** - Contribution monitoring
- ✅ **Performance Metrics** - Department analytics

#### Statistics Displayed:
1. **Total Members** - Church-wide member count
2. **Today's Attendance** - Current day attendance
3. **Weekly Average** - 7-day attendance average
4. **Attendance Rate** - Percentage calculation
5. **Total Visitors** - Visitor count
6. **Pending Follow-ups** - Follow-up tasks
7. **This Month Giving** - Monthly contributions
8. **Total Contributions** - Overall giving

#### Quick Actions:
- Register Member
- Register Visitor
- Create Attendance Session
- Record Contribution
- View Reports

#### Widgets:
- Recent Visitors (last 5)
- Top Contributors (top 5)
- Recent Attendance Sessions (last 5)

#### Additional Access:
- **My Department** - Dedicated department dashboard
- Department-specific statistics
- Department member list
- Department performance tracking

---

### 3. **Member Dashboard** (Enhanced Dashboard)
**Access:** Regular members and viewers

#### Features:
- ✅ **Personal Overview** - Individual statistics
- ✅ **Church Information** - General church stats
- ✅ **Attendance Tracking** - Personal attendance count
- ✅ **Limited Actions** - View-only access
- ✅ **My Portal Access** - Personal dashboard link

#### Statistics Displayed:
1. **Total Members** - Church member count
2. **Today's Attendance** - Current attendance
3. **Weekly Average** - Church attendance average
4. **Attendance Rate** - Overall percentage
5. **My Attendance** - Personal attendance count

#### Quick Actions:
- View Reports
- My Portal (personal dashboard)

#### Widgets:
- Recent Attendance Sessions (last 5)

#### Restrictions:
- ❌ Cannot register members or visitors
- ❌ Cannot create attendance sessions
- ❌ Cannot record contributions
- ❌ Cannot view financial data
- ❌ Cannot access visitor management

---

### 4. **Department Dashboard**
**Access:** Leaders and Viewers with assigned departments

#### Features:
- ✅ **Department-Specific Stats** - Focused metrics
- ✅ **Member Roster** - Complete department list
- ✅ **Performance Tracking** - Department analytics
- ✅ **Top Performer Recognition** - Highlight active members
- ✅ **Activity Monitoring** - Recent engagement

#### Statistics Displayed:
1. **Total Members** - Department member count
2. **Active Members** - Members active in last 30 days
3. **Avg Attendance** - Average per department member
4. **Top Performer** - Most active department member

#### Department Member Table:
- Member ID
- Full Name
- Phone Number
- Email
- Membership Type

#### Quick Actions:
- View All Members
- Department Reports
- Track Attendance

#### Access Requirements:
- Must be assigned to a department
- Department field must be populated in member profile
- Automatically filters data by department

---

## Role-Based Features

### Admin Role Features:
✅ Full system access  
✅ All statistics visible  
✅ Financial management  
✅ Visitor management  
✅ Member management  
✅ Contribution tracking  
✅ All reports access  
✅ Department oversight  

### Leader Role Features:
✅ Department management  
✅ Department dashboard  
✅ Visitor management  
✅ Financial tracking  
✅ Member registration  
✅ Attendance creation  
✅ Contribution recording  
✅ Team analytics  

### Member Role Features:
✅ Personal dashboard (My Portal)  
✅ View church statistics  
✅ View attendance sessions  
✅ View reports  
✅ Personal attendance tracking  
❌ No administrative access  
❌ No financial access  
❌ No visitor management  

---

## Dashboard Customization

### Automatic Adaptation:
The dashboard automatically detects the user's role and displays:
- **Relevant statistics** - Only metrics the user needs
- **Appropriate actions** - Only functions they can perform
- **Role-specific widgets** - Data relevant to their responsibilities
- **Custom header** - Role-based title and description

### Color-Coded Headers:
- **Admin Dashboard** - Gold gradient with Settings icon
- **Leader Dashboard** - Gold gradient with Award icon
- **Member Dashboard** - Gold gradient with Users icon
- **Department Dashboard** - Gold gradient with Award icon

### Dynamic Quick Actions:
Quick action cards automatically show/hide based on permissions:
- Admin sees all actions
- Leaders see management actions
- Members see view-only actions

---

## Widget System

### Available Widgets:

#### 1. **Statistics Cards**
- Responsive grid layout (1-4 columns)
- Icon-based visual indicators
- Color-coded by metric type
- Hover effects for interactivity

#### 2. **Recent Visitors Widget**
- Last 5 visitors
- Visit type badges
- Follow-up status indicators
- Quick link to full visitor list
- Admin/Leader only

#### 3. **Top Contributors Widget**
- Top 5 givers
- Ranked with medals (1st, 2nd, 3rd)
- Total contribution amounts
- Quick link to financial reports
- Admin/Leader only

#### 4. **Recent Sessions Widget**
- Last 5 attendance sessions
- Session name and date
- Event type
- Attendance count
- Available to all roles

#### 5. **Department Members Widget**
- Complete member roster
- Sortable table
- Contact information
- Membership type badges
- Department Dashboard only

---

## Navigation Structure

### Main Dashboard (`/`)
- Role-based enhanced dashboard
- Automatic role detection
- Dynamic content loading

### Department Dashboard (`/department-dashboard`)
- Leaders and Viewers with assigned departments
- Requires department assignment
- Department-specific data

### My Portal (`/my-portal`)
- All authenticated users
- Personal statistics
- Individual contributions
- Personal attendance

---

## Usage Guide

### For Admins:

#### Accessing Admin Dashboard:
1. Log in with admin credentials
2. Automatically redirected to admin dashboard
3. View all system statistics
4. Access all management functions

#### Key Metrics to Monitor:
- Total members and visitors
- Attendance rates and trends
- Pending follow-ups
- Financial contributions
- Top contributors

#### Quick Actions:
- Use quick action cards for common tasks
- Click widget headers to view full pages
- Monitor recent visitors for follow-up
- Track top contributors for recognition

---

### For Leaders:

#### Accessing Leader Dashboard:
1. Log in with leader credentials
2. View leader-specific dashboard
3. Access department dashboard via sidebar

#### Accessing Department Dashboard (Leaders and Viewers):
1. Click **My Department** in sidebar (if assigned to a department)
2. View department statistics
3. Monitor member activity
4. Track department performance

#### Key Responsibilities:
- Follow up with visitors
- Monitor department attendance
- Track department contributions
- Recognize top performers

---

### For Viewers:

#### Accessing Department Dashboard:
1. Log in with viewer credentials
2. Click **My Department** in sidebar (if assigned to a department)
3. View department overview and member list
4. See department statistics (read-only)

#### Available Actions:
- View department statistics
- View department member list
- Access My Portal for personal data
- View church-wide reports

---

## Technical Implementation

### Files Created:
- `src/pages/EnhancedDashboard.jsx` - Main role-based dashboard
- `src/pages/DepartmentDashboard.jsx` - Department-specific dashboard

### Files Modified:
- `src/App.jsx` - Updated to use EnhancedDashboard
- `src/components/Layout.jsx` - Added Department Dashboard link

### Routes Added:
- `/` - Enhanced Dashboard (role-based)
- `/department-dashboard` - Department Dashboard (leaders only)

### Role Detection:
```javascript
const { userRole, currentUser } = useAuth();

// Role-based rendering
if (userRole === 'admin') {
  // Show admin features
} else if (userRole === 'leader') {
  // Show leader features
} else {
  // Show member features
}
```

### Dynamic Statistics:
```javascript
const getStatCards = () => {
  const commonCards = [...]; // All users
  const adminLeaderCards = [...]; // Admin/Leader only
  const memberCards = [...]; // Members only
  
  return [...commonCards, ...adminLeaderCards, ...memberCards]
    .filter(card => card.show);
};
```

---

## Performance Optimization

### Data Fetching:
- ✅ Parallel queries for faster loading
- ✅ Role-based data fetching (only load needed data)
- ✅ Cached statistics where possible
- ✅ Efficient Firestore queries

### Loading States:
- Spinner during data fetch
- Graceful error handling
- Empty state messages
- Skeleton screens (future enhancement)

---

## Responsive Design

### Mobile Optimization:
- ✅ Responsive grid layouts (1-4 columns)
- ✅ Collapsible navigation
- ✅ Touch-friendly buttons
- ✅ Optimized table views
- ✅ Scrollable widgets

### Breakpoints:
- **Mobile:** 1 column stats
- **Tablet:** 2 column stats
- **Desktop:** 4 column stats

---

## Future Enhancements

Potential dashboard improvements:
- 📊 Drag-and-drop widget customization
- 🎨 Custom color themes per role
- 📈 Real-time data updates
- 🔔 Dashboard notifications
- 📱 Mobile app version
- 🎯 Goal tracking widgets
- 📅 Calendar integration
- 🏆 Gamification elements
- 📊 Custom chart builders
- 💾 Dashboard layout saving

---

## Troubleshooting

### Common Issues:

**Issue:** Dashboard shows wrong role  
**Solution:** Check user role in Firestore `users` collection

**Issue:** Department Dashboard shows "No Department Assigned"  
**Solution:** Ensure user's member profile has `department` field populated

**Issue:** Statistics showing zero  
**Solution:** This is normal if no data exists yet; start adding records

**Issue:** Can't see financial widgets  
**Solution:** Financial widgets only visible to Admin and Leader roles

**Issue:** Quick actions not showing  
**Solution:** Actions are role-based; check user permissions

---

## Best Practices

### For Administrators:
- ✅ Monitor pending follow-ups daily
- ✅ Review top contributors monthly
- ✅ Track attendance trends weekly
- ✅ Assign departments to leaders
- ✅ Ensure proper role assignments

### For Leaders:
- ✅ Check department dashboard weekly
- ✅ Monitor department attendance
- ✅ Follow up with inactive members
- ✅ Recognize top performers
- ✅ Update department information

### For Members:
- ✅ Check My Portal regularly
- ✅ Review personal attendance
- ✅ Stay informed on church stats
- ✅ Participate in church activities

---

## Security & Privacy

### Role-Based Access Control:
- Dashboard content filtered by role
- Sensitive data hidden from members
- Financial data restricted to leaders
- Visitor data protected

### Data Privacy:
- Members see only aggregated stats
- Personal data protected
- Department data isolated
- Contribution amounts private (except to leaders)

---

## Support

For questions about role-based dashboards:
1. Check this documentation
2. Verify user role assignment
3. Ensure department assignment (for leaders)
4. Contact system administrator

---

**Last Updated:** October 18, 2025  
**Version:** 1.0  
**Feature Status:** ✅ Production Ready
