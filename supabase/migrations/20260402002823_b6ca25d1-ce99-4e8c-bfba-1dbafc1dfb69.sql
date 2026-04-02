-- Fix 1: Drop plaintext magic link columns and functions

-- Drop functions first (they depend on the columns)
DROP FUNCTION IF EXISTS public.generate_magic_link(text);
DROP FUNCTION IF EXISTS public.validate_magic_link(text);

-- Drop all magic_link_* columns from Authorization table
ALTER TABLE public."Authorization"
  DROP COLUMN IF EXISTS magic_link_token,
  DROP COLUMN IF EXISTS magic_link_expires_at,
  DROP COLUMN IF EXISTS magic_link_sent_at,
  DROP COLUMN IF EXISTS magic_link_used,
  DROP COLUMN IF EXISTS magic_link_used_at,
  DROP COLUMN IF EXISTS magic_link_request_count,
  DROP COLUMN IF EXISTS magic_link_requested_ip,
  DROP COLUMN IF EXISTS magic_link_enabled;