# Event Templates & Types

## 📋 Pre-Built Event Templates for Quick Creation

Complete collection of event templates and types for church events.

---

## 🎯 Overview

Event templates provide pre-configured settings for common church events, enabling:
- ⚡ Faster event creation
- ✅ Consistent event setup
- 📊 Standardized data collection
- 🎨 Professional presentation

---

## 📚 Template Categories

### 1. Regular Services
### 2. Special Services
### 3. Fellowship Events
### 4. Ministry Events
### 5. Life Events
### 6. Social Events
### 7. Administrative Events
### 8. Outreach Events

---

## 1️⃣ Regular Services Templates

### Sunday Morning Service

**Template Settings:**
```yaml
Title: "Sunday Morning Service"
Type: Worship Service
Category: Regular Service
Recurrence: Weekly (Sunday)
Start Time: 9:00 AM
End Time: 11:00 AM
Duration: 2 hours

Registration:
  Enabled: false
  Required: false

Attendance:
  Enabled: true
  Check-In Required: true
  QR Code: true
  
Notifications:
  Announcement: false
  Reminders: false

Visibility: Public
Capacity: Unlimited
```

**Use Case:** Weekly Sunday worship service

---

### Sunday Evening Service

**Template Settings:**
```yaml
Title: "Sunday Evening Service"
Type: Worship Service
Category: Regular Service
Recurrence: Weekly (Sunday)
Start Time: 6:00 PM
End Time: 8:00 PM
Duration: 2 hours

Registration:
  Enabled: false

Attendance:
  Enabled: true
  Check-In Required: true

Visibility: Public
```

---

### Midweek Service

**Template Settings:**
```yaml
Title: "Midweek Service"
Type: Worship Service
Category: Regular Service
Recurrence: Weekly (Wednesday)
Start Time: 6:00 PM
End Time: 8:00 PM

Registration:
  Enabled: false

Attendance:
  Enabled: true

Visibility: Public
```

---

### Prayer Meeting

**Template Settings:**
```yaml
Title: "Prayer Meeting"
Type: Prayer Meeting
Category: Regular Service
Recurrence: Weekly (Friday)
Start Time: 6:00 PM
End Time: 8:00 PM

Registration:
  Enabled: false

Attendance:
  Enabled: true
  Optional: true

Visibility: Members Only
```

---

## 2️⃣ Special Services Templates

### Easter Service

**Template Settings:**
```yaml
Title: "Easter Celebration Service"
Type: Special Service
Category: Holiday Service
Recurrence: Yearly (Easter Sunday)
Start Time: 9:00 AM
End Time: 12:00 PM
Duration: 3 hours

Registration:
  Enabled: true
  Required: false
  Deadline: 1 week before
  
Attendance:
  Enabled: true
  Check-In Required: true

Notifications:
  Announcement: true
  Reminders: [7 days, 1 day]

Capacity: 1000
Visibility: Public

Custom Fields:
  - Bringing guests (Yes/No)
  - Number of guests
  - Special needs
```

**Use Case:** Annual Easter celebration

---

### Christmas Service

**Template Settings:**
```yaml
Title: "Christmas Service"
Type: Special Service
Category: Holiday Service
Recurrence: Yearly (December 25)
Start Time: 10:00 AM
End Time: 12:00 PM

Registration:
  Enabled: true
  Capacity: 800

Attendance:
  Enabled: true

Notifications:
  Announcement: true
  Reminders: [14 days, 7 days, 1 day]

Visibility: Public
```

---

### Revival Service

**Template Settings:**
```yaml
Title: "Revival Service"
Type: Special Service
Category: Revival
Recurrence: None (Multi-day event)
Duration: 3 days
Daily Time: 6:00 PM - 9:00 PM

Registration:
  Enabled: true
  Required: false

Attendance:
  Enabled: true
  Track Daily: true

Notifications:
  Announcement: true
  Daily Reminders: true

Visibility: Public
```

---

### Conference

**Template Settings:**
```yaml
Title: "[Conference Name]"
Type: Conference
Category: Special Event
Duration: 3 days
Schedule: Multi-session

Registration:
  Enabled: true
  Required: true
  Deadline: 2 weeks before
  Fee: Optional
  
Registration Fields:
  - Full Name
  - Email
  - Phone
  - Church/Organization
  - Dietary Restrictions
  - T-Shirt Size
  - Emergency Contact

Attendance:
  Enabled: true
  Session Tracking: true

Notifications:
  Confirmation: true
  Reminders: [30 days, 14 days, 7 days, 1 day]
  Daily Updates: true

Capacity: 500
Visibility: Public

Resources Needed:
  - Conference Hall
  - Audio/Visual Equipment
  - Registration Desk
  - Volunteers (20)
```

