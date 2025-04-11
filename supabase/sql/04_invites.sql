-- Criar a tabela de convites
CREATE TABLE IF NOT EXISTS invites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID REFERENCES auth.users(id) NOT NULL,
    email TEXT NOT NULL,
    token TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    UNIQUE(owner_id, email)
);

-- Habilitar RLS na tabela
ALTER TABLE invites ENABLE ROW LEVEL SECURITY;

-- Criar políticas de segurança
CREATE POLICY "Usuários podem ver seus próprios convites"
    ON invites FOR SELECT
    USING (owner_id = auth.uid());

CREATE POLICY "Usuários podem criar convites"
    ON invites FOR INSERT
    WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Usuários podem atualizar seus convites"
    ON invites FOR UPDATE
    USING (owner_id = auth.uid());

-- Criar função para gerar token único
CREATE OR REPLACE FUNCTION generate_invite_token()
RETURNS TEXT AS $$
DECLARE
    token TEXT;
BEGIN
    token := encode(gen_random_bytes(32), 'base64');
    RETURN token;
END;
$$ LANGUAGE plpgsql; 