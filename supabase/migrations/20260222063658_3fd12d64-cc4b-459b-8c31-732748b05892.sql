
-- Create checklist_templates table to store checklist items per resource category
CREATE TABLE public.checklist_templates (
  id SERIAL PRIMARY KEY,
  category_name TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  label TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.checklist_templates ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read templates
CREATE POLICY "Authenticated users can read checklist templates"
  ON public.checklist_templates FOR SELECT
  TO authenticated
  USING (true);

-- Seed data: Bookings group (Bookings, Venues, Hospitality, Transportation)
INSERT INTO public.checklist_templates (category_name, sort_order, label) VALUES
  ('Booking', 1, 'Confirm availability and service window'),
  ('Booking', 2, 'Validate compatibility with venue rules and layout'),
  ('Booking', 3, 'Verify access credentials and load-in requirements'),
  ('Booking', 4, 'Confirm setup and teardown timing'),
  ('Booking', 5, 'Coordinate with venue and lead vendors'),
  ('Venue', 1, 'Confirm availability and service window'),
  ('Venue', 2, 'Validate compatibility with venue rules and layout'),
  ('Venue', 3, 'Verify access credentials and load-in requirements'),
  ('Venue', 4, 'Confirm setup and teardown timing'),
  ('Venue', 5, 'Coordinate with venue and lead vendors'),
  ('Hospitality', 1, 'Confirm availability and service window'),
  ('Hospitality', 2, 'Validate compatibility with venue rules and layout'),
  ('Hospitality', 3, 'Verify access credentials and load-in requirements'),
  ('Hospitality', 4, 'Confirm setup and teardown timing'),
  ('Hospitality', 5, 'Coordinate with venue and lead vendors'),
  ('Transportation', 1, 'Confirm availability and service window'),
  ('Transportation', 2, 'Validate compatibility with venue rules and layout'),
  ('Transportation', 3, 'Verify access credentials and load-in requirements'),
  ('Transportation', 4, 'Confirm setup and teardown timing'),
  ('Transportation', 5, 'Coordinate with venue and lead vendors'),
  -- Vendors group
  ('Vendors', 1, 'Define scope of work and deliverables'),
  ('Vendors', 2, 'Finalize agreement or service terms'),
  ('Vendors', 3, 'Log deviations, delays, or issues'),
  ('Vendors', 4, 'Confirm all deliverables received'),
  ('Vendors', 5, 'Process final payment'),
  ('Rentals', 1, 'Define scope of work and deliverables'),
  ('Rentals', 2, 'Finalize agreement or service terms'),
  ('Rentals', 3, 'Log deviations, delays, or issues'),
  ('Rentals', 4, 'Confirm all deliverables received'),
  ('Rentals', 5, 'Process final payment'),
  ('Service', 1, 'Define scope of work and deliverables'),
  ('Service', 2, 'Finalize agreement or service terms'),
  ('Service', 3, 'Log deviations, delays, or issues'),
  ('Service', 4, 'Confirm all deliverables received'),
  ('Service', 5, 'Process final payment'),
  ('Supplier', 1, 'Define scope of work and deliverables'),
  ('Supplier', 2, 'Finalize agreement or service terms'),
  ('Supplier', 3, 'Log deviations, delays, or issues'),
  ('Supplier', 4, 'Confirm all deliverables received'),
  ('Supplier', 5, 'Process final payment'),
  -- Entertainment
  ('Entertainment', 1, 'Technical rider review (Sound/Light)'),
  ('Entertainment', 2, 'Performance schedule alignment'),
  ('Entertainment', 3, 'Green room/Hospitality requirements'),
  ('Entertainment', 4, 'Soundcheck timing'),
  -- Staff
  ('Staff', 1, 'Confirm staff availability and assignments'),
  ('Staff', 2, 'Verify credentials and certifications'),
  ('Staff', 3, 'Distribute schedule and responsibilities'),
  ('Staff', 4, 'Confirm uniforms and equipment'),
  ('Staff', 5, 'Complete post-event debrief');
