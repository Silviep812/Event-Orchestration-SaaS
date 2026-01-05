--
-- PostgreSQL database dump
--


-- Dumped from database version 17.6
-- Dumped by pg_dump version 18.1

-- Started on 2025-12-22 18:43:21

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 37 (class 2615 OID 129498)
-- Name: Cm_Event_Orchestration; Type: SCHEMA; Schema: -; Owner: postgres
--

CREATE SCHEMA "Cm_Event_Orchestration";


ALTER SCHEMA "Cm_Event_Orchestration" OWNER TO postgres;

--
-- TOC entry 23 (class 2615 OID 16416)
-- Name: auth; Type: SCHEMA; Schema: -; Owner: supabase_admin
--

CREATE SCHEMA cm;


ALTER SCHEMA cm OWNER TO postgres;

--
-- TOC entry 104 (class 2615 OID 133286)
-- Name: cm_activity; Type: SCHEMA; Schema: -; Owner: postgres
--

CREATE SCHEMA cm_activity;


ALTER SCHEMA cm_activity OWNER TO postgres;

--
-- TOC entry 36 (class 2615 OID 129443)
-- Name: event_orchestration_saas; Type: SCHEMA; Schema: -; Owner: postgres
--

CREATE SCHEMA event_orchestration_saas;


ALTER SCHEMA event_orchestration_saas OWNER TO postgres;

--
-- TOC entry 27 (class 2615 OID 16417)
-- Name: extensions; Type: SCHEMA; Schema: -; Owner: postgres
--


--
CREATE TYPE public.app_role AS ENUM (
    'host',
    'organizer',
    'event_planner',
    'venue_owner',
    'hospitality_provider',
    'manager'
);


ALTER TYPE public.app_role OWNER TO postgres;

--
-- TOC entry 1447 (class 1247 OID 33276)
-- Name: budget_category; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.budget_category AS ENUM (
    'venue',
    'catering',
    'entertainment',
    'decorations',
    'transportation',
    'marketing',
    'supplies',
    'services',
    'other',
    'hospitality',
    'misc',
    'vendors'
);


ALTER TYPE public.budget_category OWNER TO postgres;

--
-- TOC entry 1888 (class 1247 OID 129447)
-- Name: change_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.change_status AS ENUM (
    'pending',
    'approved',
    'rejected',
    'applied',
    'cancelled'
);


ALTER TYPE public.change_status OWNER TO postgres;

--
-- TOC entry 1891 (class 1247 OID 129458)
-- Name: change_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.change_type AS ENUM (
    'task_update',
    'event_update',
    'resource_update',
    'vendor_update',
    'workflow_update',
    'note'
);


ALTER TYPE public.change_type OWNER TO postgres;

--
-- TOC entry 1450 (class 1247 OID 83777)
-- Name: event_status_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.event_status_enum AS ENUM (
    'pending',
    'in_progress',
    'completed',
    'cancelled'
);


ALTER TYPE public.event_status_enum OWNER TO postgres;

--
-- TOC entry 1453 (class 1247 OID 100033)
-- Name: permission_level; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.permission_level AS ENUM (
    'admin',
    'coordinator',
    'viewer'
);


ALTER TYPE public.permission_level OWNER TO postgres;

--
-- TOC entry 1456 (class 1247 OID 33244)
-- Name: task_priority; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.task_priority AS ENUM (
    'low',
    'medium',
    'high',
    'urgent'
);


ALTER TYPE public.task_priority OWNER TO postgres;

--
-- TOC entry 1459 (class 1247 OID 33233)
-- Name: task_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.task_status AS ENUM (
    'not_started',
    'in_progress',
    'completed',
    'on_hold',
    'cancelled'
);


ALTER TYPE public.task_status OWNER TO postgres;

--
CREATE FUNCTION "Cm_Event_Orchestration".apply_change(p_change_id uuid) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  v_event_id uuid;
  v_status change_status;
BEGIN
  SELECT event_id, status INTO v_event_id, v_status
  FROM "Cm_Event_Orchestration".change_requests
  WHERE id = p_change_id;

  IF v_event_id IS NULL THEN
    RAISE EXCEPTION 'Change request has no event_id; cannot apply' USING ERRCODE = '22023';
  END IF;

  IF v_status <> 'approved' THEN
    RAISE EXCEPTION 'Only approved changes can be applied' USING ERRCODE = '22023';
  END IF;

  IF NOT "Cm_Event_Orchestration".can_approve(v_event_id) THEN
    RAISE EXCEPTION 'Not authorized to apply for this event' USING ERRCODE = '42501';
  END IF;

  UPDATE "Cm_Event_Orchestration".change_requests
     SET status = 'applied',
         applied_at = now(),
         updated_at = now()
   WHERE id = p_change_id
     AND status = 'approved';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No approved change found with id %', p_change_id USING ERRCODE = 'P0002';
  END IF;

  INSERT INTO "Cm_Event_Orchestration".change_events (change_request_id, action, created_by)
  VALUES (p_change_id, 'applied', auth.uid());
END;
$$;


ALTER FUNCTION "Cm_Event_Orchestration".apply_change(p_change_id uuid) OWNER TO postgres;

--
-- TOC entry 629 (class 1255 OID 129542)
-- Name: approve_change(uuid); Type: FUNCTION; Schema: Cm_Event_Orchestration; Owner: postgres
--

CREATE FUNCTION "Cm_Event_Orchestration".approve_change(p_change_id uuid) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  v_event_id uuid;
BEGIN
  SELECT event_id INTO v_event_id
  FROM "Cm_Event_Orchestration".change_requests
  WHERE id = p_change_id;

  IF v_event_id IS NULL THEN
    RAISE EXCEPTION 'Change request has no event_id; cannot approve' USING ERRCODE = '22023';
  END IF;

  IF NOT "Cm_Event_Orchestration".can_approve(v_event_id) THEN
    RAISE EXCEPTION 'Not authorized to approve for this event' USING ERRCODE = '42501';
  END IF;

  UPDATE "Cm_Event_Orchestration".change_requests
     SET status = 'approved',
         approver_id = auth.uid(),
         approved_at = now(),
         updated_at = now()
   WHERE id = p_change_id
     AND status = 'pending';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No pending change found with id %', p_change_id USING ERRCODE = 'P0002';
  END IF;

  INSERT INTO "Cm_Event_Orchestration".change_events (change_request_id, action, created_by)
  VALUES (p_change_id, 'approved', auth.uid());
END;
$$;


ALTER FUNCTION "Cm_Event_Orchestration".approve_change(p_change_id uuid) OWNER TO postgres;

--
-- TOC entry 571 (class 1255 OID 129538)
-- Name: broadcast_change_requests(); Type: FUNCTION; Schema: Cm_Event_Orchestration; Owner: postgres
--

CREATE FUNCTION "Cm_Event_Orchestration".broadcast_change_requests() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  topic text;
  evt uuid;
BEGIN
  evt := COALESCE(NEW.event_id, OLD.event_id);
  topic := 'event:' || COALESCE(evt::text, 'none') || ':changes';

  PERFORM realtime.broadcast_changes(
    topic,
    TG_OP,
    TG_OP,
    TG_TABLE_NAME,
    TG_TABLE_SCHEMA,
    NEW,
    OLD
  );
  RETURN COALESCE(NEW, OLD);
END;
$$;


ALTER FUNCTION "Cm_Event_Orchestration".broadcast_change_requests() OWNER TO postgres;

--
-- TOC entry 737 (class 1255 OID 129541)
-- Name: can_approve(uuid); Type: FUNCTION; Schema: Cm_Event_Orchestration; Owner: postgres
--

CREATE FUNCTION "Cm_Event_Orchestration".can_approve(p_event_id uuid) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.event_id = p_event_id
      AND ur.permission_level IN ('admin','coordinator')
  );
$$;


ALTER FUNCTION "Cm_Event_Orchestration".can_approve(p_event_id uuid) OWNER TO postgres;

--
-- TOC entry 639 (class 1255 OID 129544)
-- Name: cancel_change(uuid); Type: FUNCTION; Schema: Cm_Event_Orchestration; Owner: postgres
--

CREATE FUNCTION "Cm_Event_Orchestration".cancel_change(p_change_id uuid) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  v_event_id uuid;
  v_requested_by uuid;
  v_status change_status;
  v_uid uuid := auth.uid();
  v_is_admin boolean;
BEGIN
  SELECT event_id, requested_by, status
    INTO v_event_id, v_requested_by, v_status
  FROM "Cm_Event_Orchestration".change_requests
  WHERE id = p_change_id;

  IF v_status IS NULL THEN
    RAISE EXCEPTION 'Change not found: %', p_change_id USING ERRCODE = 'P0002';
  END IF;

  IF v_status <> 'pending' THEN
    RAISE EXCEPTION 'Only pending changes can be cancelled' USING ERRCODE = '22023';
  END IF;

  v_is_admin := COALESCE("Cm_Event_Orchestration".can_approve(v_event_id), false);

  IF v_uid <> v_requested_by AND NOT v_is_admin THEN
    RAISE EXCEPTION 'Not authorized to cancel this request' USING ERRCODE = '42501';
  END IF;

  UPDATE "Cm_Event_Orchestration".change_requests
     SET status = 'cancelled',
         updated_at = now()
   WHERE id = p_change_id
     AND status = 'pending';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No pending change found with id %', p_change_id USING ERRCODE = 'P0002';
  END IF;

  INSERT INTO "Cm_Event_Orchestration".change_events (change_request_id, action, created_by)
  VALUES (p_change_id, 'updated', v_uid);
END;
$$;


ALTER FUNCTION "Cm_Event_Orchestration".cancel_change(p_change_id uuid) OWNER TO postgres;

--
CREATE FUNCTION cm_activity.log_event() RETURNS trigger
    LANGUAGE plpgsql
    AS $$ 

BEGIN 

INSERT INTO cm_activity.audit_log(entity, entity_id, action, 

user_id, context, changes) 

VALUES (TG_TABLE_NAME, NEW.id, TG_OP, auth.uid(), 

current_setting('app.context', true), row_to_json(NEW)); 

RETURN NEW; 

END; 

$$;


ALTER FUNCTION cm_activity.log_event() OWNER TO postgres;

--
-- TOC entry 651 (class 1255 OID 133407)
-- Name: refresh_daily_activity(); Type: FUNCTION; Schema: cm_activity; Owner: postgres
--

CREATE FUNCTION cm_activity.refresh_daily_activity() RETURNS void
    LANGUAGE plpgsql
    AS $$ 

BEGIN 

  REFRESH MATERIALIZED VIEW CONCURRENTLY 

cm_activity.mv_daily_activity; 

END; 

$$;


ALTER FUNCTION cm_activity.refresh_daily_activity() OWNER TO postgres;

--
-- TOC entry 716 (class 1255 OID 129669)
-- Name: broadcast_change_requests(); Type: FUNCTION; Schema: event_orchestration_saas; Owner: postgres
--

CREATE FUNCTION event_orchestration_saas.broadcast_change_requests() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  topic text;
  evt uuid;
BEGIN
  evt := COALESCE(NEW.event_id, OLD.event_id);
  topic := 'event:' || COALESCE(evt::text, 'none') || ':changes';

  PERFORM realtime.broadcast_changes(
    topic,
    TG_OP,
    TG_OP,
    TG_TABLE_NAME,
    TG_TABLE_SCHEMA,
    NEW,
    OLD
  );
  RETURN COALESCE(NEW, OLD);
END;
$$;


ALTER FUNCTION event_orchestration_saas.broadcast_change_requests() OWNER TO postgres;

--









--
CREATE FUNCTION public.apply_change_request_wr(change_request_id uuid) RETURNS void
    LANGUAGE plpgsql
    AS $$
DECLARE
  ev uuid;
BEGIN
  SELECT event_id INTO ev
  FROM event_orchestration_saas.change_requests
  WHERE id = change_request_id;

  IF ev IS NULL THEN
    RAISE EXCEPTION 'No event found for change_request %', change_request_id USING ERRCODE = '23514';
  END IF;

  PERFORM public.assert_user_in_event(ev);
  PERFORM "Cm_Event_Orchestration".apply_change(change_request_id);
END;
$$;


ALTER FUNCTION public.apply_change_request_wr(change_request_id uuid) OWNER TO postgres;

