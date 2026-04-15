

## Problem

The `event_themes` table has a `tags` column for the Retreat theme containing `["Wellness", "Mindful", "Rejuvenating", "Holistic"]`. These are displayed as tag chips on the Themes Directory page because the code at `EventThemesDirectory.tsx` line 438 starts with `t.tags` and then merges in the dynamic branch labels. The `loadRetreatsEventTypeGroups` filter works correctly, but the raw DB tags bypass it.

## Solution

Two changes are needed:

### 1. Update the database — remove excluded tags from `event_themes`

Run a migration to clear the stale tags from the Retreat theme row:

```sql
UPDATE event_themes
SET tags = '{}'
WHERE name = 'Retreat';
```

This removes "Wellness", "Mindful", "Rejuvenating", "Holistic" from the stored tags. The Retreat theme will now only show dynamically loaded branch labels (Building communities, Hybrid, Motivational Retreat, etc.).

### 2. Add a frontend safety filter in `EventThemesDirectory.tsx`

In the Retreat tag-building block (~line 443), filter out the excluded labels so even if the DB still has stale data, they won't appear:

```typescript
if (/^retreats?$/i.test(trimmed) || /^retreat\b/i.test(trimmed)) {
  const keys = Object.keys(retreatBranchTypes);
  if (keys.length) {
    tags = [...new Set([...tags, ...keys])];
  }
  // Remove H&W labels that don't belong under Retreats
  const excluded = ["wellness", "mindful", "rejuvenating", "holistic"];
  tags = tags.filter(t => !excluded.some(ex => t.toLowerCase().includes(ex)));
}
```

This ensures both the data layer and UI layer enforce the exclusion.

