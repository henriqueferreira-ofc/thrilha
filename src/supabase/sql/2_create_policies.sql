-- Políticas RLS para a tabela profiles
-- Execute este script SOMENTE após verificar que as políticas não existem

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