# Photo Gallery Feature Guide

## Overview
The Photo Gallery feature allows church leaders to upload, manage, and document church events, member photos, and special occasions. All authenticated members can view the gallery.

## Features

### 📸 Photo Upload
- **Multiple file upload** - Upload multiple photos at once
- **File validation** - Automatic validation for image types and size (max 10MB per photo)
- **Rich metadata** - Add title, description, category, event date, location, and tags
- **Category organization** - 8 predefined categories for easy organization

### 🔍 Search & Filter
- **Text search** - Search by title, description, or tags
- **Category filter** - Filter by event type (Church Event, Service, Baptism, Wedding, etc.)
- **Year filter** - Filter photos by year
- **Real-time filtering** - Instant results as you type

### 📱 View Modes
- **Grid view** - Beautiful card-based layout for browsing
- **List view** - Compact list with thumbnails and details
- **Photo modal** - Full-screen photo viewer with complete details

### 🎯 Photo Management
- **View details** - See full photo information including upload date, location, and tags
- **Download photos** - Download individual photos
- **Delete photos** - Admin/Leader can delete photos (with confirmation)
- **Responsive design** - Works perfectly on mobile and desktop

## Photo Categories

1. **Church Event** - General church events and gatherings
2. **Church Service** - Sunday services and special services
3. **Member Photo** - Individual member photos and portraits
4. **Baptism** - Baptism ceremonies and celebrations
5. **Wedding** - Wedding ceremonies held at church
6. **Outreach** - Community outreach and mission activities
7. **Youth Ministry** - Youth events and activities
8. **Other** - Miscellaneous photos

## User Permissions

### All Authenticated Users
- ✅ View all photos in the gallery
- ✅ Search and filter photos
- ✅ View photo details
- ✅ Download photos

### Leaders & Admins
- ✅ All user permissions
- ✅ Upload new photos
- ✅ Edit photo metadata
- ✅ Delete photos (Admin only for final deletion)

## How to Use

### Uploading Photos

1. **Navigate to Photo Gallery**
   - Click "Photo Gallery" in the sidebar navigation

2. **Click "Upload Photos"**
   - Only visible to Leaders and Admins

3. **Fill in Photo Details**
   - **Title** (Required) - Give your photo collection a descriptive title
   - **Description** (Optional) - Add context about the event or photos
   - **Category** (Required) - Select the appropriate category
   - **Event Date** (Optional) - When the event took place
   - **Location** (Optional) - Where the photos were taken
   - **Tags** (Optional) - Comma-separated keywords for easier searching

4. **Select Photos**
   - Click "Upload files" or drag and drop
   - Select one or multiple photos
   - Each photo must be under 10MB
   - Only image files are accepted

5. **Review and Upload**
   - See the list of selected files
   - Remove any unwanted files
   - Click "Upload" to complete

### Viewing Photos

1. **Browse the Gallery**
   - Photos are displayed in grid or list view
   - Switch between views using the toggle buttons

2. **Search and Filter**
   - Use the search bar to find specific photos
   - Filter by category or year
   - Combine filters for precise results

3. **View Photo Details**
   - Click any photo to open the full-screen viewer
   - See complete information including:
     - Full-size image
     - Title and description
     - Category and event date
     - Location and tags
     - Upload information

4. **Download Photos**
   - Click the "Download" button in the photo detail view
   - Photo will be saved to your device

### Managing Photos

**For Admins/Leaders:**

1. **Delete Photos**
   - Open the photo in detail view
   - Click the "Delete" button
   - Confirm the deletion
   - Photo is removed from both storage and database

## Technical Details

### Storage Structure
```
gallery/
  ├── event/
  │   └── timestamp_filename.jpg
  ├── service/
  │   └── timestamp_filename.jpg
  ├── member/
  │   └── timestamp_filename.jpg
  └── [other categories]/
      └── timestamp_filename.jpg
```

