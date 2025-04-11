-- Criar a tabela de colaboradores se não existir
CREATE TABLE IF NOT EXISTS collaborators (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID REFERENCES auth.users(id) NOT NULL,
    collaborator_id UUID REFERENCES auth.users(id) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(owner_id, collaborator_id)
);

-- Habilitar RLS na tabela
ALTER TABLE collaborators ENABLE ROW LEVEL SECURITY;

-- Remover políticas existentes
DROP POLICY IF EXISTS "Usuários podem ver seus próprios colaboradores" ON collaborators;
DROP POLICY IF EXISTS "Usuários podem adicionar colaboradores" ON collaborators;
DROP POLICY IF EXISTS "Usuários podem remover seus colaboradores" ON collaborators;

-- Criar políticas de segurança
CREATE POLICY "Usuários podem ver seus próprios colaboradores"
    ON collaborators FOR SELECT
    USING (owner_id = auth.uid());

CREATE POLICY "Usuários podem adicionar colaboradores"
    ON collaborators FOR INSERT
    WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Usuários podem remover seus colaboradores"
    ON collaborators FOR DELETE
    USING (owner_id = auth.uid());

-- Criar view para facilitar a consulta de colaboradores com seus perfis
CREATE OR REPLACE VIEW collaborators_with_profiles AS
SELECT 
    c.*,
    p.username as full_name
FROM 
    collaborators c
JOIN 
    profiles p ON c.collaborator_id = p.id; 