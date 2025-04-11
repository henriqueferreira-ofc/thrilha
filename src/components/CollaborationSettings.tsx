import React, { useState, useEffect } from 'react';
import { useCollaboration } from '../hooks/useCollaboration';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

// Componente para reenviar convites
const ResendInvites = () => {
    const [isResending, setIsResending] = useState(false);
    const DEVELOPER_EMAIL = 'henriqueanalista.ads@gmail.com';

    const handleResendInvites = async () => {
        try {
            setIsResending(true);
            
            // Buscar os convites pendentes
            const { data: pendingInvites, error: invitesError } = await supabase()
                .from('invites')
                .select('*')
                .eq('status', 'pending');

            if (invitesError) {
                console.error('Erro ao buscar convites pendentes:', invitesError);
                throw invitesError;
            }

            if (!pendingInvites || pendingInvites.length === 0) {
                toast.info('Não há convites pendentes para reenviar.');
                return;
            }

            // Filtrar apenas convites para o email do desenvolvedor
            const developerInvites = pendingInvites.filter(invite => invite.email === DEVELOPER_EMAIL);

            if (developerInvites.length === 0) {
                toast.error('Durante o modo de teste, os convites só podem ser reenviados para o email do desenvolvedor (henriqueanalista.ads@gmail.com).');
                return;
            }

            console.log('Convites pendentes encontrados:', developerInvites);

            // Função para adicionar delay entre requisições
            const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

            // Enviar cada convite pendente com delay
            const results = [];
            for (const invite of developerInvites) {
                try {
                    const requestBody = {
                        email: invite.email,
                        inviteId: invite.id,
                        token: invite.token,
                        ownerId: invite.owner_id
                    };

                    console.log('Enviando convite:', requestBody);

                    const response = await fetch('https://yieihrvcbshzmxieflsv.supabase.co/functions/v1/send-invite-email', {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(requestBody)
                    });

                    console.log('Resposta do servidor:', response.status, response.statusText);

                    if (!response.ok) {
                        const errorText = await response.text();
                        console.error('Erro na resposta:', errorText);
                        
                        // Verificar se é erro de domínio não verificado
                        if (errorText.includes('verify a domain')) {
                            toast.error('Erro: É necessário verificar um domínio no Resend.com para enviar emails para outros destinatários.');
                            break;
                        }
                        
                        // Verificar se é erro de limite de taxa
                        if (errorText.includes('rate limit')) {
                            toast.error('Erro: Muitas requisições em pouco tempo. Aguarde um momento e tente novamente.');
                            break;
                        }

                        throw new Error(`Erro ao enviar convite: ${response.status} ${response.statusText}`);
                    }

                    const data = await response.json();
                    console.log('Dados da resposta:', data);

                    results.push({
                        status: 'sent',
                        email: invite.email
                    });

                    // Adicionar delay de 500ms entre requisições
                    await delay(500);

                } catch (error) {
                    console.error('Erro ao processar convite:', error);
                    results.push({
                        status: 'error',
                        email: invite.email,
                        error: error instanceof Error ? error.message : 'Erro desconhecido'
                    });
                }
            }

            const sent = results.filter(r => r.status === 'sent').length;
            const failed = results.filter(r => r.status === 'error').length;

            if (sent > 0) {
                toast.success(`${sent} convite${sent > 1 ? 's' : ''} reenviado${sent > 1 ? 's' : ''} com sucesso!`);
            }
            
            if (failed > 0) {
                const failedEmails = results
                    .filter(r => r.status === 'error')
                    .map(r => r.email)
                    .join(', ');
                toast.error(`${failed} convite${failed > 1 ? 's' : ''} não pude${failed > 1 ? 'ram' : ''} ser reenviado${failed > 1 ? 's' : ''} para: ${failedEmails}`);
            }

        } catch (error) {
            console.error('Erro ao reenviar convites:', error);
            toast.error('Erro ao reenviar convites. Tente novamente.');
        } finally {
            setIsResending(false);
        }
    };

    return (
        <div className="flex flex-col gap-2 p-4 bg-zinc-900/50 rounded-lg border border-purple-500/20">
            <h3 className="text-lg font-semibold bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent">
                Convites Pendentes
            </h3>
            <p className="text-gray-400 text-sm">
                Reenvie os emails para todos os convites que ainda estão pendentes.
            </p>
            <p className="text-yellow-400 text-sm">
                ⚠️ Durante o modo de teste, apenas convites para o email do desenvolvedor (henriqueanalista.ads@gmail.com) podem ser reenviados.
            </p>
            <Button
                onClick={handleResendInvites}
                disabled={isResending}
                className="bg-gradient-to-r from-purple-500 to-purple-700 hover:from-purple-600 hover:to-purple-800 text-white mt-2"
            >
                {isResending ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Reenviando...
                    </>
                ) : (
                    'Reenviar Convites Pendentes'
                )}
            </Button>
        </div>
    );
};

