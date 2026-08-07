-- Acceptance Test 3 verification — run in Supabase SQL Editor (Dashboard → SQL).
-- Read-only. Run AFTER the migrations have been pushed to this project.
--
-- Every query below should return the "expected" result noted in its comment. Anything else means
-- the migrations have not reached this database yet (see docs/DEPLOYING_TASK1_FIXES.md).

-- ─── 0) Are the Task 1 migrations recorded as applied? ──────────────────────
-- Expected: all four versions present.
SELECT version,
       version IN (
         '20260730150000',
         '20260730151000',
         '20260801120000',
         '20260806120000'
       ) AS is_task1_fix
FROM supabase_migrations.schema_migrations
WHERE version >= '20260730000000'
ORDER BY version;

-- ─── 1) Double entries: duplicate category labels under the same parent ─────
-- Expected: 0 rows.
SELECT theme_id, parent_id, lower(btrim(name)) AS label, count(*) AS copies
FROM event_types
GROUP BY theme_id, parent_id, lower(btrim(name))
HAVING count(*) > 1
ORDER BY copies DESC;

-- ─── 2) Misaligned directory: a child in a different theme than its parent ──
-- Expected: 0 rows.
SELECT child.id, child.name AS child_name, child.theme_id AS child_theme,
       parent.name AS parent_name, parent.theme_id AS parent_theme
FROM event_types child
JOIN event_types parent ON parent.id = child.parent_id
WHERE parent.theme_id IS NOT NULL
  AND child.theme_id IS DISTINCT FROM parent.theme_id;

-- ─── 3) Dining categories with their types ──────────────────────────────────
-- Expected: Contemporary, Buffet, Fine Dining — each with at least one type.
SELECT cat.name AS category, count(t.id) AS types
FROM "Themes Directory Catalog" th
JOIN event_types cat ON cat.theme_id = th.id
LEFT JOIN event_types t ON t.parent_id = cat.id
WHERE lower(th.name) = 'dining'
GROUP BY cat.id, cat.name
ORDER BY cat.name;

-- ─── 4) Festival must have the Heritage category ────────────────────────────
-- Expected: one row, types > 0.
SELECT cat.name AS category, count(t.id) AS types
FROM "Themes Directory Catalog" th
JOIN event_types cat ON cat.theme_id = th.id
LEFT JOIN event_types t ON t.parent_id = cat.id
WHERE lower(th.name) LIKE 'festival%'
  AND lower(btrim(cat.name)) = 'heritage'
GROUP BY cat.id, cat.name;

-- ─── 5) Sporting must offer 5K race and Game Night ──────────────────────────
-- Expected: 2 rows.
SELECT cat.name AS category
FROM "Themes Directory Catalog" th
JOIN event_types cat ON cat.theme_id = th.id
WHERE lower(btrim(th.name)) IN ('sporting', 'sport', 'sports')
  AND lower(btrim(cat.name)) IN ('5k race', 'game night')
ORDER BY cat.name;

-- ─── 6) Special Event cleanup ───────────────────────────────────────────────
-- Expected: has_convention = true, has_charity/has_social_meetup/has_heritage = false.
SELECT
  bool_or(lower(btrim(name)) = 'convention')                                   AS has_convention,
  bool_or(lower(btrim(name)) IN ('charity', 'charity gala'))                   AS has_charity,
  bool_or(lower(btrim(name)) IN ('social meetup', 'social meet-up', 'social meet up')) AS has_social_meetup,
  bool_or(lower(btrim(name)) = 'heritage')                                     AS has_heritage
FROM event_types
WHERE theme_id IN (SELECT id FROM "Themes Directory Catalog" WHERE lower(name) LIKE '%special%');

-- ─── 7) Special Event has a usable Directory > category > type tree ─────────
-- Expected: at least one category, each with types.
SELECT cat.name AS category, count(t.id) AS types
FROM "Themes Directory Catalog" th
JOIN event_types root ON root.theme_id = th.id AND root.parent_id IS NULL
JOIN event_types cat ON cat.parent_id = root.id
LEFT JOIN event_types t ON t.parent_id = cat.id
WHERE lower(th.name) LIKE '%special%'
GROUP BY cat.id, cat.name
ORDER BY cat.name;

