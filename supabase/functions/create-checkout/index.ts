
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

// Configuração CORS segura
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Security-Policy': "default-src 'self'; frame-ancestors 'none';",
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'Content-Type': 'application/json',
  'Cache-Control': 'no-store, private, must-revalidate',
  'X-Content-Type-Options': 'nosniff',
};

// Inicializar Stripe com configurações robustas
const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2023-10-16",
  httpClient: Stripe.createFetchHttpClient(),
  maxNetworkRetries: 3,
});

// Preço real do plano Pro
const PRICE_ID = 'price_1ROJxKQovJyvXFNJCRpnp3gE';

// Logger aprimorado com timestamp
const log = (level: string, message: string, data?: any) => {
  const timestamp = new Date().toISOString();
  console.log(JSON.stringify({
    timestamp,
    level,
    service: 'create-checkout',
    message,
    ...(data ? { data } : {})
  }));
};

serve(async (req) => {
  // Tratamento de CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders, status: 204 });
  }
  
  // Validar método
  if (req.method !== 'POST') {
    log('error', 'Método não permitido', { method: req.method });
    return new Response(JSON.stringify({
      error: "Método não permitido"
    }), { headers: corsHeaders, status: 405 });
  }
  
  try {
    // Verificar autenticação
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      log('error', 'Sem cabeçalho de autorização');
      return new Response(JSON.stringify({
        error: "Não autorizado"
      }), { headers: corsHeaders, status: 401 });
    }
    
    // Inicializar cliente Supabase
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { 
        auth: { 
          persistSession: false,
          autoRefreshToken: false,
        },
        global: {
          headers: { 'X-Client-Info': 'checkout-function' },
        }
      }
    );
    
    // Obter usuário atual a partir do JWT
    log('info', 'Verificando sessão do usuário');
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !user) {
      log('error', 'Erro ao obter usuário', { error: userError });
      return new Response(JSON.stringify({
        error: "Usuário não autenticado"
      }), { headers: corsHeaders, status: 401 });
    }
    
    log('info', 'Usuário autenticado', { userId: user.id });
    
    // Obter parâmetros do corpo da requisição
    let params: { returnUrl?: string };
    try {
      params = await req.json();
    } catch (e) {
      params = {};
      log('warn', 'Erro ao analisar corpo da requisição', { error: e.message });
    }
    
    // URL para onde o usuário será redirecionado após o checkout
    const returnUrl = params?.returnUrl || Deno.env.get('SITE_URL') || 'http://localhost:3000';
    log('info', 'URL de retorno definida', { returnUrl });
    
    // Primeiro verificar se o cliente já existe no Stripe
    log('info', 'Verificando cliente existente', { email: user.email });
    const { data: existingSubscription } = await supabaseClient
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .maybeSingle();
    
    let customerId: string;
    
    if (existingSubscription?.stripe_customer_id) {
      log('info', 'Cliente existente encontrado', { 
        customerId: existingSubscription.stripe_customer_id 
      });
      customerId = existingSubscription.stripe_customer_id;
    } else {
      // Criar um novo cliente Stripe
      log('info', 'Criando novo cliente Stripe');
      const newCustomer = await stripe.customers.create({
        email: user.email,
        metadata: {
          user_id: user.id
        }
      });
      
      customerId = newCustomer.id;
      log('info', 'Novo cliente criado', { customerId });
    }
    
    // Criar uma sessão de checkout
    log('info', 'Criando sessão de checkout', { priceId: PRICE_ID });
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [
        {
          price: PRICE_ID,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${returnUrl}/tasks?success=true`,
      cancel_url: `${returnUrl}/subscription?canceled=true`,
      automatic_tax: { enabled: true },
      customer_update: {
        address: 'auto',
        name: 'auto',
      },
      payment_method_types: ['card'],
      allow_promotion_codes: true,
      billing_address_collection: 'required',
      client_reference_id: user.id,
    });

    log('info', 'Sessão de checkout criada com sucesso', { 
      sessionId: session.id,
      url: session.url
    });
    
    return new Response(JSON.stringify({ 
      url: session.url,
      sessionId: session.id,
    }), { headers: corsHeaders });
  } catch (error) {
    log('error', 'Erro ao processar solicitação de checkout', {
      error: error.message,
      stack: error.stack
    });
    
    return new Response(JSON.stringify({ 
      error: "Erro ao criar sessão de checkout: " + error.message 
    }), { headers: corsHeaders, status: 500 });
  }
});