### Database Schema
```javascript
{
  title: string,
  description: string,
  category: string,
  eventDate: string (ISO date),
  location: string,
  tags: array of strings,
  imageUrl: string (download URL),
  storagePath: string,
  filename: string,
  fileSize: number (bytes),
  uploadedAt: string (ISO timestamp),
  uploadedBy: string (user role)
}
```

### Security Rules

**Firestore:**
- Read: All authenticated users
- Create/Update: Admin and Leader only
- Delete: Admin only

**Storage:**
- Read: All authenticated users
- Write: All authenticated users (with file validation)
- Delete: All authenticated users
- Max file size: 10MB
- File type: Images only

## Best Practices

### Photo Upload Guidelines

1. **Image Quality**
   - Use high-quality photos (but under 10MB)
   - Ensure good lighting and focus
   - Crop or edit before uploading if needed

2. **Naming Convention**
   - Use descriptive titles: "Easter Sunday Service 2024" not "IMG_1234"
   - Include the event name and date
   - Be consistent with naming

3. **Categorization**
   - Choose the most appropriate category
   - Use "Other" only when no category fits
   - Consider creating new categories if needed frequently

4. **Metadata**
   - Always add a description for context
   - Include the event date for historical records
   - Add location for events outside the main church
   - Use relevant tags for better searchability

5. **Privacy Considerations**
   - Get consent before uploading photos of individuals
   - Be mindful of children's photos
   - Avoid uploading sensitive or private moments

### Organization Tips

1. **Regular Uploads**
   - Upload photos shortly after events
   - Don't let photos accumulate
   - Keep the gallery current

2. **Consistent Tagging**
   - Use standard tags across similar events
   - Include year in tags: "2024", "easter2024"
   - Add people's names when appropriate

3. **Quality Over Quantity**
   - Upload the best photos, not all photos
   - Remove duplicates or similar shots
   - Aim for 10-20 photos per event

4. **Maintenance**
   - Periodically review old photos
   - Remove outdated or irrelevant photos
   - Update descriptions if needed

## Troubleshooting

### Upload Issues

**"File is larger than 10MB"**
- Compress the image before uploading
- Use image editing software to reduce file size
- Consider using online compression tools

**"Not an image file"**
- Only JPG, PNG, GIF, and other image formats are accepted
- Convert videos or documents to images first
- Check file extension

**"Failed to upload photos"**
- Check your internet connection
- Ensure you have Leader/Admin permissions
- Try uploading fewer photos at once
- Refresh the page and try again

### Viewing Issues

**Photos not loading**
- Check your internet connection
- Clear browser cache
- Refresh the page
- Ensure you're logged in

**Search not working**
- Check spelling in search terms
- Try different keywords
- Clear filters and try again
- Ensure photos have proper metadata

### Permission Issues

**Can't upload photos**
- Only Leaders and Admins can upload
- Contact your church administrator
- Verify your account role

**Can't delete photos**
- Only Admins can delete photos
- Contact your church administrator
- Request deletion if needed

## Future Enhancements

Potential features for future updates:

1. **Photo Albums** - Group related photos into albums
2. **Bulk Actions** - Select and manage multiple photos at once
3. **Photo Editing** - Basic editing tools (crop, rotate, filters)
4. **Slideshow Mode** - Automatic photo slideshow
5. **Comments** - Allow members to comment on photos
6. **Likes/Reactions** - Let members react to photos
7. **Face Recognition** - Auto-tag members in photos
8. **Print Options** - Order prints directly from the gallery
9. **Social Sharing** - Share photos on social media
10. **Advanced Search** - Search by people, colors, or objects

## Support

For technical issues or feature requests:
- Contact your church administrator
- Check the main README.md for general support
- Review Firebase console for storage/database issues

## Related Features

- **Members** - Link member photos to member profiles
- **Celebrations** - Document birthday and anniversary celebrations
- **Achievements** - Showcase achievement ceremonies
- **Reports** - Include photos in church reports

---

**Last Updated:** October 2024
**Version:** 1.0.0
