# Advanced Features Guide

## Overview
This guide covers the three major advanced features implemented in the Greater Works Attendance Tracker:
1. **QR Code Scanner** - Quick attendance marking via QR codes
2. **Export to PDF/CSV** - Comprehensive data export capabilities
3. **Advanced Charts/Reports** - In-depth analytics and visualizations

---

## 1. QR Code Scanner

### Features
- **Real-time QR Code Scanning** - Use device camera to scan member QR codes
- **Member QR Code Generation** - Each member has a unique QR code
- **Instant Attendance Marking** - Automatic attendance recording upon successful scan
- **Mobile-Friendly** - Works on smartphones and tablets

### How to Use

#### Scanning QR Codes (Attendance Page)
1. Navigate to **Attendance** page
2. Select or create an attendance session
3. Click **"Scan QR Code"** button
4. Allow camera permissions when prompted
5. Point camera at member's QR code
6. Attendance is automatically marked upon successful scan

#### Generating Member QR Codes
1. Navigate to **Members** page
2. Click on a member to view their profile
3. Click **"View QR Code"** button
4. QR code is displayed with member information
5. Click **"Download QR Code"** to save as PNG image

### Technical Details
- Uses `html5-qrcode` library for scanning
- QR codes contain unique member IDs
- High error correction level (Level H) for reliability
- QR codes can be printed on member cards

---

## 2. Export to PDF/CSV

### Features
- **Multiple Export Formats** - PDF and CSV options
- **Comprehensive Reports** - Includes statistics and detailed data
- **Professional Formatting** - Church-branded PDF reports
- **Filtered Exports** - Export based on date range and filters

### Export Options

#### Attendance Session Export
**Location:** Attendance Page → Select Session → Export Buttons

**PDF Export Includes:**
- Session details (name, date, event type, department)
- Total attendee count
- Complete list of present members with:
  - Member ID
  - Full Name
  - Department
  - Phone Number
  - Status

**CSV Export Includes:**
- Session metadata
- Member details
- Attendance status
- Contact information

**How to Export:**
1. Go to **Attendance** page
2. Click on a session to open attendance modal
3. Click **"Export CSV"** or **"Export PDF"** button
4. File downloads automatically

#### Reports Export
**Location:** Reports Page → Export Buttons

**PDF Export Includes:**
- Church header and branding
- Report period and filters
- Summary statistics box (highlighted)
- Detailed sessions table with:
  - Date
  - Session name
  - Event type
  - Department
  - Attendance count
- Page numbers and footer

**CSV Export Includes:**
- Report metadata
- Summary statistics
- Session details
- Day of week analysis
- All filtered data

**How to Export:**
1. Go to **Reports** page
2. Set desired filters (date range, department)
3. Click **"Export CSV"** or **"Export PDF"** button
4. File downloads with timestamp

#### Advanced Analytics Export
**Location:** Advanced Analytics Page → Export Report Button

**PDF Export Includes:**
- Comprehensive analytics summary
- Monthly trend data
- Department performance comparison
- Statistical analysis
- Multi-page support with page numbers

**How to Export:**
1. Go to **Advanced Analytics** page
2. Configure filters (time period, department, event type)
3. Click **"Export Report"** button
4. Comprehensive PDF downloads

### File Naming Convention
- Attendance Session: `attendance-[session-name]-YYYY-MM-DD.[pdf/csv]`
- Reports: `attendance-report-YYYY-MM-DD.[pdf/csv]`
- Analytics: `advanced-analytics-YYYY-MM-DD.pdf`

---

## 3. Advanced Charts/Reports

### Features
- **Multiple Chart Types** - Line, Bar, Pie, Area, Radar, Composed charts
- **Interactive Visualizations** - Hover tooltips and legends
- **Comprehensive Analytics** - 8+ different analytical views
- **Customizable Filters** - Filter by time, department, event type

### Available Analytics

#### 1. Monthly Attendance Trend
**Chart Type:** Composed Chart (Area + Bar + Line)
- **Total Attendance** - Area chart showing cumulative attendance
- **Sessions** - Bar chart showing number of sessions
- **Average Attendance** - Line chart showing trends

**Insights:**
- Identify growth patterns
- Compare monthly performance
- Track session frequency

#### 2. Department Performance
**Chart Type:** Bar Chart
- Compares average attendance across departments
- Shows number of sessions per department
- Identifies most active departments

**Use Cases:**
- Department resource allocation
- Performance evaluation
- Engagement comparison

#### 3. Event Type Distribution
**Chart Type:** Pie Chart
- Shows percentage breakdown of event types
- Displays total count per event type
- Color-coded segments

**Insights:**
- Event popularity analysis
- Program balance assessment
- Planning future events

#### 4. Attendance Growth Trend
**Chart Type:** Dual-Axis Line Chart
- **Attendance Numbers** - Absolute attendance values
- **Growth Rate** - Percentage change between sessions

**Use Cases:**
- Track growth momentum
- Identify declining trends
- Measure impact of initiatives

#### 5. Day of Week Performance
**Chart Type:** Radar Chart
- Circular visualization of attendance by day
- Shows average attendance per weekday
- Identifies optimal meeting days

**Strategic Value:**
- Schedule optimization
- Resource planning
- Member availability patterns

