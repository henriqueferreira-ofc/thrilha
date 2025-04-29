import { useState, useEffect } from 'react';
import { supabase } from '../supabase/client';
import { WorkGroup, Collaborator, Invite } from '../types/collaboration';

export function useCollaboration() {
    const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
    const [invites, setInvites] = useState<Invite[]>([]);
    const [groups, setGroups] = useState<WorkGroup[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Carregar colaboradores
    const loadCollaborators = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                throw new Error('Usuário não autenticado');
            }

            console.log('Carregando colaboradores para o usuário:', user.id);

            // Primeiro, verificar se a tabela existe
            const { data: tableExists, error: tableError } = await supabase
                .from('collaborators')
                .select('id')
                .limit(1);

            if (tableError) {
                console.error('Erro ao verificar tabela:', tableError);
                throw new Error('Tabela de colaboradores não encontrada. Por favor, execute o SQL de criação da tabela.');
            }

            // Agora buscar os colaboradores usando a view
            const { data: collaboratorsData, error } = await supabase
                .from('collaborators_with_profiles')
                .select('*')
                .eq('owner_id', user.id);

            if (error) {
                console.error('Erro ao carregar colaboradores:', error);
                throw error;
            }

            // Verificar se os dados dos colaboradores incluem o email
            const processedCollaborators = (collaboratorsData || []).map((collab: any) => ({
                ...collab,
                email: collab.email || `usuário-${collab.collaborator_id.substring(0, 6)}@exemplo.com`
            }));

            console.log('Colaboradores carregados:', processedCollaborators);
            setCollaborators(processedCollaborators || []);
        } catch (err) {
            console.error('Erro detalhado:', err);
            setError(err instanceof Error ? err.message : 'Erro ao carregar colaboradores');
        } finally {
            setLoading(false);
        }
    };

    // Carregar convites pendentes
    const loadInvites = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                throw new Error('Usuário não autenticado');
            }

            const { data: invitesData, error } = await supabase
                .from('invites')
                .select('*')
                .eq('owner_id', user.id)
                .eq('status', 'pending');

            if (error) {
                console.error('Erro ao carregar convites:', error);
                throw error;
            }

            setInvites(invitesData || []);
        } catch (err) {
            console.error('Erro ao carregar convites:', err);
        }
    };

    // Carregar grupos de trabalho
    const loadWorkGroups = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                throw new Error('Usuário não autenticado');
            }

            const { data: groupsData, error } = await supabase
                .from('work_groups')
                .select('*')
                .eq('created_by', user.id);

            if (error) {
                console.error('Erro ao carregar grupos:', error);
                throw error;
            }

            setGroups(groupsData || []);
        } catch (err) {
            console.error('Erro ao carregar grupos:', err);
        }
    };

    // Enviar convite
    const sendInvite = async (email: string) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                throw new Error('Usuário não autenticado');
            }

            // Verificar se já existe um convite pendente para este email
            const { data: existingInvite, error: checkError } = await supabase
                .from('invites')
                .select('id')
                .eq('owner_id', user.id)
                .eq('email', email)
                .eq('status', 'pending')
                .single();

            if (checkError && checkError.code !== 'PGRST116') {
                throw checkError;
            }

            if (existingInvite) {
                throw new Error('Já existe um convite pendente para este email');
            }

            // Gerar token único
            const { data: token, error: tokenError } = await supabase
                .rpc('generate_invite_token');

            if (tokenError) {
                throw tokenError;
            }

            // Criar o convite
            const { data: invite, error: inviteError } = await supabase
                .from('invites')
                .insert([
                    {
                        owner_id: user.id,
                        email,
                        token,
                        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 dias
                    }
                ])
                .select()
                .single();

            if (inviteError) {
                throw inviteError;
            }

            // Enviar email com o link de confirmação
            const { error: emailError } = await supabase
                .functions
                .invoke('send-invite-email', {
                    body: {
                        email,
                        inviteId: invite.id,
                        token,
                        ownerId: user.id
                    }
                });

            if (emailError) {
                console.error('Erro ao enviar email:', emailError);
                // Não lançamos o erro aqui para não impedir a criação do convite
            }

            // Recarregar os convites
            await loadInvites();
            return true;
        } catch (err) {
            console.error('Erro ao enviar convite:', err);
            throw err; // Propagar o erro para ser tratado no componente
        }
    };

    // Criar novo grupo de trabalho
    const createGroup = async (name: string, description?: string) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                throw new Error('Usuário não autenticado');
            }

            const { data: group, error } = await supabase
                .from('work_groups')
                .insert({
                    name,
                    description,
                    created_by: user.id
                })
                .select()
                .single();

            if (error) throw error;

            // Atualizar a lista de grupos
            setGroups(prev => [...prev, group]);
            
            return group;
        } catch (err) {
            console.error('Erro ao criar grupo:', err);
            setError(err instanceof Error ? err.message : 'Erro ao criar grupo');
            return null;
        }
    };

    // Adicionar membro a um grupo
    const addMember = async (groupId: string, userId: string, role: 'member' | 'admin' = 'member') => {
        try {
            const { data: member, error } = await supabase
                .from('group_members')
                .insert({
                    group_id: groupId,
                    user_id: userId,
                    role
                })
                .select()
                .single();

            if (error) throw error;
            return member;
        } catch (err) {
            console.error('Erro ao adicionar membro:', err);
            setError(err instanceof Error ? err.message : 'Erro ao adicionar membro');
            return null;
        }
    };

    // Remover colaborador
    const removeMember = async (collaboratorId: string) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                throw new Error('Usuário não autenticado');
            }

            const { error } = await supabase
                .from('collaborators')
                .delete()
                .eq('collaborator_id', collaboratorId)
                .eq('owner_id', user.id);

            if (error) {
                console.error('Erro ao remover colaborador:', error);
                throw error;
            }

            setCollaborators(collaborators.filter(c => c.collaborator_id !== collaboratorId));
        } catch (err) {
            console.error('Erro detalhado ao remover membro:', err);
            setError(err instanceof Error ? err.message : 'Erro ao remover colaborador');
        }
    };

    // Carregar dados ao montar o componente
    useEffect(() => {
        loadCollaborators();
        loadInvites();
        loadWorkGroups();
    }, []);

    return {
        collaborators,
        invites,
        groups,
        loading,
        error,
        sendInvite,
        removeMember,
        loadCollaborators,
        createGroup,
        addMember
    };
}
