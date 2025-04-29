import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function AcceptInvite() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState<'loading' | 'error' | 'success'>('loading');
    const [message, setMessage] = useState('');

    useEffect(() => {
        const acceptInvite = async () => {
            try {
                const token = searchParams.get('token');
                if (!token) {
                    setStatus('error');
                    setMessage('Token de convite não encontrado.');
                    return;
                }

                // Verificar se o usuário está autenticado
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) {
                    // Redirecionar para login mantendo o token como state
                    navigate('/login', { state: { returnTo: `/accept-invite?token=${token}` } });
                    return;
                }

                // Buscar o convite e informações do grupo
                const { data: invite, error: inviteError } = await supabase
                    .from('invites')
                    .select(`
                        *,
                        work_groups (
                            name
                        )
                    `)
                    .eq('token', token)
                    .eq('status', 'pending')
                    .single();

                if (inviteError || !invite) {
                    setStatus('error');
                    setMessage('Convite não encontrado ou já utilizado.');
                    return;
                }

                // Verificar se o convite não expirou
                if (new Date(invite.expires_at) < new Date()) {
                    setStatus('error');
                    setMessage('Este convite expirou.');
                    return;
                }

                // Verificar se o email do convite corresponde ao email do usuário
                if (invite.email !== user.email) {
                    setStatus('error');
                    setMessage('Este convite foi enviado para outro email.');
                    return;
                }

                // Adicionar o usuário como colaborador
                const { error: collaboratorError } = await supabase
                    .from('collaborators')
                    .insert([
                        {
                            user_id: user.id,
                            owner_id: invite.owner_id,
                            work_group_id: invite.work_group_id
                        }
                    ]);

                if (collaboratorError) {
                    console.error('Erro ao adicionar colaborador:', collaboratorError);
                    setStatus('error');
                    setMessage('Erro ao adicionar colaborador.');
                    return;
                }

                // Atualizar o status do convite
                const { error: updateError } = await supabase
                    .from('invites')
                    .update({ 
                        status: 'accepted',
                        accepted_at: new Date().toISOString()
                    })
                    .eq('id', invite.id);

                if (updateError) {
                    console.error('Erro ao atualizar convite:', updateError);
                    setStatus('error');
                    setMessage('Erro ao atualizar status do convite.');
                    return;
                }

                setStatus('success');
                setMessage(`Convite aceito com sucesso! Você agora é colaborador ${invite.work_groups?.name ? `do grupo "${invite.work_groups.name}"` : ''}.`);

                // Redirecionar após 2 segundos
                setTimeout(() => {
                    navigate('/dashboard');
                }, 2000);

            } catch (error) {
                console.error('Erro ao processar convite:', error);
                setStatus('error');
                setMessage('Erro ao processar convite.');
            }
        };

        acceptInvite();
    }, [searchParams, navigate]);

    return (
        <div className="min-h-screen bg-black flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-zinc-900 rounded-lg shadow-xl p-6 border border-purple-500/20">
                <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent">
                        {status === 'loading' && 'Processando Convite'}
                        {status === 'error' && 'Erro no Convite'}
                        {status === 'success' && 'Convite Aceito'}
                    </h2>
                </div>

                <div className="space-y-4">
                    {status === 'loading' && (
                        <div className="flex items-center justify-center p-6">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
                            <span className="ml-3 text-gray-300">
                                Processando seu convite...
                            </span>
                        </div>
                    )}

                    {status === 'error' && (
                        <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-4">
                            <h3 className="text-red-400 font-semibold mb-2">
                                Não foi possível aceitar o convite
                            </h3>
                            <p className="text-gray-300 mb-4">{message}</p>
                            <button 
                                onClick={() => navigate('/dashboard')}
                                className="w-full bg-gradient-to-r from-purple-500 to-purple-700 text-white py-2 px-4 rounded-lg hover:from-purple-600 hover:to-purple-800 transition-all duration-200"
                            >
                                Voltar ao Dashboard
                            </button>
                        </div>
                    )}

                    {status === 'success' && (
                        <div className="bg-purple-900/20 border border-purple-500/50 rounded-lg p-4">
                            <h3 className="text-purple-400 font-semibold mb-2">
                                Tudo certo!
                            </h3>
                            <p className="text-gray-300">{message}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
