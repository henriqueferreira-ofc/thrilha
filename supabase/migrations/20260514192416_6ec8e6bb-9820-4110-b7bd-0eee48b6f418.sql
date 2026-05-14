
-- 1) Create user_settings table for sensitive per-user data
CREATE TABLE IF NOT EXISTS public.user_settings (
  user_id uuid PRIMARY KEY,
  birthday_zapier_webhook text,
  preferences jsonb NOT NULL DEFAULT '{"darkMode": true, "compactMode": false, "soundEnabled": true, "taskReminders": true, "pushNotifications": false, "emailNotifications": true}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own settings"
  ON public.user_settings FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own settings"
  ON public.user_settings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own settings"
  ON public.user_settings FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own settings"
  ON public.user_settings FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE TRIGGER update_user_settings_updated_at
  BEFORE UPDATE ON public.user_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2) Migrate existing data from profiles to user_settings
INSERT INTO public.user_settings (user_id, birthday_zapier_webhook, preferences)
SELECT
  id,
  birthday_zapier_webhook,
  COALESCE(preferences, '{"darkMode": true, "compactMode": false, "soundEnabled": true, "taskReminders": true, "pushNotifications": false, "emailNotifications": true}'::jsonb)
FROM public.profiles
ON CONFLICT (user_id) DO NOTHING;

-- 3) Drop sensitive columns from profiles
ALTER TABLE public.profiles DROP COLUMN IF EXISTS birthday_zapier_webhook;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS preferences;

-- 4) Remove subscriptions from realtime publication (Stripe IDs leak)
ALTER PUBLICATION supabase_realtime DROP TABLE public.subscriptions;

-- 5) Drop self-insert policy on notifications (only service role inserts)
DROP POLICY IF EXISTS "Usuários podem criar suas próprias notificações" ON public.notifications;

-- 6) Tighten avatar upload policy to enforce path = user id
DROP POLICY IF EXISTS "Avatar Upload Policy" ON storage.objects;
CREATE POLICY "Avatar Upload Policy"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- 7) Helper function to look up a user id by username (for adding collaborators)
CREATE OR REPLACE FUNCTION public.find_user_id_by_username(p_username text)
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT id FROM public.profiles WHERE username = p_username LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.find_user_id_by_username(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.find_user_id_by_username(text) TO authenticated;

-- 8) Revoke EXECUTE from anon on SECURITY DEFINER functions
REVOKE EXECUTE ON FUNCTION public.add_task_collaborator(uuid, uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.add_task_collaborator(uuid, uuid, uuid) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.remove_task_collaborator(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.remove_task_collaborator(uuid) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.get_task_collaborators(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_task_collaborators(uuid) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.is_task_collaborator(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_task_collaborator(uuid, uuid) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.create_user_profile(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_user_profile(uuid, text) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.criar_politicas_avatar() FROM PUBLIC, anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.can_create_board(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_create_board(uuid) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.generate_invite_token() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.generate_invite_token() TO authenticated;
