-- Simplified migration since events table is cleared
-- 1) Drop FK from events -> event_types if exists
ALTER TABLE public.events DROP CONSTRAINT IF EXISTS events_type_id_fkey;

-- 2) Drop self-FK on event_types (parent_id -> id) before dropping PK index
ALTER TABLE public.event_types DROP CONSTRAINT IF EXISTS event_types_parent_id_fkey;

-- 3) Drop the old UUID primary key from event_types
ALTER TABLE public.event_types DROP CONSTRAINT IF EXISTS event_types_pkey;

-- 4) Drop the old UUID id column from event_types
ALTER TABLE public.event_types DROP COLUMN id;

-- 5) Add new integer id column as primary key
ALTER TABLE public.event_types ADD COLUMN id SERIAL PRIMARY KEY;

-- 6) Change events.type_id from UUID to integer
ALTER TABLE public.events DROP COLUMN type_id;
ALTER TABLE public.events ADD COLUMN type_id integer;

-- 7) Re-add the foreign key constraint
ALTER TABLE public.events 
  ADD CONSTRAINT events_type_id_fkey 
  FOREIGN KEY (type_id) REFERENCES public.event_types(id);