--
-- TOC entry 673 (class 1255 OID 129682)
-- Name: approve_change_request_wr(uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.approve_change_request_wr(change_request_id uuid) RETURNS void
    LANGUAGE plpgsql
    AS $$
DECLARE
  ev uuid;
BEGIN
  SELECT event_id INTO ev
  FROM event_orchestration_saas.change_requests
  WHERE id = change_request_id;

  IF ev IS NULL THEN
    RAISE EXCEPTION 'No event found for change_request %', change_request_id USING ERRCODE = '23514';
  END IF;

  PERFORM public.assert_user_in_event(ev);
  PERFORM "Cm_Event_Orchestration".approve_change(change_request_id);
END;
$$;


ALTER FUNCTION public.approve_change_request_wr(change_request_id uuid) OWNER TO postgres;

--
-- TOC entry 778 (class 1255 OID 16537)
-- Name: are_team_members(uuid, uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.are_team_members(_user_id_1 uuid, _user_id_2 uuid) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.team_assignments ta1
    JOIN public.team_assignments ta2 ON ta1.team_id = ta2.team_id
    WHERE ta1.user_id = _user_id_1
      AND ta2.user_id = _user_id_2
  )
$$;


ALTER FUNCTION public.are_team_members(_user_id_1 uuid, _user_id_2 uuid) OWNER TO postgres;

--
-- TOC entry 751 (class 1255 OID 129681)
-- Name: assert_user_in_event(uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.assert_user_in_event(p_event_id uuid) RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = (SELECT auth.uid())
      AND ur.event_id = p_event_id
  ) THEN
    RAISE EXCEPTION 'User % is not a member of event %', (SELECT auth.uid()), p_event_id USING ERRCODE = '42501';
  END IF;
END;
$$;


ALTER FUNCTION public.assert_user_in_event(p_event_id uuid) OWNER TO postgres;

--
-- TOC entry 788 (class 1255 OID 129684)
-- Name: cancel_change_request_wr(uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.cancel_change_request_wr(change_request_id uuid) RETURNS void
    LANGUAGE plpgsql
    AS $$
DECLARE
  ev uuid;
BEGIN
  SELECT event_id INTO ev
  FROM event_orchestration_saas.change_requests
  WHERE id = change_request_id;

  IF ev IS NULL THEN
    RAISE EXCEPTION 'No event found for change_request %', change_request_id USING ERRCODE = '23514';
  END IF;

  PERFORM public.assert_user_in_event(ev);
  PERFORM "Cm_Event_Orchestration".cancel_change(change_request_id);
END;
$$;


ALTER FUNCTION public.cancel_change_request_wr(change_request_id uuid) OWNER TO postgres;

--
-- TOC entry 586 (class 1255 OID 16538)
-- Name: execute_raw_sql(text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.execute_raw_sql(query text) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    result JSONB;
BEGIN
    EXECUTE query INTO result;
    RETURN result;
END;
$$;


ALTER FUNCTION public.execute_raw_sql(query text) OWNER TO postgres;

--
-- TOC entry 560 (class 1255 OID 16539)
-- Name: get_my_events_safe(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_my_events_safe() RETURNS TABLE(event_start_date date, event_end_date date, event_start_time timestamp with time zone, event_end_time timestamp with time zone, event_theme text[], booking_type text[], event_collaborators text[], event_description text, event_location text[], is_venue_available boolean, is_booking_available boolean, is_service_rental_available boolean, service_rental_type text, supplier_type text[], is_transportation_available boolean, is_supply_available boolean, transportation_type text, event_budget numeric, notification text, is_service_type_availabe boolean, resources text[], priority text[], created_at timestamp with time zone)
    LANGUAGE sql STABLE
    SET search_path TO 'public'
    AS $$
  SELECT 
    event_start_date,
    event_end_date,
    event_start_time,
    event_end_time,
    event_theme,
    booking_type,
    event_collaborators,
    event_description,
    event_location,
    is_venue_available,
    is_booking_available,
    is_service_rental_available,
    service_rental_type,
    supplier_type,
    is_transportation_available,
    is_supply_available,
    transportation_type,
    event_budget,
    notification,
    is_service_type_availabe,
    resources,
    priority,
    created_at
  FROM "Create Event"
  WHERE userid = (auth.uid())::text;
$$;


ALTER FUNCTION public.get_my_events_safe() OWNER TO postgres;

--
-- TOC entry 646 (class 1255 OID 16540)
-- Name: get_user_directory_safe(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_user_directory_safe() RETURNS TABLE(userid uuid, user_name text, contact_name text)
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT u.userid, u.user_name, u.contact_name
  FROM public."User" u
  WHERE has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'event_manager');
$$;


ALTER FUNCTION public.get_user_directory_safe() OWNER TO postgres;

--
-- TOC entry 667 (class 1255 OID 16541)
-- Name: handle_new_user_profile(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.handle_new_user_profile() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data ->> 'full_name', 'User'));
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.handle_new_user_profile() OWNER TO postgres;

--
-- TOC entry 795 (class 1255 OID 16542)
-- Name: handle_task_estimate_change(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.handle_task_estimate_change() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  task_record RECORD;
  dependent_task RECORD;
  total_time_change NUMERIC := 0;
BEGIN
  -- Calculate the time difference
  IF TG_OP = 'UPDATE' AND OLD.estimated_hours IS DISTINCT FROM NEW.estimated_hours THEN
    total_time_change := COALESCE(NEW.estimated_hours, 0) - COALESCE(OLD.estimated_hours, 0);
    
    -- Log the change
    PERFORM public.log_change(
      'task'::text,
      NEW.id,
      'estimate_updated'::text,
      'estimated_hours'::text,
      OLD.estimated_hours::text,
      NEW.estimated_hours::text,
      format('Task estimate changed from %s to %s hours (difference: %s)', 
             COALESCE(OLD.estimated_hours::text, 'null'), 
             COALESCE(NEW.estimated_hours::text, 'null'),
             total_time_change)
    );
    
    -- Update dependent tasks (tasks with later due dates in the same event)
    FOR dependent_task IN 
      SELECT id, title, due_date, estimated_hours
      FROM public.tasks 
      WHERE event_id = NEW.event_id 
        AND id != NEW.id 
        AND due_date > NEW.due_date
      ORDER BY due_date ASC
    LOOP
      -- Shift dependent task due dates if the estimate increased significantly (>2 hours)
      IF total_time_change > 2 THEN
        UPDATE public.tasks 
        SET due_date = due_date + (total_time_change || ' hours')::interval,
            updated_at = now()
        WHERE id = dependent_task.id;
        
        -- Log the dependent task update
        PERFORM public.log_change(
          'task'::text,
          dependent_task.id,
          'timeline_adjusted'::text,
          'due_date'::text,
          dependent_task.due_date::text,
          (dependent_task.due_date + (total_time_change || ' hours')::interval)::text,
          format('Due date adjusted by %s hours due to upstream task estimate change', total_time_change)
        );
      END IF;
    END LOOP;
    
    -- Notify coordinators about the change
    PERFORM public.notify_coordinators(
      format('Task Estimate Changed: %s', NEW.title),
      format('Task "%s" estimate changed from %s to %s hours. Dependent tasks have been automatically adjusted.',
             NEW.title,
             COALESCE(OLD.estimated_hours::text, 'unset'),
             COALESCE(NEW.estimated_hours::text, 'unset')),
      'task_estimate_change'::text,
      'task'::text,
      NEW.id
    );
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.handle_task_estimate_change() OWNER TO postgres;

--
-- TOC entry 787 (class 1255 OID 16543)
-- Name: handle_updated_at(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.handle_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.handle_updated_at() OWNER TO postgres;

--
-- TOC entry 789 (class 1255 OID 16544)
-- Name: has_min_permission_level(uuid, public.permission_level, uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.has_min_permission_level(_user_id uuid, _level public.permission_level, _event_id uuid DEFAULT NULL::uuid) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND (_event_id IS NULL OR event_id = _event_id OR event_id IS NULL)
      AND (
        permission_level = _level OR
        (_level = 'viewer' AND permission_level IN ('coordinator', 'admin')) OR
        (_level = 'coordinator' AND permission_level = 'admin')
      )
  )
$$;


ALTER FUNCTION public.has_min_permission_level(_user_id uuid, _level public.permission_level, _event_id uuid) OWNER TO postgres;

--
-- TOC entry 593 (class 1255 OID 16545)
-- Name: has_permission_level(uuid, public.permission_level, uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.has_permission_level(_user_id uuid, _level public.permission_level, _event_id uuid DEFAULT NULL::uuid) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND permission_level = _level
      AND (_event_id IS NULL OR event_id = _event_id OR event_id IS NULL)
  )
$$;


ALTER FUNCTION public.has_permission_level(_user_id uuid, _level public.permission_level, _event_id uuid) OWNER TO postgres;

--
-- TOC entry 728 (class 1255 OID 16546)
-- Name: has_role(uuid, public.app_role); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.has_role(_user_id uuid, _role public.app_role) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;


ALTER FUNCTION public.has_role(_user_id uuid, _role public.app_role) OWNER TO postgres;

--
-- TOC entry 631 (class 1255 OID 16547)
-- Name: is_team_admin(uuid, uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.is_team_admin(_user_id uuid, _team_id uuid) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.team_assignments
    WHERE user_id = _user_id
      AND team_id = _team_id
      AND team_admin = true
  );
$$;


ALTER FUNCTION public.is_team_admin(_user_id uuid, _team_id uuid) OWNER TO postgres;

--
-- TOC entry 679 (class 1255 OID 16548)
-- Name: is_team_member(uuid, uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.is_team_member(_user_id uuid, _team_id uuid) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.team_assignments
    WHERE user_id = _user_id
      AND team_id = _team_id
  );
$$;


ALTER FUNCTION public.is_team_member(_user_id uuid, _team_id uuid) OWNER TO postgres;

--
-- TOC entry 543 (class 1255 OID 16549)
-- Name: log_budget_item_changes(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.log_budget_item_changes() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  -- Log updates to specific fields
  IF TG_OP = 'UPDATE' THEN
    IF OLD.item_name IS DISTINCT FROM NEW.item_name THEN
      PERFORM public.log_change('budget_item', NEW.id, 'updated', 'item_name', OLD.item_name, NEW.item_name);
    END IF;
    
    IF OLD.description IS DISTINCT FROM NEW.description THEN
      PERFORM public.log_change('budget_item', NEW.id, 'updated', 'description', OLD.description, NEW.description);
    END IF;
    
    IF OLD.category IS DISTINCT FROM NEW.category THEN
      PERFORM public.log_change('budget_item', NEW.id, 'updated', 'category', OLD.category::text, NEW.category::text);
    END IF;
    
    IF OLD.estimated_cost IS DISTINCT FROM NEW.estimated_cost THEN
      PERFORM public.log_change('budget_item', NEW.id, 'updated', 'estimated_cost', OLD.estimated_cost::text, NEW.estimated_cost::text);
    END IF;
    
    IF OLD.actual_cost IS DISTINCT FROM NEW.actual_cost THEN
      PERFORM public.log_change('budget_item', NEW.id, 'updated', 'actual_cost', OLD.actual_cost::text, NEW.actual_cost::text);
    END IF;
    
    IF OLD.payment_status IS DISTINCT FROM NEW.payment_status THEN
      PERFORM public.log_change('budget_item', NEW.id, 'updated', 'payment_status', OLD.payment_status, NEW.payment_status);
    END IF;
    
    IF OLD.vendor_name IS DISTINCT FROM NEW.vendor_name THEN
      PERFORM public.log_change('budget_item', NEW.id, 'updated', 'vendor_name', OLD.vendor_name, NEW.vendor_name);
    END IF;
    
    IF OLD.vendor_contact IS DISTINCT FROM NEW.vendor_contact THEN
      PERFORM public.log_change('budget_item', NEW.id, 'updated', 'vendor_contact', OLD.vendor_contact, NEW.vendor_contact);
    END IF;
    
    IF OLD.payment_due_date IS DISTINCT FROM NEW.payment_due_date THEN
      PERFORM public.log_change('budget_item', NEW.id, 'updated', 'payment_due_date', OLD.payment_due_date::text, NEW.payment_due_date::text);
    END IF;
    
    IF OLD.archived IS DISTINCT FROM NEW.archived THEN
      PERFORM public.log_change('budget_item', NEW.id, 'updated', 'archived', OLD.archived::text, NEW.archived::text);
    END IF;
  ELSIF TG_OP = 'INSERT' THEN
    PERFORM public.log_change('budget_item', NEW.id, 'created', NULL, NULL, NULL, 
      format('Budget item "%s" created for category %s', NEW.item_name, NEW.category));
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM public.log_change('budget_item', OLD.id, 'deleted', NULL, NULL, NULL,
      format('Budget item "%s" deleted', OLD.item_name));
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;


ALTER FUNCTION public.log_budget_item_changes() OWNER TO postgres;

--
-- TOC entry 614 (class 1255 OID 16550)
-- Name: log_change(text, uuid, text, text, text, text, text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.log_change(p_entity_type text, p_entity_id uuid, p_action text, p_field_name text DEFAULT NULL::text, p_old_value text DEFAULT NULL::text, p_new_value text DEFAULT NULL::text, p_description text DEFAULT NULL::text) RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  log_id UUID;
BEGIN
  INSERT INTO public.change_logs (
    entity_type,
    entity_id,
    action,
    field_name,
    old_value,
    new_value,
    changed_by,
    change_description
  )
  VALUES (
    p_entity_type,
    p_entity_id,
    p_action,
    p_field_name,
    p_old_value,
    p_new_value,
    auth.uid(),
    p_description
  )
  RETURNING id INTO log_id;
  
  RETURN log_id;
END;
$$;


ALTER FUNCTION public.log_change(p_entity_type text, p_entity_id uuid, p_action text, p_field_name text, p_old_value text, p_new_value text, p_description text) OWNER TO postgres;

--
-- TOC entry 782 (class 1255 OID 16551)
-- Name: log_task_changes(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.log_task_changes() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  -- Log updates to specific fields
  IF TG_OP = 'UPDATE' THEN
    IF OLD.start_date IS DISTINCT FROM NEW.start_date THEN
      PERFORM public.log_change('task', NEW.id, 'updated', 'start_date', OLD.start_date::text, NEW.start_date::text);
    END IF;
    
    IF OLD.end_date IS DISTINCT FROM NEW.end_date THEN
      PERFORM public.log_change('task', NEW.id, 'updated', 'end_date', OLD.end_date::text, NEW.end_date::text);
    END IF;
    
    IF OLD.start_time IS DISTINCT FROM NEW.start_time THEN
      PERFORM public.log_change('task', NEW.id, 'updated', 'start_time', OLD.start_time::text, NEW.start_time::text);
    END IF;
    
    IF OLD.end_time IS DISTINCT FROM NEW.end_time THEN
      PERFORM public.log_change('task', NEW.id, 'updated', 'end_time', OLD.end_time::text, NEW.end_time::text);
    END IF;
    
    IF OLD.due_date IS DISTINCT FROM NEW.due_date THEN
      PERFORM public.log_change('task', NEW.id, 'updated', 'due_date', OLD.due_date::text, NEW.due_date::text);
    END IF;
    
    IF OLD.assigned_to IS DISTINCT FROM NEW.assigned_to THEN
      PERFORM public.log_change('task', NEW.id, 'updated', 'assigned_to', OLD.assigned_to::text, NEW.assigned_to::text);
    END IF;
    
    IF OLD.description IS DISTINCT FROM NEW.description THEN
      PERFORM public.log_change('task', NEW.id, 'updated', 'description', OLD.description, NEW.description);
    END IF;
    
    IF OLD.category IS DISTINCT FROM NEW.category THEN
      PERFORM public.log_change('task', NEW.id, 'updated', 'category', OLD.category, NEW.category);
    END IF;
    
    IF OLD.estimated_hours IS DISTINCT FROM NEW.estimated_hours THEN
      PERFORM public.log_change('task', NEW.id, 'updated', 'estimated_hours', OLD.estimated_hours::text, NEW.estimated_hours::text);
    END IF;
    
    IF OLD.actual_hours IS DISTINCT FROM NEW.actual_hours THEN
      PERFORM public.log_change('task', NEW.id, 'updated', 'actual_hours', OLD.actual_hours::text, NEW.actual_hours::text);
    END IF;
    
    IF OLD.event_id IS DISTINCT FROM NEW.event_id THEN
      PERFORM public.log_change('task', NEW.id, 'updated', 'event_id', OLD.event_id::text, NEW.event_id::text);
    END IF;
    
    IF OLD.archived IS DISTINCT FROM NEW.archived THEN
      PERFORM public.log_change('task', NEW.id, 'updated', 'archived', OLD.archived::text, NEW.archived::text);
    END IF;
    
    IF OLD.priority IS DISTINCT FROM NEW.priority THEN
      PERFORM public.log_change('task', NEW.id, 'updated', 'priority', OLD.priority::text, NEW.priority::text);
    END IF;
  ELSIF TG_OP = 'INSERT' THEN
    PERFORM public.log_change('task', NEW.id, 'created', NULL, NULL, NULL, 
      format('Task "%s" created with priority %s', NEW.title, NEW.priority));
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM public.log_change('task', OLD.id, 'deleted', NULL, NULL, NULL,
      format('Task "%s" deleted', OLD.title));
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;


ALTER FUNCTION public.log_task_changes() OWNER TO postgres;

--
-- TOC entry 599 (class 1255 OID 16552)
-- Name: notify_coordinators(text, text, text, text, uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.notify_coordinators(p_title text, p_message text, p_type text, p_entity_type text DEFAULT NULL::text, p_entity_id uuid DEFAULT NULL::uuid) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  coordinator_id UUID;
BEGIN
  -- Get all users with coordinator roles
  FOR coordinator_id IN 
    SELECT user_id 
    FROM public.user_roles 
    WHERE role IN ('admin', 'event_manager', 'task_coordinator')
  LOOP
    INSERT INTO public.notifications (
      recipient_id,
      sender_id,
      title,
      message,
      type,
      entity_type,
      entity_id
    )
    VALUES (
      coordinator_id,
      auth.uid(),
      p_title,
      p_message,
      p_type,
      p_entity_type,
      p_entity_id
    );
  END LOOP;
END;
$$;


ALTER FUNCTION public.notify_coordinators(p_title text, p_message text, p_type text, p_entity_type text, p_entity_id uuid) OWNER TO postgres;

--
-- TOC entry 613 (class 1255 OID 16553)
-- Name: recalculate_project_timeline(uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.recalculate_project_timeline(p_event_id uuid) RETURNS TABLE(task_id uuid, new_due_date timestamp with time zone, estimated_completion timestamp with time zone)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  base_date TIMESTAMP WITH TIME ZONE;
  calc_date TIMESTAMP WITH TIME ZONE;
  task_record RECORD;
BEGIN
  -- Get the earliest task start date for this event
  SELECT MIN(due_date - (COALESCE(estimated_hours, 0) || ' hours')::interval)
  INTO base_date
  FROM public.tasks
  WHERE event_id = p_event_id;
  
  -- If no base date found, use current time
  IF base_date IS NULL THEN
    base_date := now();
  END IF;
  
  calc_date := base_date;
  
  -- Recalculate timeline for all tasks in dependency order
  FOR task_record IN 
    SELECT t.id, t.title, t.estimated_hours, t.priority
    FROM public.tasks t
    WHERE t.event_id = p_event_id
    ORDER BY 
      CASE t.priority 
        WHEN 'urgent' THEN 1
        WHEN 'high' THEN 2
        WHEN 'medium' THEN 3
        WHEN 'low' THEN 4
        ELSE 5
      END,
      t.created_at
  LOOP
    -- Calculate new due date
    calc_date := calc_date + (COALESCE(task_record.estimated_hours, 1) || ' hours')::interval;
    
    -- Update the task
    UPDATE public.tasks
    SET due_date = calc_date,
        updated_at = now()
    WHERE id = task_record.id;
    
    -- Return the updates
    RETURN QUERY SELECT 
      task_record.id,
      calc_date,
      calc_date;
    
    -- Add buffer time between tasks (30 minutes)
    calc_date := calc_date + interval '30 minutes';
  END LOOP;
  
  RETURN;
END;
$$;


ALTER FUNCTION public.recalculate_project_timeline(p_event_id uuid) OWNER TO postgres;

--
-- TOC entry 615 (class 1255 OID 16554)
-- Name: scrub_authorization_sensitive_fields(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.scrub_authorization_sensitive_fields() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  -- Never persist plaintext or pseudo-password fields
  NEW.pass_word := NULL;
  NEW.create_password := NULL;
  NEW.reset_pw := NULL;
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.scrub_authorization_sensitive_fields() OWNER TO postgres;

--
-- TOC entry 602 (class 1255 OID 16555)
-- Name: set_user_profile_user_id(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.set_user_profile_user_id() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.user_id IS NULL THEN
      NEW.user_id := auth.uid();
    END IF;
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.set_user_profile_user_id() OWNER TO postgres;

--
-- TOC entry 747 (class 1255 OID 16556)
-- Name: sync_create_event_to_manage_event(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.sync_create_event_to_manage_event() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  INSERT INTO "Manage Event" (
    event_user_id,
    event_contact_name,
    event_contact_email,
    event_contact_ph_nbr,
    event_date,
    event_time,
    event_theme,
    event_type,
    event_status,
    created_at
  )
  VALUES (
    NEW.userid,
    NEW.contact_name,
    NEW.email,
    NEW.contact_phone_nbr,
    NEW.event_start_date,
    NEW.event_start_time,
    CASE 
      WHEN NEW.event_theme IS NOT NULL AND array_length(NEW.event_theme, 1) > 0 
      THEN NEW.event_theme[1]::text 
      ELSE NULL 
    END,
    'Event', -- Default event type
    'Planning', -- Default status
    NEW.created_at
  );
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.sync_create_event_to_manage_event() OWNER TO postgres;

--
-- TOC entry 656 (class 1255 OID 16557)
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_updated_at_column() OWNER TO postgres;

--
CREATE TABLE "Cm_Event_Orchestration".change_events (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    change_request_id uuid NOT NULL,
    action text NOT NULL,
    field_name text,
    old_value text,
    new_value text,
    created_by uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT change_events_action_check CHECK ((action = ANY (ARRAY['created'::text, 'updated'::text, 'deleted'::text, 'approved'::text, 'rejected'::text, 'applied'::text])))
);


ALTER TABLE "Cm_Event_Orchestration".change_events OWNER TO postgres;

--
-- TOC entry 521 (class 1259 OID 129501)
-- Name: change_requests; Type: TABLE; Schema: Cm_Event_Orchestration; Owner: postgres
--

CREATE TABLE "Cm_Event_Orchestration".change_requests (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    requested_by uuid NOT NULL,
    entity_type text NOT NULL,
    entity_id uuid NOT NULL,
    change_type public.change_type NOT NULL,
    payload jsonb NOT NULL,
    status public.change_status DEFAULT 'pending'::public.change_status NOT NULL,
    approver_id uuid,
    approved_at timestamp with time zone,
    applied_at timestamp with time zone,
    event_id uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT change_requests_entity_type_check CHECK ((entity_type = ANY (ARRAY['event'::text, 'task'::text, 'workflow'::text, 'venue'::text, 'supplier'::text, 'transport'::text, 'entertainment'::text])))
);


ALTER TABLE "Cm_Event_Orchestration".change_requests OWNER TO postgres;

--
CREATE TABLE event_orchestration_saas.change_events (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    change_request_id uuid NOT NULL,
    action text NOT NULL,
    field_name text,
    old_value text,
    new_value text,
    created_by uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT change_events_action_check CHECK ((action = ANY (ARRAY['created'::text, 'updated'::text, 'deleted'::text, 'approved'::text, 'rejected'::text, 'applied'::text])))
);


ALTER TABLE event_orchestration_saas.change_events OWNER TO postgres;

--
-- TOC entry 519 (class 1259 OID 129471)
-- Name: change_requests; Type: TABLE; Schema: event_orchestration_saas; Owner: postgres
--

CREATE TABLE event_orchestration_saas.change_requests (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    requested_by uuid NOT NULL,
    entity_type text NOT NULL,
    entity_id uuid NOT NULL,
    change_type public.change_type NOT NULL,
    payload jsonb NOT NULL,
    status public.change_status DEFAULT 'pending'::public.change_status NOT NULL,
    approver_id uuid,
    approved_at timestamp with time zone,
    applied_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    event_id uuid,
    CONSTRAINT change_requests_entity_type_check CHECK ((entity_type = ANY (ARRAY['event'::text, 'task'::text, 'workflow'::text, 'venue'::text, 'supplier'::text, 'transport'::text, 'entertainment'::text])))
);


ALTER TABLE event_orchestration_saas.change_requests OWNER TO postgres;

--
-- TOC entry 393 (class 1259 OID 17340)
-- Name: Authorization; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Authorization" (
    sign_in text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    pass_word text,
    reset_pw text,
    sign_out text,
    create_userid text,
    create_password text
);


ALTER TABLE public."Authorization" OWNER TO postgres;

--
-- TOC entry 6050 (class 0 OID 0)
-- Dependencies: 393
-- Name: COLUMN "Authorization".create_userid; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public."Authorization".create_userid IS 'email';


--
-- TOC entry 6051 (class 0 OID 0)
-- Dependencies: 393
-- Name: COLUMN "Authorization".create_password; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public."Authorization".create_password IS 'offer suggestions';


--
-- TOC entry 405 (class 1259 OID 20824)
-- Name: Bookings Directory; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Bookings Directory" (
    book_id text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    confirmation boolean,
    rsvp boolean,
    registry text[],
    reservation boolean,
    barcode boolean,
    user_id uuid
);


ALTER TABLE public."Bookings Directory" OWNER TO postgres;

--
-- TOC entry 6053 (class 0 OID 0)
-- Dependencies: 405
-- Name: TABLE "Bookings Directory"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public."Bookings Directory" IS 'Select type';


--
-- TOC entry 6054 (class 0 OID 0)
-- Dependencies: 405
-- Name: COLUMN "Bookings Directory".confirmation; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public."Bookings Directory".confirmation IS 'hospitality, venue, transportation, vendor, service, supply';


--
-- TOC entry 6055 (class 0 OID 0)
-- Dependencies: 405
-- Name: COLUMN "Bookings Directory".rsvp; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public."Bookings Directory".rsvp IS 'invitation';


--
-- TOC entry 6056 (class 0 OID 0)
-- Dependencies: 405
-- Name: COLUMN "Bookings Directory".registry; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public."Bookings Directory".registry IS 'weddings, showers, celebrations';


--
-- TOC entry 6057 (class 0 OID 0)
-- Dependencies: 405
-- Name: COLUMN "Bookings Directory".reservation; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public."Bookings Directory".reservation IS 'venue, transportation,hospitality';


--
-- TOC entry 395 (class 1259 OID 18485)
-- Name: Collaborators; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Collaborators" (
    collab_type text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    services_assign_to text,
    suppliers_assign_to text,
    vendors_assign_to text,
    venue_assign_to text,
    hospitality_assign_to text,
    entertainment_assign_to text,
    booking_assign_to text,
    transportation_assign_to text
);


ALTER TABLE public."Collaborators" OWNER TO postgres;

--
-- TOC entry 396 (class 1259 OID 18493)
-- Name: Comments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Comments" (
    comment text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    creator text[],
    subject text
);


ALTER TABLE public."Comments" OWNER TO postgres;

--
-- TOC entry 394 (class 1259 OID 17348)
-- Name: Create Event; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Create Event" (
    userid text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    event_theme text[],
    booking_type text[],
    email text,
    contact_name text,
    contact_phone_nbr numeric,
    event_budget numeric,
    event_collaborators text[],
    event_description text,
    event_start_date date,
    event_start_time timestamp with time zone,
    event_end_date date,
    event_end_time timestamp with time zone,
    event_location text[],
    notification text,
    resources text[],
    priority text[],
    venue_type text[],
    service_rental_type text,
    is_service_type_availabe boolean,
    is_venue_available boolean,
    is_booking_available boolean,
    is_service_rental_available boolean,
    supplier_type text[],
    is_supply_available boolean,
    transportation_type text,
    is_transportation_available boolean,
    "Venue_Location" text[],
    "Hospitality_Location" numeric
);


ALTER TABLE public."Create Event" OWNER TO postgres;

--
-- TOC entry 6061 (class 0 OID 0)
-- Dependencies: 394
-- Name: COLUMN "Create Event".userid; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public."Create Event".userid IS 'organizer, planner, manager, venue owner';


--
-- TOC entry 6062 (class 0 OID 0)
-- Dependencies: 394
-- Name: COLUMN "Create Event".event_theme; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public."Create Event".event_theme IS 'drop down selection from directory';


--
-- TOC entry 6063 (class 0 OID 0)
-- Dependencies: 394
-- Name: COLUMN "Create Event".booking_type; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public."Create Event".booking_type IS 'venue, hospitality, transportation';


--
-- TOC entry 6064 (class 0 OID 0)
-- Dependencies: 394
-- Name: COLUMN "Create Event".event_location; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public."Create Event".event_location IS 'search by event type and make a selection';


--
-- TOC entry 6065 (class 0 OID 0)
-- Dependencies: 394
-- Name: COLUMN "Create Event".notification; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public."Create Event".notification IS 'sent by planner';


--
-- TOC entry 6066 (class 0 OID 0)
-- Dependencies: 394
-- Name: COLUMN "Create Event".venue_type; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public."Create Event".venue_type IS 'drop down selection from directory';


--
-- TOC entry 6067 (class 0 OID 0)
-- Dependencies: 394
-- Name: COLUMN "Create Event".service_rental_type; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public."Create Event".service_rental_type IS 'drop down menu from service rental directory';


--
-- TOC entry 6068 (class 0 OID 0)
-- Dependencies: 394
-- Name: COLUMN "Create Event".is_booking_available; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public."Create Event".is_booking_available IS 'venue, hospitality, transportation';


--
-- TOC entry 6069 (class 0 OID 0)
-- Dependencies: 394
-- Name: COLUMN "Create Event".supplier_type; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public."Create Event".supplier_type IS 'drop down menu from directory';


--
-- TOC entry 6070 (class 0 OID 0)
-- Dependencies: 394
-- Name: COLUMN "Create Event".transportation_type; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public."Create Event".transportation_type IS 'drop down menu from directory';


--
-- TOC entry 6071 (class 0 OID 0)
-- Dependencies: 394
-- Name: COLUMN "Create Event"."Venue_Location"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public."Create Event"."Venue_Location" IS 'search (zip, state, city/town, street address)';


--
-- TOC entry 6072 (class 0 OID 0)
-- Dependencies: 394
-- Name: COLUMN "Create Event"."Hospitality_Location"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public."Create Event"."Hospitality_Location" IS 'search (zip, state, city/town, street address)';


--
-- TOC entry 429 (class 1259 OID 35744)
-- Name: Entertainment Directory; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Entertainment Directory" (
    id bigint NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    "Standup Comic" text,
    "DJ Music" text,
    "Performer" text,
    "Musicians" text,
    "Stage_Production" text,
    "Speaker" text,
    "Other" text
);


ALTER TABLE public."Entertainment Directory" OWNER TO postgres;

--
-- TOC entry 6074 (class 0 OID 0)
-- Dependencies: 429
-- Name: COLUMN "Entertainment Directory"."Other"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public."Entertainment Directory"."Other" IS 'Specific type';


--
-- TOC entry 430 (class 1259 OID 35747)
-- Name: Entertainment Directory_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public."Entertainment Directory" ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public."Entertainment Directory_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 431 (class 1259 OID 35756)
-- Name: Entertainment Profile; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Entertainment Profile" (
    id bigint NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    "Business_Name" text,
    "Contact_Name" text,
    "Contact_Ph_Nbr" numeric,
    "Business_Location" text,
    "Email" text,
    "Price" numeric,
    "Available_Dates" timestamp with time zone,
    type_id text,
    "Genre" text
);


ALTER TABLE public."Entertainment Profile" OWNER TO postgres;

--
-- TOC entry 6077 (class 0 OID 0)
-- Dependencies: 431
-- Name: COLUMN "Entertainment Profile"."Genre"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public."Entertainment Profile"."Genre" IS 'Performance Details';


--
-- TOC entry 432 (class 1259 OID 35759)
-- Name: Entertainment Profile_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public."Entertainment Profile" ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public."Entertainment Profile_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 398 (class 1259 OID 18517)
-- Name: Event Analytics; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Event Analytics" (
    event_id integer NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    event_count_update numeric,
    event_freq_by_location text,
    lead_conversion_rate numeric,
    resource_util_percent real,
    task_completion_rate numeric,
    avg_task_duration real
);


ALTER TABLE public."Event Analytics" OWNER TO postgres;

--
-- TOC entry 413 (class 1259 OID 23215)
-- Name: Event Plan Report; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Event Plan Report" (
    userid uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    event_attendee_count numeric,
    event_type text,
    event_total_cost numeric,
    event_collaborators_name text,
    event_comments text,
    event_description text,
    event_end_date date,
    event_end_time timestamp with time zone,
    event_location text,
    event_start_date date,
    event_start_time timestamp with time zone,
    event_priority text,
    event_status text,
    event_theme text,
    user_name text,
    event_budget numeric,
    user_contact_name text,
    user_contact_nbr numeric,
    event_hosp_biz_name text,
    event_hosp_location text,
    event_hosp_contact_name text,
    event_hosp_contact_nbr numeric,
    event_hosp_type text,
    event_hosp_cost numeric,
    event_hosp_check_in_date date,
    event_hosp_check_out_date date,
    event_venue_collab_name text,
    event_venue_biz_name text,
    event_venue_location text,
    event_venue_contact_name text,
    event_venue_contact_nbr numeric,
    venue_email text,
    hosp_email text,
    event_venue_type text,
    event_venue_check_in_date date,
    event_venue_check_out_date date,
    event_venue_cost numeric,
    event_vend_collab_name text,
    event_vend_email text,
    event_vend_contact_name text,
    event_vend_biz_name text,
    event_vend_contact_nbr numeric,
    event_vend_location text,
    event_vend_type text,
    event_vend_cost public.budget_category,
    event_vend_start_date date,
    event_vend_end_date date
);


ALTER TABLE public."Event Plan Report" OWNER TO postgres;

--
-- TOC entry 6081 (class 0 OID 0)
-- Dependencies: 413
-- Name: TABLE "Event Plan Report"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public."Event Plan Report" IS 'event plan summary';


--
-- TOC entry 6082 (class 0 OID 0)
-- Dependencies: 413
-- Name: COLUMN "Event Plan Report".event_type; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public."Event Plan Report".event_type IS 'auto fill theme';


--
-- TOC entry 6083 (class 0 OID 0)
-- Dependencies: 413
-- Name: COLUMN "Event Plan Report".event_total_cost; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public."Event Plan Report".event_total_cost IS 'venue, vendors, suppliers, services';


--
-- TOC entry 6084 (class 0 OID 0)
-- Dependencies: 413
-- Name: COLUMN "Event Plan Report".event_collaborators_name; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public."Event Plan Report".event_collaborators_name IS 'hospitality, venue, vendor, services, supplier';


--
-- TOC entry 6085 (class 0 OID 0)
-- Dependencies: 413
-- Name: COLUMN "Event Plan Report".event_theme; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public."Event Plan Report".event_theme IS 'auto fill';


--
-- TOC entry 6086 (class 0 OID 0)
-- Dependencies: 413
-- Name: COLUMN "Event Plan Report".event_budget; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public."Event Plan Report".event_budget IS 'budget categories amt';


--
-- TOC entry 6087 (class 0 OID 0)
-- Dependencies: 413
-- Name: COLUMN "Event Plan Report".event_hosp_type; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public."Event Plan Report".event_hosp_type IS 'airbnb, hotel, motel, resort,other';


--
-- TOC entry 407 (class 1259 OID 20854)
-- Name: Event Resources; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Event Resources" (
    event_id integer NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    hospitality_types text,
    service_rental_type text,
    service_vendor_type text,
    venue_types text,
    supply_type text,
    vendor_types text
);


ALTER TABLE public."Event Resources" OWNER TO postgres;

--
-- TOC entry 6089 (class 0 OID 0)
-- Dependencies: 407
-- Name: COLUMN "Event Resources".hospitality_types; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public."Event Resources".hospitality_types IS 'hospitality directory by location';


--
-- TOC entry 6090 (class 0 OID 0)
-- Dependencies: 407
-- Name: COLUMN "Event Resources".service_rental_type; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public."Event Resources".service_rental_type IS 'service rental directory by location';


--
-- TOC entry 6091 (class 0 OID 0)
-- Dependencies: 407
-- Name: COLUMN "Event Resources".service_vendor_type; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public."Event Resources".service_vendor_type IS 'service vendor directory by location';


--
-- TOC entry 6092 (class 0 OID 0)
-- Dependencies: 407
-- Name: COLUMN "Event Resources".venue_types; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public."Event Resources".venue_types IS 'venue directory by location';


--
-- TOC entry 6093 (class 0 OID 0)
-- Dependencies: 407
-- Name: COLUMN "Event Resources".supply_type; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public."Event Resources".supply_type IS 'supplier directory by location';


--
-- TOC entry 6094 (class 0 OID 0)
-- Dependencies: 407
-- Name: COLUMN "Event Resources".vendor_types; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public."Event Resources".vendor_types IS 'vendor directory by location';


--
-- TOC entry 408 (class 1259 OID 20857)
-- Name: Event Resources_resource_type_idid_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public."Event Resources" ALTER COLUMN event_id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public."Event Resources_resource_type_idid_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 423 (class 1259 OID 35685)
-- Name: Hospitality Directory; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Hospitality Directory" (
    id bigint NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    "Airbnb" text,
    "Hotel" text,
    "Motel" text,
    "Resort" text,
    "Other" text
);


ALTER TABLE public."Hospitality Directory" OWNER TO postgres;

--
-- TOC entry 6097 (class 0 OID 0)
-- Dependencies: 423
-- Name: COLUMN "Hospitality Directory"."Other"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public."Hospitality Directory"."Other" IS 'Specify';


--
-- TOC entry 424 (class 1259 OID 35688)
-- Name: Hospitality Directory_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public."Hospitality Directory" ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public."Hospitality Directory_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 406 (class 1259 OID 20842)
-- Name: Hospitality Profile; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Hospitality Profile" (
    hosp_type_id public.budget_category NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    hosp_biz_name text,
    hosp_location text[],
    hosp_contact_name text,
    hosp_contact_nbr numeric,
    hosp_website text,
    hosp_amendities text[],
    hosp_price numeric,
    hospitality_type integer,
    hosp_email text
);


ALTER TABLE public."Hospitality Profile" OWNER TO postgres;

--
-- TOC entry 6100 (class 0 OID 0)
-- Dependencies: 406
-- Name: TABLE "Hospitality Profile"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public."Hospitality Profile" IS 'airbnb, hotel, motel, resort, other';


--
-- TOC entry 6101 (class 0 OID 0)
-- Dependencies: 406
-- Name: COLUMN "Hospitality Profile".hosp_location; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public."Hospitality Profile".hosp_location IS 'street, city/town, state, zip';


--
-- TOC entry 6102 (class 0 OID 0)
-- Dependencies: 406
-- Name: COLUMN "Hospitality Profile".hosp_price; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public."Hospitality Profile".hosp_price IS '$000.00';


--
-- TOC entry 401 (class 1259 OID 19647)
-- Name: Manage Event; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Manage Event" (
    event_user_id text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    event_contact_email text,
    event_contact_name text,
    event_contact_ph_nbr numeric,
    event_budget_cost numeric[],
    event_date date,
    event_time timestamp with time zone,
    event_type text,
    hosp_biz_name text,
    hosp_location text,
    hosp_booking_date date,
    hosp_booking_time timestamp with time zone,
    service_type text[],
    service_biz_name text,
    service_delivery_location text,
    service_delivery_date date,
    service_delivery_time timestamp with time zone,
    venue_contact_name text,
    venue_contact_ph_nbr numeric,
    venue_location text,
    venue_booking_time timestamp with time zone,
    venue_name text,
    venue_type text,
    venue_booking_date date,
    venue_cost numeric,
    hosp_cost numeric,
    hosp_contact_name text,
    hosp_contact_nbr numeric,
    hosp_email text,
    service_cost numeric,
    supplier_biz_name text,
    supply_type text[],
    supplier_contact_name text,
    supplier_contact_nbr numeric,
    supplier_email text,
    supply_cost numeric,
    supply_delivery_date date,
    supply_delivery_time timestamp with time zone,
    vendor_biz_name text,
    vendor_contact_name text,
    vendor_contact_nbr numeric,
    vendor_email text,
    vendor_cost numeric,
    event_status public.event_status_enum,
    set_priority text,
    task_status text,
    event_theme text
);


