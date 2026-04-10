-- IEP §6: when venue booking is complete, event start/end dates and times are locked in CM.
ALTER TABLE public.events
ADD COLUMN IF NOT EXISTS venue_booking_completed boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.events.venue_booking_completed IS
  'True after venue booking transaction is complete; Manage Event locks start/end date and times until reset by owner.';
