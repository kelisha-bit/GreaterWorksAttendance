# Backup & Data Management System

## Overview
The Backup & Data Management system provides comprehensive tools for protecting your church data through exports, imports, automated backups, and restore functionality. This ensures data safety, enables archiving, and facilitates data migration.

---

## Features Implemented

### 1. **Backup Manager Page** (`/backup`)
**Access:** Admins only

#### Main Features:
- ✅ **Data Export** - Download data as JSON or CSV
- ✅ **Data Import** - Restore data from backup files
- ✅ **Backup History** - Track all backup operations
- ✅ **Collection Selection** - Choose specific data to backup
- ✅ **Statistics Dashboard** - View data counts
- ✅ **Manual Backups** - Create full system backups

---

## Export Functionality

### **Export Formats:**

#### **1. JSON Export**
**Best for:**
- Complete data backups
- System migration
- Data restoration
- Multi-collection exports

**Features:**
- Preserves all data types
- Maintains relationships
- Includes all fields
- Supports nested data
- Can export all collections at once

**File naming:** `backup_[collection]_[date].json`

#### **2. CSV Export**
**Best for:**
- Spreadsheet analysis
- Single collection exports
- Human-readable format
- Excel/Google Sheets import

**Features:**
- Tabular format
- Easy to read
- Compatible with spreadsheets
- Handles special characters
- Quotes fields with commas

**File naming:** `backup_[collection]_[date].csv`

---

### **Available Collections:**

1. **All Data** - Complete system backup
2. **Members** - Member profiles and information
3. **Attendance Sessions** - Service sessions
4. **Attendance Records** - Individual attendance records
5. **Contributions** - Financial contributions
6. **Visitors** - Visitor registrations
7. **Special Occasions** - Birthdays, anniversaries, events
8. **Achievements** - Badges and attendance incentives

---

## Import Functionality

### **Import Process:**

#### **Step 1: Select Target Collection**
- Choose where to import data
- Can import to specific collection
- Or import all collections at once

#### **Step 2: Select JSON File**
- Only JSON format supported for import
- File must be valid JSON
- Shows file name and size

#### **Step 3: Import Data**
- Validates JSON structure
- Adds or updates records
- Preserves document IDs
- Creates new IDs if missing

### **Import Behavior:**
- **Existing Records:** Overwritten if ID matches
- **New Records:** Added to collection
- **Missing IDs:** Auto-generated
- **Multi-Collection:** Imports all included collections

---

## Backup History

### **Tracked Information:**
- **Type** - Export or Import
- **Format** - JSON or CSV
- **Collection** - Which data was backed up
- **Record Count** - Number of records
- **Date & Time** - When backup occurred
- **Status** - Completed or Failed

### **History Management:**
- View all backup operations
- Sort by date (newest first)
- Delete old backup records
- Refresh to update list

---

## Statistics Dashboard

### **4 Real-Time Stats:**

1. **Members** (Blue)
   - Total member count
   - Core church data

2. **Attendance** (Green)
   - Total attendance records
   - Service participation

3. **Contributions** (Purple)
   - Total contribution records
   - Financial data

4. **Visitors** (Orange)
   - Total visitor registrations
   - Outreach tracking

---

## Manual Backup Creation

### **Full System Backup:**
- Click "Create Full Backup" button
- Exports all collections
- Downloads as single JSON file
- Records backup in history
- Recommended weekly

---

## Google Sheets Integration

### **Automated Backups to Google Sheets:**

#### **Setup Requirements:**
1. **Google Cloud Console:**
   - Enable Google Sheets API
   - Enable Google Drive API
   - Create service account
   - Download credentials JSON

2. **Firebase Setup:**
   - Deploy Firebase Functions
   - Add credentials to environment
   - Configure scheduled backups
   - Set up Cloud Scheduler

3. **Google Sheets:**
   - Create backup spreadsheet
   - Share with service account email
   - Configure sheet structure
   - Set permissions

#### **Configuration Steps:**

**1. Enable APIs:**
```
- Go to Google Cloud Console
- Enable Google Sheets API
- Enable Google Drive API
```

**2. Create Service Account:**
```
- Create service account
- Generate JSON key
- Save credentials securely
```

**3. Share Spreadsheet:**
```
- Open Google Sheet
- Share with service account email
- Grant Editor permissions
```

