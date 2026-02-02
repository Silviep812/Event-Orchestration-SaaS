

## Add Hidden Developer Access to Coming Soon Page

### Summary
Add a secret way to access the dashboard that only developers/team members would know about, keeping the Coming Soon page clean for public visitors.

### Recommended Approach: Logo Click Counter
Click the IEP logo **5 times quickly** to unlock navigation to the dashboard. This is intuitive for developers who know about it, but invisible to regular visitors.

### How It Works
1. Track the number of clicks on the logo
2. After 5 clicks within 2 seconds, navigate to `/dashboard`
3. Reset the counter if too much time passes between clicks
4. No visual changes to the page - completely hidden

### Technical Implementation

**File to modify:** `src/pages/ComingSoon.tsx`

**Changes:**
1. Add `useNavigate` hook from `react-router-dom`
2. Add state to track click count and timing
3. Add click handler to the logo image
4. Navigate to `/dashboard` after 5 rapid clicks

### Code Preview
```tsx
import { useNavigate } from "react-router-dom";
import { useRef } from "react";

const ComingSoon = () => {
  const navigate = useNavigate();
  const clickCountRef = useRef(0);
  const lastClickTimeRef = useRef(0);

  const handleLogoClick = () => {
    const now = Date.now();
    // Reset if more than 2 seconds since last click
    if (now - lastClickTimeRef.current > 2000) {
      clickCountRef.current = 0;
    }
    lastClickTimeRef.current = now;
    clickCountRef.current += 1;

    if (clickCountRef.current >= 5) {
      navigate("/dashboard");
    }
  };

  // ... rest of component

  // Update logo to be clickable:
  <img 
    src={iepFullLogo} 
    alt="Ida Event Partners Logo" 
    className="h-[120px] w-auto mx-auto cursor-pointer"
    onClick={handleLogoClick}
  />
```

### Security Note
- Dashboard is already protected by authentication (`ProtectedRoute`)
- Unauthenticated users will be redirected to `/auth` login page
- This just provides a hidden navigation shortcut

### Alternative Options (if preferred)
- **Keyboard shortcut**: Press `Ctrl+Shift+D` to access dashboard
- **URL parameter**: Add `?dev=true` to show the dashboard button