ALTER TABLE public."Manage Event" OWNER TO postgres;

--
-- TOC entry 6104 (class 0 OID 0)
-- Dependencies: 401
-- Name: COLUMN "Manage Event".event_user_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public."Manage Event".event_user_id IS 'auto fill from create event';


--
-- TOC entry 6105 (class 0 OID 0)
-- Dependencies: 401
-- Name: COLUMN "Manage Event".event_contact_name; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public."Manage Event".event_contact_name IS 'auto fill from create event';


--
-- TOC entry 6106 (class 0 OID 0)
-- Dependencies: 401
-- Name: COLUMN "Manage Event".event_contact_ph_nbr; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public."Manage Event".event_contact_ph_nbr IS 'auto fill from create event';


--
-- TOC entry 6107 (class 0 OID 0)
-- Dependencies: 401
-- Name: COLUMN "Manage Event".event_budget_cost; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public."Manage Event".event_budget_cost IS 'auto fill from create event';


--
-- TOC entry 6108 (class 0 OID 0)
-- Dependencies: 401
-- Name: COLUMN "Manage Event".event_date; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public."Manage Event".event_date IS 'auto fill';


--
-- TOC entry 6109 (class 0 OID 0)
-- Dependencies: 401
-- Name: COLUMN "Manage Event".event_time; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public."Manage Event".event_time IS 'auto fill';


--
-- TOC entry 6110 (class 0 OID 0)
-- Dependencies: 401
-- Name: COLUMN "Manage Event".event_type; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public."Manage Event".event_type IS 'auto fill';


--
-- TOC entry 6111 (class 0 OID 0)
-- Dependencies: 401
-- Name: COLUMN "Manage Event".hosp_biz_name; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public."Manage Event".hosp_biz_name IS 'auto fill';


--
-- TOC entry 6112 (class 0 OID 0)
-- Dependencies: 401
-- Name: COLUMN "Manage Event".hosp_location; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public."Manage Event".hosp_location IS 'auto fill from create event';


--
-- TOC entry 6113 (class 0 OID 0)
-- Dependencies: 401
-- Name: COLUMN "Manage Event".hosp_booking_date; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public."Manage Event".hosp_booking_date IS 'auto fill';


--
-- TOC entry 6114 (class 0 OID 0)
-- Dependencies: 401
-- Name: COLUMN "Manage Event".hosp_booking_time; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public."Manage Event".hosp_booking_time IS 'auto fill';


--
-- TOC entry 6115 (class 0 OID 0)
-- Dependencies: 401
-- Name: COLUMN "Manage Event".service_type; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public."Manage Event".service_type IS 'auto fill';


--
-- TOC entry 6116 (class 0 OID 0)
-- Dependencies: 401
-- Name: COLUMN "Manage Event".service_biz_name; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public."Manage Event".service_biz_name IS 'auto fill';


--
-- TOC entry 6117 (class 0 OID 0)
-- Dependencies: 401
-- Name: COLUMN "Manage Event".service_delivery_location; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public."Manage Event".service_delivery_location IS 'auto fill';


--
-- TOC entry 6118 (class 0 OID 0)
-- Dependencies: 401
-- Name: COLUMN "Manage Event".venue_contact_name; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public."Manage Event".venue_contact_name IS 'auto fill';


--
-- TOC entry 6119 (class 0 OID 0)
-- Dependencies: 401
-- Name: COLUMN "Manage Event".venue_contact_ph_nbr; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public."Manage Event".venue_contact_ph_nbr IS 'auto fill';


--
-- TOC entry 6120 (class 0 OID 0)
-- Dependencies: 401
-- Name: COLUMN "Manage Event".venue_location; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public."Manage Event".venue_location IS 'auto fill';


--
-- TOC entry 6121 (class 0 OID 0)
-- Dependencies: 401
-- Name: COLUMN "Manage Event".venue_booking_time; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public."Manage Event".venue_booking_time IS 'auto fill';


--
-- TOC entry 6122 (class 0 OID 0)
-- Dependencies: 401
-- Name: COLUMN "Manage Event".venue_name; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public."Manage Event".venue_name IS 'auto fill';


--
-- TOC entry 6123 (class 0 OID 0)
-- Dependencies: 401
-- Name: COLUMN "Manage Event".venue_type; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public."Manage Event".venue_type IS 'auto fill';


--
-- TOC entry 6124 (class 0 OID 0)
-- Dependencies: 401
-- Name: COLUMN "Manage Event".venue_booking_date; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public."Manage Event".venue_booking_date IS 'auto fill';


--
-- TOC entry 6125 (class 0 OID 0)
-- Dependencies: 401
-- Name: COLUMN "Manage Event".venue_cost; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public."Manage Event".venue_cost IS 'auto fill';


--
-- TOC entry 6126 (class 0 OID 0)
-- Dependencies: 401
-- Name: COLUMN "Manage Event".hosp_cost; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public."Manage Event".hosp_cost IS 'auto fill';


--
-- TOC entry 6127 (class 0 OID 0)
-- Dependencies: 401
-- Name: COLUMN "Manage Event".hosp_contact_name; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public."Manage Event".hosp_contact_name IS 'auto fill';


--
-- TOC entry 6128 (class 0 OID 0)
-- Dependencies: 401
-- Name: COLUMN "Manage Event".hosp_contact_nbr; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public."Manage Event".hosp_contact_nbr IS 'auto fill';


--
-- TOC entry 6129 (class 0 OID 0)
-- Dependencies: 401
-- Name: COLUMN "Manage Event".hosp_email; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public."Manage Event".hosp_email IS 'auto fill';


--
-- TOC entry 6130 (class 0 OID 0)
-- Dependencies: 401
-- Name: COLUMN "Manage Event".supply_type; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public."Manage Event".supply_type IS 'auto fill';


--
-- TOC entry 6131 (class 0 OID 0)
-- Dependencies: 401
-- Name: COLUMN "Manage Event".supplier_contact_nbr; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public."Manage Event".supplier_contact_nbr IS 'auto fill';


--
-- TOC entry 6132 (class 0 OID 0)
-- Dependencies: 401
-- Name: COLUMN "Manage Event".vendor_contact_name; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public."Manage Event".vendor_contact_name IS 'auto fill';


--
-- TOC entry 6133 (class 0 OID 0)
-- Dependencies: 401
-- Name: COLUMN "Manage Event".vendor_email; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public."Manage Event".vendor_email IS 'auto fill';


--
-- TOC entry 6134 (class 0 OID 0)
-- Dependencies: 401
-- Name: COLUMN "Manage Event".event_status; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public."Manage Event".event_status IS 'completed, ongoing, upcoming';


--
-- TOC entry 6135 (class 0 OID 0)
-- Dependencies: 401
-- Name: COLUMN "Manage Event".set_priority; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public."Manage Event".set_priority IS 'high, medium, low';


--
-- TOC entry 6136 (class 0 OID 0)
-- Dependencies: 401
-- Name: COLUMN "Manage Event".task_status; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public."Manage Event".task_status IS 'in progress, to do, completed';


--
-- TOC entry 6137 (class 0 OID 0)
-- Dependencies: 401
-- Name: COLUMN "Manage Event".event_theme; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public."Manage Event".event_theme IS 'drop down theme directory';


--
-- TOC entry 397 (class 1259 OID 18501)
-- Name: Manage Event Tasks; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Manage Event Tasks" (
    event_theme text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    analytics_update jsonb[],
    task_update text[],
    resource_update text,
    progress_update text,
    task_change_update text[],
    task_modified_date date,
    task_align_update jsonb[],
    task_completion_time_update timestamp with time zone
);


ALTER TABLE public."Manage Event Tasks" OWNER TO postgres;

--
-- TOC entry 6139 (class 0 OID 0)
-- Dependencies: 397
-- Name: COLUMN "Manage Event Tasks".resource_update; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public."Manage Event Tasks".resource_update IS 'hosp, venue, vendor, service, supplier';


--
-- TOC entry 6140 (class 0 OID 0)
-- Dependencies: 397
-- Name: COLUMN "Manage Event Tasks".progress_update; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public."Manage Event Tasks".progress_update IS 'completed, ongoing and upcoming';


--
-- TOC entry 6141 (class 0 OID 0)
-- Dependencies: 397
-- Name: COLUMN "Manage Event Tasks".task_change_update; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public."Manage Event Tasks".task_change_update IS 'Log';


--
-- TOC entry 6142 (class 0 OID 0)
-- Dependencies: 397
-- Name: COLUMN "Manage Event Tasks".task_align_update; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public."Manage Event Tasks".task_align_update IS 'venue, hosp, vendor, service and supplier';


--
-- TOC entry 436 (class 1259 OID 36975)
-- Name: Registration; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Registration" (
    id bigint NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public."Registration" OWNER TO postgres;

--
-- TOC entry 437 (class 1259 OID 36978)
-- Name: Registration_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public."Registration" ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public."Registration_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 427 (class 1259 OID 35732)
-- Name: Service Profile; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Service Profile" (
    id bigint NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    "Business Name" text,
    "Contact_Name" text,
    "Contact_Ph_Nbr" numeric,
    "Price" numeric,
    "Email" text,
    "Location" text,
    "Service_Type" text,
    service_provided_listing text
);


ALTER TABLE public."Service Profile" OWNER TO postgres;

--
-- TOC entry 6146 (class 0 OID 0)
-- Dependencies: 427
-- Name: COLUMN "Service Profile"."Service_Type"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public."Service Profile"."Service_Type" IS 'Service Rental/Sale Directory and Service Vendor Directory';


--
-- TOC entry 428 (class 1259 OID 35735)
-- Name: Service Profile_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public."Service Profile" ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public."Service Profile_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 402 (class 1259 OID 19697)
-- Name: Service Rental/Sale Directory; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Service Rental/Sale Directory" (
    rental_type_id text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    audio_visual_equip text,
    child_play_equip text[],
    venue_space_decor text[],
    entertainment_options text,
    flowers_plants text,
    game_tables text,
    table_chairs text,
    housewares text,
    lighting text,
    photo_both text,
    potty_johns numeric,
    prod_props text,
    tents text,
    transport_options text
);


ALTER TABLE public."Service Rental/Sale Directory" OWNER TO postgres;

--
-- TOC entry 6149 (class 0 OID 0)
-- Dependencies: 402
-- Name: TABLE "Service Rental/Sale Directory"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public."Service Rental/Sale Directory" IS 'search by type';


--
-- TOC entry 6150 (class 0 OID 0)
-- Dependencies: 402
-- Name: COLUMN "Service Rental/Sale Directory".audio_visual_equip; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public."Service Rental/Sale Directory".audio_visual_equip IS 'create event input';


--
-- TOC entry 6151 (class 0 OID 0)
-- Dependencies: 402
-- Name: COLUMN "Service Rental/Sale Directory".child_play_equip; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public."Service Rental/Sale Directory".child_play_equip IS 'input to create event';


--
-- TOC entry 6152 (class 0 OID 0)
-- Dependencies: 402
-- Name: COLUMN "Service Rental/Sale Directory".venue_space_decor; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public."Service Rental/Sale Directory".venue_space_decor IS 'chair covers table clothes , runners,  backdrop, balloon arch, decorations,';


--
-- TOC entry 6153 (class 0 OID 0)
-- Dependencies: 402
-- Name: COLUMN "Service Rental/Sale Directory".entertainment_options; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public."Service Rental/Sale Directory".entertainment_options IS 'dj_music, live music, live production, speaker, standup comic,';


--
-- TOC entry 6154 (class 0 OID 0)
-- Dependencies: 402
-- Name: COLUMN "Service Rental/Sale Directory".flowers_plants; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public."Service Rental/Sale Directory".flowers_plants IS 'types';


--
-- TOC entry 6155 (class 0 OID 0)
-- Dependencies: 402
-- Name: COLUMN "Service Rental/Sale Directory".transport_options; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public."Service Rental/Sale Directory".transport_options IS 'van, bus, car, rv';


--
-- TOC entry 403 (class 1259 OID 19705)
-- Name: Service Vendor Directory; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Service Vendor Directory" (
    service_vendor_id text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    bakery text,
    caterer text,
    chef text,
    videographer text,
    mixologist text
);


ALTER TABLE public."Service Vendor Directory" OWNER TO postgres;

--
-- TOC entry 6157 (class 0 OID 0)
-- Dependencies: 403
-- Name: TABLE "Service Vendor Directory"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public."Service Vendor Directory" IS 'search by location';


--
-- TOC entry 6158 (class 0 OID 0)
-- Dependencies: 403
-- Name: COLUMN "Service Vendor Directory".service_vendor_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public."Service Vendor Directory".service_vendor_id IS 'food truck, mobile popup';


--
-- TOC entry 441 (class 1259 OID 40352)
-- Name: Subscription_Plans Directory; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Subscription_Plans Directory" (
    id bigint NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    "Trial" text DEFAULT 'Free'::text,
    "Standard_Plan" numeric,
    "Premium" numeric,
    "Premium Plus" numeric,
    "Enterprise" numeric,
    "Special Promo" text
);


ALTER TABLE public."Subscription_Plans Directory" OWNER TO postgres;

--
-- TOC entry 6160 (class 0 OID 0)
-- Dependencies: 441
-- Name: COLUMN "Subscription_Plans Directory"."Enterprise"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public."Subscription_Plans Directory"."Enterprise" IS 'Independent Contract';


--
-- TOC entry 442 (class 1259 OID 40355)
-- Name: Subscription_Plans Directory_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public."Subscription_Plans Directory" ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public."Subscription_Plans Directory_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 425 (class 1259 OID 35697)
-- Name: Supplier Directory; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Supplier Directory" (
    id bigint NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    "Distributor" text,
    "Merchandizer" text,
    "Online_Market" text,
    "Wholesaler" text,
    "Other" text,
    "Food_Wholesaler" text
);


ALTER TABLE public."Supplier Directory" OWNER TO postgres;

--
-- TOC entry 426 (class 1259 OID 35700)
-- Name: Supplier Directory_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public."Supplier Directory" ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public."Supplier Directory_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 409 (class 1259 OID 20866)
-- Name: Supplier Profile; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Supplier Profile" (
    supply_id text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    distributor_supplier_biz_name text,
    supplier_email text,
    supplier_location text,
    supplier_contact_name text,
    supplier_contact_nbr numeric,
    supplier_type text,
    wholesaler_supplier_biz_name text,
    online_marketplace_supplier_biz_name text,
    merchandizer_supllier_biz_name text
);


ALTER TABLE public."Supplier Profile" OWNER TO postgres;

--
-- TOC entry 6165 (class 0 OID 0)
-- Dependencies: 409
-- Name: TABLE "Supplier Profile"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public."Supplier Profile" IS 'search by location';


--
-- TOC entry 6166 (class 0 OID 0)
-- Dependencies: 409
-- Name: COLUMN "Supplier Profile".supplier_type; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public."Supplier Profile".supplier_type IS 'search location for supplier type';


--
-- TOC entry 434 (class 1259 OID 36945)
-- Name: Supplier Vendor Profile; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Supplier Vendor Profile" (
    type bigint NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    supp_name text,
    supp_contact_name text,
    supp_contact_nbr numeric,
    supp_contact_role text,
    supp_email text,
    supp_location text,
    supp_biz_name text,
    supp_rate numeric,
    inventory_listing text
);


ALTER TABLE public."Supplier Vendor Profile" OWNER TO postgres;

--
-- TOC entry 435 (class 1259 OID 36948)
-- Name: Supplier Vendor Profile_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public."Supplier Vendor Profile" ALTER COLUMN type ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public."Supplier Vendor Profile_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 400 (class 1259 OID 18534)
-- Name: Themes Directory; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Themes Directory" (
    baby_shower text NOT NULL,
    bridal_shower text,
    "Celebration" text,
    "Dining" text,
    "Festival" text,
    market_place text[],
    meet_up text[],
    parties text[],
    retreats text,
    reunion text,
    special_event text[],
    sporting text[],
    wedding text,
    "Health_Wellness" text
);


ALTER TABLE public."Themes Directory" OWNER TO postgres;

--
-- TOC entry 6170 (class 0 OID 0)
-- Dependencies: 400
-- Name: TABLE "Themes Directory"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public."Themes Directory" IS 'drop down menu';


--
-- TOC entry 6171 (class 0 OID 0)
-- Dependencies: 400
-- Name: COLUMN "Themes Directory".baby_shower; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public."Themes Directory".baby_shower IS 'rsvp';


--
-- TOC entry 6172 (class 0 OID 0)
-- Dependencies: 400
-- Name: COLUMN "Themes Directory".bridal_shower; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public."Themes Directory".bridal_shower IS 'rsvp';


--
-- TOC entry 6173 (class 0 OID 0)
-- Dependencies: 400
-- Name: COLUMN "Themes Directory"."Celebration"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public."Themes Directory"."Celebration" IS 'birthday, anniversary, graduation, holiday, special event';


--
-- TOC entry 6174 (class 0 OID 0)
-- Dependencies: 400
-- Name: COLUMN "Themes Directory"."Dining"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public."Themes Directory"."Dining" IS 'farm to table, restaurant, resident';


--
-- TOC entry 6175 (class 0 OID 0)
-- Dependencies: 400
-- Name: COLUMN "Themes Directory".market_place; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public."Themes Directory".market_place IS 'vendors';


--
-- TOC entry 6176 (class 0 OID 0)
-- Dependencies: 400
-- Name: COLUMN "Themes Directory".meet_up; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public."Themes Directory".meet_up IS 'van life travel';