**4. Deploy Functions:**
```javascript
// Firebase Function for automated backup
exports.scheduledBackup = functions.pubsub
  .schedule('every 24 hours')
  .onRun(async (context) => {
    // Backup logic here
  });
```

---

## Database Structure

### Firestore Collection: `backups`

```javascript
{
  type: "export",                    // "export" or "import"
  format: "json",                    // "json" or "csv"
  collection: "members",             // Collection name or "all"
  recordCount: 150,                  // Number of records
  timestamp: "2025-10-18T06:28:00Z", // When backup occurred
  status: "completed"                // "completed" or "failed"
}
```

---

## Security & Permissions

### Firestore Rules:
```javascript
match /backups/{backupId} {
  allow read: if hasRole('admin');
  allow write: if hasRole('admin');
}
```

### Access Control:
- **Admins Only:** Full backup management access
- **Leaders:** No access to backups
- **Members:** No access to backups

### Security Best Practices:
- ✅ Store backups securely
- ✅ Encrypt sensitive data
- ✅ Limit backup access
- ✅ Regular backup rotation
- ✅ Test restore procedures

---

## Usage Guide

### For Administrators:

#### **Creating a Backup:**

**Option 1: Quick Full Backup**
1. Go to **Backup & Data** page
2. Click **Create Full Backup**
3. File downloads automatically
4. Store in secure location

**Option 2: Selective Export**
1. Select collection from dropdown
2. Choose format (JSON or CSV)
3. Click **Export JSON** or **Export CSV**
4. Save downloaded file

#### **Importing Data:**

**Step-by-Step:**
1. Go to **Backup & Data** page
2. Select target collection
3. Click **Select JSON File**
4. Choose backup file
5. Review file information
6. Click **Import Data**
7. Wait for completion
8. Verify imported data

#### **Viewing Backup History:**
1. Scroll to Backup History section
2. See all past operations
3. Click Refresh to update
4. Delete old records if needed

---

## Backup Strategies

### **Recommended Backup Schedule:**

#### **Daily Backups:**
- Automated Google Sheets backup
- Critical data only
- Members and attendance

#### **Weekly Backups:**
- Full system backup
- All collections
- Download and store locally

#### **Monthly Backups:**
- Archive backup
- Long-term storage
- Offsite storage recommended

#### **Before Major Changes:**
- Manual backup
- Test restore
- Verify data integrity

---

## Data Export Use Cases

### **1. Archiving:**
- End of year data export
- Historical records
- Compliance requirements
- Long-term storage

### **2. Migration:**
- Moving to new system
- Changing platforms
- System upgrades
- Data consolidation

### **3. Analysis:**
- Export to Excel/Sheets
- Statistical analysis
- Report generation
- Data visualization

### **4. Disaster Recovery:**
- System failure
- Data corruption
- Accidental deletion
- Restore operations

---

## Import Use Cases

### **1. Data Restoration:**
- Recover deleted data
- Restore from backup
- Undo mistakes
- System recovery

### **2. Data Migration:**
- Import from old system
- Bulk data entry
- Initial setup
- System consolidation

### **3. Testing:**
- Load test data
- Development environment
- Training scenarios
- Demo data

---

## File Format Specifications

### **JSON Export Format:**

**Single Collection:**
```json
{
  "members": [
    {
      "id": "abc123",
      "fullName": "John Doe",
      "email": "john@example.com",
      "department": "Choir"
    }
  ]
}
```

**Multi-Collection:**
```json
{
  "members": [...],
  "attendance_sessions": [...],
  "contributions": [...]
}
```

### **CSV Export Format:**
```csv
id,fullName,email,department
abc123,John Doe,john@example.com,Choir
def456,Jane Smith,jane@example.com,Ushering
```

---

## Error Handling

### **Common Errors:**

**Export Errors:**
- **No Data:** Collection is empty
- **Permission Denied:** Check Firestore rules
- **Network Error:** Check internet connection

**Import Errors:**
- **Invalid JSON:** Check file format
- **Missing Fields:** Verify data structure
- **Duplicate IDs:** May overwrite existing data
- **Permission Denied:** Admin access required

### **Solutions:**
1. Verify file format
2. Check permissions
3. Validate data structure
4. Review error messages
5. Contact support if needed

---

## Best Practices

