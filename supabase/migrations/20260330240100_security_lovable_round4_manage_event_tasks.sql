-- Lovable round 4 (2/4): "Manage Event Tasks" — stable FK (linked_event_id) when set; legacy theme match when NULL.
-- user_id vs auth.uid() compared as text (42883).

ALTER TABLE public."Manage Event Tasks"
  ADD COLUMN IF NOT EXISTS linked_event_id uuid REFERENCES public.events(id) ON DELETE SET NULL;

DO $$
DECLARE
  r RECORD;
  has_linked boolean;
  has_event_id boolean;
  has_cm boolean;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'Manage Event Tasks'
  ) THEN
    NULL;
  ELSE
    SELECT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'Manage Event Tasks' AND column_name = 'linked_event_id'
    ) INTO has_linked;

    SELECT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'Manage Event Tasks' AND column_name = 'event_id'
    ) INTO has_event_id;

    SELECT EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'cm_event_members'
    ) INTO has_cm;

    EXECUTE 'ALTER TABLE public."Manage Event Tasks" ENABLE ROW LEVEL SECURITY';

    FOR r IN
      SELECT policyname FROM pg_policies
      WHERE schemaname = 'public' AND tablename = 'Manage Event Tasks'
    LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public."Manage Event Tasks"', r.policyname);
    END LOOP;

    IF has_linked THEN
      IF has_cm THEN
        EXECUTE $p$
          CREATE POLICY met_select_scoped ON public."Manage Event Tasks"
          FOR SELECT TO authenticated
          USING (
            (public."Manage Event Tasks".linked_event_id IS NOT NULL AND (
              EXISTS (
                SELECT 1 FROM public.events e
                WHERE e.user_id::text = auth.uid()::text
                  AND e.id::text = public."Manage Event Tasks".linked_event_id::text
              )
              OR EXISTS (
                SELECT 1 FROM public.cm_event_members m
                WHERE m.user_id::text = auth.uid()::text
                  AND m.event_id::text = public."Manage Event Tasks".linked_event_id::text
              )
            ))
            OR (public."Manage Event Tasks".linked_event_id IS NULL AND (
                EXISTS (
                  SELECT 1 FROM public.events e
                  WHERE e.user_id::text = auth.uid()::text
                    AND e.title::text = public."Manage Event Tasks".event_theme::text
                )
                OR EXISTS (
                  SELECT 1 FROM public."Manage Event" me
                  WHERE me.event_user_id::text = auth.uid()::text
                    AND me.event_theme::text = public."Manage Event Tasks".event_theme::text
                )
                OR EXISTS (
                  SELECT 1 FROM public.events e
                  JOIN public.cm_event_members m ON m.event_id::text = e.id::text
                  WHERE m.user_id::text = auth.uid()::text
                    AND e.title::text = public."Manage Event Tasks".event_theme::text
                )
            ))
          )
        $p$;
        EXECUTE $p$
          CREATE POLICY met_insert_scoped ON public."Manage Event Tasks"
          FOR INSERT TO authenticated
          WITH CHECK (
            (public."Manage Event Tasks".linked_event_id IS NOT NULL AND (
              EXISTS (
                SELECT 1 FROM public.events e
                WHERE e.user_id::text = auth.uid()::text
                  AND e.id::text = public."Manage Event Tasks".linked_event_id::text
              )
              OR EXISTS (
                SELECT 1 FROM public.cm_event_members m
                WHERE m.user_id::text = auth.uid()::text
                  AND m.event_id::text = public."Manage Event Tasks".linked_event_id::text
              )
            ))
            OR (public."Manage Event Tasks".linked_event_id IS NULL AND (
                EXISTS (
                  SELECT 1 FROM public.events e
                  WHERE e.user_id::text = auth.uid()::text
                    AND e.title::text = public."Manage Event Tasks".event_theme::text
                )
                OR EXISTS (
                  SELECT 1 FROM public."Manage Event" me
                  WHERE me.event_user_id::text = auth.uid()::text
                    AND me.event_theme::text = public."Manage Event Tasks".event_theme::text
                )
                OR EXISTS (
                  SELECT 1 FROM public.events e
                  JOIN public.cm_event_members m ON m.event_id::text = e.id::text
                  WHERE m.user_id::text = auth.uid()::text
                    AND e.title::text = public."Manage Event Tasks".event_theme::text
                )
            ))
          )
        $p$;
        EXECUTE $p$
          CREATE POLICY met_update_scoped ON public."Manage Event Tasks"
          FOR UPDATE TO authenticated
          USING (
            (public."Manage Event Tasks".linked_event_id IS NOT NULL AND (
              EXISTS (
                SELECT 1 FROM public.events e
                WHERE e.user_id::text = auth.uid()::text
                  AND e.id::text = public."Manage Event Tasks".linked_event_id::text
              )
              OR EXISTS (
                SELECT 1 FROM public.cm_event_members m
                WHERE m.user_id::text = auth.uid()::text
                  AND m.event_id::text = public."Manage Event Tasks".linked_event_id::text
              )
            ))
            OR (public."Manage Event Tasks".linked_event_id IS NULL AND (
                EXISTS (
                  SELECT 1 FROM public.events e
                  WHERE e.user_id::text = auth.uid()::text
                    AND e.title::text = public."Manage Event Tasks".event_theme::text
                )
                OR EXISTS (
                  SELECT 1 FROM public."Manage Event" me
                  WHERE me.event_user_id::text = auth.uid()::text
                    AND me.event_theme::text = public."Manage Event Tasks".event_theme::text
                )
                OR EXISTS (
                  SELECT 1 FROM public.events e
                  JOIN public.cm_event_members m ON m.event_id::text = e.id::text
                  WHERE m.user_id::text = auth.uid()::text
                    AND e.title::text = public."Manage Event Tasks".event_theme::text
                )
            ))
          )
          WITH CHECK (
            (public."Manage Event Tasks".linked_event_id IS NOT NULL AND (
              EXISTS (
                SELECT 1 FROM public.events e
                WHERE e.user_id::text = auth.uid()::text
                  AND e.id::text = public."Manage Event Tasks".linked_event_id::text
              )
              OR EXISTS (
                SELECT 1 FROM public.cm_event_members m
                WHERE m.user_id::text = auth.uid()::text
                  AND m.event_id::text = public."Manage Event Tasks".linked_event_id::text
              )
            ))
            OR (public."Manage Event Tasks".linked_event_id IS NULL AND (
                EXISTS (
                  SELECT 1 FROM public.events e
                  WHERE e.user_id::text = auth.uid()::text
                    AND e.title::text = public."Manage Event Tasks".event_theme::text
                )
                OR EXISTS (
                  SELECT 1 FROM public."Manage Event" me
                  WHERE me.event_user_id::text = auth.uid()::text
                    AND me.event_theme::text = public."Manage Event Tasks".event_theme::text
                )
                OR EXISTS (
                  SELECT 1 FROM public.events e
                  JOIN public.cm_event_members m ON m.event_id::text = e.id::text
                  WHERE m.user_id::text = auth.uid()::text
                    AND e.title::text = public."Manage Event Tasks".event_theme::text
                )
            ))
          )
        $p$;
      ELSE
        EXECUTE $p$
          CREATE POLICY met_select_scoped ON public."Manage Event Tasks"
          FOR SELECT TO authenticated
          USING (
            (public."Manage Event Tasks".linked_event_id IS NOT NULL AND EXISTS (
              SELECT 1 FROM public.events e
              WHERE e.user_id::text = auth.uid()::text
                AND e.id::text = public."Manage Event Tasks".linked_event_id::text
            ))
            OR (public."Manage Event Tasks".linked_event_id IS NULL AND (
                EXISTS (
                  SELECT 1 FROM public.events e
                  WHERE e.user_id::text = auth.uid()::text
                    AND e.title::text = public."Manage Event Tasks".event_theme::text
                )
                OR EXISTS (
                  SELECT 1 FROM public."Manage Event" me
                  WHERE me.event_user_id::text = auth.uid()::text
                    AND me.event_theme::text = public."Manage Event Tasks".event_theme::text
                )
            ))
          )
        $p$;
        EXECUTE $p$
          CREATE POLICY met_insert_scoped ON public."Manage Event Tasks"
          FOR INSERT TO authenticated
          WITH CHECK (
            (public."Manage Event Tasks".linked_event_id IS NOT NULL AND EXISTS (
              SELECT 1 FROM public.events e
              WHERE e.user_id::text = auth.uid()::text
                AND e.id::text = public."Manage Event Tasks".linked_event_id::text
            ))
            OR (public."Manage Event Tasks".linked_event_id IS NULL AND (
                EXISTS (
                  SELECT 1 FROM public.events e
                  WHERE e.user_id::text = auth.uid()::text
                    AND e.title::text = public."Manage Event Tasks".event_theme::text
                )
                OR EXISTS (
                  SELECT 1 FROM public."Manage Event" me
                  WHERE me.event_user_id::text = auth.uid()::text
                    AND me.event_theme::text = public."Manage Event Tasks".event_theme::text
                )
            ))
          )
        $p$;
        EXECUTE $p$
          CREATE POLICY met_update_scoped ON public."Manage Event Tasks"
          FOR UPDATE TO authenticated
          USING (
            (public."Manage Event Tasks".linked_event_id IS NOT NULL AND EXISTS (
              SELECT 1 FROM public.events e
              WHERE e.user_id::text = auth.uid()::text
                AND e.id::text = public."Manage Event Tasks".linked_event_id::text
            ))
            OR (public."Manage Event Tasks".linked_event_id IS NULL AND (
                EXISTS (
                  SELECT 1 FROM public.events e
                  WHERE e.user_id::text = auth.uid()::text
                    AND e.title::text = public."Manage Event Tasks".event_theme::text
                )
                OR EXISTS (
                  SELECT 1 FROM public."Manage Event" me
                  WHERE me.event_user_id::text = auth.uid()::text
                    AND me.event_theme::text = public."Manage Event Tasks".event_theme::text
                )
            ))
          )
          WITH CHECK (
            (public."Manage Event Tasks".linked_event_id IS NOT NULL AND EXISTS (
              SELECT 1 FROM public.events e
              WHERE e.user_id::text = auth.uid()::text
                AND e.id::text = public."Manage Event Tasks".linked_event_id::text
            ))
            OR (public."Manage Event Tasks".linked_event_id IS NULL AND (
                EXISTS (
                  SELECT 1 FROM public.events e
                  WHERE e.user_id::text = auth.uid()::text
                    AND e.title::text = public."Manage Event Tasks".event_theme::text
                )
                OR EXISTS (
                  SELECT 1 FROM public."Manage Event" me
                  WHERE me.event_user_id::text = auth.uid()::text
                    AND me.event_theme::text = public."Manage Event Tasks".event_theme::text
                )
            ))
          )
        $p$;
      END IF;

      EXECUTE $p$
        CREATE POLICY met_delete_scoped ON public."Manage Event Tasks"
        FOR DELETE TO authenticated
        USING (
          (public."Manage Event Tasks".linked_event_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM public.events e
            WHERE e.user_id::text = auth.uid()::text
              AND e.id::text = public."Manage Event Tasks".linked_event_id::text
          ))
          OR (public."Manage Event Tasks".linked_event_id IS NULL AND (
              EXISTS (
                SELECT 1 FROM public.events e
                WHERE e.user_id::text = auth.uid()::text
                  AND e.title::text = public."Manage Event Tasks".event_theme::text
              )
              OR EXISTS (
                SELECT 1 FROM public."Manage Event" me
                WHERE me.event_user_id::text = auth.uid()::text
                  AND me.event_theme::text = public."Manage Event Tasks".event_theme::text
              )
          ))
        )
      $p$;

    ELSIF has_event_id THEN
      IF has_cm THEN
        EXECUTE $p$
          CREATE POLICY met_select_scoped ON public."Manage Event Tasks"
          FOR SELECT TO authenticated
          USING (
            EXISTS (
              SELECT 1 FROM public.events e
              WHERE e.user_id::text = auth.uid()::text
                AND e.id::text = public."Manage Event Tasks".event_id::text
            )
            OR EXISTS (
              SELECT 1 FROM public.cm_event_members m
              WHERE m.user_id::text = auth.uid()::text
                AND m.event_id::text = public."Manage Event Tasks".event_id::text
            )
          )
        $p$;
        EXECUTE $p$
          CREATE POLICY met_insert_scoped ON public."Manage Event Tasks"
          FOR INSERT TO authenticated
          WITH CHECK (
            EXISTS (
              SELECT 1 FROM public.events e
              WHERE e.user_id::text = auth.uid()::text
                AND e.id::text = public."Manage Event Tasks".event_id::text
            )
            OR EXISTS (
              SELECT 1 FROM public.cm_event_members m
              WHERE m.user_id::text = auth.uid()::text
                AND m.event_id::text = public."Manage Event Tasks".event_id::text
            )
          )
        $p$;
        EXECUTE $p$
          CREATE POLICY met_update_scoped ON public."Manage Event Tasks"
          FOR UPDATE TO authenticated
          USING (
            EXISTS (
              SELECT 1 FROM public.events e
              WHERE e.user_id::text = auth.uid()::text
                AND e.id::text = public."Manage Event Tasks".event_id::text
            )
            OR EXISTS (
              SELECT 1 FROM public.cm_event_members m
              WHERE m.user_id::text = auth.uid()::text
                AND m.event_id::text = public."Manage Event Tasks".event_id::text
            )
          )
          WITH CHECK (
            EXISTS (
              SELECT 1 FROM public.events e
              WHERE e.user_id::text = auth.uid()::text
                AND e.id::text = public."Manage Event Tasks".event_id::text
            )
            OR EXISTS (
              SELECT 1 FROM public.cm_event_members m
              WHERE m.user_id::text = auth.uid()::text
                AND m.event_id::text = public."Manage Event Tasks".event_id::text
            )
          )
        $p$;
      ELSE
        EXECUTE $p$
          CREATE POLICY met_select_scoped ON public."Manage Event Tasks"
          FOR SELECT TO authenticated
          USING (
            EXISTS (
              SELECT 1 FROM public.events e
              WHERE e.user_id::text = auth.uid()::text
                AND e.id::text = public."Manage Event Tasks".event_id::text
            )
          )
        $p$;
        EXECUTE $p$
          CREATE POLICY met_insert_scoped ON public."Manage Event Tasks"
          FOR INSERT TO authenticated
          WITH CHECK (
            EXISTS (
              SELECT 1 FROM public.events e
              WHERE e.user_id::text = auth.uid()::text
                AND e.id::text = public."Manage Event Tasks".event_id::text
            )
          )
        $p$;
        EXECUTE $p$
          CREATE POLICY met_update_scoped ON public."Manage Event Tasks"
          FOR UPDATE TO authenticated
          USING (
            EXISTS (
              SELECT 1 FROM public.events e
              WHERE e.user_id::text = auth.uid()::text
                AND e.id::text = public."Manage Event Tasks".event_id::text
            )
          )
          WITH CHECK (
            EXISTS (
              SELECT 1 FROM public.events e
              WHERE e.user_id::text = auth.uid()::text
                AND e.id::text = public."Manage Event Tasks".event_id::text
            )
          )
        $p$;
      END IF;

      EXECUTE $p$
        CREATE POLICY met_delete_scoped ON public."Manage Event Tasks"
        FOR DELETE TO authenticated
        USING (
          EXISTS (
            SELECT 1 FROM public.events e
            WHERE e.user_id::text = auth.uid()::text
              AND e.id::text = public."Manage Event Tasks".event_id::text
          )
        )
      $p$;

    ELSE
      IF has_cm THEN
        EXECUTE $p$
          CREATE POLICY met_select_scoped ON public."Manage Event Tasks"
          FOR SELECT TO authenticated
          USING (
            EXISTS (
              SELECT 1 FROM public.events e
              WHERE e.user_id::text = auth.uid()::text
                AND e.title::text = public."Manage Event Tasks".event_theme::text
            )
            OR EXISTS (
              SELECT 1 FROM public."Manage Event" me
              WHERE me.event_user_id::text = auth.uid()::text
                AND me.event_theme::text = public."Manage Event Tasks".event_theme::text
            )
            OR EXISTS (
              SELECT 1 FROM public.events e
              JOIN public.cm_event_members m ON m.event_id::text = e.id::text
              WHERE m.user_id::text = auth.uid()::text
                AND e.title::text = public."Manage Event Tasks".event_theme::text
            )
          )
        $p$;
        EXECUTE $p$
          CREATE POLICY met_insert_scoped ON public."Manage Event Tasks"
          FOR INSERT TO authenticated
          WITH CHECK (
            EXISTS (
              SELECT 1 FROM public.events e
              WHERE e.user_id::text = auth.uid()::text
                AND e.title::text = public."Manage Event Tasks".event_theme::text
            )
            OR EXISTS (
              SELECT 1 FROM public."Manage Event" me
              WHERE me.event_user_id::text = auth.uid()::text
                AND me.event_theme::text = public."Manage Event Tasks".event_theme::text
            )
            OR EXISTS (
              SELECT 1 FROM public.events e
              JOIN public.cm_event_members m ON m.event_id::text = e.id::text
              WHERE m.user_id::text = auth.uid()::text
                AND e.title::text = public."Manage Event Tasks".event_theme::text
            )
          )
        $p$;
        EXECUTE $p$
          CREATE POLICY met_update_scoped ON public."Manage Event Tasks"
          FOR UPDATE TO authenticated
          USING (
            EXISTS (
              SELECT 1 FROM public.events e
              WHERE e.user_id::text = auth.uid()::text
                AND e.title::text = public."Manage Event Tasks".event_theme::text
            )
            OR EXISTS (
              SELECT 1 FROM public."Manage Event" me
              WHERE me.event_user_id::text = auth.uid()::text
                AND me.event_theme::text = public."Manage Event Tasks".event_theme::text
            )
            OR EXISTS (
              SELECT 1 FROM public.events e
              JOIN public.cm_event_members m ON m.event_id::text = e.id::text
              WHERE m.user_id::text = auth.uid()::text
                AND e.title::text = public."Manage Event Tasks".event_theme::text
            )
          )
          WITH CHECK (
            EXISTS (
              SELECT 1 FROM public.events e
              WHERE e.user_id::text = auth.uid()::text
                AND e.title::text = public."Manage Event Tasks".event_theme::text
            )
            OR EXISTS (
              SELECT 1 FROM public."Manage Event" me
              WHERE me.event_user_id::text = auth.uid()::text
                AND me.event_theme::text = public."Manage Event Tasks".event_theme::text
            )
            OR EXISTS (
              SELECT 1 FROM public.events e
              JOIN public.cm_event_members m ON m.event_id::text = e.id::text
              WHERE m.user_id::text = auth.uid()::text
                AND e.title::text = public."Manage Event Tasks".event_theme::text
            )
          )
        $p$;
      ELSE
        EXECUTE $p$
          CREATE POLICY met_select_scoped ON public."Manage Event Tasks"
          FOR SELECT TO authenticated
          USING (
            EXISTS (
              SELECT 1 FROM public.events e
              WHERE e.user_id::text = auth.uid()::text
                AND e.title::text = public."Manage Event Tasks".event_theme::text
            )
            OR EXISTS (
              SELECT 1 FROM public."Manage Event" me
              WHERE me.event_user_id::text = auth.uid()::text
                AND me.event_theme::text = public."Manage Event Tasks".event_theme::text
            )
          )
        $p$;
        EXECUTE $p$
          CREATE POLICY met_insert_scoped ON public."Manage Event Tasks"
          FOR INSERT TO authenticated
          WITH CHECK (
            EXISTS (
              SELECT 1 FROM public.events e
              WHERE e.user_id::text = auth.uid()::text
                AND e.title::text = public."Manage Event Tasks".event_theme::text
            )
            OR EXISTS (
              SELECT 1 FROM public."Manage Event" me
              WHERE me.event_user_id::text = auth.uid()::text
                AND me.event_theme::text = public."Manage Event Tasks".event_theme::text
            )
          )
        $p$;
        EXECUTE $p$
          CREATE POLICY met_update_scoped ON public."Manage Event Tasks"
          FOR UPDATE TO authenticated
          USING (
            EXISTS (
              SELECT 1 FROM public.events e
              WHERE e.user_id::text = auth.uid()::text
                AND e.title::text = public."Manage Event Tasks".event_theme::text
            )
            OR EXISTS (
              SELECT 1 FROM public."Manage Event" me
              WHERE me.event_user_id::text = auth.uid()::text
                AND me.event_theme::text = public."Manage Event Tasks".event_theme::text
            )
          )
          WITH CHECK (
            EXISTS (
              SELECT 1 FROM public.events e
              WHERE e.user_id::text = auth.uid()::text
                AND e.title::text = public."Manage Event Tasks".event_theme::text
            )
            OR EXISTS (
              SELECT 1 FROM public."Manage Event" me
              WHERE me.event_user_id::text = auth.uid()::text
                AND me.event_theme::text = public."Manage Event Tasks".event_theme::text
            )
          )
        $p$;
      END IF;

      EXECUTE $p$
        CREATE POLICY met_delete_scoped ON public."Manage Event Tasks"
        FOR DELETE TO authenticated
        USING (
          EXISTS (
            SELECT 1 FROM public.events e
            WHERE e.user_id::text = auth.uid()::text
              AND e.title::text = public."Manage Event Tasks".event_theme::text
          )
          OR EXISTS (
            SELECT 1 FROM public."Manage Event" me
            WHERE me.event_user_id::text = auth.uid()::text
              AND me.event_theme::text = public."Manage Event Tasks".event_theme::text
          )
        )
      $p$;
    END IF;
  END IF;
END $$;
