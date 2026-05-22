-- Restrict existing public-role RLS policies to authenticated users only

-- birthdays
DROP POLICY IF EXISTS "Usuários podem adicionar aniversários" ON public.birthdays;
DROP POLICY IF EXISTS "Usuários podem atualizar seus aniversários" ON public.birthdays;
DROP POLICY IF EXISTS "Usuários podem excluir seus aniversários" ON public.birthdays;
DROP POLICY IF EXISTS "Usuários podem visualizar seus aniversários" ON public.birthdays;

CREATE POLICY "Usuários autenticados podem adicionar aniversários"
ON public.birthdays FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários autenticados podem atualizar seus aniversários"
ON public.birthdays FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários autenticados podem excluir seus aniversários"
ON public.birthdays FOR DELETE TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Usuários autenticados podem visualizar seus aniversários"
ON public.birthdays FOR SELECT TO authenticated
USING (auth.uid() = user_id);

-- boards
DROP POLICY IF EXISTS "Usuários podem atualizar seus próprios boards" ON public.boards;
DROP POLICY IF EXISTS "Usuários podem criar seus próprios boards" ON public.boards;
DROP POLICY IF EXISTS "Usuários podem deletar seus próprios boards" ON public.boards;
DROP POLICY IF EXISTS "Usuários podem visualizar seus próprios boards" ON public.boards;

CREATE POLICY "Usuários autenticados podem atualizar seus próprios boards"
ON public.boards FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários autenticados podem criar seus próprios boards"
ON public.boards FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários autenticados podem deletar seus próprios boards"
ON public.boards FOR DELETE TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Usuários autenticados podem visualizar seus próprios boards"
ON public.boards FOR SELECT TO authenticated
USING (auth.uid() = user_id);

-- collaborators
DROP POLICY IF EXISTS "Usuários podem adicionar colaboradores" ON public.collaborators;
DROP POLICY IF EXISTS "Usuários podem remover seus colaboradores" ON public.collaborators;
DROP POLICY IF EXISTS "Usuários podem ver seus próprios colaboradores" ON public.collaborators;
DROP POLICY IF EXISTS "Usuários autenticados podem atualizar seus colaboradores" ON public.collaborators;

CREATE POLICY "Usuários autenticados podem adicionar colaboradores"
ON public.collaborators FOR INSERT TO authenticated
WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Usuários autenticados podem remover seus colaboradores"
ON public.collaborators FOR DELETE TO authenticated
USING (owner_id = auth.uid());

CREATE POLICY "Usuários autenticados podem ver seus próprios colaboradores"
ON public.collaborators FOR SELECT TO authenticated
USING (owner_id = auth.uid() OR collaborator_id = auth.uid());

CREATE POLICY "Usuários autenticados podem atualizar seus colaboradores"
ON public.collaborators FOR UPDATE TO authenticated
USING (owner_id = auth.uid())
WITH CHECK (owner_id = auth.uid());

-- group_members
DROP POLICY IF EXISTS "Usuários podem ver membros de grupos que participam" ON public.group_members;
DROP POLICY IF EXISTS "Criadores podem adicionar membros ao grupo" ON public.group_members;
DROP POLICY IF EXISTS "Criadores podem atualizar membros do grupo" ON public.group_members;
DROP POLICY IF EXISTS "Criadores podem remover membros do grupo" ON public.group_members;

CREATE POLICY "Usuários autenticados podem ver membros de grupos que participam"
ON public.group_members FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.group_members gm
    WHERE gm.group_id = group_members.group_id
      AND gm.user_id = auth.uid()
  )
);

CREATE POLICY "Criadores podem adicionar membros ao grupo"
ON public.group_members FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.work_groups wg
    WHERE wg.id = group_members.group_id
      AND wg.created_by = auth.uid()
  )
);

CREATE POLICY "Criadores podem atualizar membros do grupo"
ON public.group_members FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.work_groups wg
    WHERE wg.id = group_members.group_id
      AND wg.created_by = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.work_groups wg
    WHERE wg.id = group_members.group_id
      AND wg.created_by = auth.uid()
  )
);

CREATE POLICY "Criadores podem remover membros do grupo"
ON public.group_members FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.work_groups wg
    WHERE wg.id = group_members.group_id
      AND wg.created_by = auth.uid()
  )
);

-- invites
DROP POLICY IF EXISTS "Usuários podem atualizar seus convites" ON public.invites;
DROP POLICY IF EXISTS "Usuários podem criar convites" ON public.invites;
DROP POLICY IF EXISTS "Usuários podem ver seus próprios convites" ON public.invites;

CREATE POLICY "Usuários autenticados podem atualizar seus convites"
ON public.invites FOR UPDATE TO authenticated
USING (owner_id = auth.uid())
WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Usuários autenticados podem criar convites"
ON public.invites FOR INSERT TO authenticated
WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Usuários autenticados podem ver seus próprios convites"
ON public.invites FOR SELECT TO authenticated
USING (owner_id = auth.uid());

