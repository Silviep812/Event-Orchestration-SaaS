-- Seed Authorization / User lookup rows when those legacy tables exist (deleted later on some remotes).
-- Idempotent: skips missing tables; avoids duplicate seed rows on replays.

DO $seed$
BEGIN
  IF pg_catalog.to_regclass('public."Authorization"') IS NOT NULL THEN
    INSERT INTO public."Authorization" (sign_in)
    SELECT v
    FROM (
      VALUES
        ('Host'),
        ('Organizer'),
        ('Professional Event Planner'),
        ('Venue Owner'),
        ('Manager')
    ) AS t(v)
    WHERE NOT EXISTS (
      SELECT 1 FROM public."Authorization" a WHERE a.sign_in IS NOT DISTINCT FROM t.v
    );
  END IF;

  IF pg_catalog.to_regclass('public."User"') IS NOT NULL THEN
    INSERT INTO public."User" (userid, user_name, contact_name, user_role)
    SELECT gen_random_uuid(), 'Host', 'Host User', 'host'
    WHERE NOT EXISTS (SELECT 1 FROM public."User" u WHERE u.user_role = 'host');

    INSERT INTO public."User" (userid, user_name, contact_name, user_role)
    SELECT gen_random_uuid(), 'Organizer', 'Organizer User', 'organizer'
    WHERE NOT EXISTS (SELECT 1 FROM public."User" u WHERE u.user_role = 'organizer');

    INSERT INTO public."User" (userid, user_name, contact_name, user_role)
    SELECT gen_random_uuid(), 'Professional Event Planner', 'Professional Event Planner User', 'professional-planner'
    WHERE NOT EXISTS (SELECT 1 FROM public."User" u WHERE u.user_role = 'professional-planner');

    INSERT INTO public."User" (userid, user_name, contact_name, user_role)
    SELECT gen_random_uuid(), 'Venue Owner', 'Venue Owner User', 'venue-owner'
    WHERE NOT EXISTS (SELECT 1 FROM public."User" u WHERE u.user_role = 'venue-owner');

    INSERT INTO public."User" (userid, user_name, contact_name, user_role)
    SELECT gen_random_uuid(), 'Manager', 'Manager User', 'manager'
    WHERE NOT EXISTS (SELECT 1 FROM public."User" u WHERE u.user_role = 'manager');
  END IF;
END $seed$;
