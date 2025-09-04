# App Store Assets

## Required Assets Status

### Icons

- [x] `icon.png` - 1024x1024 App Store icon
- [x] `adaptive-icon.png` - 1024x1024 Android adaptive icon foreground
- [x] `favicon.png` - 192x192 Web favicon
- [x] `splash-icon.png` - Splash screen logo
- [x] `notification-icon.png` - Push notification icon

### Screenshots Needed

Generate these screenshots using the app on actual devices:

#### iPhone Screenshots (6.7" Display - iPhone 14 Pro Max)

1. **Login/Welcome Screen** - Show app branding and login interface
2. **Dashboard/Home** - Main navigation and quick actions
3. **Service Check-in** - QR code scanner in action
4. **Events List** - Upcoming events with RSVP options
5. **Event Detail** - Event information and RSVP interface
6. **Life Groups** - Group discovery and filtering
7. **Discipleship Pathways** - Pathway progress and completion
8. **Member Directory** - Search and contact features

#### Android Screenshots (Phone - 16:9 aspect ratio)

Same 8 screens as iPhone but captured on Android device

### App Previews (Optional but Recommended)

- 30-second video showing key app flow: Login → Check-in → Events → Groups

## Asset Generation Commands

```bash
# Generate all required icon sizes
npm run generate-icons

# Take screenshots with Detox
npm run screenshots

# Optimize images for store submission
npm run optimize-assets
```

## Store Upload Checklist

### App Store Connect

- [ ] Upload 1024x1024 icon
- [ ] Upload 8 iPhone screenshots (6.7" display)
- [ ] Add app description and keywords
- [ ] Set age rating to 4+
- [ ] Configure in-app purchases (none)
- [ ] Add support and privacy policy URLs

### Google Play Console

- [ ] Upload high-res icon (512x512)
- [ ] Upload 8 phone screenshots
- [ ] Add app description (4000 char limit)
- [ ] Complete Data Safety form
- [ ] Set content rating to Everyone
- [ ] Configure distribution countries

## Notes

- All assets use Drouple brand colors: Primary #1e7ce8, Secondary #e5c453
- Icons include church/community symbolism with modern design
- Screenshots should demonstrate core value: community connection
- Ensure accessibility compliance in all visual assets
