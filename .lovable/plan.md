
# Coming Soon Landing Page

## Overview
Replace the current full landing page with a simple, elegant "Coming Soon" page to prevent visitors from seeing the full app while it's still in development.

## What You'll Get
- A clean, professional "Coming Soon" page with your IEP branding
- Brief teaser text about your event planning platform
- Optional email signup to notify visitors when you launch
- Your logo prominently displayed

## Implementation

### Create New Coming Soon Page
**File: `src/pages/ComingSoon.tsx`**

A simple, centered page with:
- IEP logo at the top
- "Coming Soon" headline with gradient styling
- Brief description: "Ida Event Partners - Your comprehensive event planning platform is launching soon"
- Decorative background elements for visual interest
- Optional: Email input + "Notify Me" button (can connect to database later)

### Update Routes
**File: `src/App.tsx`**

Change the home route to show ComingSoon instead of Index:
- Line 51: Change `<Index />` to `<ComingSoon />`
- Keep Index.tsx intact so you can easily switch back when ready to launch

## Design Details
- Full-screen centered layout
- Gradient background matching your brand colors (purple/pink theme)
- Subtle animated elements (floating shapes or pulse effect)
- Responsive design for mobile visitors
- Dark mode support

## Switching Back When Ready
When you're ready to launch, simply change line 51 in App.tsx back to:
```tsx
<Route path="/" element={<Index />} />
```

## Technical Notes
- No database changes required
- The /auth and /dashboard routes remain functional for your development testing
- Contact page remains accessible if you want to keep it
