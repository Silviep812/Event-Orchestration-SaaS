-- create_event_safe is a VIEW over public."Create Event", not a table. PostgreSQL does not
-- support CREATE POLICY on views; RLS applies to the base table. With security_invoker=true,
-- the invoker's session (auth.uid()) is used when evaluating those policies — same as querying
-- "Create Event" directly. security_barrier is the documented option for views used in RLS-style
-- access paths (see PostgreSQL CREATE VIEW notes).

ALTER VIEW IF EXISTS public.create_event_safe SET (security_invoker = true);
ALTER VIEW IF EXISTS public.create_event_safe SET (security_barrier = true);

REVOKE ALL ON public.create_event_safe FROM anon;
GRANT SELECT ON public.create_event_safe TO authenticated;

COMMENT ON VIEW public.create_event_safe IS
  'Sanitized subset of "Create Event" (no contact fields). Not a table: row access is enforced by RLS policies on public."Create Event" evaluated as the invoker (security_invoker).';

NOTIFY pgrst, 'reload schema';
