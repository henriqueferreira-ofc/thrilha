-- Tabela para armazenar os grupos de trabalho
CREATE TABLE IF NOT EXISTS work_groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    created_by UUID REFERENCES auth.users(id) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela para armazenar os membros dos grupos
CREATE TABLE IF NOT EXISTS group_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id UUID REFERENCES work_groups(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'member')),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(group_id, user_id)
);

-- Tabela para armazenar as permissões de tarefas
CREATE TABLE IF NOT EXISTS task_permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID REFERENCES tasks(id) ON DELETE CASCADE NOT NULL,
    group_id UUID REFERENCES work_groups(id) ON DELETE CASCADE NOT NULL,
    permission_level TEXT NOT NULL CHECK (permission_level IN ('read', 'write', 'admin')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(task_id, group_id)
);

-- Tabela para armazenar as notificações
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    type TEXT NOT NULL,
    content JSONB NOT NULL,
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela para armazenar os perfis dos usuários
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trigger para criar perfil automaticamente quando um usuário é criado
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name)
    VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Políticas de segurança para profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver seus próprios perfis"
    ON profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Usuários podem atualizar seus próprios perfis"
    ON profiles FOR UPDATE
    USING (auth.uid() = id);

-- Tabela para armazenar os colaboradores
CREATE TABLE IF NOT EXISTS collaborators (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID REFERENCES auth.users(id) NOT NULL,
    collaborator_id UUID REFERENCES auth.users(id) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(owner_id, collaborator_id)
);

-- Políticas de segurança para collaborators
ALTER TABLE collaborators ENABLE ROW LEVEL SECURITY;

-- Políticas de segurança
ALTER TABLE work_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Políticas para work_groups
CREATE POLICY "Usuários podem ver grupos que são membros"
    ON work_groups FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM group_members
            WHERE group_members.group_id = work_groups.id
            AND group_members.user_id = auth.uid()
        )
    );

CREATE POLICY "Usuários podem criar grupos"
    ON work_groups FOR INSERT
    WITH CHECK (auth.uid() = created_by);

-- Políticas para group_members
CREATE POLICY "Usuários podem ver membros de grupos que participam"
    ON group_members FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM group_members gm
            WHERE gm.group_id = group_members.group_id
            AND gm.user_id = auth.uid()
        )
    );

-- Políticas para task_permissions
CREATE POLICY "Usuários podem ver permissões de tarefas que têm acesso"
    ON task_permissions FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM group_members gm
            WHERE gm.group_id = task_permissions.group_id
            AND gm.user_id = auth.uid()
        )
    );

-- Políticas para notifications
CREATE POLICY "Usuários podem ver suas próprias notificações"
    ON notifications FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Usuários podem criar suas próprias notificações"
    ON notifications FOR INSERT
    WITH CHECK (user_id = auth.uid()); 