-- ─── 8) Catalog tags now mirror the real categories ─────────────────────────
-- Expected: no theme reports missing_from_tags.
WITH roots AS (
  SELECT th.id AS theme_id, th.name AS theme_name, th.tags,
         (SELECT count(*) FROM event_types r WHERE r.theme_id = th.id AND r.parent_id IS NULL) AS root_count
  FROM "Themes Directory Catalog" th
),
categories AS (
  SELECT r.theme_id, r.theme_name, r.tags, et.name AS category_name
  FROM roots r
  JOIN event_types et ON et.theme_id = r.theme_id AND et.parent_id IS NULL
  WHERE r.root_count > 1
  UNION ALL
  SELECT r.theme_id, r.theme_name, r.tags, child.name
  FROM roots r
  JOIN event_types root ON root.theme_id = r.theme_id AND root.parent_id IS NULL
  JOIN event_types child ON child.parent_id = root.id
  WHERE r.root_count = 1
)
SELECT theme_name, category_name AS missing_from_tags
FROM categories c
WHERE NOT EXISTS (
  SELECT 1 FROM unnest(COALESCE(c.tags, ARRAY[]::text[])) AS t
  WHERE lower(btrim(t)) = lower(btrim(c.category_name))
)
ORDER BY theme_name, category_name;

-- ─── 9) Themes labelled "Recommend" in Browse Event Themes ──────────────────
-- Expected: Celebration, Dining, Festival present exactly once each.
SELECT name FROM "Themes Directory Catalog"
WHERE lower(btrim(name)) IN ('celebration', 'dining')
   OR lower(btrim(name)) LIKE 'festival%'
ORDER BY name;

-- ═══ Round 2 — Acceptance Testing 08/06/2026 ════════════════════════════════

-- ─── 10) No duplicate theme rows (Create Event listed "Dining" twice) ───────
-- Expected: 0 rows.
SELECT lower(btrim(name)) AS theme, count(*) AS copies
FROM "Themes Directory Catalog"
GROUP BY lower(btrim(name))
HAVING count(*) > 1;

-- ─── 11) Festival > Heritage types are ethnic groups ────────────────────────
-- Expected: African American, German American, Asian American, … and none of
-- the old descriptive labels (Cultural Heritage, Family Heritage, …).
SELECT t.name AS heritage_type
FROM "Themes Directory Catalog" th
JOIN event_types cat ON cat.theme_id = th.id AND lower(btrim(cat.name)) = 'heritage'
JOIN event_types t ON t.parent_id = cat.id
WHERE lower(th.name) LIKE 'festival%'
ORDER BY t.name;

-- ─── 12) Every category offers at least one selectable type ─────────────────
-- Covers "Health and Wellness > type missing dropdown" and the Celebration
-- Holiday / Personal note. Expected: 0 rows.
SELECT th.name AS theme, cat.name AS category_with_no_types
FROM "Themes Directory Catalog" th
JOIN event_types root ON root.theme_id = th.id AND root.parent_id IS NULL
JOIN event_types cat ON cat.parent_id = root.id
WHERE NOT EXISTS (SELECT 1 FROM event_types t WHERE t.parent_id = cat.id)
  AND EXISTS (
    SELECT 1 FROM event_types sib
    JOIN event_types g ON g.parent_id = sib.id
    WHERE sib.parent_id = root.id
  )
ORDER BY th.name, cat.name;

-- ─── 13) Celebration Holidays / Personal both carry types ───────────────────
-- Expected: two rows, each with types > 0.
SELECT cat.name AS category, count(t.id) AS types
FROM "Themes Directory Catalog" th
JOIN event_types cat ON cat.theme_id = th.id
LEFT JOIN event_types t ON t.parent_id = cat.id
WHERE lower(btrim(th.name)) = 'celebration'
  AND lower(btrim(cat.name)) IN ('holidays', 'holiday', 'personal')
GROUP BY cat.id, cat.name
ORDER BY cat.name;

-- ─── 14) Health & Wellness categories carry types ───────────────────────────
-- Expected: every row has types > 0.
SELECT cat.name AS category, count(t.id) AS types
FROM "Themes Directory Catalog" th
JOIN event_types root ON root.theme_id = th.id AND root.parent_id IS NULL
JOIN event_types cat ON cat.parent_id = root.id
LEFT JOIN event_types t ON t.parent_id = cat.id
WHERE lower(th.name) LIKE '%health%' AND lower(th.name) LIKE '%wellness%'
GROUP BY cat.id, cat.name
ORDER BY cat.name;
