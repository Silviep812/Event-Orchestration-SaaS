-- Add venue_id to reservation_submissions to connect reservations with venues
ALTER TABLE public.reservation_submissions
ADD COLUMN IF NOT EXISTS venue_id uuid REFERENCES public.venues(id) ON DELETE SET NULL;