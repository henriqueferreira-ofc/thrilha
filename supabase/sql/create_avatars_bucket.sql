
-- Verificar se o bucket avatars já existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'avatars'
  ) THEN
    -- Criar o bucket avatars se não existir
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('avatars', 'avatars', true);
    
    -- Criar políticas para permitir acesso público de leitura
    INSERT INTO storage.policies (name, definition, bucket_id)
    VALUES (
      'Avatar images are publicly accessible',
      '(bucket_id = ''avatars'')',
      'avatars'
    );
    
    -- Criar política para permitir que usuários autenticados façam upload
    INSERT INTO storage.policies (name, definition, bucket_id)
    VALUES (
      'Users can upload avatars',
      '(bucket_id = ''avatars'' AND auth.uid() = owner)',
      'avatars'
    );
    
    RAISE NOTICE 'Bucket avatars criado com sucesso!';
  ELSE
    RAISE NOTICE 'Bucket avatars já existe.';
  END IF;
END $$;