--
-- TOC entry 6177 (class 0 OID 0)
-- Dependencies: 400
-- Name: COLUMN "Themes Directory".parties; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public."Themes Directory".parties IS 'group celebrations/work xmas';


--
-- TOC entry 6178 (class 0 OID 0)
-- Dependencies: 400
-- Name: COLUMN "Themes Directory".retreats; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public."Themes Directory".retreats IS 'spiritual, wellness, caregivers';


--
-- TOC entry 6179 (class 0 OID 0)
-- Dependencies: 400
-- Name: COLUMN "Themes Directory".reunion; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public."Themes Directory".reunion IS 'school, family';


--
-- TOC entry 6180 (class 0 OID 0)
-- Dependencies: 400
-- Name: COLUMN "Themes Directory".special_event; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public."Themes Directory".special_event IS 'honoring someone special';


--
-- TOC entry 6181 (class 0 OID 0)
-- Dependencies: 400
-- Name: COLUMN "Themes Directory".sporting; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public."Themes Directory".sporting IS 'skiing resort, equestrian center, tennis facility';


--
-- TOC entry 411 (class 1259 OID 20888)
-- Name: Transportation Directory; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Transportation Directory" (
    transo_rental_id integer NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    bus text[],
    van text,
    limo text,
    car_suv text,
    truck text,
    other text
);


ALTER TABLE public."Transportation Directory" OWNER TO postgres;

--
-- TOC entry 6183 (class 0 OID 0)
-- Dependencies: 411
-- Name: TABLE "Transportation Directory"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public."Transportation Directory" IS 'location searches';


--
-- TOC entry 6184 (class 0 OID 0)
-- Dependencies: 411
-- Name: COLUMN "Transportation Directory".transo_rental_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public."Transportation Directory".transo_rental_id IS 'bus, van, limo, car';


--
-- TOC entry 6185 (class 0 OID 0)
-- Dependencies: 411
-- Name: COLUMN "Transportation Directory".bus; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public."Transportation Directory".bus IS 'search by location';


--
-- TOC entry 412 (class 1259 OID 20891)
-- Name: Transportation Directory_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public."Transportation Directory" ALTER COLUMN transo_rental_id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public."Transportation Directory_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 404 (class 1259 OID 20816)
-- Name: Transportation Profile; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Transportation Profile" (
    transpo_id text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    trans_type text,
    biz_name text,
    biz_email text,
    trans_contact_name text,
    trans_contact_nbr numeric,
    days_of_operation text[],
    hours_of_operation timestamp with time zone[],
    dates_available date,
    departure_date date,
    departure_time timestamp with time zone,
    arrival_date date,
    arrival_time timestamp with time zone,
    departure_location text,
    destination_location text,
    seating_capacity numeric,
    special_accommodations text[],
    transpo_cost numeric,
    confirmation_nbr numeric,
    trans_amenities text
);


ALTER TABLE public."Transportation Profile" OWNER TO postgres;

--
-- TOC entry 6188 (class 0 OID 0)
-- Dependencies: 404
-- Name: TABLE "Transportation Profile"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public."Transportation Profile" IS 'bus, van, limo, car service provider';


--
-- TOC entry 6189 (class 0 OID 0)
-- Dependencies: 404
-- Name: COLUMN "Transportation Profile".trans_type; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public."Transportation Profile".trans_type IS 'bus, van, limo, car service rental';


--
-- TOC entry 6190 (class 0 OID 0)
-- Dependencies: 404
-- Name: COLUMN "Transportation Profile".dates_available; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public."Transportation Profile".dates_available IS 'calendar';


--
-- TOC entry 439 (class 1259 OID 40339)
-- Name: User Profile; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."User Profile" (
    id bigint NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    "Biz_Name" text,
    "User_Contact_Ph_Nbr" numeric,
    "User_Contact_Name" text,
    "User_Email" text,
    "User_Type" text,
    "Subscription_type" text DEFAULT 'Trial'::text,
    "Pay_Method" text,
    "Subscription_Start_Date" date,
    "Subscrition_End_Date" date,
    "Subscription_Upgrade_Type" text,
    "Sibscription_Upgrade_Date" date,
    "User_Category" text,
    "User_Subscription_Freq" text,
    "User_Location" text,
    user_id uuid,
    user_upload_pics text
);


ALTER TABLE public."User Profile" OWNER TO postgres;

--
-- TOC entry 6192 (class 0 OID 0)
-- Dependencies: 439
-- Name: COLUMN "User Profile"."Subscription_type"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public."User Profile"."Subscription_type" IS 'trial, standard, prem, prem plus, enterprise';


--
-- TOC entry 6193 (class 0 OID 0)
-- Dependencies: 439
-- Name: COLUMN "User Profile"."User_Subscription_Freq"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public."User Profile"."User_Subscription_Freq" IS 'Monthly, Annually';


--
-- TOC entry 6194 (class 0 OID 0)
-- Dependencies: 439
-- Name: COLUMN "User Profile".user_upload_pics; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public."User Profile".user_upload_pics IS 'Biz showcase';


--
-- TOC entry 440 (class 1259 OID 40342)
-- Name: User Profile_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public."User Profile" ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public."User Profile_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 421 (class 1259 OID 35661)
-- Name: Vendor Directory; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Vendor Directory" (
    id bigint NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    "Bakery" text,
    "Beverage" text,
    "Brewery" text,
    "Caterer" text,
    "Chef" text,
    "Florist" text,
    "Food Truck" text,
    "Foodies" text,
    "Ice_Sculpure" text,
    "Mobile_Pop_Up" text,
    "Other" text,
    "Videographer" text,
    "Winery" text
);


ALTER TABLE public."Vendor Directory" OWNER TO postgres;

--
-- TOC entry 6197 (class 0 OID 0)
-- Dependencies: 421
-- Name: COLUMN "Vendor Directory"."Beverage"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public."Vendor Directory"."Beverage" IS 'Water, soft drinks';


--
-- TOC entry 6198 (class 0 OID 0)
-- Dependencies: 421
-- Name: COLUMN "Vendor Directory"."Other"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public."Vendor Directory"."Other" IS 'Specify';


--
-- TOC entry 422 (class 1259 OID 35664)
-- Name: Vendor Directory_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public."Vendor Directory" ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public."Vendor Directory_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 410 (class 1259 OID 20880)
-- Name: Vendor Profile; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Vendor Profile" (
    vendor_type_id text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    vendor_biz_name text,
    vendor_location text,
    vendor_contact_name text,
    vendor_contact_nbr numeric,
    vendor_email text,
    vendor_type text,
    vendor_price numeric,
    ven_avail_dates date
);


ALTER TABLE public."Vendor Profile" OWNER TO postgres;

--
-- TOC entry 6201 (class 0 OID 0)
-- Dependencies: 410
-- Name: COLUMN "Vendor Profile".vendor_type; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public."Vendor Profile".vendor_type IS 'food truck, mobile popup, market place';


--
-- TOC entry 419 (class 1259 OID 35649)
-- Name: Venue Directory; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Venue Directory" (
    id bigint NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    "Agri-Farming" text,
    "Hospitality_Location" text,
    "Local_Govern_Location" text,
    "Market_Place" text,
    "Other" text,
    "Private_Club" text,
    "Private_Resident" text,
    "Recreation_Location" text,
    "Resort_Location" text,
    "Restaurant_Location" text,
    "Business_Location" text,
    "Sporting_Facility" text,
    "State_Govern_Location" text,
    "Warehouse" text,
    "Sporting_Facility_Location" text,
    "Warehouse_Location" text,
    "Private_Club_Location" text,
    "Agri_Location" text,
    "Market_Location" text
);


ALTER TABLE public."Venue Directory" OWNER TO postgres;

--
-- TOC entry 6203 (class 0 OID 0)
-- Dependencies: 419
-- Name: COLUMN "Venue Directory"."Other"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public."Venue Directory"."Other" IS 'Specify';


--
-- TOC entry 6204 (class 0 OID 0)
-- Dependencies: 419
-- Name: COLUMN "Venue Directory"."Sporting_Facility_Location"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public."Venue Directory"."Sporting_Facility_Location" IS 'street address, city/town, state, zipcode';


--
-- TOC entry 6205 (class 0 OID 0)
-- Dependencies: 419
-- Name: COLUMN "Venue Directory"."Warehouse_Location"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public."Venue Directory"."Warehouse_Location" IS 'street address, city/town, state, zip code';


--
-- TOC entry 6206 (class 0 OID 0)
-- Dependencies: 419
-- Name: COLUMN "Venue Directory"."Private_Club_Location"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public."Venue Directory"."Private_Club_Location" IS 'street address, city/town, state and zip code';


--
-- TOC entry 6207 (class 0 OID 0)
-- Dependencies: 419
-- Name: COLUMN "Venue Directory"."Agri_Location"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public."Venue Directory"."Agri_Location" IS 'address, city/town, state, and zip code';


--
-- TOC entry 6208 (class 0 OID 0)
-- Dependencies: 419
-- Name: COLUMN "Venue Directory"."Market_Location"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public."Venue Directory"."Market_Location" IS 'address, city/town, state, zip code';


--
-- TOC entry 420 (class 1259 OID 35652)
-- Name: Venue Directory_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public."Venue Directory" ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public."Venue Directory_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 399 (class 1259 OID 18526)
-- Name: Venue Profile; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Venue Profile" (
    venue_type_id text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    ven_locatiom text,
    ven_email text,
    ven_contact_name text,
    ven_contact_ph_nbr numeric,
    ven_biz_name text,
    ven_reservation_date date,
    ven_reservation_time timestamp with time zone,
    ven_price numeric,
    venue_amenities text
);


ALTER TABLE public."Venue Profile" OWNER TO postgres;

--
-- TOC entry 6211 (class 0 OID 0)
-- Dependencies: 399
-- Name: TABLE "Venue Profile"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public."Venue Profile" IS 'search by  type and location';


--
-- TOC entry 6212 (class 0 OID 0)
-- Dependencies: 399
-- Name: COLUMN "Venue Profile".venue_type_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public."Venue Profile".venue_type_id IS 'resort, private club, farm, local gov, marketplace, restaurant, sports facility';


--
-- TOC entry 6213 (class 0 OID 0)
-- Dependencies: 399
-- Name: COLUMN "Venue Profile".ven_locatiom; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public."Venue Profile".ven_locatiom IS 'street, city/town, state and zip';


--
-- TOC entry 459 (class 1259 OID 86469)
-- Name: amenity_types; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.amenity_types (
    id integer NOT NULL,
    name text NOT NULL,
    description text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.amenity_types OWNER TO postgres;

--
-- TOC entry 458 (class 1259 OID 86468)
-- Name: amenity_types_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.amenity_types_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.amenity_types_id_seq OWNER TO postgres;

--
-- TOC entry 6216 (class 0 OID 0)
-- Dependencies: 458
-- Name: amenity_types_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.amenity_types_id_seq OWNED BY public.amenity_types.id;


--
-- TOC entry 498 (class 1259 OID 96456)
-- Name: barcode_submissions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.barcode_submissions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    book_id text NOT NULL,
    event_name text NOT NULL,
    ticket_number text NOT NULL,
    email text NOT NULL,
    phone text,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.barcode_submissions OWNER TO postgres;

--
-- TOC entry 416 (class 1259 OID 33295)
-- Name: budget_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.budget_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    event_id uuid NOT NULL,
    category public.budget_category NOT NULL,
    item_name text NOT NULL,
    description text,
    estimated_cost numeric(10,2),
    actual_cost numeric(10,2),
    vendor_name text,
    vendor_contact text,
    payment_status text DEFAULT 'pending'::text,
    payment_due_date date,
    created_by uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    archived boolean DEFAULT false NOT NULL
);


ALTER TABLE public.budget_items OWNER TO postgres;

--
-- TOC entry 417 (class 1259 OID 34426)
-- Name: change_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.change_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    entity_type text NOT NULL,
    entity_id uuid NOT NULL,
    action text NOT NULL,
    field_name text,
    old_value text,
    new_value text,
    changed_by uuid NOT NULL,
    change_description text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT change_logs_action_check CHECK ((action = ANY (ARRAY['created'::text, 'updated'::text, 'deleted'::text]))),
    CONSTRAINT change_logs_entity_type_check CHECK ((entity_type = ANY (ARRAY['task'::text, 'event'::text, 'team'::text, 'role'::text, 'notification'::text, 'workflow'::text, 'budget_item'::text])))
);


ALTER TABLE public.change_logs OWNER TO postgres;

--
-- TOC entry 528 (class 1259 OID 136518)
-- Name: cm_audit_events; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.cm_audit_events (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    user_id uuid,
    event_id uuid,
    type text NOT NULL,
    description text,
    payload jsonb
);


ALTER TABLE public.cm_audit_events OWNER TO postgres;

--
-- TOC entry 527 (class 1259 OID 136505)
-- Name: cm_change_requests; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.cm_change_requests (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    event_id uuid,
    task_id uuid,
    requested_by uuid,
    description text,
    priority_tag text,
    CONSTRAINT cm_change_requests_priority_tag_check CHECK ((priority_tag = ANY (ARRAY['Urgent'::text, 'Optional'::text, 'Deferred'::text])))
);


ALTER TABLE public.cm_change_requests OWNER TO postgres;

--
-- TOC entry 523 (class 1259 OID 136466)
-- Name: cm_event_members; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.cm_event_members (
    user_id uuid NOT NULL,
    event_id uuid NOT NULL,
    role text DEFAULT 'viewer'::text NOT NULL,
    CONSTRAINT cm_event_members_role_check CHECK ((role = ANY (ARRAY['viewer'::text, 'contributor'::text, 'manager'::text])))
);


ALTER TABLE public.cm_event_members OWNER TO postgres;

--
-- TOC entry 524 (class 1259 OID 136475)
-- Name: cm_locations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.cm_locations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    event_id uuid,
    name text,
    address text
);


ALTER TABLE public.cm_locations OWNER TO postgres;

--
-- TOC entry 525 (class 1259 OID 136484)
-- Name: cm_resources; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.cm_resources (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    event_id uuid,
    name text,
    role text,
    location_id uuid,
    availability jsonb
);


ALTER TABLE public.cm_resources OWNER TO postgres;

--
-- TOC entry 526 (class 1259 OID 136494)
-- Name: cm_tasks; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.cm_tasks (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    event_id uuid,
    name text,
    start_date timestamp with time zone,
    end_date timestamp with time zone,
    depends_on uuid,
    locked boolean DEFAULT false,
    status text
);


ALTER TABLE public.cm_tasks OWNER TO postgres;

--
-- TOC entry 500 (class 1259 OID 98798)
-- Name: collaborator_configurations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.collaborator_configurations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    team_id uuid,
    role text NOT NULL,
    collaborator_types text[] NOT NULL,
    is_coordinator boolean DEFAULT false,
    is_viewer boolean DEFAULT false,
    assigned_user_id uuid,
    notes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.collaborator_configurations OWNER TO postgres;

--
-- TOC entry 495 (class 1259 OID 96426)
-- Name: confirmation_submissions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.confirmation_submissions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    book_id text NOT NULL,
    confirmation_number text NOT NULL,
    name text NOT NULL,
    email text NOT NULL,
    phone text,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    event_id text
);


ALTER TABLE public.confirmation_submissions OWNER TO postgres;

--
-- TOC entry 433 (class 1259 OID 36935)
-- Name: create_event_safe; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.create_event_safe WITH (security_invoker='true') AS
 SELECT event_start_date,
    event_end_date,
    event_start_time,
    event_end_time,
    event_theme,
    booking_type,
    event_collaborators,
    event_description,
    event_location,
    is_venue_available,
    is_booking_available,
    is_service_rental_available,
    service_rental_type,
    supplier_type,
    is_transportation_available,
    is_supply_available,
    transportation_type,
    event_budget,
    notification,
    is_service_type_availabe,
    resources,
    priority,
    created_at,
    userid
   FROM public."Create Event";


ALTER VIEW public.create_event_safe OWNER TO postgres;

--
-- TOC entry 6229 (class 0 OID 0)
-- Dependencies: 433
-- Name: VIEW create_event_safe; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON VIEW public.create_event_safe IS 'Sanitized view of Create Event without sensitive contact fields (contact_name, email, contact_phone_nbr). Uses SECURITY INVOKER so RLS policies are enforced based on the querying user.';


--
-- TOC entry 474 (class 1259 OID 87762)
-- Name: entertainment_types; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.entertainment_types (
    id integer NOT NULL,
    name text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.entertainment_types OWNER TO postgres;

--
-- TOC entry 473 (class 1259 OID 87761)
-- Name: entertainment_types_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.entertainment_types_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.entertainment_types_id_seq OWNER TO postgres;

--
-- TOC entry 6232 (class 0 OID 0)
-- Dependencies: 473
-- Name: entertainment_types_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.entertainment_types_id_seq OWNED BY public.entertainment_types.id;


--
-- TOC entry 475 (class 1259 OID 87773)
-- Name: entertainments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.entertainments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    business_name text NOT NULL,
    contact_name text,
    email text,
    phone_number text,
    city text,
    state text,
    zip text,
    ent_type_id integer,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    price numeric,
    description text
);


ALTER TABLE public.entertainments OWNER TO postgres;

--
-- TOC entry 448 (class 1259 OID 76759)
-- Name: event_themes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.event_themes (
    name text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    description text,
    tags text[],
    premium boolean DEFAULT false NOT NULL,
    id integer NOT NULL
);


ALTER TABLE public.event_themes OWNER TO postgres;

--
-- TOC entry 450 (class 1259 OID 82478)
-- Name: event_themes_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.event_themes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.event_themes_id_seq OWNER TO postgres;

--
-- TOC entry 6236 (class 0 OID 0)
-- Dependencies: 450
-- Name: event_themes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.event_themes_id_seq OWNED BY public.event_themes.id;


--
-- TOC entry 449 (class 1259 OID 76778)
-- Name: event_types; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.event_types (
    name text NOT NULL,
    theme_id integer,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    id integer NOT NULL,
    parent_id integer
);


ALTER TABLE public.event_types OWNER TO postgres;

--
-- TOC entry 451 (class 1259 OID 83694)
-- Name: event_types_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.event_types_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.event_types_id_seq OWNER TO postgres;

--
-- TOC entry 6239 (class 0 OID 0)
-- Dependencies: 451
-- Name: event_types_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.event_types_id_seq OWNED BY public.event_types.id;


--
-- TOC entry 446 (class 1259 OID 70917)
-- Name: events; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.events (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    title text NOT NULL,
    description text,
    venue text NOT NULL,
    start_date date NOT NULL,
    end_date date,
    budget numeric,
    expected_attendees integer,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    start_time time without time zone,
    end_time time without time zone,
    theme_id integer,
    type_id integer,
    status public.event_status_enum DEFAULT 'pending'::public.event_status_enum,
    location text
);

ALTER TABLE ONLY public.events REPLICA IDENTITY FULL;


ALTER TABLE public.events OWNER TO postgres;

--
-- TOC entry 6241 (class 0 OID 0)
-- Dependencies: 446
-- Name: COLUMN events.location; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.events.location IS 'Event location or address';


--
-- TOC entry 461 (class 1259 OID 86496)
-- Name: hospitality_profile_amenities; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.hospitality_profile_amenities (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    hospitality_profile_id uuid NOT NULL,
    amenity_type_id integer NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.hospitality_profile_amenities OWNER TO postgres;

--
-- TOC entry 460 (class 1259 OID 86482)
-- Name: hospitality_profiles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.hospitality_profiles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    business_name text NOT NULL,
    contact_name text,
    email text,
    phone_number text,
    website text,
    city text,
    state text,
    zip text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    hospitality_type integer,
    cost numeric,
    capacity integer,
    make_reservations text
);


ALTER TABLE public.hospitality_profiles OWNER TO postgres;

--
-- TOC entry 463 (class 1259 OID 86527)
-- Name: hospitality_types; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.hospitality_types (
    id integer NOT NULL,
    name text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.hospitality_types OWNER TO postgres;

--
-- TOC entry 462 (class 1259 OID 86526)
-- Name: hospitality_types_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.hospitality_types_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.hospitality_types_id_seq OWNER TO postgres;

--
-- TOC entry 6246 (class 0 OID 0)
-- Dependencies: 462
-- Name: hospitality_types_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.hospitality_types_id_seq OWNED BY public.hospitality_types.id;


--
-- TOC entry 418 (class 1259 OID 34439)
-- Name: notifications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.notifications (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    recipient_id uuid NOT NULL,
    sender_id uuid,
    title text NOT NULL,
    message text NOT NULL,
    type text NOT NULL,
    entity_type text,
    entity_id uuid,
    is_read boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT notifications_entity_type_check CHECK ((entity_type = ANY (ARRAY['task'::text, 'event'::text, 'budget_item'::text]))),
    CONSTRAINT notifications_type_check CHECK ((type = ANY (ARRAY['new_request'::text, 'task_update'::text, 'event_update'::text, 'budget_update'::text])))
);


ALTER TABLE public.notifications OWNER TO postgres;

--
-- TOC entry 499 (class 1259 OID 96502)
-- Name: private_residence_responses; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.private_residence_responses (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    event_id uuid,
    street_address text NOT NULL,
    email text NOT NULL,
    phone_number text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.private_residence_responses OWNER TO postgres;

--
-- TOC entry 438 (class 1259 OID 40306)
-- Name: profiles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.profiles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    username text,
    display_name text,
    bio text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    avatar_url text
);

ALTER TABLE ONLY public.profiles REPLICA IDENTITY FULL;


ALTER TABLE public.profiles OWNER TO postgres;

--
-- TOC entry 497 (class 1259 OID 96446)
-- Name: registry_submissions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.registry_submissions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    book_id text NOT NULL,
    name text NOT NULL,
    email text NOT NULL,
    phone text,
    selected_items jsonb NOT NULL,
    total_amount numeric(10,2) NOT NULL,
    message text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.registry_submissions OWNER TO postgres;

--
-- TOC entry 496 (class 1259 OID 96436)
-- Name: reservation_submissions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.reservation_submissions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    book_id text NOT NULL,
    name text NOT NULL,
    email text NOT NULL,
    phone text NOT NULL,
    party_size integer NOT NULL,
    preferred_date date NOT NULL,
    preferred_time text NOT NULL,
    special_requests text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    venue_id uuid,
    event_id text
);


ALTER TABLE public.reservation_submissions OWNER TO postgres;

