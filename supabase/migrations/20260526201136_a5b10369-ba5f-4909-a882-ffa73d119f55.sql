
SET session_replication_role = 'replica';

UPDATE public.tasks
SET assigned_to = '4a62ca71-a7af-4765-b7df-cceb02d1e30e',
    assigned_to_display_name = 'Demo Collaborator',
    updated_at = now()
WHERE id IN (
  '9c93f3fe-aa72-4273-8f25-0960a56ae889',
  '9c7d767f-fc55-443d-a624-1c1354b2975c',
  'd4d2d213-3466-48de-b368-72355b4ed869'
);

UPDATE public.tasks
SET assigned_to = 'afecfd42-68ff-42d9-ba7f-8da07c8b95d4',
    assigned_to_display_name = 'Demo Viewer',
    updated_at = now()
WHERE id IN (
  'd473e6d8-9f00-4531-9d1e-e08713b85516',
  '5e378354-73f9-472a-9b3b-c6c84efc2da0'
);

INSERT INTO public.task_assignments (task_id, user_id, created_by)
SELECT t.id, t.assigned_to, '06a72aed-0880-4f3a-b5c9-261d11c67c24'
FROM public.tasks t
WHERE t.event_id = 'aa6a0127-4fcd-4bf5-8b70-1f6ef4367f39'
  AND t.assigned_to IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.task_assignments a
    WHERE a.task_id = t.id AND a.user_id = t.assigned_to
  );

SET session_replication_role = 'origin';
