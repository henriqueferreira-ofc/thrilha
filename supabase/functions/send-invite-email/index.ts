import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Email do desenvolvedor para modo de teste
const DEVELOPER_EMAIL = 'henriqueanalista.ads@gmail.com';

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );

        const { email, inviteId, token, ownerId } = await req.json();

        // Verificar se o email é do desenvolvedor (modo de teste)
        if (email !== DEVELOPER_EMAIL) {
            return new Response(
                JSON.stringify({ 
                    error: 'Durante o modo de teste, os emails só podem ser enviados para o endereço do desenvolvedor. Por favor, use o email: henriqueanalista.ads@gmail.com'
                }),
                {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                    status: 400,
                },
            );
        }

        // Buscar informações do dono do convite
        const { data: ownerProfile } = await supabaseClient
            .from('profiles')
            .select('username')
            .eq('id', ownerId)
            .single();

        const acceptUrl = `${Deno.env.get('SITE_URL')}/accept-invite?token=${token}`;

        const { error } = await supabaseClient
            .from('emails')
            .insert([
                {
                    to: email,
                    from: 'noreply@seu-dominio.com', // Substitua pelo seu domínio personalizado
                    subject: 'Convite para colaborar',
                    html: `
                        <h1>Você foi convidado para colaborar!</h1>
                        <p>${ownerProfile?.username || 'Um usuário'} te convidou para colaborar em seu grupo.</p>
                        <p>Clique no link abaixo para aceitar o convite:</p>
                        <a href="${acceptUrl}">Aceitar convite</a>
                        <p>Este link expira em 7 dias.</p>
                    `
                }
            ]);

        if (error) {
            console.error('Erro ao enviar email:', error);
            return new Response(
                JSON.stringify({ error: `Failed to send email: ${error.message}` }),
                {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                    status: 400,
                },
            );
        }

        return new Response(
            JSON.stringify({ success: true }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            },
        );
    } catch (error) {
        console.error('Erro na função:', error);
        return new Response(
            JSON.stringify({ error: error instanceof Error ? error.message : 'Erro desconhecido' }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            },
        );
    }
}); 