### **Backup Management:**
- ✅ Backup before major changes
- ✅ Test restore procedures regularly
- ✅ Store backups in multiple locations
- ✅ Encrypt sensitive backups
- ✅ Document backup procedures
- ✅ Set backup reminders
- ✅ Verify backup integrity

### **Data Import:**
- ✅ Always backup before importing
- ✅ Test with small dataset first
- ✅ Verify data format
- ✅ Check for duplicates
- ✅ Review imported data
- ✅ Keep original files

### **Security:**
- ✅ Limit backup access
- ✅ Use secure storage
- ✅ Encrypt backups
- ✅ Regular security audits
- ✅ Monitor backup logs

---

## Automated Backup Setup

### **Firebase Functions Setup:**

**1. Install Dependencies:**
```bash
npm install googleapis
npm install firebase-functions
```

**2. Create Backup Function:**
```javascript
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { google } = require('googleapis');

exports.dailyBackup = functions.pubsub
  .schedule('every 24 hours')
  .timeZone('America/New_York')
  .onRun(async (context) => {
    // Backup logic
    const db = admin.firestore();
    const collections = ['members', 'attendance_sessions'];
    
    for (const collectionName of collections) {
      const snapshot = await db.collection(collectionName).get();
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Export to Google Sheets
      await exportToSheets(collectionName, data);
    }
    
    return null;
  });
```

**3. Deploy Function:**
```bash
firebase deploy --only functions
```

---

## Restore Procedures

### **Full System Restore:**

**Step 1: Prepare**
- Locate backup file
- Verify file integrity
- Backup current data (if any)

**Step 2: Import**
- Select "All Data" collection
- Choose backup JSON file
- Click Import Data

**Step 3: Verify**
- Check record counts
- Verify data integrity
- Test application functionality

**Step 4: Validate**
- Review all collections
- Test user access
- Confirm data accuracy

---

## Monitoring & Maintenance

### **Regular Checks:**
- ✅ Weekly backup verification
- ✅ Monthly restore tests
- ✅ Quarterly backup audits
- ✅ Annual security review

### **Backup Health Indicators:**
- Successful backup rate
- Backup file sizes
- Storage capacity
- Backup duration
- Error frequency

---

## Troubleshooting

### **Common Issues:**

**Issue:** Export button not working  
**Solution:** Check admin permissions and browser console

**Issue:** Import fails with error  
**Solution:** Verify JSON format and file structure

**Issue:** Backup history not showing  
**Solution:** Refresh page or check Firestore rules

**Issue:** CSV export has garbled text  
**Solution:** Open with UTF-8 encoding in Excel

**Issue:** Large file export times out  
**Solution:** Export smaller collections separately

---

## Storage Recommendations

### **Local Storage:**
- External hard drive
- Network attached storage (NAS)
- USB flash drives (encrypted)

### **Cloud Storage:**
- Google Drive
- Dropbox
- OneDrive
- AWS S3

### **Offsite Storage:**
- Remote server
- Cloud backup service
- Physical location backup

---

## Compliance & Legal

### **Data Protection:**
- Follow GDPR guidelines
- Maintain data privacy
- Secure personal information
- Document retention policies

### **Backup Retention:**
- Daily: 7 days
- Weekly: 4 weeks
- Monthly: 12 months
- Annual: Indefinite

---

## Technical Details

### Files Created:
- `src/pages/BackupManager.jsx` - Main backup management page

### Files Modified:
- `src/App.jsx` - Added BackupManager route
- `src/components/Layout.jsx` - Added Backup menu item (admin only)
- `firestore.rules` - Added backups collection rules

### Routes Added:
- `/backup` - Backup Manager page (admin only)

### Navigation:
- **Backup & Data** (HardDrive icon) - Admins only

---

## Future Enhancements

Potential improvements:
- 🔄 Automated scheduled backups
- 📧 Email backup notifications
- 🔐 Encrypted backup files
- ☁️ Direct cloud storage integration
- 📊 Backup analytics dashboard
- 🔍 Backup file preview
- 🗜️ Compressed backup files
- 📱 Mobile backup management
- 🔔 Backup failure alerts
- 📈 Storage usage tracking

---

## Support

For questions about backup management:
1. Check this documentation
2. Verify admin permissions
3. Test with small datasets
4. Review backup history
5. Contact system administrator

---

**Last Updated:** October 18, 2025  
**Version:** 1.0  
**Feature Status:** ✅ Production Ready
