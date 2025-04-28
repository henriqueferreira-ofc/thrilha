-- Criação da função para criar perfil de usuário (a ser executada no painel do Supabase SQL Editor)
-- Esta função permite criar perfis de usuários contornando as políticas RLS
-- É necessário ter permissões de administrador para instalar esta função

-- Função para criar perfil de usuário
CREATE OR REPLACE FUNCTION public.create_user_profile(user_id UUID, user_name TEXT)
RETURNS "profiles" AS $$
DECLARE
  new_profile "profiles";
BEGIN
  -- Verificar se o perfil já existe
  SELECT * INTO new_profile FROM profiles WHERE id = user_id;
  
  -- Se não existir, inserir novo perfil
  IF new_profile.id IS NULL THEN
    INSERT INTO profiles (id, username, updated_at)
    VALUES (user_id, user_name, NOW())
    RETURNING * INTO new_profile;
  END IF;
  
  RETURN new_profile;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comentário para a função
COMMENT ON FUNCTION public.create_user_profile IS 'Cria um novo perfil de usuário com bypass de RLS using SECURITY DEFINER';

-- Conceder permissões para a função ser usada por usuários autenticados
GRANT EXECUTE ON FUNCTION public.create_user_profile TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_user_profile TO service_role;

-- Política RLS para a tabela profiles (caso não exista)
-- Esta política permite que usuários autenticados vejam apenas seus próprios perfis
CREATE POLICY "Users can view their own profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Esta política permite que usuários autenticados atualizem apenas seus próprios perfis
CREATE POLICY "Users can update their own profiles"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Política para permitir inserção apenas pelo próprio usuário
CREATE POLICY "Users can insert their own profiles"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id); 