---

## 3️⃣ Fellowship Events Templates

### Men's Fellowship

**Template Settings:**
```yaml
Title: "Men's Fellowship"
Type: Fellowship
Category: Men's Ministry
Recurrence: Monthly (First Saturday)
Start Time: 8:00 AM
End Time: 11:00 AM

Registration:
  Enabled: true
  RSVP: true

Attendance:
  Enabled: true

Notifications:
  Reminder: [7 days, 1 day]

Visibility: Members Only
Target Audience: Men
```

---

### Women's Fellowship

**Template Settings:**
```yaml
Title: "Women's Fellowship"
Type: Fellowship
Category: Women's Ministry
Recurrence: Monthly (Second Saturday)
Start Time: 10:00 AM
End Time: 1:00 PM

Registration:
  Enabled: true
  RSVP: true
  
Custom Fields:
  - Bringing children (Yes/No)
  - Number of children
  - Ages of children

Attendance:
  Enabled: true

Visibility: Members Only
Target Audience: Women
```

---

### Youth Fellowship

**Template Settings:**
```yaml
Title: "Youth Night"
Type: Fellowship
Category: Youth Ministry
Recurrence: Weekly (Friday)
Start Time: 6:00 PM
End Time: 9:00 PM

Registration:
  Enabled: true
  Parental Consent: Required (under 18)

Attendance:
  Enabled: true
  Check-In/Check-Out: true

Notifications:
  Reminder: [1 day]

Visibility: Public
Target Audience: Youth (13-25)
```

---

### Family Day

**Template Settings:**
```yaml
Title: "Family Fun Day"
Type: Fellowship
Category: Family Event
Recurrence: Quarterly
Start Time: 10:00 AM
End Time: 4:00 PM

Registration:
  Enabled: true
  Required: true
  Family Registration: true
  
Registration Fields:
  - Family Name
  - Number of Adults
  - Number of Children
  - Ages of Children
  - Special Dietary Needs

Attendance:
  Enabled: true

Notifications:
  Announcement: true
  Reminders: [14 days, 7 days, 1 day]

Capacity: 300 people
Visibility: Public

Activities:
  - Games
  - Food
  - Entertainment
  - Prizes
```

---

## 4️⃣ Ministry Events Templates

### Bible Study

**Template Settings:**
```yaml
Title: "Bible Study"
Type: Bible Study
Category: Teaching
Recurrence: Weekly (Thursday)
Start Time: 6:30 PM
End Time: 8:00 PM

Registration:
  Enabled: true
  Optional: true

Attendance:
  Enabled: true

Materials:
  - Study Guide
  - Bible
  - Notebook

Visibility: Members Only
```

---

### Discipleship Class

**Template Settings:**
```yaml
Title: "Discipleship Class"
Type: Training
Category: Discipleship
Duration: 8 weeks
Recurrence: Weekly (Tuesday)
Start Time: 7:00 PM
End Time: 9:00 PM

Registration:
  Enabled: true
  Required: true
  Application Process: true
  Limited Capacity: 30

Attendance:
  Enabled: true
  Required: 80% for completion

Notifications:
  Weekly Reminders: true
  Homework Reminders: true

Visibility: Members Only

Completion:
  Certificate: true
  Final Assessment: true
```

---

### Leadership Training

**Template Settings:**
```yaml
Title: "Leadership Training"
Type: Training
Category: Leadership Development
Duration: 6 weeks
Recurrence: Weekly (Saturday)
Start Time: 9:00 AM
End Time: 12:00 PM

Registration:
  Enabled: true
  Required: true
  Nomination Required: true
  Capacity: 25

Attendance:
  Enabled: true
  Mandatory: true

Notifications:
  Pre-Training Materials: true
  Weekly Reminders: true

Visibility: Private (Invitation Only)

Requirements:
  - Active Member
  - Ministry Experience
  - Pastor Recommendation
```

---

### Choir Practice

