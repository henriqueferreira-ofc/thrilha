-- ============ INVITES ============
DROP POLICY IF EXISTS "Service role can create invites" ON public.invites;
DROP POLICY IF EXISTS "Service role can view all invites" ON public.invites;
DROP POLICY IF EXISTS "Users can create invites" ON public.invites;
DROP POLICY IF EXISTS "Users can insert invites" ON public.invites;
DROP POLICY IF EXISTS "Users can update invites" ON public.invites;
DROP POLICY IF EXISTS "Users can view invites" ON public.invites;
DROP POLICY IF EXISTS "Users can view their own invites" ON public.invites;
-- Mantemos apenas as políticas em português escopadas por owner_id

-- ============ TASK_COLLABORATORS ============
DROP POLICY IF EXISTS "Users can view task collaborators" ON public.task_collaborators;
DROP POLICY IF EXISTS "Users can insert task collaborators" ON public.task_collaborators;
DROP POLICY IF EXISTS "Users can delete task collaborators" ON public.task_collaborators;
DROP POLICY IF EXISTS "Usuários podem ver colaboradores de suas tarefas" ON public.task_collaborators;

CREATE POLICY "Ver colaboradores de tarefas relacionadas"
ON public.task_collaborators
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id
  OR auth.uid() IN (SELECT t.user_id FROM public.tasks t WHERE t.id = task_collaborators.task_id)
);

-- ============ PROFILES ============
DROP POLICY IF EXISTS "Perfis visíveis para todos usuários autenticados" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profiles" ON public.profiles;
-- Mantemos "Usuários podem ver seus próprios perfis e de colaboradores"

-- ============ STORAGE: AVATARS ============
DROP POLICY IF EXISTS "Avatar Upload Policy " ON storage.objects;
DROP POLICY IF EXISTS "Avatar Public Read Policy" ON storage.objects;

CREATE POLICY "Avatar read by owner or collaborators"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'avatars'
  AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR EXISTS (
      SELECT 1 FROM public.collaborators c
      WHERE (c.owner_id = auth.uid() AND c.collaborator_id::text = (storage.foldername(name))[1])
         OR (c.collaborator_id = auth.uid() AND c.owner_id::text = (storage.foldername(name))[1])
    )
  )
);

-- ============ FUNCTION SEARCH PATH ============
ALTER FUNCTION public.add_task_collaborator(uuid, uuid, uuid) SET search_path = public;
ALTER FUNCTION public.handle_new_user() SET search_path = public;
ALTER FUNCTION public.update_updated_at_column() SET search_path = public;
ALTER FUNCTION public.handle_new_avatar_upload() SET search_path = public;
ALTER FUNCTION public.remove_task_collaborator(uuid) SET search_path = public;
ALTER FUNCTION public.is_task_collaborator(uuid, uuid) SET search_path = public;
ALTER FUNCTION public.generate_invite_token() SET search_path = public;
ALTER FUNCTION public.get_task_collaborators(uuid) SET search_path = public;
ALTER FUNCTION public.create_user_profile(uuid, text) SET search_path = public;
ALTER FUNCTION public.can_create_board(uuid) SET search_path = public;
ALTER FUNCTION public.criar_politicas_avatar() SET search_path = public;