DO $$
DECLARE
  v_admin uuid := '06a72aed-0880-4f3a-b5c9-261d11c67c24';
  v_viewer uuid := 'afecfd42-68ff-42d9-ba7f-8da07c8b95d4';
  v_collab uuid := '4a62ca71-a7af-4765-b7df-cceb02d1e30e';
  v_event uuid;
  v_start date := (CURRENT_DATE + INTERVAL '3 months')::date;
  v_venue_name text := 'The Surf Room';
BEGIN
  PERFORM set_config('request.jwt.claim.sub', v_admin::text, true);
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_admin::text, 'role','authenticated')::text, true);
  PERFORM set_config('role', 'authenticated', true);

  SELECT id INTO v_event FROM public.events
    WHERE title = 'IEP Demo Event — Corporate Gala' AND user_id = v_admin LIMIT 1;
  IF v_event IS NOT NULL THEN
    RAISE NOTICE 'Demo event already exists: %', v_event;
    RETURN;
  END IF;

  INSERT INTO public.events (user_id, title, description, venue, location, start_date, end_date, start_time, end_time, budget, expected_attendees, status, type_id, venue_booking_completed)
  VALUES (v_admin, 'IEP Demo Event — Corporate Gala',
          'Pre-built demo event showcasing IEP planning capabilities for a corporate gala in Washington DC.',
          v_venue_name, 'Washington DC', v_start, v_start, '18:00', '23:00',
          25000, 150, 'in_progress', 86, true)
  RETURNING id INTO v_event;

  INSERT INTO public.tasks (event_id, title, description, status, priority, created_by, category, due_date) VALUES
    (v_event, 'Finalize venue contract', 'Sign and return the venue agreement.', 'completed', 'high', v_admin, 'Venue', (v_start - INTERVAL '60 days')),
    (v_event, 'Confirm catering menu', 'Lock final menu selections with catering vendor.', 'in_progress', 'high', v_admin, 'Catering', (v_start - INTERVAL '30 days')),
    (v_event, 'Book entertainment', 'Confirm live band booking and stage requirements.', 'in_progress', 'medium', v_admin, 'Entertainment', (v_start - INTERVAL '21 days')),
    (v_event, 'Send guest invitations', 'Distribute formal invitations to 150 guests.', 'not_started', 'medium', v_admin, 'Marketing', (v_start - INTERVAL '45 days')),
    (v_event, 'Coordinate transportation', 'Arrange shuttle service for VIP guests.', 'not_started', 'low', v_admin, 'Transportation', (v_start - INTERVAL '14 days'));

  INSERT INTO public.budget_items (event_id, category, item_name, estimated_cost, vendor_name, created_by, status) VALUES
    (v_event, 'venue', 'Venue Rental', 10000, v_venue_name, v_admin, 'Confirmed'),
    (v_event, 'catering', 'Catering Service', 8000, 'Premier Catering Co.', v_admin, 'Estimated'),
    (v_event, 'entertainment', 'Live Band & DJ', 5000, 'DC Live Entertainment', v_admin, 'Estimated');

  INSERT INTO public.change_requests (title, description, status, priority, event_id, requested_by, approved_by, approved_at, change_type, field_changes)
  VALUES ('Increase expected attendees to 175',
          'Adjust headcount to accommodate additional VIP guests.',
          'approved', 'medium', v_event::text, v_admin, v_admin, now(), 'event_update',
          jsonb_build_object('expected_attendees', jsonb_build_object('oldValue','150','newValue','175')));

  RESET role;
  PERFORM set_config('request.jwt.claims', NULL, true);
  PERFORM set_config('request.jwt.claim.sub', NULL, true);

  INSERT INTO public.cm_event_members (user_id, event_id, role) VALUES
    (v_collab, v_event, 'manager'),
    (v_viewer, v_event, 'viewer')
  ON CONFLICT DO NOTHING;
END $$;