-- Lovable scan: tasks_assignments missing UPDATE/DELETE for assignment creators.
-- Hosted DB may use public.tasks_assignments; this repo uses public.task_assignments.
-- PERMISSIVE OR with existing task-owner policies (20250925185139) when both apply.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'tasks_assignments'
  ) THEN
    ALTER TABLE public.tasks_assignments ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Users can update own task assignments" ON public.tasks_assignments;
    CREATE POLICY "Users can update own task assignments"
    ON public.tasks_assignments
    FOR UPDATE TO authenticated
    USING (created_by::text = auth.uid()::text)
    WITH CHECK (created_by::text = auth.uid()::text);

    DROP POLICY IF EXISTS "Users can delete own task assignments" ON public.tasks_assignments;
    CREATE POLICY "Users can delete own task assignments"
    ON public.tasks_assignments
    FOR DELETE TO authenticated
    USING (created_by::text = auth.uid()::text);

    REVOKE ALL ON public.tasks_assignments FROM anon;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'task_assignments'
  ) THEN
    ALTER TABLE public.task_assignments ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Users can update own task assignments" ON public.task_assignments;
    CREATE POLICY "Users can update own task assignments"
    ON public.task_assignments
    FOR UPDATE TO authenticated
    USING (created_by::text = auth.uid()::text)
    WITH CHECK (created_by::text = auth.uid()::text);

    DROP POLICY IF EXISTS "Users can delete own task assignments" ON public.task_assignments;
    CREATE POLICY "Users can delete own task assignments"
    ON public.task_assignments
    FOR DELETE TO authenticated
    USING (created_by::text = auth.uid()::text);

    REVOKE ALL ON public.task_assignments FROM anon;
  END IF;
END $$;

NOTIFY pgrst, 'reload schema';