#### 6. Top 10 Most Engaged Members
**Display Type:** Ranked Table with Progress Bars
- Member name and department
- Sessions attended count
- Attendance rate percentage
- Visual progress indicators
- Medal icons for top 3 (🥇🥈🥉)

**Features:**
- Sortable by engagement
- Highlights top performers
- Useful for recognition programs

### Filter Options

#### Time Period Filters
- **This Week** - Last 7 days
- **This Month** - Current month
- **Last 3 Months** - 90-day view
- **Last 6 Months** - 180-day view (default)
- **This Year** - Year-to-date
- **All Time** - Complete history

#### Department Filter
- Filter analytics by specific department
- "All" option for church-wide view
- Affects all charts and statistics

#### Event Type Filter
- Filter by service type
- Options: Sunday Service, Prayer Meeting, Bible Study, etc.
- Enables focused analysis

### How to Use Advanced Analytics

1. **Navigate to Advanced Analytics**
   - Click "Advanced Analytics" in sidebar menu

2. **Set Your Filters**
   - Select time period (default: Last 6 Months)
   - Choose department (default: All)
   - Pick event type (default: All)

3. **Analyze the Data**
   - Scroll through different chart sections
   - Hover over charts for detailed tooltips
   - Review the top performers table

4. **Export Your Analysis**
   - Click "Export Report" button
   - PDF includes all statistics and tables
   - Save for presentations or records

### Chart Interactions
- **Hover** - View exact values in tooltips
- **Legend** - Click to show/hide data series
- **Responsive** - Charts adapt to screen size
- **Color-Coded** - Consistent church gold theme

---

## Best Practices

### QR Code Scanner
✅ **Do:**
- Ensure good lighting when scanning
- Hold camera steady for 1-2 seconds
- Print QR codes at least 2x2 inches
- Test QR codes before mass printing

❌ **Don't:**
- Use damaged or blurry QR codes
- Scan in very low light
- Cover parts of the QR code

### Export Functions
✅ **Do:**
- Export regularly for backup
- Use descriptive file names
- Set appropriate filters before export
- Review exported data for accuracy

❌ **Don't:**
- Export without checking filters
- Share sensitive data inappropriately
- Rely solely on exports (use database backups)

### Advanced Analytics
✅ **Do:**
- Review analytics monthly
- Compare different time periods
- Share insights with leadership
- Use data for strategic planning

❌ **Don't:**
- Make decisions on limited data
- Ignore declining trends
- Compare incompatible periods

---

## Troubleshooting

### QR Code Scanner Issues

**Problem:** Camera not working
- **Solution:** Check browser permissions for camera access
- **Solution:** Try a different browser (Chrome/Safari recommended)
- **Solution:** Ensure HTTPS connection (required for camera)

**Problem:** QR code not recognized
- **Solution:** Ensure QR code is well-lit and in focus
- **Solution:** Try regenerating the QR code
- **Solution:** Check if member ID is valid

### Export Issues

**Problem:** PDF not downloading
- **Solution:** Check browser pop-up blocker settings
- **Solution:** Ensure sufficient disk space
- **Solution:** Try a different browser

**Problem:** CSV formatting issues
- **Solution:** Open with Excel/Google Sheets (not Notepad)
- **Solution:** Check UTF-8 encoding support
- **Solution:** Use "Import Data" feature in Excel

### Chart Display Issues

**Problem:** Charts not rendering
- **Solution:** Refresh the page
- **Solution:** Clear browser cache
- **Solution:** Check internet connection
- **Solution:** Ensure JavaScript is enabled

**Problem:** Charts showing no data
- **Solution:** Verify attendance sessions exist
- **Solution:** Adjust date range filters
- **Solution:** Check if members are registered

---

## Technical Requirements

### Browser Support
- **Recommended:** Chrome 90+, Safari 14+, Firefox 88+, Edge 90+
- **Mobile:** iOS Safari 14+, Chrome Mobile 90+
- **Camera Access:** HTTPS required for QR scanning

### Dependencies
- `html5-qrcode` - QR code scanning
- `qrcode.react` - QR code generation
- `jspdf` - PDF generation
- `jspdf-autotable` - PDF tables
- `recharts` - Chart visualizations
- `date-fns` - Date formatting

### Performance
- Charts optimized for up to 1000 data points
- PDF generation handles 100+ pages
- QR scanning: ~10 scans per minute
- Export files: Typically 50KB - 2MB

---

## Security & Privacy

### Data Protection
- QR codes contain only member IDs (no sensitive data)
- Exports include only authorized data
- Camera access is temporary and local
- No QR data is stored on external servers

### Access Control
- QR scanning requires leader permissions
- Export functions available to all authenticated users
- Analytics visible to all members
- Sensitive financial data requires admin access

---

## Future Enhancements

### Planned Features
- Bulk QR code generation and printing
- Excel (.xlsx) export format
- Custom chart builder
- Email report scheduling
- Real-time analytics dashboard
- Attendance predictions using ML
- Mobile app with native QR scanner

---

## Support

### Getting Help
- Review this guide first
- Check the main USER_GUIDE.md
- Contact your church administrator
- Report bugs to the development team

### Feedback
We welcome your feedback on these features! Please share:
- Feature requests
- Usability improvements
- Bug reports
- Success stories

---

**Last Updated:** October 2025  
**Version:** 1.0.0  
**Greater Works City Church, Ghana**
