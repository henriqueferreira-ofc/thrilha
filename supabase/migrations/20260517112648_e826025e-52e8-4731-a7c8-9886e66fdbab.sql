
-- 1. Notifications: restrict to authenticated
DROP POLICY IF EXISTS "Usuários podem ver suas próprias notificações" ON public.notifications;
CREATE POLICY "Usuários podem ver suas próprias notificações"
  ON public.notifications FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- 2. Storage policies: add bucket_id filter
DROP POLICY IF EXISTS "Avatar Delete Policy" ON storage.objects;
CREATE POLICY "Avatar Delete Policy"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'avatars'
    AND auth.uid() = ((storage.foldername(name))[1])::uuid
  );

DROP POLICY IF EXISTS "Avatar Update Policy" ON storage.objects;
CREATE POLICY "Avatar Update Policy"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'avatars'
    AND auth.uid() = ((storage.foldername(name))[1])::uuid
  );

-- 3. Lock down SECURITY DEFINER functions
-- Internal trigger functions - revoke from all client roles
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_avatar_upload() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.criar_politicas_avatar() FROM PUBLIC, anon, authenticated;

-- RPC functions used by the app - only authenticated
REVOKE EXECUTE ON FUNCTION public.find_user_id_by_username(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.find_user_id_by_username(text) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.is_task_collaborator(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_task_collaborator(uuid, uuid) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.add_task_collaborator(uuid, uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.add_task_collaborator(uuid, uuid, uuid) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.remove_task_collaborator(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.remove_task_collaborator(uuid) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.get_task_collaborators(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_task_collaborators(uuid) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.generate_invite_token() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.generate_invite_token() TO authenticated;

REVOKE EXECUTE ON FUNCTION public.create_user_profile(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_user_profile(uuid, text) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.can_create_board(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_create_board(uuid) TO authenticated;