--
-- TOC entry 487 (class 1259 OID 91377)
-- Name: resource_categories; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.resource_categories (
    id integer NOT NULL,
    name text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.resource_categories OWNER TO postgres;

--
-- TOC entry 486 (class 1259 OID 91376)
-- Name: resource_categories_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.resource_categories_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.resource_categories_id_seq OWNER TO postgres;

--
-- TOC entry 6254 (class 0 OID 0)
-- Dependencies: 486
-- Name: resource_categories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.resource_categories_id_seq OWNED BY public.resource_categories.id;


--
-- TOC entry 489 (class 1259 OID 91389)
-- Name: resource_status; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.resource_status (
    id integer NOT NULL,
    name text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.resource_status OWNER TO postgres;

--
-- TOC entry 488 (class 1259 OID 91388)
-- Name: resource_status_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.resource_status_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.resource_status_id_seq OWNER TO postgres;

--
-- TOC entry 6257 (class 0 OID 0)
-- Dependencies: 488
-- Name: resource_status_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.resource_status_id_seq OWNED BY public.resource_status.id;


--
-- TOC entry 490 (class 1259 OID 91400)
-- Name: resources; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.resources (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    category_id integer NOT NULL,
    status_id integer,
    location text NOT NULL,
    allocated integer DEFAULT 0 NOT NULL,
    total integer DEFAULT 0 NOT NULL,
    event_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.resources OWNER TO postgres;

--
-- TOC entry 502 (class 1259 OID 100039)
-- Name: role_permission_groups; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.role_permission_groups (
    role public.app_role NOT NULL,
    permission_group public.permission_level NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.role_permission_groups OWNER TO postgres;

--
-- TOC entry 494 (class 1259 OID 96415)
-- Name: rsvp_submissions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.rsvp_submissions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    book_id text NOT NULL,
    guest_name text NOT NULL,
    guest_email text NOT NULL,
    response_type text NOT NULL,
    guest_count integer,
    special_requests text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    event_id text,
    CONSTRAINT rsvp_submissions_response_type_check CHECK ((response_type = ANY (ARRAY['attending'::text, 'not-attending'::text, 'maybe'::text])))
);


ALTER TABLE public.rsvp_submissions OWNER TO postgres;

--
-- TOC entry 480 (class 1259 OID 87815)
-- Name: serv_vendor_rental_assignments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.serv_vendor_rental_assignments (
    id integer NOT NULL,
    serv_vendor_rental_id uuid,
    vendor_rental_type_id integer,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.serv_vendor_rental_assignments OWNER TO postgres;

--
-- TOC entry 479 (class 1259 OID 87814)
-- Name: serv_vendor_rental_types_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.serv_vendor_rental_types_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.serv_vendor_rental_types_id_seq OWNER TO postgres;

--
-- TOC entry 6263 (class 0 OID 0)
-- Dependencies: 479
-- Name: serv_vendor_rental_types_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.serv_vendor_rental_types_id_seq OWNED BY public.serv_vendor_rental_assignments.id;


--
-- TOC entry 478 (class 1259 OID 87803)
-- Name: serv_vendor_rentals; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.serv_vendor_rentals (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    business_name text NOT NULL,
    contact_name text,
    email text,
    phone_number text,
    city text,
    state text,
    zip text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    price numeric,
    description text
);


ALTER TABLE public.serv_vendor_rentals OWNER TO postgres;

--
-- TOC entry 469 (class 1259 OID 87713)
-- Name: serv_vendor_suppliers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.serv_vendor_suppliers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    business_name text NOT NULL,
    contact_name text,
    email text,
    phone_number text,
    city text,
    state text,
    zip text,
    vendor_sup_type_id integer,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    price numeric,
    description text
);


ALTER TABLE public.serv_vendor_suppliers OWNER TO postgres;

--
-- TOC entry 456 (class 1259 OID 86412)
-- Name: supplier_categories; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.supplier_categories (
    id integer NOT NULL,
    name text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.supplier_categories OWNER TO postgres;

--
-- TOC entry 455 (class 1259 OID 86411)
-- Name: supplier_categories_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.supplier_categories_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.supplier_categories_id_seq OWNER TO postgres;

--
-- TOC entry 6268 (class 0 OID 0)
-- Dependencies: 455
-- Name: supplier_categories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.supplier_categories_id_seq OWNED BY public.supplier_categories.id;


--
-- TOC entry 454 (class 1259 OID 86400)
-- Name: supplier_types; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.supplier_types (
    id integer NOT NULL,
    name text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.supplier_types OWNER TO postgres;

--
-- TOC entry 453 (class 1259 OID 86399)
-- Name: supplier_types_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.supplier_types_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.supplier_types_id_seq OWNER TO postgres;

--
-- TOC entry 6271 (class 0 OID 0)
-- Dependencies: 453
-- Name: supplier_types_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.supplier_types_id_seq OWNED BY public.supplier_types.id;


--
-- TOC entry 457 (class 1259 OID 86423)
-- Name: suppliers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.suppliers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    business_name text NOT NULL,
    contact_name text,
    email text,
    phone_number text,
    city text,
    state text,
    zip text,
    type_id integer,
    category_id integer,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    price numeric,
    description text,
    inventory_images text
);


ALTER TABLE public.suppliers OWNER TO postgres;

--
-- TOC entry 447 (class 1259 OID 71074)
-- Name: tasks; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tasks (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    event_id uuid,
    title text NOT NULL,
    description text,
    assigned_to uuid,
    status public.task_status DEFAULT 'not_started'::public.task_status,
    priority public.task_priority DEFAULT 'medium'::public.task_priority NOT NULL,
    estimated_hours numeric,
    actual_hours numeric,
    due_date timestamp with time zone,
    created_by uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    assigned_venue_role text,
    assigned_supplier_vendor_role text,
    assigned_service_vendor_role text,
    assined_vendor_role text,
    start_time time without time zone,
    end_time time without time zone,
    start_date date,
    end_date date,
    archived boolean DEFAULT false NOT NULL,
    category text,
    assigned_coordinator_name text
);


ALTER TABLE public.tasks OWNER TO postgres;

--
-- TOC entry 6274 (class 0 OID 0)
-- Dependencies: 447
-- Name: COLUMN tasks.category; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.tasks.category IS 'Task category based on collaborator type (e.g., Bookings, Venue, Hospitality, Suppliers, Services)';


--
-- TOC entry 6275 (class 0 OID 0)
-- Dependencies: 447
-- Name: COLUMN tasks.assigned_coordinator_name; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.tasks.assigned_coordinator_name IS 'Manually entered coordinator name for task assignment';


--
-- TOC entry 415 (class 1259 OID 33253)
-- Name: tasks_assignments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tasks_assignments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    event_id uuid NOT NULL,
    event_theme text NOT NULL,
    description text,
    assigned_to uuid,
    status public.task_status DEFAULT 'not_started'::public.task_status,
    priority public.task_priority DEFAULT 'medium'::public.task_priority NOT NULL,
    estimated_hours numeric(5,2),
    actual_hours numeric(5,2),
    due_date timestamp with time zone,
    created_by uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    task_name text
);


ALTER TABLE public.tasks_assignments OWNER TO postgres;

--
-- TOC entry 452 (class 1259 OID 85246)
-- Name: tasks_dependencies; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tasks_dependencies (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    task_id uuid NOT NULL,
    depends_on_task_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.tasks_dependencies OWNER TO postgres;

--
-- TOC entry 493 (class 1259 OID 91478)
-- Name: team_assignments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.team_assignments (
    id integer NOT NULL,
    team_id uuid NOT NULL,
    user_id uuid NOT NULL,
    team_admin boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    is_viewer boolean DEFAULT false NOT NULL,
    is_coordinator boolean DEFAULT false NOT NULL
);


ALTER TABLE public.team_assignments OWNER TO postgres;

--
-- TOC entry 492 (class 1259 OID 91477)
-- Name: team_assignments_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.team_assignments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.team_assignments_id_seq OWNER TO postgres;

--
-- TOC entry 6280 (class 0 OID 0)
-- Dependencies: 492
-- Name: team_assignments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.team_assignments_id_seq OWNED BY public.team_assignments.id;


--
-- TOC entry 491 (class 1259 OID 91439)
-- Name: teams; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.teams (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.teams OWNER TO postgres;

--
-- TOC entry 485 (class 1259 OID 90240)
-- Name: template_tasks; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.template_tasks (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    template_id uuid NOT NULL,
    user_id uuid NOT NULL,
    title text NOT NULL,
    description text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.template_tasks OWNER TO postgres;

--
-- TOC entry 484 (class 1259 OID 90225)
-- Name: templates; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.templates (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    name text NOT NULL,
    description text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.templates OWNER TO postgres;

--
-- TOC entry 472 (class 1259 OID 87743)
-- Name: transportation_profiles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.transportation_profiles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    business_name text NOT NULL,
    contact_name text,
    email text,
    phone_number text,
    city text,
    state text,
    zip text,
    capacity integer,
    transp_type_id integer,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    seating_capacity integer,
    price numeric,
    description text,
    special_accommodations text[],
    transpo_images text
);


ALTER TABLE public.transportation_profiles OWNER TO postgres;

--
-- TOC entry 471 (class 1259 OID 87732)
-- Name: transportation_types; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.transportation_types (
    id integer NOT NULL,
    name text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.transportation_types OWNER TO postgres;

--
-- TOC entry 470 (class 1259 OID 87731)
-- Name: transportation_types_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.transportation_types_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.transportation_types_id_seq OWNER TO postgres;

--
-- TOC entry 6287 (class 0 OID 0)
-- Dependencies: 470
-- Name: transportation_types_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.transportation_types_id_seq OWNED BY public.transportation_types.id;


--
-- TOC entry 539 (class 1259 OID 169971)
-- Name: unified_audit_events; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.unified_audit_events AS
 SELECT 'cm'::text AS source,
    id,
    created_at,
    user_id,
    event_id,
    type,
    description,
    payload
   FROM public.cm_audit_events cae;


ALTER VIEW public.unified_audit_events OWNER TO postgres;

--
-- TOC entry 531 (class 1259 OID 136894)
-- Name: unified_locations; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.unified_locations AS
 SELECT 'cm'::text AS source,
    id,
    event_id,
    name,
    address
   FROM public.cm_locations cl;


ALTER VIEW public.unified_locations OWNER TO postgres;

--
-- TOC entry 530 (class 1259 OID 136890)
-- Name: unified_resources; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.unified_resources AS
 SELECT 'main'::text AS source,
    r.id,
    r.event_id,
    r.name,
    NULL::text AS role,
    NULL::uuid AS location_id,
    NULL::jsonb AS availability
   FROM public.resources r
UNION ALL
 SELECT 'cm'::text AS source,
    cr.id,
    cr.event_id,
    cr.name,
    cr.role,
    cr.location_id,
    cr.availability
   FROM public.cm_resources cr;


ALTER VIEW public.unified_resources OWNER TO postgres;

--
-- TOC entry 529 (class 1259 OID 136885)
-- Name: unified_tasks; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.unified_tasks AS
 SELECT 'main'::text AS source,
    t.id,
    t.event_id,
    t.title AS name,
    t.start_date,
    t.end_date,
    NULL::uuid AS depends_on,
    NULL::boolean AS locked,
    (t.status)::text AS status
   FROM public.tasks t
UNION ALL
 SELECT 'cm'::text AS source,
    ct.id,
    ct.event_id,
    ct.name,
    (ct.start_date)::date AS start_date,
    (ct.end_date)::date AS end_date,
    ct.depends_on,
    ct.locked,
    ct.status
   FROM public.cm_tasks ct;


ALTER VIEW public.unified_tasks OWNER TO postgres;

--
-- TOC entry 501 (class 1259 OID 100015)
-- Name: user_roles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    role public.app_role NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    permission_level public.permission_level,
    event_id uuid
);

ALTER TABLE ONLY public.user_roles REPLICA IDENTITY FULL;


ALTER TABLE public.user_roles OWNER TO postgres;

--
-- TOC entry 477 (class 1259 OID 87792)
-- Name: vendor_rental_types; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.vendor_rental_types (
    id integer NOT NULL,
    name text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.vendor_rental_types OWNER TO postgres;

--
-- TOC entry 476 (class 1259 OID 87791)
-- Name: vendor_rental_types_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.vendor_rental_types_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.vendor_rental_types_id_seq OWNER TO postgres;

--
-- TOC entry 6295 (class 0 OID 0)
-- Dependencies: 476
-- Name: vendor_rental_types_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.vendor_rental_types_id_seq OWNED BY public.vendor_rental_types.id;


--
-- TOC entry 468 (class 1259 OID 87702)
-- Name: vendor_supplier_types; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.vendor_supplier_types (
    id integer NOT NULL,
    name text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.vendor_supplier_types OWNER TO postgres;

--
-- TOC entry 467 (class 1259 OID 87701)
-- Name: vendor_supplier_types_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.vendor_supplier_types_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.vendor_supplier_types_id_seq OWNER TO postgres;

--
-- TOC entry 6298 (class 0 OID 0)
-- Dependencies: 467
-- Name: vendor_supplier_types_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.vendor_supplier_types_id_seq OWNED BY public.vendor_supplier_types.id;


--
-- TOC entry 465 (class 1259 OID 87672)
-- Name: venue_types; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.venue_types (
    id integer NOT NULL,
    name text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.venue_types OWNER TO postgres;

--
-- TOC entry 464 (class 1259 OID 87671)
-- Name: venue_types_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.venue_types_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.venue_types_id_seq OWNER TO postgres;

--
-- TOC entry 6301 (class 0 OID 0)
-- Dependencies: 464
-- Name: venue_types_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.venue_types_id_seq OWNED BY public.venue_types.id;


--
-- TOC entry 466 (class 1259 OID 87683)
-- Name: venues; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.venues (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    business_name text NOT NULL,
    contact_name text,
    email text,
    phone_number text,
    city text,
    state text,
    zip text,
    capacity integer,
    venue_type_id integer,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    user_id uuid,
    cost numeric,
    venue_images text
);


ALTER TABLE public.venues OWNER TO postgres;

--
-- TOC entry 482 (class 1259 OID 90126)
-- Name: workflow_types; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.workflow_types (
    id integer NOT NULL,
    name text NOT NULL,
    description text,
    tags text[],
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.workflow_types OWNER TO postgres;

--
-- TOC entry 481 (class 1259 OID 90125)
-- Name: workflow_types_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.workflow_types_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.workflow_types_id_seq OWNER TO postgres;

--
-- TOC entry 6305 (class 0 OID 0)
-- Dependencies: 481
-- Name: workflow_types_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.workflow_types_id_seq OWNED BY public.workflow_types.id;


--
-- TOC entry 483 (class 1259 OID 90161)
-- Name: workflows; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.workflows (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    workflow_type_id integer,
    user_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    theme_id integer,
    hospitality_id uuid,
    venue_id uuid,
    supplier_id uuid,
    serv_vendor_sup_id uuid,
    serv_vendor_rent_id uuid,
    event_id uuid NOT NULL
);


ALTER TABLE public.workflows OWNER TO postgres;

--
CREATE INDEX idx_ceo_change_requests_entity ON "Cm_Event_Orchestration".change_requests USING btree (entity_type, entity_id);


--
-- TOC entry 5001 (class 1259 OID 129530)
-- Name: idx_ceo_change_requests_event; Type: INDEX; Schema: Cm_Event_Orchestration; Owner: postgres
--

CREATE INDEX idx_ceo_change_requests_event ON "Cm_Event_Orchestration".change_requests USING btree (event_id);


--
-- TOC entry 5002 (class 1259 OID 129531)
-- Name: idx_ceo_change_requests_requested_by; Type: INDEX; Schema: Cm_Event_Orchestration; Owner: postgres
--

CREATE INDEX idx_ceo_change_requests_requested_by ON "Cm_Event_Orchestration".change_requests USING btree (requested_by);


--
-- TOC entry 5003 (class 1259 OID 129528)
-- Name: idx_ceo_change_requests_status; Type: INDEX; Schema: Cm_Event_Orchestration; Owner: postgres
--

CREATE INDEX idx_ceo_change_requests_status ON "Cm_Event_Orchestration".change_requests USING btree (status);


--
CREATE INDEX idx_eos_change_requests_requested_by ON event_orchestration_saas.change_requests USING btree (requested_by);


--
-- TOC entry 4995 (class 1259 OID 129678)
-- Name: idx_eos_change_requests_status; Type: INDEX; Schema: event_orchestration_saas; Owner: postgres
--

CREATE INDEX idx_eos_change_requests_status ON event_orchestration_saas.change_requests USING btree (status);


--
-- TOC entry 5024 (class 1259 OID 136529)
-- Name: cm_audit_events_created_at_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX cm_audit_events_created_at_idx ON public.cm_audit_events USING btree (created_at DESC);


--
-- TOC entry 5025 (class 1259 OID 136527)
-- Name: cm_audit_events_event_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX cm_audit_events_event_id_idx ON public.cm_audit_events USING btree (event_id);


--
-- TOC entry 5028 (class 1259 OID 136528)
-- Name: cm_audit_events_type_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX cm_audit_events_type_idx ON public.cm_audit_events USING btree (type);


--
-- TOC entry 5019 (class 1259 OID 136515)
-- Name: cm_change_requests_event_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX cm_change_requests_event_id_idx ON public.cm_change_requests USING btree (event_id);


--
-- TOC entry 5022 (class 1259 OID 136517)
-- Name: cm_change_requests_requested_by_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX cm_change_requests_requested_by_idx ON public.cm_change_requests USING btree (requested_by);


--
-- TOC entry 5023 (class 1259 OID 136516)
-- Name: cm_change_requests_task_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX cm_change_requests_task_id_idx ON public.cm_change_requests USING btree (task_id);


--
-- TOC entry 5008 (class 1259 OID 136483)
-- Name: cm_locations_event_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX cm_locations_event_id_idx ON public.cm_locations USING btree (event_id);


--
-- TOC entry 5011 (class 1259 OID 136492)
-- Name: cm_resources_event_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX cm_resources_event_id_idx ON public.cm_resources USING btree (event_id);


--
-- TOC entry 5012 (class 1259 OID 136493)
-- Name: cm_resources_location_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX cm_resources_location_id_idx ON public.cm_resources USING btree (location_id);


--
-- TOC entry 5015 (class 1259 OID 136504)
-- Name: cm_tasks_depends_on_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX cm_tasks_depends_on_idx ON public.cm_tasks USING btree (depends_on);


--
-- TOC entry 5016 (class 1259 OID 136503)
-- Name: cm_tasks_event_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX cm_tasks_event_id_idx ON public.cm_tasks USING btree (event_id);


--
-- TOC entry 4959 (class 1259 OID 96491)
-- Name: idx_barcode_book_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_barcode_book_id ON public.barcode_submissions USING btree (book_id);


--
-- TOC entry 4960 (class 1259 OID 96492)
-- Name: idx_barcode_ticket; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_barcode_ticket ON public.barcode_submissions USING btree (ticket_number);


--
-- TOC entry 4773 (class 1259 OID 98751)
-- Name: idx_bookings_directory_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_bookings_directory_user_id ON public."Bookings Directory" USING btree (user_id);


--
-- TOC entry 4796 (class 1259 OID 82477)
-- Name: idx_budget_items_archived; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_budget_items_archived ON public.budget_items USING btree (archived);


--
-- TOC entry 5029 (class 1259 OID 169977)
-- Name: idx_cm_audit_events_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_cm_audit_events_created_at ON public.cm_audit_events USING btree (created_at);


--
-- TOC entry 5030 (class 1259 OID 169975)
-- Name: idx_cm_audit_events_event; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_cm_audit_events_event ON public.cm_audit_events USING btree (event_id);


--
-- TOC entry 5031 (class 1259 OID 169976)
-- Name: idx_cm_audit_events_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_cm_audit_events_user ON public.cm_audit_events USING btree (user_id);


--
-- TOC entry 4946 (class 1259 OID 96486)
-- Name: idx_confirmation_book_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_confirmation_book_id ON public.confirmation_submissions USING btree (book_id);


--
-- TOC entry 4947 (class 1259 OID 96487)
-- Name: idx_confirmation_number; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_confirmation_number ON public.confirmation_submissions USING btree (confirmation_number);


--
-- TOC entry 4845 (class 1259 OID 82520)
-- Name: idx_event_types_theme_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_event_types_theme_id ON public.event_types USING btree (theme_id);


--
-- TOC entry 4837 (class 1259 OID 82529)
-- Name: idx_events_theme_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_events_theme_id ON public.events USING btree (theme_id);


--
-- TOC entry 4880 (class 1259 OID 86523)
-- Name: idx_hospitality_profile_amenities_amenity_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_hospitality_profile_amenities_amenity_id ON public.hospitality_profile_amenities USING btree (amenity_type_id);


--
-- TOC entry 4881 (class 1259 OID 86522)
-- Name: idx_hospitality_profile_amenities_profile_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_hospitality_profile_amenities_profile_id ON public.hospitality_profile_amenities USING btree (hospitality_profile_id);


--
-- TOC entry 4874 (class 1259 OID 86520)
-- Name: idx_hospitality_profiles_business_name; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_hospitality_profiles_business_name ON public.hospitality_profiles USING btree (business_name);


--
-- TOC entry 4875 (class 1259 OID 86521)
-- Name: idx_hospitality_profiles_city_state; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_hospitality_profiles_city_state ON public.hospitality_profiles USING btree (city, state);


--
-- TOC entry 4952 (class 1259 OID 96490)
-- Name: idx_registry_book_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_registry_book_id ON public.registry_submissions USING btree (book_id);


--
-- TOC entry 4948 (class 1259 OID 96488)
-- Name: idx_reservation_book_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_reservation_book_id ON public.reservation_submissions USING btree (book_id);


--
-- TOC entry 4949 (class 1259 OID 96489)
-- Name: idx_reservation_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_reservation_email ON public.reservation_submissions USING btree (email);


--
-- TOC entry 4929 (class 1259 OID 91436)
-- Name: idx_resources_category_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_resources_category_id ON public.resources USING btree (category_id);


--
-- TOC entry 4930 (class 1259 OID 91435)
-- Name: idx_resources_event_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_resources_event_id ON public.resources USING btree (event_id);


--
-- TOC entry 4931 (class 1259 OID 91437)
-- Name: idx_resources_status_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_resources_status_id ON public.resources USING btree (status_id);


--
-- TOC entry 4940 (class 1259 OID 96484)
-- Name: idx_rsvp_book_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_rsvp_book_id ON public.rsvp_submissions USING btree (book_id);


--
-- TOC entry 4941 (class 1259 OID 96485)
-- Name: idx_rsvp_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_rsvp_email ON public.rsvp_submissions USING btree (guest_email);


--
-- TOC entry 4860 (class 1259 OID 86454)
-- Name: idx_suppliers_business_name; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_suppliers_business_name ON public.suppliers USING btree (business_name);


--
-- TOC entry 4861 (class 1259 OID 86453)
-- Name: idx_suppliers_category_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_suppliers_category_id ON public.suppliers USING btree (category_id);


--
-- TOC entry 4862 (class 1259 OID 86455)
-- Name: idx_suppliers_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_suppliers_email ON public.suppliers USING btree (email);


--
-- TOC entry 4863 (class 1259 OID 86452)
-- Name: idx_suppliers_type_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_suppliers_type_id ON public.suppliers USING btree (type_id);


--
-- TOC entry 4838 (class 1259 OID 100064)
-- Name: idx_tasks_category; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tasks_category ON public.tasks USING btree (category);


--
-- TOC entry 4846 (class 1259 OID 85269)
-- Name: idx_tasks_dependencies_depends_on; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tasks_dependencies_depends_on ON public.tasks_dependencies USING btree (depends_on_task_id);


--
-- TOC entry 4847 (class 1259 OID 85268)
-- Name: idx_tasks_dependencies_task_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tasks_dependencies_task_id ON public.tasks_dependencies USING btree (task_id);


--
-- TOC entry 4790 (class 1259 OID 34463)
-- Name: idx_tasks_estimate_hours; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tasks_estimate_hours ON public.tasks_assignments USING btree (estimated_hours) WHERE (estimated_hours IS NOT NULL);


--
-- TOC entry 4791 (class 1259 OID 34462)
-- Name: idx_tasks_event_due_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tasks_event_due_date ON public.tasks_assignments USING btree (event_id, due_date);


--
-- TOC entry 4823 (class 1259 OID 41508)
-- Name: idx_user_profile_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_user_profile_user_id ON public."User Profile" USING btree (user_id);


--
-- TOC entry 4965 (class 1259 OID 129537)
-- Name: idx_user_roles_user_event; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_user_roles_user_event ON public.user_roles USING btree (user_id, event_id);


--
-- TOC entry 4912 (class 1259 OID 90224)
-- Name: idx_workflows_event_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_workflows_event_id ON public.workflows USING btree (event_id);


--
-- TOC entry 4968 (class 1259 OID 103642)
-- Name: user_roles_user_event_unique; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX user_roles_user_event_unique ON public.user_roles USING btree (user_id, COALESCE(event_id, '00000000-0000-0000-0000-000000000000'::uuid));


--
CREATE TRIGGER log_budget_item_changes_trigger AFTER INSERT OR DELETE OR UPDATE ON public.budget_items FOR EACH ROW EXECUTE FUNCTION public.log_budget_item_changes();


--
-- TOC entry 5154 (class 2620 OID 17043)
-- Name: tasks log_task_changes_trigger; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER log_task_changes_trigger AFTER INSERT OR DELETE OR UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION public.log_task_changes();


--
-- TOC entry 5182 (class 2620 OID 17044)
-- Name: barcode_submissions set_updated_at_barcode; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER set_updated_at_barcode BEFORE UPDATE ON public.barcode_submissions FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--
-- TOC entry 5179 (class 2620 OID 17045)
-- Name: confirmation_submissions set_updated_at_confirmation; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER set_updated_at_confirmation BEFORE UPDATE ON public.confirmation_submissions FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--
-- TOC entry 5181 (class 2620 OID 17046)
-- Name: registry_submissions set_updated_at_registry; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER set_updated_at_registry BEFORE UPDATE ON public.registry_submissions FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--
-- TOC entry 5180 (class 2620 OID 17047)
-- Name: reservation_submissions set_updated_at_reservation; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER set_updated_at_reservation BEFORE UPDATE ON public.reservation_submissions FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--
-- TOC entry 5178 (class 2620 OID 17048)
-- Name: rsvp_submissions set_updated_at_rsvp; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER set_updated_at_rsvp BEFORE UPDATE ON public.rsvp_submissions FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--
-- TOC entry 5150 (class 2620 OID 17049)
-- Name: User Profile set_user_profile_user_id_trigger; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER set_user_profile_user_id_trigger BEFORE INSERT ON public."User Profile" FOR EACH ROW EXECUTE FUNCTION public.set_user_profile_user_id();


--
-- TOC entry 5144 (class 2620 OID 17050)
-- Name: Create Event sync_new_events_to_manage; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER sync_new_events_to_manage AFTER INSERT ON public."Create Event" FOR EACH ROW EXECUTE FUNCTION public.sync_create_event_to_manage_event();


--
-- TOC entry 5145 (class 2620 OID 17051)
-- Name: tasks_assignments task_estimate_change_trigger; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER task_estimate_change_trigger AFTER UPDATE ON public.tasks_assignments FOR EACH ROW EXECUTE FUNCTION public.handle_task_estimate_change();


--
-- TOC entry 5143 (class 2620 OID 17052)
-- Name: Authorization trg_scrub_authorization_sensitive_fields; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_scrub_authorization_sensitive_fields BEFORE INSERT OR UPDATE ON public."Authorization" FOR EACH ROW EXECUTE FUNCTION public.scrub_authorization_sensitive_fields();


--
-- TOC entry 5157 (class 2620 OID 17053)
-- Name: amenity_types update_amenity_types_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_amenity_types_updated_at BEFORE UPDATE ON public.amenity_types FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 5148 (class 2620 OID 17054)
-- Name: budget_items update_budget_items_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_budget_items_updated_at BEFORE UPDATE ON public.budget_items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 5184 (class 2620 OID 17055)
-- Name: collaborator_configurations update_collaborator_configurations_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_collaborator_configurations_updated_at BEFORE UPDATE ON public.collaborator_configurations FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--
-- TOC entry 5166 (class 2620 OID 17056)
-- Name: entertainment_types update_entertainment_types_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_entertainment_types_updated_at BEFORE UPDATE ON public.entertainment_types FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 5167 (class 2620 OID 17057)
-- Name: entertainments update_entertainments_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_entertainments_updated_at BEFORE UPDATE ON public.entertainments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 5153 (class 2620 OID 17058)
-- Name: events update_events_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON public.events FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 5158 (class 2620 OID 17059)
-- Name: hospitality_profiles update_hospitality_profiles_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_hospitality_profiles_updated_at BEFORE UPDATE ON public.hospitality_profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 5159 (class 2620 OID 17060)
-- Name: hospitality_types update_hospitality_types_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_hospitality_types_updated_at BEFORE UPDATE ON public.hospitality_types FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 5183 (class 2620 OID 17061)
-- Name: private_residence_responses update_private_residence_responses_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_private_residence_responses_updated_at BEFORE UPDATE ON public.private_residence_responses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 5149 (class 2620 OID 17062)
-- Name: profiles update_profiles_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 5175 (class 2620 OID 17063)
-- Name: resources update_resources_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_resources_updated_at BEFORE UPDATE ON public.resources FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 5170 (class 2620 OID 17064)
-- Name: serv_vendor_rental_assignments update_serv_vendor_rental_types_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_serv_vendor_rental_types_updated_at BEFORE UPDATE ON public.serv_vendor_rental_assignments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 5169 (class 2620 OID 17065)
-- Name: serv_vendor_rentals update_serv_vendor_rentals_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_serv_vendor_rentals_updated_at BEFORE UPDATE ON public.serv_vendor_rentals FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 5163 (class 2620 OID 17066)
-- Name: serv_vendor_suppliers update_serv_vendor_suppliers_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_serv_vendor_suppliers_updated_at BEFORE UPDATE ON public.serv_vendor_suppliers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 5156 (class 2620 OID 17067)
-- Name: suppliers update_suppliers_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON public.suppliers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 5155 (class 2620 OID 17068)
-- Name: tasks update_tasks_new_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_tasks_new_updated_at BEFORE UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 5146 (class 2620 OID 17069)
-- Name: tasks_assignments update_tasks_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON public.tasks_assignments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 5177 (class 2620 OID 17070)
-- Name: team_assignments update_team_assignments_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_team_assignments_updated_at BEFORE UPDATE ON public.team_assignments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 5176 (class 2620 OID 17071)
-- Name: teams update_teams_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_teams_updated_at BEFORE UPDATE ON public.teams FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 5174 (class 2620 OID 17072)
-- Name: template_tasks update_template_tasks_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_template_tasks_updated_at BEFORE UPDATE ON public.template_tasks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 5173 (class 2620 OID 17073)
-- Name: templates update_templates_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_templates_updated_at BEFORE UPDATE ON public.templates FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 5164 (class 2620 OID 17074)
-- Name: transportation_types update_transportation_types_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_transportation_types_updated_at BEFORE UPDATE ON public.transportation_types FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 5165 (class 2620 OID 17075)
-- Name: transportation_profiles update_transportations_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_transportations_updated_at BEFORE UPDATE ON public.transportation_profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 5168 (class 2620 OID 17076)
-- Name: vendor_rental_types update_vendor_rental_types_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_vendor_rental_types_updated_at BEFORE UPDATE ON public.vendor_rental_types FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 5162 (class 2620 OID 17077)
-- Name: vendor_supplier_types update_vendor_supplier_types_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_vendor_supplier_types_updated_at BEFORE UPDATE ON public.vendor_supplier_types FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 5160 (class 2620 OID 17078)
-- Name: venue_types update_venue_types_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_venue_types_updated_at BEFORE UPDATE ON public.venue_types FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 5161 (class 2620 OID 17079)
-- Name: venues update_venues_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_venues_updated_at BEFORE UPDATE ON public.venues FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 5171 (class 2620 OID 17080)
-- Name: workflow_types update_workflow_types_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_workflow_types_updated_at BEFORE UPDATE ON public.workflow_types FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 5172 (class 2620 OID 17081)
-- Name: workflows update_workflows_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_workflows_updated_at BEFORE UPDATE ON public.workflows FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
CREATE POLICY ce_insert_any_auth ON "Cm_Event_Orchestration".change_events FOR INSERT TO authenticated WITH CHECK (true);


--
-- TOC entry 5629 (class 3256 OID 129535)
-- Name: change_events ce_read_if_related_visible; Type: POLICY; Schema: Cm_Event_Orchestration; Owner: postgres
--

CREATE POLICY ce_read_if_related_visible ON "Cm_Event_Orchestration".change_events FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM "Cm_Event_Orchestration".change_requests cr
  WHERE ((cr.id = change_events.change_request_id) AND ((cr.requested_by = ( SELECT auth.uid() AS uid)) OR (EXISTS ( SELECT 1
           FROM public.user_roles ur
          WHERE ((ur.user_id = ( SELECT auth.uid() AS uid)) AND ((ur.event_id = cr.event_id) OR (cr.event_id IS NULL))))))))));


--
-- TOC entry 5443 (class 0 OID 129513)
-- Dependencies: 522
-- Name: change_events; Type: ROW SECURITY; Schema: Cm_Event_Orchestration; Owner: postgres
--

ALTER TABLE "Cm_Event_Orchestration".change_events ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 5442 (class 0 OID 129501)
-- Dependencies: 521
-- Name: change_requests; Type: ROW SECURITY; Schema: Cm_Event_Orchestration; Owner: postgres
--

ALTER TABLE "Cm_Event_Orchestration".change_requests ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 5627 (class 3256 OID 129533)
-- Name: change_requests cr_insert_own; Type: POLICY; Schema: Cm_Event_Orchestration; Owner: postgres
--

CREATE POLICY cr_insert_own ON "Cm_Event_Orchestration".change_requests FOR INSERT TO authenticated WITH CHECK ((( SELECT auth.uid() AS uid) = requested_by));


--
-- TOC entry 5626 (class 3256 OID 129532)
-- Name: change_requests cr_read_owner_or_collab; Type: POLICY; Schema: Cm_Event_Orchestration; Owner: postgres
--

CREATE POLICY cr_read_owner_or_collab ON "Cm_Event_Orchestration".change_requests FOR SELECT TO authenticated USING (((( SELECT auth.uid() AS uid) = requested_by) OR (EXISTS ( SELECT 1
   FROM public.user_roles ur
  WHERE ((ur.user_id = ( SELECT auth.uid() AS uid)) AND ((ur.event_id = change_requests.event_id) OR (change_requests.event_id IS NULL)))))));


--
-- TOC entry 5628 (class 3256 OID 129534)
-- Name: change_requests cr_update_own; Type: POLICY; Schema: Cm_Event_Orchestration; Owner: postgres
--

CREATE POLICY cr_update_own ON "Cm_Event_Orchestration".change_requests FOR UPDATE TO authenticated USING ((( SELECT auth.uid() AS uid) = requested_by)) WITH CHECK (true);


--
CREATE POLICY ce_insert_any_auth ON event_orchestration_saas.change_events FOR INSERT TO authenticated WITH CHECK (true);


--
-- TOC entry 5636 (class 3256 OID 129675)
-- Name: change_events ce_read_if_related_visible; Type: POLICY; Schema: event_orchestration_saas; Owner: postgres
--

CREATE POLICY ce_read_if_related_visible ON event_orchestration_saas.change_events FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM event_orchestration_saas.change_requests cr
  WHERE ((cr.id = change_events.change_request_id) AND ((cr.requested_by = ( SELECT auth.uid() AS uid)) OR (EXISTS ( SELECT 1
           FROM public.user_roles ur
          WHERE ((ur.user_id = ( SELECT auth.uid() AS uid)) AND ((ur.event_id = cr.event_id) OR (cr.event_id IS NULL))))))))));


--
-- TOC entry 5441 (class 0 OID 129483)
-- Dependencies: 520
-- Name: change_events; Type: ROW SECURITY; Schema: event_orchestration_saas; Owner: postgres
--

ALTER TABLE event_orchestration_saas.change_events ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 5440 (class 0 OID 129471)
-- Dependencies: 519
-- Name: change_requests; Type: ROW SECURITY; Schema: event_orchestration_saas; Owner: postgres
--

ALTER TABLE event_orchestration_saas.change_requests ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 5632 (class 3256 OID 129671)
-- Name: change_requests cr_insert_own; Type: POLICY; Schema: event_orchestration_saas; Owner: postgres
--

CREATE POLICY cr_insert_own ON event_orchestration_saas.change_requests FOR INSERT TO authenticated WITH CHECK ((( SELECT auth.uid() AS uid) = requested_by));


--
-- TOC entry 5633 (class 3256 OID 129672)
-- Name: change_requests cr_read_owner_or_collab; Type: POLICY; Schema: event_orchestration_saas; Owner: postgres
--

CREATE POLICY cr_read_owner_or_collab ON event_orchestration_saas.change_requests FOR SELECT TO authenticated USING (((( SELECT auth.uid() AS uid) = requested_by) OR (EXISTS ( SELECT 1
   FROM public.user_roles ur
  WHERE ((ur.user_id = ( SELECT auth.uid() AS uid)) AND ((ur.event_id = change_requests.event_id) OR (change_requests.event_id IS NULL)))))));


--
-- TOC entry 5634 (class 3256 OID 129673)
-- Name: change_requests cr_update_own; Type: POLICY; Schema: event_orchestration_saas; Owner: postgres
--

CREATE POLICY cr_update_own ON event_orchestration_saas.change_requests FOR UPDATE TO authenticated USING ((( SELECT auth.uid() AS uid) = requested_by)) WITH CHECK (true);


--
-- TOC entry 5452 (class 3256 OID 17445)
-- Name: budget_items Admins can delete budget items; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can delete budget items" ON public.budget_items FOR DELETE USING (public.has_permission_level(auth.uid(), 'admin'::public.permission_level));


--
-- TOC entry 5453 (class 3256 OID 17446)
-- Name: Create Event Admins can delete events; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can delete events" ON public."Create Event" FOR DELETE USING (public.has_permission_level(auth.uid(), 'admin'::public.permission_level));


--
-- TOC entry 5454 (class 3256 OID 17447)
-- Name: Manage Event Admins can delete managed events; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can delete managed events" ON public."Manage Event" FOR DELETE USING (public.has_permission_level(auth.uid(), 'admin'::public.permission_level));


--
-- TOC entry 5455 (class 3256 OID 17448)
-- Name: user_roles Admins can delete role assignments; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can delete role assignments" ON public.user_roles FOR DELETE USING (public.has_permission_level(auth.uid(), 'admin'::public.permission_level));


--
-- TOC entry 5456 (class 3256 OID 17449)
-- Name: user_roles Admins can insert role assignments; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can insert role assignments" ON public.user_roles FOR INSERT WITH CHECK (public.has_permission_level(auth.uid(), 'admin'::public.permission_level));


--
-- TOC entry 5457 (class 3256 OID 17450)
-- Name: user_roles Admins can update role assignments; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can update role assignments" ON public.user_roles FOR UPDATE USING (public.has_permission_level(auth.uid(), 'admin'::public.permission_level)) WITH CHECK (public.has_permission_level(auth.uid(), 'admin'::public.permission_level));


--
-- TOC entry 5458 (class 3256 OID 17451)
-- Name: budget_items Admins can view all budget items; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can view all budget items" ON public.budget_items FOR SELECT USING (public.has_permission_level(auth.uid(), 'admin'::public.permission_level));


--
-- TOC entry 5459 (class 3256 OID 17452)
-- Name: Create Event Admins can view all events; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can view all events" ON public."Create Event" FOR SELECT USING (public.has_permission_level(auth.uid(), 'admin'::public.permission_level));


--
-- TOC entry 5460 (class 3256 OID 17453)
-- Name: Manage Event Admins can view all managed events; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can view all managed events" ON public."Manage Event" FOR SELECT USING (public.has_permission_level(auth.uid(), 'admin'::public.permission_level));


--
-- TOC entry 5461 (class 3256 OID 17454)
-- Name: user_roles Admins can view all role assignments; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can view all role assignments" ON public.user_roles FOR SELECT USING (public.has_permission_level(auth.uid(), 'admin'::public.permission_level));


--
-- TOC entry 5462 (class 3256 OID 17455)
-- Name: rsvp_submissions Anyone can create RSVP submissions; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Anyone can create RSVP submissions" ON public.rsvp_submissions FOR INSERT WITH CHECK (true);


--
-- TOC entry 5463 (class 3256 OID 17456)
-- Name: barcode_submissions Anyone can create barcode submissions; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Anyone can create barcode submissions" ON public.barcode_submissions FOR INSERT WITH CHECK (true);


--
-- TOC entry 5464 (class 3256 OID 17457)
-- Name: confirmation_submissions Anyone can create confirmation submissions; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Anyone can create confirmation submissions" ON public.confirmation_submissions FOR INSERT WITH CHECK (true);


--
-- TOC entry 5465 (class 3256 OID 17458)
-- Name: registry_submissions Anyone can create registry submissions; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Anyone can create registry submissions" ON public.registry_submissions FOR INSERT WITH CHECK (true);


--
-- TOC entry 5466 (class 3256 OID 17459)
-- Name: reservation_submissions Anyone can create reservation submissions; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Anyone can create reservation submissions" ON public.reservation_submissions FOR INSERT WITH CHECK (true);


--
-- TOC entry 5467 (class 3256 OID 17460)
-- Name: rsvp_submissions Anyone can view RSVP submissions; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Anyone can view RSVP submissions" ON public.rsvp_submissions FOR SELECT USING (true);


--
-- TOC entry 5468 (class 3256 OID 17461)
-- Name: amenity_types Anyone can view amenity types; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Anyone can view amenity types" ON public.amenity_types FOR SELECT USING (true);


--
-- TOC entry 5469 (class 3256 OID 17462)
-- Name: barcode_submissions Anyone can view barcode submissions; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Anyone can view barcode submissions" ON public.barcode_submissions FOR SELECT USING (true);


--
-- TOC entry 5470 (class 3256 OID 17463)
-- Name: Collaborators Anyone can view collaborators directory; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Anyone can view collaborators directory" ON public."Collaborators" FOR SELECT USING (true);


--
-- TOC entry 5471 (class 3256 OID 17464)
-- Name: confirmation_submissions Anyone can view confirmation submissions; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Anyone can view confirmation submissions" ON public.confirmation_submissions FOR SELECT USING (true);


--
-- TOC entry 5472 (class 3256 OID 17465)
-- Name: Entertainment Directory Anyone can view entertainment directory; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Anyone can view entertainment directory" ON public."Entertainment Directory" FOR SELECT USING (true);


--
-- TOC entry 5473 (class 3256 OID 17466)
-- Name: Entertainment Profile Anyone can view entertainment profiles; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Anyone can view entertainment profiles" ON public."Entertainment Profile" FOR SELECT USING (true);


--
-- TOC entry 5474 (class 3256 OID 17467)
-- Name: entertainment_types Anyone can view entertainment types; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Anyone can view entertainment types" ON public.entertainment_types FOR SELECT USING (true);


--
-- TOC entry 5475 (class 3256 OID 17468)
-- Name: entertainments Anyone can view entertainments; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Anyone can view entertainments" ON public.entertainments FOR SELECT USING (true);


--
-- TOC entry 5476 (class 3256 OID 17469)
-- Name: event_themes Anyone can view event themes; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Anyone can view event themes" ON public.event_themes FOR SELECT USING (true);


--
-- TOC entry 5477 (class 3256 OID 17470)
-- Name: event_types Anyone can view event types; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Anyone can view event types" ON public.event_types FOR SELECT USING (true);


--
-- TOC entry 5478 (class 3256 OID 17471)
-- Name: Hospitality Directory Anyone can view hospitality directory; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Anyone can view hospitality directory" ON public."Hospitality Directory" FOR SELECT USING (true);


--
-- TOC entry 5479 (class 3256 OID 17472)
-- Name: hospitality_profile_amenities Anyone can view hospitality profile amenities; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Anyone can view hospitality profile amenities" ON public.hospitality_profile_amenities FOR SELECT USING (true);


--
-- TOC entry 5480 (class 3256 OID 17473)
-- Name: Hospitality Profile Anyone can view hospitality profiles; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Anyone can view hospitality profiles" ON public."Hospitality Profile" FOR SELECT USING (true);


--
-- TOC entry 5481 (class 3256 OID 17474)
-- Name: hospitality_profiles Anyone can view hospitality profiles; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Anyone can view hospitality profiles" ON public.hospitality_profiles FOR SELECT USING (true);


--
-- TOC entry 5482 (class 3256 OID 17475)
-- Name: hospitality_types Anyone can view hospitality types; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Anyone can view hospitality types" ON public.hospitality_types FOR SELECT USING (true);


--
-- TOC entry 5483 (class 3256 OID 17476)
-- Name: role_permission_groups Anyone can view permission groups; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Anyone can view permission groups" ON public.role_permission_groups FOR SELECT TO authenticated USING (true);


--
-- TOC entry 5484 (class 3256 OID 17477)
-- Name: registry_submissions Anyone can view registry submissions; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Anyone can view registry submissions" ON public.registry_submissions FOR SELECT USING (true);


--
-- TOC entry 5485 (class 3256 OID 17478)
-- Name: reservation_submissions Anyone can view reservation submissions; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Anyone can view reservation submissions" ON public.reservation_submissions FOR SELECT USING (true);


--
-- TOC entry 5486 (class 3256 OID 17479)
-- Name: resource_categories Anyone can view resource categories; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Anyone can view resource categories" ON public.resource_categories FOR SELECT USING (true);


--
-- TOC entry 5487 (class 3256 OID 17480)
-- Name: resource_status Anyone can view resource statuses; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Anyone can view resource statuses" ON public.resource_status FOR SELECT USING (true);


--
-- TOC entry 5488 (class 3256 OID 17481)
-- Name: serv_vendor_rental_assignments Anyone can view serv vendor rental types; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Anyone can view serv vendor rental types" ON public.serv_vendor_rental_assignments FOR SELECT USING (true);


--
-- TOC entry 5489 (class 3256 OID 17482)
-- Name: serv_vendor_rentals Anyone can view serv vendor rentals; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Anyone can view serv vendor rentals" ON public.serv_vendor_rentals FOR SELECT USING (true);


--
-- TOC entry 5490 (class 3256 OID 17483)
-- Name: serv_vendor_suppliers Anyone can view serv vendor suppliers; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Anyone can view serv vendor suppliers" ON public.serv_vendor_suppliers FOR SELECT USING (true);


--
-- TOC entry 5491 (class 3256 OID 17484)
-- Name: Service Profile Anyone can view service profiles; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Anyone can view service profiles" ON public."Service Profile" FOR SELECT USING (true);


--
-- TOC entry 5492 (class 3256 OID 17485)
-- Name: Service Rental/Sale Directory Anyone can view service rental directory; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Anyone can view service rental directory" ON public."Service Rental/Sale Directory" FOR SELECT USING (true);


--
-- TOC entry 5493 (class 3256 OID 17486)
-- Name: Service Vendor Directory Anyone can view service vendor directory; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Anyone can view service vendor directory" ON public."Service Vendor Directory" FOR SELECT USING (true);


--
-- TOC entry 5494 (class 3256 OID 17487)
-- Name: Subscription_Plans Directory Anyone can view subscription plans; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Anyone can view subscription plans" ON public."Subscription_Plans Directory" FOR SELECT USING (true);


--
-- TOC entry 5495 (class 3256 OID 17488)
-- Name: supplier_categories Anyone can view supplier categories; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Anyone can view supplier categories" ON public.supplier_categories FOR SELECT USING (true);


--
-- TOC entry 5496 (class 3256 OID 17489)
-- Name: Supplier Directory Anyone can view supplier directory; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Anyone can view supplier directory" ON public."Supplier Directory" FOR SELECT USING (true);


--
-- TOC entry 5497 (class 3256 OID 17490)
-- Name: Supplier Profile Anyone can view supplier profiles; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Anyone can view supplier profiles" ON public."Supplier Profile" FOR SELECT USING (true);


--
-- TOC entry 5498 (class 3256 OID 17491)
-- Name: supplier_types Anyone can view supplier types; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Anyone can view supplier types" ON public.supplier_types FOR SELECT USING (true);


--
-- TOC entry 5499 (class 3256 OID 17492)
-- Name: Supplier Vendor Profile Anyone can view supplier vendor profiles; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Anyone can view supplier vendor profiles" ON public."Supplier Vendor Profile" FOR SELECT USING (true);


--
-- TOC entry 5500 (class 3256 OID 17493)
-- Name: suppliers Anyone can view suppliers; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Anyone can view suppliers" ON public.suppliers FOR SELECT USING (true);


--
-- TOC entry 5501 (class 3256 OID 17494)
-- Name: Themes Directory Anyone can view themes directory; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Anyone can view themes directory" ON public."Themes Directory" FOR SELECT USING (true);


--
-- TOC entry 5502 (class 3256 OID 17495)
-- Name: Transportation Directory Anyone can view transportation directory; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Anyone can view transportation directory" ON public."Transportation Directory" FOR SELECT USING (true);


--
-- TOC entry 5503 (class 3256 OID 17496)
-- Name: Transportation Profile Anyone can view transportation profiles; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Anyone can view transportation profiles" ON public."Transportation Profile" FOR SELECT USING (true);


--
-- TOC entry 5504 (class 3256 OID 17497)
-- Name: transportation_types Anyone can view transportation types; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Anyone can view transportation types" ON public.transportation_types FOR SELECT USING (true);


--
-- TOC entry 5505 (class 3256 OID 17498)
-- Name: transportation_profiles Anyone can view transportations; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Anyone can view transportations" ON public.transportation_profiles FOR SELECT USING (true);


--
-- TOC entry 5506 (class 3256 OID 17499)
-- Name: Vendor Directory Anyone can view vendor directory; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Anyone can view vendor directory" ON public."Vendor Directory" FOR SELECT USING (true);


--
-- TOC entry 5507 (class 3256 OID 17500)
-- Name: Vendor Profile Anyone can view vendor profiles; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Anyone can view vendor profiles" ON public."Vendor Profile" FOR SELECT USING (true);


--
-- TOC entry 5508 (class 3256 OID 17501)
-- Name: vendor_rental_types Anyone can view vendor rental types; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Anyone can view vendor rental types" ON public.vendor_rental_types FOR SELECT USING (true);


--
-- TOC entry 5509 (class 3256 OID 17502)
-- Name: vendor_supplier_types Anyone can view vendor supplier types; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Anyone can view vendor supplier types" ON public.vendor_supplier_types FOR SELECT USING (true);


--
-- TOC entry 5510 (class 3256 OID 17503)
-- Name: Venue Directory Anyone can view venue directory; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Anyone can view venue directory" ON public."Venue Directory" FOR SELECT USING (true);


--
-- TOC entry 5511 (class 3256 OID 17504)
-- Name: Venue Profile Anyone can view venue profiles; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Anyone can view venue profiles" ON public."Venue Profile" FOR SELECT USING (true);


--
-- TOC entry 5512 (class 3256 OID 17505)
-- Name: venue_types Anyone can view venue types; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Anyone can view venue types" ON public.venue_types FOR SELECT USING (true);


--
-- TOC entry 5513 (class 3256 OID 17506)
-- Name: venues Anyone can view venues; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Anyone can view venues" ON public.venues FOR SELECT USING (true);


--
-- TOC entry 5514 (class 3256 OID 17507)
-- Name: workflow_types Anyone can view workflow types; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Anyone can view workflow types" ON public.workflow_types FOR SELECT USING (true);


--
-- TOC entry 5515 (class 3256 OID 17508)
-- Name: Comments Authenticated users can create comments; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Authenticated users can create comments" ON public."Comments" FOR INSERT TO authenticated WITH CHECK (true);


--
-- TOC entry 5516 (class 3256 OID 17509)
-- Name: hospitality_profile_amenities Authenticated users can create hospitality profile amenities; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Authenticated users can create hospitality profile amenities" ON public.hospitality_profile_amenities FOR INSERT WITH CHECK ((auth.role() = 'authenticated'::text));


--
-- TOC entry 5517 (class 3256 OID 17510)
-- Name: hospitality_profiles Authenticated users can create hospitality profiles; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Authenticated users can create hospitality profiles" ON public.hospitality_profiles FOR INSERT WITH CHECK ((auth.role() = 'authenticated'::text));


--
-- TOC entry 5518 (class 3256 OID 17511)
-- Name: suppliers Authenticated users can create suppliers; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Authenticated users can create suppliers" ON public.suppliers FOR INSERT WITH CHECK ((auth.role() = 'authenticated'::text));


--
-- TOC entry 5519 (class 3256 OID 17512)
-- Name: teams Authenticated users can create teams; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Authenticated users can create teams" ON public.teams FOR INSERT WITH CHECK ((auth.role() = 'authenticated'::text));


--
-- TOC entry 5520 (class 3256 OID 17513)
-- Name: workflow_types Authenticated users can create workflow types; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Authenticated users can create workflow types" ON public.workflow_types FOR INSERT WITH CHECK ((auth.role() = 'authenticated'::text));


--
-- TOC entry 5521 (class 3256 OID 17514)
-- Name: hospitality_profile_amenities Authenticated users can delete hospitality profile amenities; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Authenticated users can delete hospitality profile amenities" ON public.hospitality_profile_amenities FOR DELETE USING ((auth.role() = 'authenticated'::text));


--
-- TOC entry 5522 (class 3256 OID 17515)
-- Name: suppliers Authenticated users can delete suppliers; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Authenticated users can delete suppliers" ON public.suppliers FOR DELETE USING ((auth.role() = 'authenticated'::text));


--
-- TOC entry 5523 (class 3256 OID 17516)
-- Name: teams Authenticated users can delete teams; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Authenticated users can delete teams" ON public.teams FOR DELETE USING ((auth.role() = 'authenticated'::text));


--
-- TOC entry 5524 (class 3256 OID 17517)
-- Name: workflow_types Authenticated users can delete workflow types; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Authenticated users can delete workflow types" ON public.workflow_types FOR DELETE USING ((auth.role() = 'authenticated'::text));


--
-- TOC entry 5525 (class 3256 OID 17518)
-- Name: Registration Authenticated users can insert registration; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Authenticated users can insert registration" ON public."Registration" FOR INSERT WITH CHECK ((auth.role() = 'authenticated'::text));


--
-- TOC entry 5526 (class 3256 OID 17519)
-- Name: Registration Authenticated users can read registration; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Authenticated users can read registration" ON public."Registration" FOR SELECT USING ((auth.role() = 'authenticated'::text));


--
-- TOC entry 5527 (class 3256 OID 17520)
-- Name: suppliers Authenticated users can update suppliers; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Authenticated users can update suppliers" ON public.suppliers FOR UPDATE USING ((auth.role() = 'authenticated'::text)) WITH CHECK ((auth.role() = 'authenticated'::text));


--
-- TOC entry 5528 (class 3256 OID 17521)
-- Name: teams Authenticated users can update teams; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Authenticated users can update teams" ON public.teams FOR UPDATE USING ((auth.role() = 'authenticated'::text));


--
-- TOC entry 5529 (class 3256 OID 17522)
-- Name: workflow_types Authenticated users can update workflow types; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Authenticated users can update workflow types" ON public.workflow_types FOR UPDATE USING ((auth.role() = 'authenticated'::text));


--
-- TOC entry 5530 (class 3256 OID 17523)
-- Name: Comments Authenticated users can view comments; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Authenticated users can view comments" ON public."Comments" FOR SELECT TO authenticated USING (true);


--
-- TOC entry 5531 (class 3256 OID 17524)
-- Name: teams Authenticated users can view teams; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Authenticated users can view teams" ON public.teams FOR SELECT USING ((auth.role() = 'authenticated'::text));


--
-- TOC entry 5362 (class 0 OID 17340)
-- Dependencies: 393
-- Name: Authorization; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public."Authorization" ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 5374 (class 0 OID 20824)
-- Dependencies: 405
-- Name: Bookings Directory; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public."Bookings Directory" ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 5533 (class 3256 OID 17525)
-- Name: user_roles Bootstrap: Allow role assignment for non-admin users; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Bootstrap: Allow role assignment for non-admin users" ON public.user_roles FOR INSERT WITH CHECK (((auth.uid() IS NOT NULL) AND (NOT public.has_permission_level(auth.uid(), 'admin'::public.permission_level))));


--
-- TOC entry 5534 (class 3256 OID 17526)
-- Name: user_roles Bootstrap: Allow role updates for non-admin users; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Bootstrap: Allow role updates for non-admin users" ON public.user_roles FOR UPDATE USING (((auth.uid() IS NOT NULL) AND (NOT public.has_permission_level(auth.uid(), 'admin'::public.permission_level)))) WITH CHECK (((auth.uid() IS NOT NULL) AND (NOT public.has_permission_level(auth.uid(), 'admin'::public.permission_level))));


--
-- TOC entry 5364 (class 0 OID 18485)
-- Dependencies: 395
-- Name: Collaborators; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public."Collaborators" ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 5365 (class 0 OID 18493)
-- Dependencies: 396
-- Name: Comments; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public."Comments" ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 5363 (class 0 OID 17348)
-- Dependencies: 394
-- Name: Create Event; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public."Create Event" ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 5390 (class 0 OID 35744)
-- Dependencies: 429
-- Name: Entertainment Directory; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public."Entertainment Directory" ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 5391 (class 0 OID 35756)
-- Dependencies: 431
-- Name: Entertainment Profile; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public."Entertainment Profile" ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 5367 (class 0 OID 18517)
-- Dependencies: 398
-- Name: Event Analytics; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public."Event Analytics" ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 5380 (class 0 OID 23215)
-- Dependencies: 413
-- Name: Event Plan Report; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public."Event Plan Report" ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 5376 (class 0 OID 20854)
-- Dependencies: 407
-- Name: Event Resources; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public."Event Resources" ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 5387 (class 0 OID 35685)
-- Dependencies: 423
-- Name: Hospitality Directory; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public."Hospitality Directory" ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 5375 (class 0 OID 20842)
-- Dependencies: 406
-- Name: Hospitality Profile; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public."Hospitality Profile" ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 5370 (class 0 OID 19647)
-- Dependencies: 401
-- Name: Manage Event; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public."Manage Event" ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 5366 (class 0 OID 18501)
-- Dependencies: 397
-- Name: Manage Event Tasks; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public."Manage Event Tasks" ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 5535 (class 3256 OID 17527)
-- Name: Authorization No direct select on Authorization; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "No direct select on Authorization" ON public."Authorization" FOR SELECT USING (false);


--
-- TOC entry 5393 (class 0 OID 36975)
-- Dependencies: 436
-- Name: Registration; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public."Registration" ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 5389 (class 0 OID 35732)
-- Dependencies: 427
-- Name: Service Profile; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public."Service Profile" ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 5371 (class 0 OID 19697)
-- Dependencies: 402
-- Name: Service Rental/Sale Directory; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public."Service Rental/Sale Directory" ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 5372 (class 0 OID 19705)
-- Dependencies: 403
-- Name: Service Vendor Directory; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public."Service Vendor Directory" ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 5396 (class 0 OID 40352)
-- Dependencies: 441
-- Name: Subscription_Plans Directory; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public."Subscription_Plans Directory" ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 5388 (class 0 OID 35697)
-- Dependencies: 425
-- Name: Supplier Directory; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public."Supplier Directory" ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 5377 (class 0 OID 20866)
-- Dependencies: 409
-- Name: Supplier Profile; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public."Supplier Profile" ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 5392 (class 0 OID 36945)
-- Dependencies: 434
-- Name: Supplier Vendor Profile; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public."Supplier Vendor Profile" ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 5536 (class 3256 OID 17528)
-- Name: change_logs System can create change logs; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "System can create change logs" ON public.change_logs FOR INSERT WITH CHECK ((changed_by = auth.uid()));


--
-- TOC entry 5537 (class 3256 OID 17529)
-- Name: collaborator_configurations Team admins can create collaborator configs; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Team admins can create collaborator configs" ON public.collaborator_configurations FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM public.team_assignments
  WHERE ((team_assignments.user_id = auth.uid()) AND (team_assignments.team_id = collaborator_configurations.team_id) AND (team_assignments.team_admin = true)))));


--
-- TOC entry 5538 (class 3256 OID 17530)
-- Name: collaborator_configurations Team admins can create configurations; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Team admins can create configurations" ON public.collaborator_configurations FOR INSERT TO authenticated WITH CHECK (public.is_team_admin(auth.uid(), team_id));


--
-- TOC entry 5539 (class 3256 OID 17531)
-- Name: team_assignments Team admins can create team assignments; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Team admins can create team assignments" ON public.team_assignments FOR INSERT WITH CHECK ((public.is_team_admin(auth.uid(), team_id) OR ((user_id = auth.uid()) AND (team_admin = true))));


--
-- TOC entry 5542 (class 3256 OID 17532)
-- Name: collaborator_configurations Team admins can delete collaborator configs; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Team admins can delete collaborator configs" ON public.collaborator_configurations FOR DELETE USING ((EXISTS ( SELECT 1
   FROM public.team_assignments
  WHERE ((team_assignments.user_id = auth.uid()) AND (team_assignments.team_id = collaborator_configurations.team_id) AND (team_assignments.team_admin = true)))));


