-- Create table for RSVP submissions
CREATE TABLE IF NOT EXISTS public.rsvp_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  book_id TEXT NOT NULL,
  guest_name TEXT NOT NULL,
  guest_email TEXT NOT NULL,
  response_type TEXT NOT NULL CHECK (response_type IN ('attending', 'not-attending', 'maybe')),
  guest_count INTEGER,
  special_requests TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for Confirmation submissions
CREATE TABLE IF NOT EXISTS public.confirmation_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  book_id TEXT NOT NULL,
  confirmation_number TEXT NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for Reservation submissions
CREATE TABLE IF NOT EXISTS public.reservation_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  book_id TEXT NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  party_size INTEGER NOT NULL,
  preferred_date DATE NOT NULL,
  preferred_time TEXT NOT NULL,
  special_requests TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for Registry submissions
CREATE TABLE IF NOT EXISTS public.registry_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  book_id TEXT NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  selected_items JSONB NOT NULL,
  total_amount NUMERIC(10,2) NOT NULL,
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for Barcode submissions
CREATE TABLE IF NOT EXISTS public.barcode_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  book_id TEXT NOT NULL,
  event_name TEXT NOT NULL,
  ticket_number TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL,
  phone TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.rsvp_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.confirmation_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservation_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registry_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.barcode_submissions ENABLE ROW LEVEL SECURITY;

-- Create policies to allow anyone to view and insert (public facing forms)
DROP POLICY IF EXISTS "Anyone can view RSVP submissions" ON public.rsvp_submissions;
CREATE POLICY "Anyone can view RSVP submissions" ON public.rsvp_submissions FOR SELECT USING (true);
DROP POLICY IF EXISTS "Anyone can create RSVP submissions" ON public.rsvp_submissions;
CREATE POLICY "Anyone can create RSVP submissions" ON public.rsvp_submissions FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can view confirmation submissions" ON public.confirmation_submissions;
CREATE POLICY "Anyone can view confirmation submissions" ON public.confirmation_submissions FOR SELECT USING (true);
DROP POLICY IF EXISTS "Anyone can create confirmation submissions" ON public.confirmation_submissions;
CREATE POLICY "Anyone can create confirmation submissions" ON public.confirmation_submissions FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can view reservation submissions" ON public.reservation_submissions;
CREATE POLICY "Anyone can view reservation submissions" ON public.reservation_submissions FOR SELECT USING (true);
DROP POLICY IF EXISTS "Anyone can create reservation submissions" ON public.reservation_submissions;
CREATE POLICY "Anyone can create reservation submissions" ON public.reservation_submissions FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can view registry submissions" ON public.registry_submissions;
CREATE POLICY "Anyone can view registry submissions" ON public.registry_submissions FOR SELECT USING (true);
DROP POLICY IF EXISTS "Anyone can create registry submissions" ON public.registry_submissions;
CREATE POLICY "Anyone can create registry submissions" ON public.registry_submissions FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can view barcode submissions" ON public.barcode_submissions;
CREATE POLICY "Anyone can view barcode submissions" ON public.barcode_submissions FOR SELECT USING (true);
DROP POLICY IF EXISTS "Anyone can create barcode submissions" ON public.barcode_submissions;
CREATE POLICY "Anyone can create barcode submissions" ON public.barcode_submissions FOR INSERT WITH CHECK (true);

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS set_updated_at_rsvp ON public.rsvp_submissions;
CREATE TRIGGER set_updated_at_rsvp
  BEFORE UPDATE ON public.rsvp_submissions
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_confirmation ON public.confirmation_submissions;
CREATE TRIGGER set_updated_at_confirmation
  BEFORE UPDATE ON public.confirmation_submissions
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_reservation ON public.reservation_submissions;
CREATE TRIGGER set_updated_at_reservation
  BEFORE UPDATE ON public.reservation_submissions
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_registry ON public.registry_submissions;
CREATE TRIGGER set_updated_at_registry
  BEFORE UPDATE ON public.registry_submissions
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_barcode ON public.barcode_submissions;
CREATE TRIGGER set_updated_at_barcode
  BEFORE UPDATE ON public.barcode_submissions
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_rsvp_book_id ON public.rsvp_submissions(book_id);
CREATE INDEX IF NOT EXISTS idx_rsvp_email ON public.rsvp_submissions(guest_email);
CREATE INDEX IF NOT EXISTS idx_confirmation_book_id ON public.confirmation_submissions(book_id);
CREATE INDEX IF NOT EXISTS idx_confirmation_number ON public.confirmation_submissions(confirmation_number);
CREATE INDEX IF NOT EXISTS idx_reservation_book_id ON public.reservation_submissions(book_id);
CREATE INDEX IF NOT EXISTS idx_reservation_email ON public.reservation_submissions(email);
CREATE INDEX IF NOT EXISTS idx_registry_book_id ON public.registry_submissions(book_id);
CREATE INDEX IF NOT EXISTS idx_barcode_book_id ON public.barcode_submissions(book_id);
CREATE INDEX IF NOT EXISTS idx_barcode_ticket ON public.barcode_submissions(ticket_number);