
-- Função para verificar se um usuário já é colaborador de uma tarefa
CREATE OR REPLACE FUNCTION public.is_task_collaborator(p_task_id UUID, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.task_collaborators 
    WHERE task_id = p_task_id AND user_id = p_user_id
  );
$$;

-- Função para adicionar um colaborador a uma tarefa
CREATE OR REPLACE FUNCTION public.add_task_collaborator(
  p_task_id UUID,
  p_user_id UUID,
  p_added_by UUID
)
RETURNS UUID
LANGUAGE SQL
SECURITY DEFINER
AS $$
  INSERT INTO public.task_collaborators (task_id, user_id, added_by)
  VALUES (p_task_id, p_user_id, p_added_by)
  RETURNING id;
$$;

-- Função para remover um colaborador de uma tarefa
CREATE OR REPLACE FUNCTION public.remove_task_collaborator(p_collaborator_id UUID)
RETURNS VOID
LANGUAGE SQL
SECURITY DEFINER
AS $$
  DELETE FROM public.task_collaborators
  WHERE id = p_collaborator_id;
$$;

-- Função para buscar colaboradores de uma tarefa
CREATE OR REPLACE FUNCTION public.get_task_collaborators(p_task_id UUID)
RETURNS TABLE (
  id UUID,
  task_id UUID,
  user_id UUID,
  added_at TIMESTAMPTZ,
  added_by UUID,
  username TEXT,
  user_email TEXT
)
LANGUAGE SQL
SECURITY DEFINER
AS $$
  SELECT 
    tc.id,
    tc.task_id,
    tc.user_id,
    tc.added_at,
    tc.added_by,
    p.username,
    p.username || '@example.com' AS user_email
  FROM 
    public.task_collaborators tc
  LEFT JOIN
    public.profiles p ON tc.user_id = p.id
  WHERE 
    tc.task_id = p_task_id;
$$;