--
-- TOC entry 5543 (class 3256 OID 17533)
-- Name: team_assignments Team admins can delete team assignments; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Team admins can delete team assignments" ON public.team_assignments FOR DELETE USING (public.is_team_admin(auth.uid(), team_id));


--
-- TOC entry 5544 (class 3256 OID 17534)
-- Name: collaborator_configurations Team admins can delete their team configurations; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Team admins can delete their team configurations" ON public.collaborator_configurations FOR DELETE TO authenticated USING (public.is_team_admin(auth.uid(), team_id));


--
-- TOC entry 5545 (class 3256 OID 17535)
-- Name: team_assignments Team admins can manage team assignments; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Team admins can manage team assignments" ON public.team_assignments TO authenticated USING (public.is_team_admin(auth.uid(), team_id));


--
-- TOC entry 5546 (class 3256 OID 17536)
-- Name: collaborator_configurations Team admins can update collaborator configs; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Team admins can update collaborator configs" ON public.collaborator_configurations FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM public.team_assignments
  WHERE ((team_assignments.user_id = auth.uid()) AND (team_assignments.team_id = collaborator_configurations.team_id) AND (team_assignments.team_admin = true)))));


--
-- TOC entry 5547 (class 3256 OID 17537)
-- Name: team_assignments Team admins can update team assignments; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Team admins can update team assignments" ON public.team_assignments FOR UPDATE USING (public.is_team_admin(auth.uid(), team_id)) WITH CHECK (public.is_team_admin(auth.uid(), team_id));


