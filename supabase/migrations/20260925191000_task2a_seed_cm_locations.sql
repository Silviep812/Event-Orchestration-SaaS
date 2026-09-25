-- Task 2A: seed cm_locations so multi-location change management is exercisable.
--
-- The guard triggers from 20260905183000 and the acceptance-test flow (create change
-- request -> accept -> tasks update -> email) both depend on an event having more than
-- one location. cm_locations was empty, so the location-scoped paths could never run.
--
-- Seeded against events that already carry change requests and tasks, using each event's
-- own recorded city/state so the rows stay consistent with existing data. Locations are
-- reference rows for an event; no venue or provider records are fabricated.
--
-- Idempotent: re-running will not duplicate a location for the same event + name.

INSERT INTO public.cm_locations (event_id, name, address, city, state, zip, region)
SELECT v.event_id, v.name, v.address, v.city, v.state, v.zip, v.region
FROM (
  VALUES
    -- "Test Milestone 5 Event" (Wheaton, MD 20902) - 4 change requests, 2 tasks.
    ('16ff1e31-3f54-4e27-847c-089bf92d15df'::uuid, 'Main Venue',        '11160 Veirs Mill Rd', 'Wheaton',   'MD', '20902', 'Maryland'),
    ('16ff1e31-3f54-4e27-847c-089bf92d15df'::uuid, 'Overflow Hall',     '2424 Reedie Dr',      'Wheaton',   'MD', '20902', 'Maryland'),
    ('16ff1e31-3f54-4e27-847c-089bf92d15df'::uuid, 'Catering Staging',  '11002 Veirs Mill Rd', 'Wheaton',   'MD', '20902', 'Maryland'),
    -- "date test 2" (Baltimore, MD 21201).
    ('6052a91c-9a26-4aae-8c05-1429d936999c'::uuid, 'Main Venue',        '401 W Baltimore St',  'Baltimore', 'MD', '21201', 'Maryland'),
    ('6052a91c-9a26-4aae-8c05-1429d936999c'::uuid, 'Breakout Space',    '300 W Lombard St',    'Baltimore', 'MD', '21201', 'Maryland'),
    -- "testing" (Baltimore, MD 21201).
    ('97e2c48c-66e2-4ea2-9e82-0e04865c00c7'::uuid, 'Main Venue',        '100 Light St',        'Baltimore', 'MD', '21201', 'Maryland'),
    ('97e2c48c-66e2-4ea2-9e82-0e04865c00c7'::uuid, 'Vendor Load-In',    '110 Light St',        'Baltimore', 'MD', '21201', 'Maryland'),
    -- "Test" (Baltimore, MD 21209).
    ('e1f8c026-7161-4559-aa98-db01ce4d0090'::uuid, 'Main Venue',        '6100 Falls Rd',       'Baltimore', 'MD', '21209', 'Maryland'),
    ('e1f8c026-7161-4559-aa98-db01ce4d0090'::uuid, 'Guest Reception',   '6200 Falls Rd',       'Baltimore', 'MD', '21209', 'Maryland')
) AS v(event_id, name, address, city, state, zip, region)
WHERE EXISTS (SELECT 1 FROM public.events e WHERE e.id = v.event_id)
  AND NOT EXISTS (
    SELECT 1 FROM public.cm_locations l
    WHERE l.event_id = v.event_id AND l.name = v.name
  );

-- Point each event's existing tasks at that event's "Main Venue" so location-scoped
-- change requests satisfy validate_cm_change_request_location_scope(). Only fills tasks
-- that have no location yet; never reassigns a task already scoped to a location.
UPDATE public.tasks t
SET location_id = l.id
FROM public.cm_locations l
WHERE l.event_id = t.event_id
  AND l.name = 'Main Venue'
  AND t.location_id IS NULL
  AND t.event_id IN (
    '16ff1e31-3f54-4e27-847c-089bf92d15df',
    '6052a91c-9a26-4aae-8c05-1429d936999c',
    '97e2c48c-66e2-4ea2-9e82-0e04865c00c7',
    'e1f8c026-7161-4559-aa98-db01ce4d0090'
  );