-- profiles
DROP POLICY IF EXISTS "Usuários podem atualizar seus próprios perfis" ON public.profiles;
DROP POLICY IF EXISTS "Usuários podem ver seus próprios perfis e de colaboradores" ON public.profiles;
DROP POLICY IF EXISTS "Usuários autenticados podem ver seus próprios perfis e de colaboradores" ON public.profiles;

CREATE POLICY "Usuários autenticados podem ver seus próprios perfis e de colaboradores"
ON public.profiles FOR SELECT TO authenticated
USING (
  auth.uid() = id OR EXISTS (
    SELECT 1 FROM public.collaborators
    WHERE (collaborators.owner_id = auth.uid() AND collaborators.collaborator_id = profiles.id)
       OR (collaborators.collaborator_id = auth.uid() AND collaborators.owner_id = profiles.id)
  )
);

-- subscriptions
DROP POLICY IF EXISTS "Usuários podem visualizar suas próprias assinaturas" ON public.subscriptions;

CREATE POLICY "Usuários autenticados podem visualizar suas próprias assinaturas"
ON public.subscriptions FOR SELECT TO authenticated
USING (auth.uid() = user_id);

-- task_collaborators
DROP POLICY IF EXISTS "Dono da tarefa pode adicionar colaboradores" ON public.task_collaborators;
DROP POLICY IF EXISTS "Dono da tarefa pode remover colaboradores" ON public.task_collaborators;

CREATE POLICY "Dono autenticado da tarefa pode adicionar colaboradores"
ON public.task_collaborators FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() IN (
    SELECT tasks.user_id FROM public.tasks
    WHERE tasks.id = task_collaborators.task_id
  )
);

CREATE POLICY "Dono autenticado da tarefa pode remover colaboradores"
ON public.task_collaborators FOR DELETE TO authenticated
USING (
  auth.uid() IN (
    SELECT tasks.user_id FROM public.tasks
    WHERE tasks.id = task_collaborators.task_id
  )
);

-- task_permissions
DROP POLICY IF EXISTS "Usuários podem ver permissões de tarefas que têm acesso" ON public.task_permissions;
DROP POLICY IF EXISTS "Donos podem criar permissões de tarefas" ON public.task_permissions;
DROP POLICY IF EXISTS "Donos podem atualizar permissões de tarefas" ON public.task_permissions;
DROP POLICY IF EXISTS "Donos podem remover permissões de tarefas" ON public.task_permissions;

CREATE POLICY "Usuários autenticados podem ver permissões de tarefas que têm acesso"
ON public.task_permissions FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.group_members gm
    WHERE gm.group_id = task_permissions.group_id
      AND gm.user_id = auth.uid()
  )
);

CREATE POLICY "Donos podem criar permissões de tarefas"
ON public.task_permissions FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.tasks t
    WHERE t.id = task_permissions.task_id
      AND t.user_id = auth.uid()
  )
);

CREATE POLICY "Donos podem atualizar permissões de tarefas"
ON public.task_permissions FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.tasks t
    WHERE t.id = task_permissions.task_id
      AND t.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.tasks t
    WHERE t.id = task_permissions.task_id
      AND t.user_id = auth.uid()
  )
);

CREATE POLICY "Donos podem remover permissões de tarefas"
ON public.task_permissions FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.tasks t
    WHERE t.id = task_permissions.task_id
      AND t.user_id = auth.uid()
  )
);

-- tasks
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON public.tasks;

-- work_groups
DROP POLICY IF EXISTS "Usuários podem criar grupos" ON public.work_groups;
DROP POLICY IF EXISTS "Usuários podem ver grupos que são membros" ON public.work_groups;
DROP POLICY IF EXISTS "Criadores podem atualizar grupos" ON public.work_groups;
DROP POLICY IF EXISTS "Criadores podem excluir grupos" ON public.work_groups;

CREATE POLICY "Usuários autenticados podem criar grupos"
ON public.work_groups FOR INSERT TO authenticated
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Usuários autenticados podem ver grupos que são membros"
ON public.work_groups FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.group_members
    WHERE group_members.group_id = work_groups.id
      AND group_members.user_id = auth.uid()
  )
);

CREATE POLICY "Criadores podem atualizar grupos"
ON public.work_groups FOR UPDATE TO authenticated
USING (created_by = auth.uid())
WITH CHECK (created_by = auth.uid());

CREATE POLICY "Criadores podem excluir grupos"
ON public.work_groups FOR DELETE TO authenticated
USING (created_by = auth.uid());

-- Realtime channel authorization for authenticated users
ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can receive their own realtime messages" ON realtime.messages;
CREATE POLICY "Users can receive their own realtime messages"
ON realtime.messages FOR SELECT TO authenticated
USING (
  topic = concat('user:', auth.uid()::text)
  OR topic = concat('boards:user:', auth.uid()::text)
  OR topic = concat('tasks:user:', auth.uid()::text)
);