--
-- TOC entry 5548 (class 3256 OID 17538)
-- Name: collaborator_configurations Team admins can update their team configurations; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Team admins can update their team configurations" ON public.collaborator_configurations FOR UPDATE TO authenticated USING (public.is_team_admin(auth.uid(), team_id)) WITH CHECK (public.is_team_admin(auth.uid(), team_id));


--
-- TOC entry 5549 (class 3256 OID 17539)
-- Name: collaborator_configurations Team admins can view their team configurations; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Team admins can view their team configurations" ON public.collaborator_configurations FOR SELECT TO authenticated USING ((public.is_team_admin(auth.uid(), team_id) OR public.is_team_member(auth.uid(), team_id)));


--
-- TOC entry 5532 (class 3256 OID 17540)
-- Name: team_assignments Team members can view assignments in their teams; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Team members can view assignments in their teams" ON public.team_assignments FOR SELECT TO authenticated USING (public.is_team_member(auth.uid(), team_id));


--
-- TOC entry 5369 (class 0 OID 18534)
-- Dependencies: 400
-- Name: Themes Directory; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public."Themes Directory" ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 5379 (class 0 OID 20888)
-- Dependencies: 411
-- Name: Transportation Directory; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public."Transportation Directory" ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 5373 (class 0 OID 20816)
-- Dependencies: 404
-- Name: Transportation Profile; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public."Transportation Profile" ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 5395 (class 0 OID 40339)
-- Dependencies: 439
-- Name: User Profile; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public."User Profile" ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 5550 (class 3256 OID 17541)
-- Name: User Profile Users can claim legacy user profile; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can claim legacy user profile" ON public."User Profile" FOR UPDATE TO authenticated USING (((user_id IS NULL) AND ("User_Email" IS NOT NULL) AND (lower("User_Email") = lower((auth.jwt() ->> 'email'::text))))) WITH CHECK ((user_id = auth.uid()));


--
-- TOC entry 5551 (class 3256 OID 17542)
-- Name: notifications Users can create notifications; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can create notifications" ON public.notifications FOR INSERT WITH CHECK (((sender_id = auth.uid()) OR (sender_id IS NULL)));


--
-- TOC entry 5552 (class 3256 OID 17543)
-- Name: resources Users can create resources for their events; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can create resources for their events" ON public.resources FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM public.events
  WHERE ((events.id = resources.event_id) AND (events.user_id = auth.uid())))));


--
-- TOC entry 5553 (class 3256 OID 17545)
-- Name: tasks_dependencies Users can create task dependencies for their tasks; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can create task dependencies for their tasks" ON public.tasks_dependencies FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM public.tasks t
  WHERE ((t.id = tasks_dependencies.task_id) AND (t.created_by = auth.uid())))));


--
-- TOC entry 5554 (class 3256 OID 17546)
-- Name: Bookings Directory Users can create their own bookings; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can create their own bookings" ON public."Bookings Directory" FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));


--
-- TOC entry 5540 (class 3256 OID 17547)
-- Name: budget_items Users can create their own budget items; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can create their own budget items" ON public.budget_items FOR INSERT TO authenticated WITH CHECK ((created_by = auth.uid()));


--
-- TOC entry 5541 (class 3256 OID 17548)
-- Name: Create Event Users can create their own events; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can create their own events" ON public."Create Event" FOR INSERT TO authenticated WITH CHECK ((userid = (auth.uid())::text));


--
-- TOC entry 5555 (class 3256 OID 17549)
-- Name: Manage Event Users can create their own events; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can create their own events" ON public."Manage Event" FOR INSERT WITH CHECK ((event_user_id = (auth.uid())::text));


--
-- TOC entry 5556 (class 3256 OID 17550)
-- Name: events Users can create their own events; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can create their own events" ON public.events FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- TOC entry 5557 (class 3256 OID 17551)
-- Name: tasks Users can create their own tasks; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can create their own tasks" ON public.tasks FOR INSERT WITH CHECK ((created_by = auth.uid()));


--
-- TOC entry 5558 (class 3256 OID 17552)
-- Name: template_tasks Users can create their own template tasks; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can create their own template tasks" ON public.template_tasks FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- TOC entry 5559 (class 3256 OID 17553)
-- Name: templates Users can create their own templates; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can create their own templates" ON public.templates FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- TOC entry 5560 (class 3256 OID 17554)
-- Name: User Profile Users can create their own user profile; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can create their own user profile" ON public."User Profile" FOR INSERT TO authenticated WITH CHECK ((user_id = auth.uid()));


--
-- TOC entry 5561 (class 3256 OID 17555)
-- Name: workflows Users can create their own workflows; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can create their own workflows" ON public.workflows FOR INSERT WITH CHECK ((user_id = auth.uid()));


--
-- TOC entry 5562 (class 3256 OID 17556)
-- Name: venues Users can create venues; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can create venues" ON public.venues FOR INSERT WITH CHECK (((user_id IS NULL) OR (user_id = auth.uid())));


--
-- TOC entry 5563 (class 3256 OID 17557)
-- Name: hospitality_profiles Users can delete hospitality profiles; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can delete hospitality profiles" ON public.hospitality_profiles FOR DELETE USING ((auth.role() = 'authenticated'::text));


--
-- TOC entry 5564 (class 3256 OID 17558)
-- Name: resources Users can delete resources for their events; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can delete resources for their events" ON public.resources FOR DELETE USING ((EXISTS ( SELECT 1
   FROM public.events
  WHERE ((events.id = resources.event_id) AND (events.user_id = auth.uid())))));


--
-- TOC entry 5567 (class 3256 OID 17560)
-- Name: tasks_dependencies Users can delete task dependencies for their tasks; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can delete task dependencies for their tasks" ON public.tasks_dependencies FOR DELETE USING ((EXISTS ( SELECT 1
   FROM public.tasks t
  WHERE ((t.id = tasks_dependencies.task_id) AND (t.created_by = auth.uid())))));


--
-- TOC entry 5568 (class 3256 OID 17561)
-- Name: tasks Users can delete tasks for their events; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can delete tasks for their events" ON public.tasks FOR DELETE USING ((EXISTS ( SELECT 1
   FROM public.events
  WHERE ((events.id = tasks.event_id) AND (events.user_id = auth.uid())))));


--
-- TOC entry 5569 (class 3256 OID 17562)
-- Name: Bookings Directory Users can delete their own bookings; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can delete their own bookings" ON public."Bookings Directory" FOR DELETE TO authenticated USING ((auth.uid() = user_id));


--
-- TOC entry 5570 (class 3256 OID 17563)
-- Name: budget_items Users can delete their own budget items; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can delete their own budget items" ON public.budget_items FOR DELETE TO authenticated USING ((created_by = auth.uid()));


--
-- TOC entry 5571 (class 3256 OID 17564)
-- Name: Create Event Users can delete their own events; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can delete their own events" ON public."Create Event" FOR DELETE TO authenticated USING ((userid = (auth.uid())::text));


--
-- TOC entry 5572 (class 3256 OID 17565)
-- Name: Manage Event Users can delete their own events; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can delete their own events" ON public."Manage Event" FOR DELETE USING ((event_user_id = (auth.uid())::text));


--
-- TOC entry 5573 (class 3256 OID 17566)
-- Name: events Users can delete their own events; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can delete their own events" ON public.events FOR DELETE USING ((auth.uid() = user_id));


--
-- TOC entry 5574 (class 3256 OID 17567)
-- Name: private_residence_responses Users can delete their own responses; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can delete their own responses" ON public.private_residence_responses FOR DELETE TO authenticated USING ((user_id = auth.uid()));


--
-- TOC entry 5565 (class 3256 OID 17568)
-- Name: template_tasks Users can delete their own template tasks; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can delete their own template tasks" ON public.template_tasks FOR DELETE USING ((auth.uid() = user_id));


--
-- TOC entry 5566 (class 3256 OID 17569)
-- Name: templates Users can delete their own templates; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can delete their own templates" ON public.templates FOR DELETE USING ((auth.uid() = user_id));


--
-- TOC entry 5575 (class 3256 OID 17570)
-- Name: User Profile Users can delete their own user profile; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can delete their own user profile" ON public."User Profile" FOR DELETE TO authenticated USING ((user_id = auth.uid()));


--
-- TOC entry 5576 (class 3256 OID 17571)
-- Name: venues Users can delete their own venues; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can delete their own venues" ON public.venues FOR DELETE USING ((user_id = auth.uid()));


--
-- TOC entry 5577 (class 3256 OID 17572)
-- Name: workflows Users can delete their own workflows; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can delete their own workflows" ON public.workflows FOR DELETE USING ((user_id = auth.uid()));


