

# Plan: Improve ResourceCard Readability (Text Size Fix)

## Problem

The Resource Category Assignments section has the correct layout position (below "View Request", before Archive), but the text is too small to read comfortably.

## Current Text Sizes (Too Small)

| Element | Current Size | Issue |
|---------|-------------|-------|
| Category label | `text-sm` (14px) | Okay but could be bolder |
| Status/Confirmed labels | `text-xs` inherited (12px) | Too small |
| Select triggers | `h-7 text-xs` (28px height, 12px text) | Too cramped |
| "Task Assigned To" label | `text-xs` (12px) | Hard to read |
| Collaborator input | `h-7 text-xs` (28px, 12px) | Too small |
| Timeline label | `text-xs` (12px) | Okay |
| Due/Start/End labels | `text-[10px]` (10px) | Very hard to read |
| Date inputs | `h-6 text-xs px-1` (24px, 12px) | Too cramped |
| Card padding | `p-3` (12px) | Could use more space |

## Proposed Sizes (Readable)

| Element | New Size | Improvement |
|---------|----------|-------------|
| Category label | `text-base font-semibold` (16px) | +2px, stands out more |
| Status/Confirmed labels | `text-sm text-muted-foreground` (14px) | +2px |
| Select triggers | `h-9 w-full text-sm` (36px, 14px) | +8px height, +2px text |
| "Task Assigned To" label | `text-sm font-semibold` (14px) | +2px |
| Collaborator input | `h-9 text-sm` (36px, 14px) | +8px height, +2px text |
| Timeline label | `text-sm text-muted-foreground` (14px) | +2px |
| Due/Start/End labels | `text-xs text-muted-foreground` (12px) | +2px from 10px |
| Date inputs | `h-8 text-sm px-2` (32px, 14px) | +8px height, +2px text |
| Card padding | `p-4` (16px) | +4px breathing room |

---

## Technical Changes

**File: `src/components/ResourceCard.tsx`**

### Line 80 - Card container padding
```tsx
// Before
<div className="border rounded-lg p-3 bg-card">

// After
<div className="border rounded-lg p-4 bg-card">
```

### Line 107 - Category label size
```tsx
// Before
className="text-sm font-semibold leading-none cursor-pointer truncate"

// After
className="text-base font-semibold leading-none cursor-pointer truncate"
```

### Line 115 - Status/Confirmed grid container
```tsx
// Before
<div className="grid grid-cols-2 gap-2 text-xs mb-2">

// After
<div className="grid grid-cols-2 gap-3 mb-3">
```

### Lines 118, 143 - Field labels
```tsx
// Before
<label className="text-muted-foreground">Status</label>
<label className="text-muted-foreground">Confirmed</label>

// After
<label className="text-sm text-muted-foreground">Status</label>
<label className="text-sm text-muted-foreground">Confirmed</label>
```

### Lines 129, 154 - Select triggers
```tsx
// Before
<SelectTrigger className="h-7 w-full text-xs">

// After
<SelectTrigger className="h-9 w-full text-sm">
```

### Line 167 - "Task Assigned To" label
```tsx
// Before
<label className="text-xs font-semibold text-foreground">Task Assigned To</label>

// After
<label className="text-sm font-semibold text-foreground">Task Assigned To</label>
```

### Line 173 - Collaborator input
```tsx
// Before
className="h-7 text-xs"

// After
className="h-9 text-sm"
```

### Line 179 - Timeline label
```tsx
// Before
<label className="text-xs text-muted-foreground">Timeline</label>

// After
<label className="text-sm text-muted-foreground">Timeline</label>
```

### Line 180 - Timeline grid
```tsx
// Before
<div className="grid grid-cols-3 gap-1 text-xs">

// After
<div className="grid grid-cols-3 gap-2">
```

### Lines 182, 192, 202 - Date field labels
```tsx
// Before
<span className="text-muted-foreground text-[10px]">Due</span>
<span className="text-muted-foreground text-[10px]">Start</span>
<span className="text-muted-foreground text-[10px]">End</span>

// After
<span className="text-xs text-muted-foreground">Due</span>
<span className="text-xs text-muted-foreground">Start</span>
<span className="text-xs text-muted-foreground">End</span>
```

### Lines 188, 198, 208 - Date inputs
```tsx
// Before
className="h-6 text-xs px-1"

// After
className="h-8 text-sm px-2"
```

---

## Visual Comparison

```text
BEFORE (cramped, hard to read):
┌─────────────────────────┐
│☑ Bookings               │  ← 14px, okay
│ Status    Confirmed     │  ← 12px, small
│ [Pending▼] [No ▼]       │  ← 28px height, cramped
│ Task Assigned To        │  ← 12px, hard to read
│ [________________]      │  ← 28px height
│ Timeline                │
│ Due  Start  End         │  ← 10px, VERY small
│ [__] [___] [___]        │  ← 24px height, cramped
└─────────────────────────┘

AFTER (readable):
┌───────────────────────────┐
│ ☑ Bookings                │  ← 16px, clear
│                           │
│ Status      Confirmed     │  ← 14px, readable
│ [Pending ▼]  [No ▼]       │  ← 36px height, comfortable
│                           │
│ Task Assigned To          │  ← 14px, readable
│ [____________________]    │  ← 36px height, comfortable
│                           │
│ Timeline                  │  ← 14px
│ Due      Start     End    │  ← 12px, readable
│ [______] [______] [______]│  ← 32px height, usable
└───────────────────────────┘
```

---

## File to Modify

| File | Changes |
|------|---------|
| `src/components/ResourceCard.tsx` | Increase all text sizes from text-xs/text-[10px] to text-sm/text-xs, increase input heights from h-6/h-7 to h-8/h-9, increase padding from p-3 to p-4, increase gaps |

---

## Summary

Single file change to `ResourceCard.tsx`:
- Card padding: `p-3` → `p-4`
- Category label: `text-sm` → `text-base`
- Field labels: inherit `text-xs` → explicit `text-sm`
- Select triggers: `h-7 text-xs` → `h-9 text-sm`
- Inputs: `h-7 text-xs` → `h-9 text-sm`
- Date labels: `text-[10px]` → `text-xs`
- Date inputs: `h-6 text-xs px-1` → `h-8 text-sm px-2`
- Gaps: `gap-1`/`gap-2` → `gap-2`/`gap-3`

All functionality preserved, only visual sizing improved for readability.