**Template Settings:**
```yaml
Title: "Choir Practice"
Type: Ministry Activity
Category: Music Ministry
Recurrence: Weekly (Wednesday, Saturday)
Start Time: 5:00 PM
End Time: 7:00 PM

Registration:
  Enabled: false

Attendance:
  Enabled: true
  Required: true

Notifications:
  Reminder: [1 day]
  Song List: true

Visibility: Members Only
Target Audience: Choir Members
```

---

## 5️⃣ Life Events Templates

### Wedding

**Template Settings:**
```yaml
Title: "[Couple Names] Wedding"
Type: Wedding
Category: Life Event
Date: [Specific Date]
Start Time: [Time]
Duration: 3 hours

Registration:
  Enabled: true
  Required: true
  RSVP Deadline: 2 weeks before
  
Registration Fields:
  - Full Name
  - Email
  - Phone
  - Number of Guests
  - Meal Preference
  - Song Requests

Attendance:
  Enabled: true

Notifications:
  Save the Date: [3 months before]
  Invitation: [6 weeks before]
  Reminder: [1 week before]
  Thank You: [After event]

Visibility: Private (Invitation Only)

Resources:
  - Sanctuary
  - Reception Hall
  - Audio/Visual
  - Decorations
```

---

### Baby Dedication

**Template Settings:**
```yaml
Title: "Baby Dedication"
Type: Dedication
Category: Life Event
Recurrence: Monthly (First Sunday)
During: Sunday Service

Registration:
  Enabled: true
  Required: true
  Deadline: 1 week before
  
Registration Fields:
  - Parents' Names
  - Baby's Name
  - Baby's Birth Date
  - Dedication Date Preference

Attendance:
  Enabled: false

Notifications:
  Confirmation: true
  Preparation Instructions: true
  Reminder: [1 week, 1 day]

Visibility: Public
```

---

### Baptism

**Template Settings:**
```yaml
Title: "Water Baptism Service"
Type: Baptism
Category: Life Event
Recurrence: Quarterly
Date: [Specific Date]
Time: During Sunday Service

Registration:
  Enabled: true
  Required: true
  Application: true
  Baptism Class Required: true
  
Registration Fields:
  - Full Name
  - Date of Birth
  - Salvation Date
  - Testimony (written)
  - Parent Consent (if minor)

Attendance:
  Enabled: true

Notifications:
  Class Schedule: true
  Preparation Instructions: true
  What to Bring: true
  Reminder: [1 week, 1 day]

Visibility: Public

Requirements:
  - Completed Baptism Class
  - Pastor Interview
  - Testimony Submission
```

---

## 6️⃣ Social Events Templates

### Church Picnic

**Template Settings:**
```yaml
Title: "Church Picnic"
Type: Social Event
Category: Outdoor Event
Date: [Specific Date]
Start Time: 11:00 AM
End Time: 4:00 PM

Registration:
  Enabled: true
  Required: true
  Family Registration: true
  
Registration Fields:
  - Family Name
  - Number Attending
  - Potluck Contribution
  - Special Dietary Needs
  - Volunteer to Help

Attendance:
  Enabled: true

Notifications:
  Announcement: [4 weeks before]
  Reminders: [2 weeks, 1 week, 1 day]
  Weather Updates: [Day before]

Visibility: Members Only

Activities:
  - Games
  - Sports
  - Food
  - Fellowship

Resources:
  - Park Rental
  - Tables/Chairs
  - Games Equipment
  - First Aid Kit
```

---

### Movie Night

**Template Settings:**
```yaml
Title: "Family Movie Night"
Type: Social Event
Category: Entertainment
Recurrence: Monthly (Last Friday)
Start Time: 6:00 PM
End Time: 9:00 PM

Registration:
  Enabled: true
  RSVP: true
  
Registration Fields:
  - Number Attending
  - Snack Preferences

Attendance:
  Enabled: true

Notifications:
  Movie Announcement: [1 week before]
  Reminder: [1 day before]

Capacity: 100
Visibility: Members Only

Provided:
  - Movie
  - Popcorn
  - Drinks
  - Seating
```

---

## 7️⃣ Administrative Events Templates

### Board Meeting

