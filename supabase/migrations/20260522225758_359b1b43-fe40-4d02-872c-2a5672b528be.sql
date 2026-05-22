-- Harden exposed SECURITY DEFINER functions with strict caller checks
CREATE OR REPLACE FUNCTION public.find_user_id_by_username(p_username text)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT p.id
  FROM public.profiles p
  WHERE p.username = p_username
    AND auth.role() = 'authenticated'
    AND auth.uid() IS NOT NULL
  LIMIT 1;
$function$;

CREATE OR REPLACE FUNCTION public.add_task_collaborator(p_task_id uuid, p_user_id uuid, p_added_by uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  new_id uuid;
BEGIN
  IF auth.uid() IS NULL OR auth.uid() <> p_added_by THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.tasks t
    WHERE t.id = p_task_id AND t.user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  INSERT INTO public.task_collaborators (task_id, user_id)
  VALUES (p_task_id, p_user_id)
  RETURNING id INTO new_id;

  RETURN new_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.is_task_collaborator(p_task_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.task_collaborators tc
    JOIN public.tasks t ON t.id = tc.task_id
    WHERE tc.task_id = p_task_id
      AND tc.user_id = p_user_id
      AND (t.user_id = auth.uid() OR tc.user_id = auth.uid())
  );
$function$;

CREATE OR REPLACE FUNCTION public.remove_task_collaborator(p_collaborator_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  DELETE FROM public.task_collaborators tc
  USING public.tasks t
  WHERE tc.id = p_collaborator_id
    AND t.id = tc.task_id
    AND t.user_id = auth.uid();
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_task_collaborators(p_task_id uuid)
RETURNS TABLE(id uuid, task_id uuid, user_id uuid, added_at timestamp with time zone, added_by uuid, username text, user_email text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT
    tc.id,
    tc.task_id,
    tc.user_id,
    tc.created_at AS added_at,
    NULL::uuid AS added_by,
    p.username,
    p.username || '@example.com' AS user_email
  FROM public.task_collaborators tc
  JOIN public.tasks t ON t.id = tc.task_id
  LEFT JOIN public.profiles p ON tc.user_id = p.id
  WHERE tc.task_id = p_task_id
    AND (t.user_id = auth.uid() OR tc.user_id = auth.uid());
$function$;

CREATE OR REPLACE FUNCTION public.create_user_profile(user_id uuid, user_name text)
RETURNS profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  new_profile public.profiles;
BEGIN
  IF auth.uid() IS NULL OR auth.uid() <> user_id THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  SELECT * INTO new_profile FROM public.profiles WHERE id = user_id;

  IF new_profile.id IS NULL THEN
    INSERT INTO public.profiles (id, username, updated_at)
    VALUES (user_id, user_name, now())
    RETURNING * INTO new_profile;
  END IF;

  RETURN new_profile;
END;
$function$;

-- Remove public/anonymous execution from privileged helpers.
REVOKE EXECUTE ON FUNCTION public.find_user_id_by_username(text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.add_task_collaborator(uuid, uuid, uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_task_collaborator(uuid, uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.remove_task_collaborator(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_task_collaborators(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.create_user_profile(uuid, text) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.find_user_id_by_username(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.add_task_collaborator(uuid, uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_task_collaborator(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.remove_task_collaborator(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_task_collaborators(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_user_profile(uuid, text) TO authenticated;

-- Try to relocate pg_net out of public. Supabase may report it as non-relocatable on some projects.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_extension e
    JOIN pg_namespace n ON n.oid = e.extnamespace
    WHERE e.extname = 'pg_net' AND n.nspname = 'public'
  ) THEN
    BEGIN
      ALTER EXTENSION pg_net SET SCHEMA extensions;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Could not relocate pg_net extension: %', SQLERRM;
    END;
  END IF;
END $$;