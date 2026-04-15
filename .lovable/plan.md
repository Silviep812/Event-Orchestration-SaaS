

## Problem

The Retreats theme in the sidebar is displaying event types that belong to Health & Wellness:
- "Wellness"
- "Mindful" 
- "Rejuvenating"
- "Holistic"

These should only appear under the Health & Wellness theme, not under Retreats.

## Solution

Add a filter in `src/lib/themeEventTypeHierarchy.ts` within the `loadRetreatsEventTypeGroups()` function to exclude these Health & Wellness labels when loading Retreats event types.

**Changes needed:**
1. Define excluded labels: `["wellness", "mindful", "rejuvenating", "holistic"]`
2. Add `isExcludedFromRetreats()` helper to catch exact matches and variations (e.g., "Mindfulness", "Rejuvenation", "Holistic Principles")
3. Skip any matching labels when processing Retreats branches

This ensures the Retreats theme only shows its proper sub-types (Skill Building, Development, Community, Support, Hybrid).

