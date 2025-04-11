-- Políticas para collaborators
CREATE POLICY IF NOT EXISTS "Usuários podem ver seus próprios colaboradores"
    ON collaborators FOR SELECT
    USING (owner_id = auth.uid());

CREATE POLICY IF NOT EXISTS "Usuários podem adicionar colaboradores"
    ON collaborators FOR INSERT
    WITH CHECK (owner_id = auth.uid());

CREATE POLICY IF NOT EXISTS "Usuários podem remover seus colaboradores"
    ON collaborators FOR DELETE
    USING (owner_id = auth.uid());

-- Política para permitir que colaboradores vejam as tarefas
CREATE POLICY IF NOT EXISTS "Colaboradores podem ver tarefas"
    ON tasks FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM collaborators
            WHERE collaborators.owner_id = tasks.user_id
            AND collaborators.collaborator_id = auth.uid()
        )
    );

-- Política para permitir que colaboradores editem as tarefas
CREATE POLICY IF NOT EXISTS "Colaboradores podem editar tarefas"
    ON tasks FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM collaborators
            WHERE collaborators.owner_id = tasks.user_id
            AND collaborators.collaborator_id = auth.uid()
        )
    );

-- Política para permitir que colaboradores criem tarefas
CREATE POLICY IF NOT EXISTS "Colaboradores podem criar tarefas"
    ON tasks FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM collaborators
            WHERE collaborators.owner_id = tasks.user_id
            AND collaborators.collaborator_id = auth.uid()
        )
    );

-- Política para permitir que colaboradores excluam tarefas
CREATE POLICY IF NOT EXISTS "Colaboradores podem excluir tarefas"
    ON tasks FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM collaborators
            WHERE collaborators.owner_id = tasks.user_id
            AND collaborators.collaborator_id = auth.uid()
        )
    ); 