export function CollaborationSettings() {
    const { collaborators, invites, loading, error, sendInvite, removeMember } = useCollaboration();
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [pendingInvites, setPendingInvites] = useState([]);
    const [isDeleting, setIsDeleting] = useState<string | null>(null);
    const [deletedInvites, setDeletedInvites] = useState<Set<string>>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('deletedInvites');
            return new Set(saved ? JSON.parse(saved) : []);
        }
        return new Set();
    });

    // Atualizar localStorage quando deletedInvites mudar
    useEffect(() => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('deletedInvites', JSON.stringify([...deletedInvites]));
        }
    }, [deletedInvites]);

    const handleInviteMember = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);

        if (!email.trim()) {
            setMessage({ type: 'error', text: 'Por favor, insira um email válido' });
            return;
        }

        // Verificar se o email é do desenvolvedor (modo de teste)
        if (email.trim() !== 'henriqueanalista.ads@gmail.com') {
            setMessage({ 
                type: 'error', 
                text: 'Durante o modo de teste, os convites só podem ser enviados para o email do desenvolvedor (henriqueanalista.ads@gmail.com).' 
            });
            return;
        }

        try {
            const success = await sendInvite(email.trim());
            if (success) {
                setMessage({ type: 'success', text: 'Convite enviado com sucesso!' });
                setEmail('');
                // Recarregar os dados para atualizar a lista de convites pendentes
                await loadCollaborationData();
            }
        } catch (error) {
            console.error('Erro ao enviar convite:', error);
            const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
            
            if (errorMessage.includes('Já existe um convite pendente')) {
                setMessage({ type: 'error', text: 'Já existe um convite pendente para este email. Aguarde a resposta ou reenvie o convite existente.' });
            } else if (errorMessage.includes('Durante o modo de teste')) {
                setMessage({ type: 'error', text: errorMessage });
            } else {
                setMessage({ type: 'error', text: 'Erro ao enviar convite. Verifique se o email está correto.' });
            }
        }
    };

    const handleDeleteInvite = async (inviteId: string) => {
        // Adicionar o ID do convite à lista de excluídos
        setDeletedInvites(prev => {
            const newSet = new Set(prev);
            newSet.add(inviteId);
            return newSet;
        });
        
        // Remover imediatamente da interface
        setPendingInvites(prevInvites => prevInvites.filter(invite => invite.id !== inviteId));
        
        try {
            setIsDeleting(inviteId);
            
            const { error: deleteError } = await supabase()
                .from('invites')
                .delete()
                .eq('id', inviteId);

            if (deleteError) {
                throw deleteError;
            }

            toast.success('Convite excluído com sucesso!');
        } catch (error) {
            console.error('Erro ao excluir convite:', error);
            // Remover o ID do convite da lista de excluídos em caso de erro
            setDeletedInvites(prev => {
                const newSet = new Set(prev);
                newSet.delete(inviteId);
                return newSet;
            });
            toast.error('Erro ao excluir convite. Tente novamente.');
        } finally {
            setIsDeleting(null);
        }
    };

    const loadCollaborationData = async () => {
        try {
            // Carregar convites pendentes
            const { data: invitesData, error: invitesError } = await supabase()
                .from('invites')
                .select('*')
                .eq('status', 'pending');

            if (invitesError) throw invitesError;

            // Filtrar os convites excluídos e expirados
            const filteredInvites = (invitesData || []).filter(invite => {
                const isDeleted = deletedInvites.has(invite.id);
                const isExpired = new Date(invite.expires_at) < new Date();
                return !isDeleted && !isExpired;
            });
            
            setPendingInvites(filteredInvites);

            // Verificar se há convites aceitos que precisam ser atualizados
            for (const invite of filteredInvites) {
                const { data: inviteStatus, error: statusError } = await supabase()
                    .from('invites')
                    .select('status')
                    .eq('id', invite.id)
                    .single();

                if (!statusError && inviteStatus && inviteStatus.status !== 'pending') {
                    // Se o convite não está mais pendente, removê-lo da lista
                    setPendingInvites(prev => prev.filter(i => i.id !== invite.id));
                }
            }

        } catch (error) {
            console.error('Erro ao carregar dados:', error);
            toast.error('Erro ao carregar informações de colaboração');
        }
    };

    useEffect(() => {
        loadCollaborationData();
        // Configurar um intervalo para atualizar os dados a cada 30 segundos
        const interval = setInterval(loadCollaborationData, 30000);
        return () => clearInterval(interval);
    }, []);

    if (loading) {
        return <div>Carregando...</div>;
    }

    if (error) {
        return <div>Erro: {error}</div>;
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Configurações de Colaboração</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="mb-4 p-4 bg-yellow-900/20 border border-yellow-500/50 rounded-lg">
                        <p className="text-yellow-400 text-sm">
                            ⚠️ Modo de Teste: Durante o desenvolvimento, os convites só podem ser enviados para o email do desenvolvedor (henriqueanalista.ads@gmail.com). Para enviar convites para outros emails, é necessário verificar um domínio no Resend.com.
                        </p>
                    </div>

                    <form onSubmit={handleInviteMember} className="space-y-4">
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-200">
                                Convidar Colaborador
                            </label>
                            <div className="mt-1 flex gap-2">
                                <Input
                                    type="email"
                                    id="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="Email do colaborador"
                                    className="flex-1"
                                />
                                <Button type="submit">
                                    Convidar
                                </Button>
                            </div>
                            {message && (
                                <p className={`mt-2 text-sm ${message.type === 'success' ? 'text-green-500' : 'text-red-500'}`}>
                                    {message.text}
                                </p>
                            )}
                        </div>
                    </form>

                    {/* Seção de Convites Pendentes */}
                    {pendingInvites.length > 0 && (
                        <div className="mt-6">
                            <h3 className="text-lg font-medium text-gray-200 mb-4">
                                Convites Pendentes ({pendingInvites.length})
                            </h3>
                            <div className="space-y-2">
                                {pendingInvites.map((invite) => (
                                    <div
                                        key={invite.id}
                                        className="flex items-center justify-between p-3 rounded-lg bg-zinc-900/50"
                                    >
                                        <div className="flex items-center gap-3">
                                            <Avatar>
                                                <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${invite.email}`} />
                                                <AvatarFallback>
                                                    {invite.email[0].toUpperCase()}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p className="font-medium">{invite.email}</p>
                                                <p className="text-sm text-gray-400">
                                                    Expira em: {new Date(invite.expires_at).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Badge variant="outline" className="text-yellow-500 border-yellow-500">
                                                Pendente
                                            </Badge>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleDeleteInvite(invite.id)}
                                                disabled={isDeleting === invite.id}
                                                className="text-red-500 hover:text-red-600"
                                            >
                                                {isDeleting === invite.id ? (
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                ) : (
                                                    <X className="h-4 w-4" />
                                                )}
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="mt-6">
                        <h3 className="text-lg font-medium text-gray-200 mb-4">
                            Colaboradores Atuais
                        </h3>
                        <div className="space-y-2">
                            {collaborators.map((collaborator) => (
                                <div
                                    key={collaborator.id}
                                    className="flex items-center justify-between p-3 rounded-lg bg-zinc-900/50"
                                >
                                    <div className="flex items-center gap-3">
                                        <Avatar>
                                            <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${collaborator.email}`} />
                                            <AvatarFallback>
                                                {collaborator.email[0].toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="font-medium">{collaborator.email}</p>
                                            <Badge variant="secondary" className="mt-1">
                                                Colaborador
                                            </Badge>
                                        </div>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => removeMember(collaborator.id)}
                                        className="text-red-500 hover:text-red-600"
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                            {collaborators.length === 0 && (
                                <p className="text-gray-400 text-sm">
                                    Nenhum colaborador adicionado ainda.
                                </p>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            <ResendInvites />
        </div>
    );
} 