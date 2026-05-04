-- Rename serv_vendor_rental_types -> serv_vendor_rental_assignments when the old
-- name still exists and the new name is not taken (remote may already have renamed).
DO $$
BEGIN
  IF to_regclass('public.serv_vendor_rental_types') IS NOT NULL
     AND to_regclass('public.serv_vendor_rental_assignments') IS NULL THEN
    ALTER TABLE public.serv_vendor_rental_types RENAME TO serv_vendor_rental_assignments;
  END IF;
END $$;
