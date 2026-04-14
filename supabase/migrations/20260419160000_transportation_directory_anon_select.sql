-- Transportation directory: allow SELECT with the anon API key (no JWT) in addition to authenticated.
-- Complements 20260328120000_directory_tables_rls.sql (authenticated-only) so catalog reads still work
-- if the client request runs before the session is attached or in tooling that uses only the anon key.

DROP POLICY IF EXISTS "Anon can view transportations (directory)" ON public.transportations;
CREATE POLICY "Anon can view transportations (directory)"
ON public.transportations FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "Anon can view transportation_types (directory)" ON public.transportation_types;
CREATE POLICY "Anon can view transportation_types (directory)"
ON public.transportation_types FOR SELECT TO anon USING (true);

NOTIFY pgrst, 'reload schema';
