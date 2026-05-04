-- Create table for private residence responses
CREATE TABLE IF NOT EXISTS public.private_residence_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  event_id uuid,
  street_address text NOT NULL,
  email text NOT NULL,
  phone_number text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.private_residence_responses ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Users can only view and manage their own responses
DROP POLICY IF EXISTS "Users can view their own responses" ON public.private_residence_responses;
CREATE POLICY "Users can view their own responses"
ON public.private_residence_responses
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert their own responses" ON public.private_residence_responses;
CREATE POLICY "Users can insert their own responses"
ON public.private_residence_responses
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own responses" ON public.private_residence_responses;
CREATE POLICY "Users can update their own responses"
ON public.private_residence_responses
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete their own responses" ON public.private_residence_responses;
CREATE POLICY "Users can delete their own responses"
ON public.private_residence_responses
FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_private_residence_responses_updated_at ON public.private_residence_responses;
CREATE TRIGGER update_private_residence_responses_updated_at
BEFORE UPDATE ON public.private_residence_responses
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();