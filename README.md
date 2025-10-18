# Greater Works Attendance Tracker

A modern, mobile-friendly attendance tracking application for **Greater Works City Church, Ghana**. Built with React and Firebase for real-time data synchronization and secure storage.

![Church Theme](https://img.shields.io/badge/Theme-White%20%26%20Gold-D4AF37)
![Firebase](https://img.shields.io/badge/Backend-Firebase-orange)
![React](https://img.shields.io/badge/Frontend-React-blue)

## 🌟 Features

### Core Functionality
- **Member Management**: Register and manage church members with detailed profiles
- **Attendance Tracking**: Create sessions and mark attendance manually or via QR code
- **Reports & Analytics**: Generate comprehensive reports with visual charts
- **Role-Based Access**: Admin, Leader, and Viewer roles with different permissions
- **QR Code Support**: Generate member QR codes for quick attendance marking
- **Data Export**: Export reports to PDF and CSV formats

### Technical Features
- Real-time data synchronization with Firebase Firestore
- Secure authentication with Firebase Auth
- Responsive mobile-first design
- Beautiful white & gold church branding
- Offline-capable with Firebase caching
- Profile photo upload with Firebase Storage

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Firebase account

### Installation

1. **Clone or download the project**
   ```bash
   cd GreaterWorksAttendance
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Firebase**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Create a new project or use an existing one
   - Enable the following services:
     - Authentication (Email/Password)
     - Firestore Database
     - Storage
   - Copy your Firebase configuration

4. **Configure Firebase**
   - Open `src/config/firebase.js`
   - Replace the placeholder values with your Firebase configuration:
   ```javascript
   const firebaseConfig = {
     apiKey: "YOUR_API_KEY",
     authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
     projectId: "YOUR_PROJECT_ID",
     storageBucket: "YOUR_PROJECT_ID.appspot.com",
     messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
     appId: "YOUR_APP_ID"
   };
   ```

5. **Deploy Firestore Security Rules**
   - In Firebase Console, go to Firestore Database > Rules
   - Copy the contents of `firestore.rules` and paste it
   - Publish the rules

6. **Deploy Storage Security Rules**
   - In Firebase Console, go to Storage > Rules
   - Copy the contents of `storage.rules` and paste it
   - Publish the rules

7. **Create the first admin user**
   - In Firebase Console, go to Authentication
   - Click "Add user"
   - Enter email and password
   - After creating the user, go to Firestore Database
   - Create a new collection called `users`
   - Add a document with the user's UID as the document ID
   - Add the following fields:
     ```
     email: "admin@example.com"
     role: "admin"
     name: "Admin Name"
     createdAt: [current timestamp]
     ```

8. **Start the development server**
   ```bash
   npm run dev
   ```

9. **Open your browser**
   - Navigate to `http://localhost:3000`
   - Log in with your admin credentials

## 📱 Usage Guide

### For Admins

#### Managing Members
1. Navigate to **Members** page
2. Click **Add Member** button
3. Fill in member details (Name, Gender, Phone, Department, etc.)
4. Optionally upload a profile photo
5. Click **Add Member** to save

#### Creating Attendance Sessions
1. Go to **Attendance** page
2. Click **Create Session**
3. Enter session details (Name, Date, Event Type, Department)
4. Click **Create Session**

#### Marking Attendance
1. Select a session from the list
2. Use one of these methods:
   - **Manual**: Click the "Mark" button next to each member
   - **QR Code**: Click "Scan QR Code" and scan member QR codes
3. Members marked present will be highlighted in green

#### Viewing Reports
1. Navigate to **Reports** page
2. Use filters to customize the view (Date Range, Department)
3. View charts and statistics
4. Export data using **Export CSV** or **Export PDF** buttons

#### Managing Users
1. Go to **Settings** > **User Management**
2. Change user roles using the dropdown
3. Roles available: Admin, Leader, Viewer

### For Leaders
- Can create attendance sessions
- Can manage members
- Can mark attendance
- Can view reports

### For Viewers
- Can view attendance summaries
- Can view reports
- Cannot create or edit data

## 🎨 Customization

### Church Branding
The app uses a white and gold color scheme. To customize:

1. Edit `tailwind.config.js`:
   ```javascript
   colors: {
     church: {
       gold: '#D4AF37',        // Primary gold
       darkGold: '#B8941F',    // Darker shade
       lightGold: '#F5E6C8',   // Lighter shade
     }
   }
   ```

2. Update church information in `src/pages/Settings.jsx`

### Departments
Default departments are:
- Choir
- Ushering
- Media
- Children Ministry
- Youth Ministry
- Prayer Team
- Welfare
- Protocol
- Other

Admins can add custom departments in **Settings** > **Departments**

## 🔒 Security

### Firestore Security Rules
- Only authenticated users can read data
- Only admins and leaders can create/edit records
- Only admins can delete records
- Users can only update their own profile

### Storage Security Rules
- Profile photos limited to 5MB
- Only image files allowed
- Users can only upload to their own folder

## 📊 Database Structure

### Collections

#### `users`
```javascript
{
  email: string,
  role: "admin" | "leader" | "viewer",
  name: string,
  createdAt: timestamp
}
```

#### `members`
```javascript
{
  memberId: string,           // Auto-generated
  fullName: string,
  gender: "Male" | "Female",
  phoneNumber: string,
  email: string,
  department: string,
  membershipType: "Adult" | "Youth" | "Child" | "Visitor",
  profilePhotoURL: string,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

#### `attendance_sessions`
```javascript
{
  name: string,
  date: string,               // YYYY-MM-DD
  eventType: string,
  department: string,
  attendeeCount: number,
  createdAt: timestamp
}
```

#### `attendance_records`
```javascript
{
  sessionId: string,
  memberId: string,
  markedAt: timestamp
}
```

## 🛠️ Tech Stack

- **Frontend**: React 18, React Router, TailwindCSS
- **Backend**: Firebase (Firestore, Auth, Storage)
- **Charts**: Recharts
- **QR Codes**: qrcode.react, html5-qrcode
- **PDF Export**: jsPDF
- **Build Tool**: Vite
- **Icons**: Lucide React

## 📦 Build for Production

```bash
npm run build
```

The build files will be in the `dist` folder.

### Deploy to Firebase Hosting

1. Install Firebase CLI:
   ```bash
   npm install -g firebase-tools
   ```

2. Login to Firebase:
   ```bash
   firebase login
   ```

3. Initialize Firebase Hosting:
   ```bash
   firebase init hosting
   ```
   - Select your Firebase project
   - Set public directory to `dist`
   - Configure as single-page app: Yes
   - Don't overwrite index.html

4. Build and deploy:
   ```bash
   npm run build
   firebase deploy
   ```

## 🐛 Troubleshooting

### Common Issues

**Issue**: "Firebase not configured"
- **Solution**: Make sure you've updated `src/config/firebase.js` with your Firebase credentials

**Issue**: "Permission denied" errors
- **Solution**: Check that Firestore and Storage security rules are properly deployed

**Issue**: QR scanner not working
- **Solution**: Make sure you're using HTTPS or localhost (camera access requires secure context)

**Issue**: Can't log in
- **Solution**: Verify that the user exists in Firebase Authentication and has a corresponding document in the `users` collection

## 📄 License

This project is created for Greater Works City Church, Ghana.

## 🤝 Support

For support or questions, contact your church administrator.

---

**Built with ❤️ for Greater Works City Church, Ghana**