--
-- TOC entry 5578 (class 3256 OID 17573)
-- Name: profiles Users can insert their own profile; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- TOC entry 5579 (class 3256 OID 17574)
-- Name: private_residence_responses Users can insert their own responses; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can insert their own responses" ON public.private_residence_responses FOR INSERT TO authenticated WITH CHECK ((user_id = auth.uid()));


--
-- TOC entry 5580 (class 3256 OID 17575)
-- Name: team_assignments Users can insert their own team assignments; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can insert their own team assignments" ON public.team_assignments FOR INSERT TO authenticated WITH CHECK ((user_id = auth.uid()));


--
-- TOC entry 5581 (class 3256 OID 17576)
-- Name: hospitality_profiles Users can update hospitality profiles; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can update hospitality profiles" ON public.hospitality_profiles FOR UPDATE USING ((auth.role() = 'authenticated'::text));


--
-- TOC entry 5582 (class 3256 OID 17577)
-- Name: resources Users can update resources for their events; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can update resources for their events" ON public.resources FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM public.events
  WHERE ((events.id = resources.event_id) AND (events.user_id = auth.uid())))));


--
-- TOC entry 5584 (class 3256 OID 17580)
-- Name: tasks Users can update tasks for their events; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can update tasks for their events" ON public.tasks FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM public.events
  WHERE ((events.id = tasks.event_id) AND (events.user_id = auth.uid())))));


--
-- TOC entry 5585 (class 3256 OID 17581)
-- Name: Bookings Directory Users can update their own bookings; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can update their own bookings" ON public."Bookings Directory" FOR UPDATE TO authenticated USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));


--
-- TOC entry 5586 (class 3256 OID 17582)
-- Name: budget_items Users can update their own budget items; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can update their own budget items" ON public.budget_items FOR UPDATE TO authenticated USING ((created_by = auth.uid())) WITH CHECK ((created_by = auth.uid()));


--
-- TOC entry 5587 (class 3256 OID 17583)
-- Name: Create Event Users can update their own events; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can update their own events" ON public."Create Event" FOR UPDATE TO authenticated USING ((userid = (auth.uid())::text)) WITH CHECK ((userid = (auth.uid())::text));


--
-- TOC entry 5588 (class 3256 OID 17584)
-- Name: Manage Event Users can update their own events; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can update their own events" ON public."Manage Event" FOR UPDATE USING ((event_user_id = (auth.uid())::text)) WITH CHECK ((event_user_id = (auth.uid())::text));


--
-- TOC entry 5589 (class 3256 OID 17585)
-- Name: events Users can update their own events; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can update their own events" ON public.events FOR UPDATE USING ((auth.uid() = user_id));


--
-- TOC entry 5590 (class 3256 OID 17586)
-- Name: notifications Users can update their own notifications; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can update their own notifications" ON public.notifications FOR UPDATE USING ((recipient_id = auth.uid()));


--
-- TOC entry 5591 (class 3256 OID 17587)
-- Name: profiles Users can update their own profile; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING ((auth.uid() = user_id));


--
-- TOC entry 5583 (class 3256 OID 17588)
-- Name: private_residence_responses Users can update their own responses; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can update their own responses" ON public.private_residence_responses FOR UPDATE TO authenticated USING ((user_id = auth.uid())) WITH CHECK ((user_id = auth.uid()));


--
-- TOC entry 5593 (class 3256 OID 17589)
-- Name: template_tasks Users can update their own template tasks; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can update their own template tasks" ON public.template_tasks FOR UPDATE USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));


--
-- TOC entry 5594 (class 3256 OID 17590)
-- Name: templates Users can update their own templates; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can update their own templates" ON public.templates FOR UPDATE USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));


--
-- TOC entry 5595 (class 3256 OID 17591)
-- Name: User Profile Users can update their own user profile; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can update their own user profile" ON public."User Profile" FOR UPDATE TO authenticated USING ((user_id = auth.uid())) WITH CHECK ((user_id = auth.uid()));


--
-- TOC entry 5596 (class 3256 OID 17592)
-- Name: venues Users can update their own venues; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can update their own venues" ON public.venues FOR UPDATE USING ((user_id = auth.uid())) WITH CHECK ((user_id = auth.uid()));


--
-- TOC entry 5597 (class 3256 OID 17593)
-- Name: workflows Users can update their own workflows; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can update their own workflows" ON public.workflows FOR UPDATE USING ((user_id = auth.uid()));


--
-- TOC entry 5598 (class 3256 OID 17594)
-- Name: profiles Users can view all profiles for assignments; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can view all profiles for assignments" ON public.profiles FOR SELECT TO authenticated USING (true);


--
-- TOC entry 5599 (class 3256 OID 17595)
-- Name: budget_items Users can view budget items for their events; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can view budget items for their events" ON public.budget_items FOR SELECT USING (((created_by = auth.uid()) OR (EXISTS ( SELECT 1
   FROM public."Create Event" ce
  WHERE (ce.userid = (auth.uid())::text)))));


--
-- TOC entry 5600 (class 3256 OID 17596)
-- Name: resources Users can view resources for their events; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can view resources for their events" ON public.resources FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.events
  WHERE ((events.id = resources.event_id) AND (events.user_id = auth.uid())))));


--
-- TOC entry 5601 (class 3256 OID 17598)
-- Name: tasks_dependencies Users can view task dependencies for their events; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can view task dependencies for their events" ON public.tasks_dependencies FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.tasks t
  WHERE ((t.id = tasks_dependencies.task_id) AND (t.created_by = auth.uid())))));


--
-- TOC entry 5602 (class 3256 OID 17599)
-- Name: tasks Users can view tasks for their events; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can view tasks for their events" ON public.tasks FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.events
  WHERE ((events.id = tasks.event_id) AND (events.user_id = auth.uid())))));


--
-- TOC entry 5603 (class 3256 OID 17600)
-- Name: profiles Users can view team members profiles; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can view team members profiles" ON public.profiles FOR SELECT TO authenticated USING (public.are_team_members(auth.uid(), user_id));


--
-- TOC entry 5604 (class 3256 OID 17601)
-- Name: User Profile Users can view team members user profile data; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can view team members user profile data" ON public."User Profile" FOR SELECT TO authenticated USING (public.are_team_members(auth.uid(), user_id));


--
-- TOC entry 5605 (class 3256 OID 17602)
-- Name: Bookings Directory Users can view their own bookings; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can view their own bookings" ON public."Bookings Directory" FOR SELECT TO authenticated USING ((auth.uid() = user_id));


--
-- TOC entry 5606 (class 3256 OID 17603)
-- Name: change_logs Users can view their own change logs; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can view their own change logs" ON public.change_logs FOR SELECT USING ((changed_by = auth.uid()));


--
-- TOC entry 5607 (class 3256 OID 17604)
-- Name: Create Event Users can view their own events; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can view their own events" ON public."Create Event" FOR SELECT TO authenticated USING ((userid = (auth.uid())::text));


--
-- TOC entry 5592 (class 3256 OID 17605)
-- Name: Manage Event Users can view their own events; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can view their own events" ON public."Manage Event" FOR SELECT USING ((event_user_id = (auth.uid())::text));


--
-- TOC entry 5608 (class 3256 OID 17606)
-- Name: events Users can view their own events; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can view their own events" ON public.events FOR SELECT USING ((auth.uid() = user_id));


--
-- TOC entry 5609 (class 3256 OID 17607)
-- Name: notifications Users can view their own notifications; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can view their own notifications" ON public.notifications FOR SELECT USING ((recipient_id = auth.uid()));


--
-- TOC entry 5610 (class 3256 OID 17608)
-- Name: profiles Users can view their own profile; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING ((auth.uid() = user_id));


--
-- TOC entry 5611 (class 3256 OID 17609)
-- Name: private_residence_responses Users can view their own responses; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can view their own responses" ON public.private_residence_responses FOR SELECT TO authenticated USING ((user_id = auth.uid()));


--
-- TOC entry 5612 (class 3256 OID 17610)
-- Name: user_roles Users can view their own role assignments; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can view their own role assignments" ON public.user_roles FOR SELECT USING ((user_id = auth.uid()));


--
-- TOC entry 5613 (class 3256 OID 17611)
-- Name: template_tasks Users can view their own template tasks; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can view their own template tasks" ON public.template_tasks FOR SELECT USING ((auth.uid() = user_id));


--
-- TOC entry 5614 (class 3256 OID 17612)
-- Name: templates Users can view their own templates; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can view their own templates" ON public.templates FOR SELECT USING ((auth.uid() = user_id));


--
-- TOC entry 5615 (class 3256 OID 17613)
-- Name: User Profile Users can view their own user profile; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can view their own user profile" ON public."User Profile" FOR SELECT TO authenticated USING (((user_id = auth.uid()) OR ((user_id IS NULL) AND ("User_Email" IS NOT NULL) AND (lower("User_Email") = lower((auth.jwt() ->> 'email'::text))))));


--
-- TOC entry 5616 (class 3256 OID 17614)
-- Name: workflows Users can view their own workflows; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can view their own workflows" ON public.workflows FOR SELECT USING ((user_id = auth.uid()));


--
-- TOC entry 5617 (class 3256 OID 17615)
-- Name: team_assignments Users can view their team assignments; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can view their team assignments" ON public.team_assignments FOR SELECT TO authenticated USING ((user_id = auth.uid()));


--
-- TOC entry 5618 (class 3256 OID 17616)
-- Name: collaborator_configurations Users can view their team's collaborator configs; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can view their team's collaborator configs" ON public.collaborator_configurations FOR SELECT USING ((team_id IN ( SELECT team_assignments.team_id
   FROM public.team_assignments
  WHERE (team_assignments.user_id = auth.uid()))));


--
-- TOC entry 5386 (class 0 OID 35661)
-- Dependencies: 421
-- Name: Vendor Directory; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public."Vendor Directory" ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 5378 (class 0 OID 20880)
-- Dependencies: 410
-- Name: Vendor Profile; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public."Vendor Profile" ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 5385 (class 0 OID 35649)
-- Dependencies: 419
-- Name: Venue Directory; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public."Venue Directory" ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 5368 (class 0 OID 18526)
-- Dependencies: 399
-- Name: Venue Profile; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public."Venue Profile" ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 5407 (class 0 OID 86469)
-- Dependencies: 459
-- Name: amenity_types; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.amenity_types ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 5435 (class 0 OID 96456)
-- Dependencies: 498
-- Name: barcode_submissions; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.barcode_submissions ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 5382 (class 0 OID 33295)
-- Dependencies: 416
-- Name: budget_items; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.budget_items ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 5383 (class 0 OID 34426)
-- Dependencies: 417
-- Name: change_logs; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.change_logs ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 5449 (class 0 OID 136518)
-- Dependencies: 528
-- Name: cm_audit_events; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.cm_audit_events ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 5651 (class 3256 OID 136566)
-- Name: cm_audit_events cm_audit_insert_contrib; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY cm_audit_insert_contrib ON public.cm_audit_events FOR INSERT WITH CHECK (((event_id IS NULL) OR (EXISTS ( SELECT 1
   FROM public.cm_event_members em
  WHERE ((em.user_id = auth.uid()) AND (em.event_id = cm_audit_events.event_id) AND (em.role = ANY (ARRAY['contributor'::text, 'manager'::text])))))));


--
-- TOC entry 5650 (class 3256 OID 136565)
-- Name: cm_audit_events cm_audit_select_members; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY cm_audit_select_members ON public.cm_audit_events FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.cm_event_members em
  WHERE ((em.user_id = auth.uid()) AND ((cm_audit_events.event_id IS NULL) OR (em.event_id = cm_audit_events.event_id))))));


--
-- TOC entry 5448 (class 0 OID 136505)
-- Dependencies: 527
-- Name: cm_change_requests; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.cm_change_requests ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 5648 (class 3256 OID 136563)
-- Name: cm_change_requests cm_cr_insert_member; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY cm_cr_insert_member ON public.cm_change_requests FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM public.cm_event_members em
  WHERE ((em.user_id = auth.uid()) AND (em.event_id = cm_change_requests.event_id)))));


--
-- TOC entry 5647 (class 3256 OID 136562)
-- Name: cm_change_requests cm_cr_select_members; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY cm_cr_select_members ON public.cm_change_requests FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.cm_event_members em
  WHERE ((em.user_id = auth.uid()) AND (em.event_id = cm_change_requests.event_id)))));


--
-- TOC entry 5649 (class 3256 OID 136564)
-- Name: cm_change_requests cm_cr_update_creator_or_mgr; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY cm_cr_update_creator_or_mgr ON public.cm_change_requests FOR UPDATE USING (((requested_by = auth.uid()) OR (EXISTS ( SELECT 1
   FROM public.cm_event_members em
  WHERE ((em.user_id = auth.uid()) AND (em.event_id = cm_change_requests.event_id) AND (em.role = 'manager'::text))))));


--
-- TOC entry 5639 (class 3256 OID 136550)
-- Name: cm_event_members cm_em_select_self_events; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY cm_em_select_self_events ON public.cm_event_members FOR SELECT USING ((user_id = auth.uid()));


--
-- TOC entry 5640 (class 3256 OID 136551)
-- Name: cm_event_members cm_em_upsert_manager; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY cm_em_upsert_manager ON public.cm_event_members USING ((EXISTS ( SELECT 1
   FROM public.cm_event_members me
  WHERE ((me.user_id = auth.uid()) AND (me.event_id = cm_event_members.event_id) AND (me.role = 'manager'::text))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM public.cm_event_members me
  WHERE ((me.user_id = auth.uid()) AND (me.event_id = cm_event_members.event_id) AND (me.role = 'manager'::text)))));


--
-- TOC entry 5444 (class 0 OID 136466)
-- Dependencies: 523
-- Name: cm_event_members; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.cm_event_members ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 5445 (class 0 OID 136475)
-- Dependencies: 524
-- Name: cm_locations; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.cm_locations ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 5641 (class 3256 OID 136553)
-- Name: cm_locations cm_locations_select_members; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY cm_locations_select_members ON public.cm_locations FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.cm_event_members em
  WHERE ((em.user_id = auth.uid()) AND (em.event_id = cm_locations.event_id)))));


--
-- TOC entry 5642 (class 3256 OID 136554)
-- Name: cm_locations cm_locations_write_manager; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY cm_locations_write_manager ON public.cm_locations USING ((EXISTS ( SELECT 1
   FROM public.cm_event_members em
  WHERE ((em.user_id = auth.uid()) AND (em.event_id = cm_locations.event_id) AND (em.role = 'manager'::text))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM public.cm_event_members em
  WHERE ((em.user_id = auth.uid()) AND (em.event_id = cm_locations.event_id) AND (em.role = 'manager'::text)))));


--
-- TOC entry 5446 (class 0 OID 136484)
-- Dependencies: 525
-- Name: cm_resources; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.cm_resources ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 5643 (class 3256 OID 136556)
-- Name: cm_resources cm_resources_select_members; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY cm_resources_select_members ON public.cm_resources FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.cm_event_members em
  WHERE ((em.user_id = auth.uid()) AND (em.event_id = cm_resources.event_id)))));


--
-- TOC entry 5644 (class 3256 OID 136557)
-- Name: cm_resources cm_resources_write_contrib; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY cm_resources_write_contrib ON public.cm_resources USING ((EXISTS ( SELECT 1
   FROM public.cm_event_members em
  WHERE ((em.user_id = auth.uid()) AND (em.event_id = cm_resources.event_id) AND (em.role = ANY (ARRAY['contributor'::text, 'manager'::text])))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM public.cm_event_members em
  WHERE ((em.user_id = auth.uid()) AND (em.event_id = cm_resources.event_id) AND (em.role = ANY (ARRAY['contributor'::text, 'manager'::text]))))));


--
-- TOC entry 5447 (class 0 OID 136494)
-- Dependencies: 526
-- Name: cm_tasks; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.cm_tasks ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 5645 (class 3256 OID 136559)
-- Name: cm_tasks cm_tasks_select_members; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY cm_tasks_select_members ON public.cm_tasks FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.cm_event_members em
  WHERE ((em.user_id = auth.uid()) AND (em.event_id = cm_tasks.event_id)))));


--
-- TOC entry 5646 (class 3256 OID 136560)
-- Name: cm_tasks cm_tasks_write_contrib; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY cm_tasks_write_contrib ON public.cm_tasks USING ((EXISTS ( SELECT 1
   FROM public.cm_event_members em
  WHERE ((em.user_id = auth.uid()) AND (em.event_id = cm_tasks.event_id) AND (em.role = ANY (ARRAY['contributor'::text, 'manager'::text])))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM public.cm_event_members em
  WHERE ((em.user_id = auth.uid()) AND (em.event_id = cm_tasks.event_id) AND (em.role = ANY (ARRAY['contributor'::text, 'manager'::text]))))));


--
-- TOC entry 5437 (class 0 OID 98798)
-- Dependencies: 500
-- Name: collaborator_configurations; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.collaborator_configurations ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 5432 (class 0 OID 96426)
-- Dependencies: 495
-- Name: confirmation_submissions; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.confirmation_submissions ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 5417 (class 0 OID 87762)
-- Dependencies: 474
-- Name: entertainment_types; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.entertainment_types ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 5418 (class 0 OID 87773)
-- Dependencies: 475
-- Name: entertainments; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.entertainments ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 5401 (class 0 OID 76759)
-- Dependencies: 448
-- Name: event_themes; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.event_themes ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 5402 (class 0 OID 76778)
-- Dependencies: 449
-- Name: event_types; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.event_types ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 5399 (class 0 OID 70917)
-- Dependencies: 446
-- Name: events; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 5409 (class 0 OID 86496)
-- Dependencies: 461
-- Name: hospitality_profile_amenities; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.hospitality_profile_amenities ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 5408 (class 0 OID 86482)
-- Dependencies: 460
-- Name: hospitality_profiles; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.hospitality_profiles ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 5410 (class 0 OID 86527)
-- Dependencies: 463
-- Name: hospitality_types; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.hospitality_types ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 5384 (class 0 OID 34439)
-- Dependencies: 418
-- Name: notifications; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 5436 (class 0 OID 96502)
-- Dependencies: 499
-- Name: private_residence_responses; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.private_residence_responses ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 5394 (class 0 OID 40306)
-- Dependencies: 438
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 5434 (class 0 OID 96446)
-- Dependencies: 497
-- Name: registry_submissions; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.registry_submissions ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 5433 (class 0 OID 96436)
-- Dependencies: 496
-- Name: reservation_submissions; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.reservation_submissions ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 5426 (class 0 OID 91377)
-- Dependencies: 487
-- Name: resource_categories; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.resource_categories ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 5427 (class 0 OID 91389)
-- Dependencies: 489
-- Name: resource_status; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.resource_status ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 5428 (class 0 OID 91400)
-- Dependencies: 490
-- Name: resources; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 5439 (class 0 OID 100039)
-- Dependencies: 502
-- Name: role_permission_groups; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.role_permission_groups ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 5431 (class 0 OID 96415)
-- Dependencies: 494
-- Name: rsvp_submissions; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.rsvp_submissions ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 5421 (class 0 OID 87815)
-- Dependencies: 480
-- Name: serv_vendor_rental_assignments; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.serv_vendor_rental_assignments ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 5420 (class 0 OID 87803)
-- Dependencies: 478
-- Name: serv_vendor_rentals; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.serv_vendor_rentals ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 5414 (class 0 OID 87713)
-- Dependencies: 469
-- Name: serv_vendor_suppliers; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.serv_vendor_suppliers ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 5405 (class 0 OID 86412)
-- Dependencies: 456
-- Name: supplier_categories; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.supplier_categories ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 5404 (class 0 OID 86400)
-- Dependencies: 454
-- Name: supplier_types; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.supplier_types ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 5406 (class 0 OID 86423)
-- Dependencies: 457
-- Name: suppliers; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 5400 (class 0 OID 71074)
-- Dependencies: 447
-- Name: tasks; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 5381 (class 0 OID 33253)
-- Dependencies: 415
-- Name: tasks_assignments; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.tasks_assignments ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 5403 (class 0 OID 85246)
-- Dependencies: 452
-- Name: tasks_dependencies; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.tasks_dependencies ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 5430 (class 0 OID 91478)
-- Dependencies: 493
-- Name: team_assignments; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.team_assignments ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 5429 (class 0 OID 91439)
-- Dependencies: 491
-- Name: teams; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 5425 (class 0 OID 90240)
-- Dependencies: 485
-- Name: template_tasks; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.template_tasks ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 5424 (class 0 OID 90225)
-- Dependencies: 484
-- Name: templates; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 5416 (class 0 OID 87743)
-- Dependencies: 472
-- Name: transportation_profiles; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.transportation_profiles ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 5415 (class 0 OID 87732)
-- Dependencies: 471
-- Name: transportation_types; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.transportation_types ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 5438 (class 0 OID 100015)
-- Dependencies: 501
-- Name: user_roles; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 5619 (class 3256 OID 17617)
-- Name: user_roles user_roles_select_all; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY user_roles_select_all ON public.user_roles FOR SELECT TO authenticated USING (true);


--
-- TOC entry 5620 (class 3256 OID 17618)
-- Name: user_roles user_roles_select_own; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY user_roles_select_own ON public.user_roles FOR SELECT TO authenticated USING ((user_id = auth.uid()));


--
-- TOC entry 5621 (class 3256 OID 17619)
-- Name: user_roles user_roles_service_role; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY user_roles_service_role ON public.user_roles TO service_role USING (true) WITH CHECK (true);


--
-- TOC entry 5419 (class 0 OID 87792)
-- Dependencies: 477
-- Name: vendor_rental_types; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.vendor_rental_types ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 5413 (class 0 OID 87702)
-- Dependencies: 468
-- Name: vendor_supplier_types; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.vendor_supplier_types ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 5411 (class 0 OID 87672)
-- Dependencies: 465
-- Name: venue_types; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.venue_types ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 5412 (class 0 OID 87683)
-- Dependencies: 466
-- Name: venues; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.venues ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 5422 (class 0 OID 90126)
-- Dependencies: 482
-- Name: workflow_types; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.workflow_types ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 5423 (class 0 OID 90161)
-- Dependencies: 483
-- Name: workflows; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.workflows ENABLE ROW LEVEL SECURITY;

--



--
-- TOC entry 5653 (class 6104 OID 17625)
-- Name: supabase_realtime_messages_publication; Type: PUBLICATION; Schema: -; Owner: supabase_admin
--


--
-- TOC entry 5654 (class 6106 OID 17626)
-- Name: supabase_realtime Registration; Type: PUBLICATION TABLE; Schema: public; Owner: postgres
--

ALTER PUBLICATION supabase_realtime ADD TABLE ONLY public."Registration";


--
-- TOC entry 5655 (class 6106 OID 17627)
-- Name: supabase_realtime events; Type: PUBLICATION TABLE; Schema: public; Owner: postgres
--

ALTER PUBLICATION supabase_realtime ADD TABLE ONLY public.events;


--
-- TOC entry 5656 (class 6106 OID 17628)
-- Name: supabase_realtime profiles; Type: PUBLICATION TABLE; Schema: public; Owner: postgres
--

ALTER PUBLICATION supabase_realtime ADD TABLE ONLY public.profiles;


--
-- TOC entry 5657 (class 6106 OID 17629)
-- Name: supabase_realtime user_roles; Type: PUBLICATION TABLE; Schema: public; Owner: postgres
--

ALTER PUBLICATION supabase_realtime ADD TABLE ONLY public.user_roles;


--


-- Completed on 2025-12-22 18:45:17

--
-- PostgreSQL database dump complete
--


