-- Trial signup attribution for marketing_conversions (dashboard funnel / KPIs)
ALTER TABLE public.marketing_conversions
  ADD COLUMN IF NOT EXISTS auth_user_id uuid REFERENCES auth.users (id) ON DELETE SET NULL;

COMMENT ON COLUMN public.marketing_conversions.auth_user_id IS
  'When set, ties a conversion row to the auth user (e.g. one Trial signup per account).';

CREATE UNIQUE INDEX IF NOT EXISTS marketing_conversions_one_trial_per_auth_user
  ON public.marketing_conversions (auth_user_id)
  WHERE conversion_type = 'Trial signup' AND auth_user_id IS NOT NULL;

DROP POLICY IF EXISTS marketing_conversions_own_trial_insert ON public.marketing_conversions;
CREATE POLICY marketing_conversions_own_trial_insert
  ON public.marketing_conversions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    conversion_type = 'Trial signup'
    AND auth_user_id IS NOT NULL
    AND auth_user_id = auth.uid()
  );