**Template Settings:**
```yaml
Title: "Board Meeting"
Type: Meeting
Category: Administrative
Recurrence: Monthly (First Monday)
Start Time: 7:00 PM
End Time: 9:00 PM

Registration:
  Enabled: false

Attendance:
  Enabled: true
  Required: true
  Quorum Tracking: true

Notifications:
  Agenda: [3 days before]
  Reminder: [1 day before]
  Minutes: [After meeting]

Visibility: Private
Attendees: Board Members Only

Documents:
  - Agenda
  - Previous Minutes
  - Financial Reports
  - Action Items
```

---

### Committee Meeting

**Template Settings:**
```yaml
Title: "[Committee Name] Meeting"
Type: Meeting
Category: Administrative
Recurrence: Monthly
Start Time: 6:00 PM
End Time: 7:30 PM

Registration:
  Enabled: false

Attendance:
  Enabled: true

Notifications:
  Agenda: [2 days before]
  Reminder: [1 day before]

Visibility: Private
Attendees: Committee Members
```

---

### Volunteer Training

**Template Settings:**
```yaml
Title: "Volunteer Orientation"
Type: Training
Category: Administrative
Date: [Specific Date]
Start Time: 10:00 AM
End Time: 2:00 PM

Registration:
  Enabled: true
  Required: true
  Capacity: 30
  
Registration Fields:
  - Ministry Interest
  - Availability
  - Skills/Experience
  - Background Check Consent

Attendance:
  Enabled: true
  Certificate: true

Notifications:
  Confirmation: true
  Pre-Training Materials: true
  Reminder: [1 week, 1 day]

Visibility: Public

Includes:
  - Church Vision/Mission
  - Ministry Overview
  - Policies & Procedures
  - Safety Training
  - Q&A Session
```

---

## 8️⃣ Outreach Events Templates

### Evangelism Outreach

**Template Settings:**
```yaml
Title: "Community Outreach"
Type: Outreach
Category: Evangelism
Date: [Specific Date]
Start Time: 9:00 AM
End Time: 2:00 PM

Registration:
  Enabled: true
  Required: true
  Volunteer Sign-Up: true
  
Registration Fields:
  - Name
  - Phone
  - Transportation (Need/Provide)
  - Team Preference

Attendance:
  Enabled: true

Notifications:
  Briefing: [1 week before]
  Meeting Point: [1 day before]
  Debrief: [After event]

Visibility: Members Only

Provided:
  - Training
  - Materials
  - Transportation
  - Lunch
```

---

### Charity Drive

**Template Settings:**
```yaml
Title: "Food/Clothing Drive"
Type: Outreach
Category: Community Service
Duration: 2 weeks
Drop-Off Times: [Schedule]

Registration:
  Enabled: true
  Volunteer Sign-Up: true
  Donation Tracking: true

Attendance:
  Enabled: false

Notifications:
  Announcement: [4 weeks before]
  Updates: Weekly
  Final Call: [3 days before end]
  Thank You: [After event]

Visibility: Public

Needed Items:
  - [List of items]
  
Drop-Off Locations:
  - [Locations]
```

---

## 🎨 Custom Template Creation

### How to Create Custom Template

**Step 1: Create Perfect Event**
1. Create event with all desired settings
2. Configure every detail
3. Test thoroughly
4. Ensure everything works

**Step 2: Save as Template**
1. Open the event
2. Click "Save as Template"
3. Name template clearly
4. Add description
5. Set category
6. Save template

**Step 3: Use Template**
1. Click "Create Event"
2. Select "Use Template"
3. Choose your template
4. Modify specific details
5. Publish event

---

## 📊 Template Best Practices

### Naming Conventions

**Good Names:**
- "Sunday Morning Service"
- "Youth Night - Weekly"
- "Quarterly Men's Breakfast"
- "Annual Conference"

**Bad Names:**
- "Event 1"
- "Meeting"
- "Thing"

### Template Organization

**Categories:**
- Regular (weekly/monthly)
- Special (annual/occasional)
- Ministry (department-specific)
- Administrative (internal)

**Tags:**
- #recurring
- #registration-required
- #members-only
- #public-event

---

## ✅ Template Checklist

### Before Saving Template

- [ ] All required fields filled
- [ ] Recurrence set correctly
- [ ] Registration configured
- [ ] Notifications set up
- [ ] Visibility appropriate
- [ ] Resources listed
- [ ] Volunteers assigned
- [ ] Clear description
- [ ] Tested thoroughly

---

**Event Templates Version:** 1.0  
**Last Updated:** October 2024  
**Total Templates:** 25+  
**Status:** Ready for Use
