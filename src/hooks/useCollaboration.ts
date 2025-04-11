import { useState, useEffect } from 'react';
import { supabase } from '../supabase/client';

interface Collaborator {
    id: string;
    owner_id: string;
    collaborator_id: string;
    created_at: string;
    full_name: string;
}

interface Invite {
    id: string;
    email: string;
    status: string;
    created_at: string;
    expires_at: string;
}

export function useCollaboration() {
    const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
    const [invites, setInvites] = useState<Invite[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Carregar colaboradores
    const loadCollaborators = async () => {
        try {
            const user = await supabase.auth.getUser();
            if (!user.data.user) {
                throw new Error('Usuário não autenticado');
            }

            console.log('Carregando colaboradores para o usuário:', user.data.user.id);

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
            const { data: collaborators, error } = await supabase
                .from('collaborators_with_profiles')
                .select('*')
                .eq('owner_id', user.data.user.id);

            if (error) {
                console.error('Erro ao carregar colaboradores:', error);
                throw error;
            }

            console.log('Colaboradores carregados:', collaborators);
            setCollaborators(collaborators || []);
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
            const user = await supabase.auth.getUser();
            if (!user.data.user) {
                throw new Error('Usuário não autenticado');
            }

            const { data: invites, error } = await supabase
                .from('invites')
                .select('*')
                .eq('owner_id', user.data.user.id)
                .eq('status', 'pending');

            if (error) {
                console.error('Erro ao carregar convites:', error);
                throw error;
            }

            setInvites(invites || []);
        } catch (err) {
            console.error('Erro ao carregar convites:', err);
        }
    };

    // Enviar convite
    const sendInvite = async (email: string) => {
        try {
            const user = await supabase.auth.getUser();
            if (!user.data.user) {
                throw new Error('Usuário não autenticado');
            }

            // Verificar se já existe um convite pendente para este email
            const { data: existingInvite, error: checkError } = await supabase
                .from('invites')
                .select('id')
                .eq('owner_id', user.data.user.id)
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
                        owner_id: user.data.user.id,
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
                        ownerId: user.data.user.id
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

    // Remover colaborador
    const removeMember = async (collaboratorId: string) => {
        try {
            const user = await supabase.auth.getUser();
            if (!user.data.user) {
                throw new Error('Usuário não autenticado');
            }

            const { error } = await supabase
                .from('collaborators')
                .delete()
                .eq('collaborator_id', collaboratorId)
                .eq('owner_id', user.data.user.id);

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
    }, []);

    return {
        collaborators,
        invites,
        loading,
        error,
        sendInvite,
        removeMember,
        loadCollaborators
    };
} 