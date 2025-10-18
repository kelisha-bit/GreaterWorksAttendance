# Greater Works Attendance Tracker - User Guide

Welcome to the Greater Works Attendance Tracker! This guide will help you understand how to use the system effectively.

## Table of Contents
1. [Getting Started](#getting-started)
2. [Dashboard Overview](#dashboard-overview)
3. [Managing Members](#managing-members)
4. [Taking Attendance](#taking-attendance)
5. [Viewing Reports](#viewing-reports)
6. [Settings](#settings)
7. [User Roles](#user-roles)

---

## Getting Started

### Logging In

1. Open the app in your web browser
2. Enter your email address
3. Enter your password
4. Click **Sign In**

If you don't have login credentials, contact your church administrator.

### First Time Setup (Admins Only)

After logging in for the first time as an admin:
1. Add church members
2. Create departments (if needed)
3. Add other users and assign roles
4. Create your first attendance session

---

## Dashboard Overview

The dashboard is your home screen and shows:

### Statistics Cards
- **Total Members**: Number of registered church members
- **Today's Attendance**: Number of people present today
- **Weekly Average**: Average attendance for the current week
- **Attendance Rate**: Percentage of members attending

### Quick Actions
- **Register Member**: Add a new church member (Leaders/Admins only)
- **Create Session**: Start a new attendance session (Leaders/Admins only)
- **View Reports**: Access attendance analytics and reports

### Recent Sessions
Shows the 5 most recent attendance sessions with:
- Session name
- Date
- Event type
- Number of attendees

---

## Managing Members

### Adding a New Member (Leaders/Admins Only)

1. Click **Members** in the sidebar
2. Click **Add Member** button
3. Fill in the required information:
   - **Full Name** (required)
   - **Gender** (required)
   - **Phone Number** (required)
   - **Email** (optional)
   - **Department** (required)
   - **Membership Type** (required): Adult, Youth, Child, or Visitor
4. Optionally upload a profile photo
5. Click **Add Member**

The system will automatically generate a unique Member ID.

### Searching for Members

Use the search bar to find members by:
- Name
- Phone number
- Email
- Department
- Member ID

### Viewing Member QR Code

1. Find the member in the list
2. Click the **QR Code** icon
3. A modal will show the member's QR code
4. Click **Download QR Code** to save it

**Use Case**: Print QR codes on member cards for quick attendance marking

### Editing a Member (Leaders/Admins Only)

1. Find the member in the list
2. Click the **Edit** icon (pencil)
3. Update the information
4. Click **Update Member**

### Deleting a Member (Admins Only)

1. Find the member in the list
2. Click the **Delete** icon (trash)
3. Confirm the deletion

⚠️ **Warning**: This action cannot be undone!

---

## Taking Attendance

### Creating an Attendance Session (Leaders/Admins Only)

1. Click **Attendance** in the sidebar
2. Click **Create Session**
3. Fill in session details:
   - **Session Name**: e.g., "Sunday Service - Jan 21, 2025"
   - **Date**: Select the date
   - **Event Type**: Choose from dropdown (Sunday Service, Prayer Meeting, etc.)
   - **Department**: Select specific department or "All"
4. Click **Create Session**

### Marking Attendance - Manual Method

1. Click on a session from the list
2. The session details modal will open
3. Use the search bar to find specific members
4. Use the department filter to narrow down the list
5. Click **Mark** button next to each member's name
6. Members marked present will turn green and show "Present"

### Marking Attendance - QR Code Method

1. Click on a session from the list
2. Click **Scan QR Code** button
3. Allow camera access when prompted
4. Point your camera at the member's QR code
5. The system will automatically mark them present
6. Continue scanning other members

**Tips for QR Scanning:**
- Ensure good lighting
- Hold the QR code steady
- Keep the code within the scanning frame
- The scanner works best at 20-30cm distance

### Viewing Session Statistics

Each session card shows:
- Session name
- Date
- Event type
- Number of attendees

Click on any session to see detailed attendance list.

---

## Viewing Reports

### Accessing Reports

1. Click **Reports** in the sidebar
2. The reports dashboard will load with charts and statistics

### Using Filters

**Date Range Filter:**
- **This Week**: Shows data from the current week
- **This Month**: Shows data from the current month
- **All Time**: Shows all historical data

**Department Filter:**
- Select a specific department to see department-specific statistics
- Select "All" to see church-wide statistics

### Understanding the Charts

#### Attendance Trend (Line Chart)
- Shows attendance numbers over time
- Helps identify patterns and trends
- X-axis: Dates
- Y-axis: Number of attendees

#### Members by Department (Pie Chart)
- Shows distribution of members across departments
- Percentages displayed for each department
- Useful for understanding church structure

#### Members by Type (Bar Chart)
- Shows breakdown of membership types
- Categories: Adult, Youth, Child, Visitor
- Helps with planning age-appropriate programs

#### Recent Sessions Summary
- Lists recent sessions with attendance counts
- Quick overview of recent church activities

### Exporting Reports

#### Export to CSV
1. Click **Export CSV** button
2. File will download automatically
3. Open in Excel or Google Sheets
4. Contains: Date, Session Name, Event Type, Department, Attendance

**Use Case**: Further analysis, sharing with leadership team

#### Export to PDF
1. Click **Export PDF** button
2. PDF will download automatically
3. Contains: Summary statistics, sessions table
4. Professional format for printing or emailing

**Use Case**: Monthly reports, board meetings, archiving

---

## Settings

### Profile Tab

View your account information:
- Email address
- User role
- Account status

To update profile information, contact your administrator.

### Church Info Tab

View church details:
- Church name: Greater Works City Church
- Location: Ghana
- App branding information

### Departments Tab (Admins Only)

**Adding a Department:**
1. Click **Add Department**
2. Enter department name
3. Click **Add Department**

**Deleting a Department:**
1. Find the department in the list
2. Click the delete icon
3. Confirm deletion

⚠️ **Note**: Default departments cannot be deleted

### User Management Tab (Admins Only)

**Changing User Roles:**
1. Find the user in the table
2. Use the dropdown to select new role:
   - **Admin**: Full access
   - **Leader**: Can manage members and attendance
   - **Viewer**: Read-only access
3. Role updates automatically

**Adding New Users:**
1. Contact Firebase administrator to create user account
2. User document will be created automatically on first login
3. Admin can then assign appropriate role

---

## User Roles

### Admin
**Full Access** - Can do everything:
- ✅ Create and manage members
- ✅ Create attendance sessions
- ✅ Mark attendance
- ✅ View all reports
- ✅ Manage departments
- ✅ Manage user roles
- ✅ Delete records

**Best For**: Church administrators, IT coordinators

### Leader
**Management Access** - Can manage day-to-day operations:
- ✅ Create and manage members
- ✅ Create attendance sessions
- ✅ Mark attendance
- ✅ View all reports
- ❌ Cannot manage departments
- ❌ Cannot manage user roles
- ❌ Cannot delete records

**Best For**: Department heads, ministry leaders, ushers

### Viewer
**Read-Only Access** - Can only view information:
- ❌ Cannot create or edit members
- ❌ Cannot create sessions
- ❌ Cannot mark attendance
- ✅ Can view reports and statistics
- ❌ Cannot access settings

**Best For**: Church members, general staff

---

## Best Practices

### For Taking Attendance

1. **Create sessions in advance** - Set up Sunday service sessions at the beginning of the week
2. **Use QR codes for large groups** - Faster than manual marking
3. **Assign attendance takers** - Designate specific people for each service
4. **Mark attendance promptly** - Take attendance during or immediately after service
5. **Review before closing** - Double-check the count before finishing

### For Member Management

1. **Keep information updated** - Regularly update phone numbers and emails
2. **Use consistent naming** - First name then last name
3. **Assign correct departments** - Helps with targeted communication
4. **Upload photos when possible** - Makes identification easier
5. **Generate QR codes** - Print on member cards for convenience

### For Reporting

1. **Export monthly reports** - Keep records for historical reference
2. **Review trends regularly** - Identify patterns in attendance
3. **Share with leadership** - Keep church leaders informed
4. **Use filters effectively** - Get specific insights per department
5. **Archive important reports** - Save PDFs for future reference

---

## Troubleshooting

### Can't Log In
- Check your email and password
- Ensure caps lock is off
- Contact administrator if you forgot password

### QR Scanner Not Working
- Allow camera permissions in browser
- Ensure good lighting
- Try refreshing the page
- Use manual marking as backup

### Member Not Showing Up
- Check spelling in search
- Clear search filters
- Verify member was added to database

### Report Not Loading
- Check internet connection
- Refresh the page
- Try different date range

### Can't Create Session
- Verify you have Leader or Admin role
- Check all required fields are filled
- Ensure date is valid

---

## Mobile Usage

The app is fully mobile-responsive. On mobile devices:

- **Navigation**: Tap the menu icon (☰) to open sidebar
- **Scanning QR**: Works best in portrait mode
- **Tables**: Swipe left/right to see all columns
- **Forms**: Scroll to see all fields

---

## Support

For technical support or questions:
1. Contact your church administrator
2. Refer to the README.md for technical details
3. Check the SETUP_GUIDE.md for configuration help

---

## Quick Reference

### Keyboard Shortcuts
- **Ctrl/Cmd + F**: Focus search bar (when available)
- **Esc**: Close modals

### Common Tasks

| Task | Steps |
|------|-------|
| Add member | Members → Add Member → Fill form → Save |
| Create session | Attendance → Create Session → Fill details → Save |
| Mark attendance | Attendance → Select session → Mark or Scan |
| Export report | Reports → Select filters → Export CSV/PDF |
| Change user role | Settings → User Management → Select role |

---

**Happy tracking! May your church grow and thrive! 🙏**

*Greater Works City Church, Ghana*
