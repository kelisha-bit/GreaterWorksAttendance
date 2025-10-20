# User Role Management System

## Overview
The Greater Works Attendance application now includes a comprehensive user role management system that allows administrators to control access levels and permissions for all users.

## Role Types

### 1. **Admin** 👑
- **Full System Access**: Complete control over all features and data
- **User Management**: Can assign and modify roles for all users
- **Data Management**: Access to backup, restore, and data management features
- **Financial Access**: Full access to contributions and financial reports
- **Member Management**: Can create, edit, and delete members and visitors
- **Event Management**: Full control over events and attendance sessions

### 2. **Leader** 🛡️
- **Management Access**: Can manage members, events, and attendance
- **Member Management**: Can create and edit member profiles
- **Visitor Management**: Can track and manage visitors
- **Event Management**: Can create and manage church events
- **Attendance Tracking**: Can mark attendance and create sessions
- **Financial Access**: Can view and manage contributions and financial reports
- **Reporting**: Access to reports and analytics

### 3. **Viewer** 👁️
- **Read-Only Access**: Can view information but cannot make changes
- **Dashboard Access**: Can view dashboard and statistics
- **Member Directory**: Can view member profiles
- **Event Calendar**: Can view events and register for them
- **Personal Portal**: Can access their own portal and information
- **Reports**: Can view reports and analytics

## Features

### User Role Management Page (`/user-roles`)
**Access**: Admin only

#### Statistics Dashboard
- Total user count
- Count of users by role (Admin, Leader, Viewer)
- Visual indicators with role-specific colors

#### Role Descriptions
Clear explanation of permissions for each role type to help admins make informed decisions.

#### User Management Table
- **Search**: Find users by name or email
- **Filter**: Filter users by role type
- **Role Assignment**: Change user roles with dropdown selection
- **Visual Indicators**: Color-coded role badges
- **Protection**: Admins cannot change their own role

#### Confirmation Modal
- Prevents accidental role changes
- Shows current and new role
- Displays user information
- Requires explicit confirmation

## Technical Implementation

### Database Structure

#### Users Collection (`users`)
```javascript
{
  email: "user@example.com",
  role: "admin" | "leader" | "viewer",
  name: "User Name",
  createdAt: "2025-10-20T00:00:00.000Z",
  updatedAt: "2025-10-20T00:00:00.000Z",
  updatedBy: "admin-user-id"
}
```

### Authentication Context

The `AuthContext` provides:
- `currentUser`: Firebase auth user object
- `userRole`: Current user's role string
- `userData`: Full user data from Firestore
- `isAdmin`: Boolean check for admin role
- `isLeader`: Boolean check for leader or admin role
- `isViewer`: Boolean check for viewer role
- `refreshUserRole()`: Function to refresh user role from database

### Firestore Security Rules

```javascript
match /users/{userId} {
  allow read: if isAuthenticated();
  allow create: if isAuthenticated() && request.auth.uid == userId;
  allow update, delete: if hasRole('admin');
}
```

### Route Protection

Routes are protected based on role requirements:
- **Admin-only**: User Roles, Backup & Data
- **Leader-only**: Visitors, Contributions, Financial Reports, Department Dashboard
- **All authenticated**: Dashboard, Members, Events, etc.

## Usage Guide

### For Administrators

#### Assigning Roles
1. Navigate to **User Roles** from the sidebar (admin only)
2. Use the search bar to find specific users
3. Use the filter dropdown to view users by role
4. Select the new role from the dropdown in the user's row
5. Confirm the change in the modal that appears

#### Best Practices
- **Admin Role**: Assign sparingly to trusted individuals only
- **Leader Role**: Assign to department heads and ministry leaders
- **Viewer Role**: Default for new members and general users
- **Regular Review**: Periodically review user roles and adjust as needed
- **Documentation**: Keep a record of role changes for accountability

### For Developers

#### Checking User Roles in Components
```javascript
import { useAuth } from '../contexts/AuthContext';

function MyComponent() {
  const { isAdmin, isLeader, userRole } = useAuth();
  
  // Check for specific role
  if (isAdmin) {
    // Admin-only code
  }
  
  // Check for leader or admin
  if (isLeader) {
    // Leader or admin code
  }
  
  // Check exact role
  if (userRole === 'viewer') {
    // Viewer-only code
  }
}
```

#### Protecting UI Elements
```javascript
{isAdmin && (
  <button>Admin Only Button</button>
)}

{isLeader && (
  <div>Leader Content</div>
)}
```

#### Refreshing User Role
```javascript
const { refreshUserRole } = useAuth();

// After updating a user's role
await updateUserRole(userId, newRole);
await refreshUserRole(); // Refresh current user's role if needed
```

## Security Considerations

### Role Persistence
- Roles are stored in Firestore, not localStorage
- Roles are fetched on authentication and cached in memory
- Roles are refreshed on page reload
- Role changes take effect immediately for the affected user

### Protection Mechanisms
1. **Firestore Rules**: Server-side validation of all operations
2. **Client-side Checks**: UI elements hidden based on roles
3. **Route Guards**: Navigation restricted by role
4. **Self-Protection**: Users cannot modify their own roles
5. **Admin Requirement**: Only admins can modify any user's role

### Audit Trail
All role changes include:
- Timestamp (`updatedAt`)
- Admin who made the change (`updatedBy`)
- Previous and new role (in confirmation modal)

## Troubleshooting

### User Can't Access Expected Features
1. Verify the user's role in the User Roles page
2. Check if the feature requires a specific role
3. Ensure the user has logged out and back in after role change
4. Verify Firestore rules are deployed correctly

### Role Changes Not Taking Effect
1. User should log out and log back in
2. Check browser console for errors
3. Verify Firestore connection
4. Check that the role was actually updated in Firestore

### Cannot Access User Roles Page
- Only admins can access this page
- Verify your account has admin role
- Check with another admin to verify/update your role

## Future Enhancements

Potential improvements for the role management system:
- **Custom Roles**: Create custom roles with specific permissions
- **Permission Sets**: Granular permission control beyond role types
- **Role History**: Track all role changes over time
- **Bulk Operations**: Assign roles to multiple users at once
- **Email Notifications**: Notify users when their role changes
- **Temporary Roles**: Assign time-limited elevated permissions
- **Department-based Roles**: Roles specific to departments

## Related Documentation
- [Authentication Guide](./SETUP_GUIDE.md)
- [Firestore Rules](./firestore.rules)
- [User Guide](./USER_GUIDE.md)
- [Deployment Guide](./DEPLOYMENT_GUIDE.md)
