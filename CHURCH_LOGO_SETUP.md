# How to Add Your Church Logo to ID Cards

## Quick Setup Guide

### Step 1: Prepare Your Logo File

1. **Find or create your church logo**
   - Recommended format: PNG with transparent background
   - Alternative: JPG, SVG
   - Recommended size: 200×200 pixels (square)
   - Keep file size under 500KB

2. **Name the file**: `church-logo.png`

### Step 2: Add Logo to Project

**Copy your logo file to the public folder:**

```
c:\Users\Amasco DE-General\Desktop\GreaterWorksAttendance\public\church-logo.png
```

**That's it!** The ID cards will automatically use your logo.

### Step 3: Customize Church Name (Optional)

If you want to change "Greater Works" and "City Church" to your church's name:

1. Open `src/components/MemberIDCard.jsx`
2. Find these lines (around line 30-31):
   ```jsx
   <h1 className="church-name">Greater Works</h1>
   <p className="church-subtitle">City Church</p>
   ```
3. Replace with your church name:
   ```jsx
   <h1 className="church-name">Your Church Name</h1>
   <p className="church-subtitle">Your Subtitle</p>
   ```

### Step 4: Test the Logo

1. Go to the Members page
2. Click the ID card icon (🎫) on any member
3. Check if your logo appears in the preview
4. If it looks good, try printing!

## Logo Design Tips

### Best Practices
- ✅ **Square format** (1:1 ratio) works best
- ✅ **Transparent background** (PNG) looks professional
- ✅ **Simple design** - complex logos may not print well
- ✅ **High contrast** - ensure logo is visible on gold background
- ✅ **Vector format** (SVG) scales perfectly

### Size Guidelines
- **Minimum**: 100×100 pixels
- **Recommended**: 200×200 pixels
- **Maximum**: 500×500 pixels
- **File size**: Under 500KB

### Color Recommendations
Since the logo appears on a gold background (#d4af37):
- ✅ Dark colors work well (navy, black, dark blue)
- ✅ White/light colors with dark outline
- ⚠️ Avoid light gold/yellow (won't show up)
- ⚠️ Avoid very light colors (low contrast)

## Troubleshooting

### Logo Not Showing
**Problem**: Logo doesn't appear on card

**Solutions**:
1. Check file name is exactly `church-logo.png`
2. Verify file is in the `public` folder
3. Refresh the browser (Ctrl+F5)
4. Check browser console for errors

### Logo Too Big/Small
**Problem**: Logo doesn't fit well in the circle

**Solutions**:
1. Resize your logo to 200×200 pixels
2. Add padding around the logo in your image editor
3. Adjust the `.logo-image` padding in `idcard.css`:
   ```css
   .logo-image {
     padding: 5px; /* Increase for more space */
   }
   ```

### Logo Quality Poor
**Problem**: Logo looks blurry or pixelated

**Solutions**:
1. Use a higher resolution image (300+ DPI)
2. Use vector format (SVG) if possible
3. Ensure original logo is high quality
4. Check printer quality settings

### Logo Wrong Color
**Problem**: Logo colors don't match brand

**Solutions**:
1. Edit logo in image editor (Photoshop, GIMP, etc.)
2. Ensure printer has "Print Background Graphics" enabled
3. Check printer color settings
4. Use PNG format to preserve colors

## Advanced Customization

### Using SVG Logo
If you have an SVG logo:

1. Save as `church-logo.svg` in public folder
2. Update the image source in `MemberIDCard.jsx`:
   ```jsx
   <img 
     src="/church-logo.svg" 
     alt="Church Logo" 
     className="logo-image"
   />
   ```

### Changing Logo Background Color
To change the gold circle background:

1. Open `src/styles/idcard.css`
2. Find `.logo-circle` (around line 46)
3. Change the gradient colors:
   ```css
   .logo-circle {
     background: linear-gradient(135deg, #your-color-1 0%, #your-color-2 100%);
   }
   ```

### Using Different Logo for Print
If you want different logos for screen vs print:

```jsx
<img 
  src="/church-logo.png" 
  alt="Church Logo" 
  className="logo-image screen-logo"
/>
<img 
  src="/church-logo-print.png" 
  alt="Church Logo" 
  className="logo-image print-logo"
  style={{ display: 'none' }}
/>
```

Then in CSS:
```css
@media print {
  .screen-logo { display: none !important; }
  .print-logo { display: block !important; }
}
```

## Multiple Logo Formats

If you want to support multiple formats with fallback:

```jsx
<picture>
  <source srcSet="/church-logo.svg" type="image/svg+xml" />
  <source srcSet="/church-logo.webp" type="image/webp" />
  <img 
    src="/church-logo.png" 
    alt="Church Logo" 
    className="logo-image"
  />
</picture>
```

## Logo Checklist

Before printing cards:
- [ ] Logo file is in `public` folder
- [ ] File name is correct (`church-logo.png`)
- [ ] Logo is square (1:1 ratio)
- [ ] Logo has good contrast on gold background
- [ ] Logo is high resolution (200×200+ pixels)
- [ ] File size is reasonable (<500KB)
- [ ] Logo displays correctly in preview
- [ ] Test print looks good
- [ ] Colors print correctly

## Examples

### Good Logo Examples
```
✅ Simple church icon with dark outline
✅ Church name in bold text
✅ Cross symbol in dark color
✅ Circular church seal
✅ Monogram with high contrast
```

### Avoid These
```
❌ Very detailed illustrations
❌ Light colors on light background
❌ Very small text
❌ Low resolution images
❌ Overly complex designs
```

## Need Help?

1. **Can't find logo?** Ask your church's communications team
2. **Need to create logo?** Use Canva, Adobe Express, or hire a designer
3. **Logo not working?** Check browser console for errors
4. **Quality issues?** Try a higher resolution image

---

**Quick Reference:**
- Logo location: `public/church-logo.png`
- Recommended size: 200×200 pixels
- Format: PNG with transparency
- Fallback: "GW" text logo if image fails

**That's it! Your church logo will now appear on all member ID cards.** 🎉
