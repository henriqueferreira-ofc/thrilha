
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

// Cabeçalhos CORS expandidos para permitir todos os headers necessários
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "*", // Permitir todos os headers
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Max-Age": "86400",
};

// Função para log com prefixo para facilitar a depuração
const log = (message: string, data?: any) => {
  const logMessage = data 
    ? `[CREATE-CHECKOUT] ${message}: ${typeof data === 'object' ? JSON.stringify(data) : data}`
    : `[CREATE-CHECKOUT] ${message}`;
  console.log(logMessage);
};

serve(async (req) => {
  log(`Requisição recebida - método: ${req.method}`);
  
  // Lidar com requisições OPTIONS para CORS
  if (req.method === "OPTIONS") {
    log("Requisição OPTIONS de CORS recebida");
    return new Response(null, { headers: corsHeaders, status: 204 });
  }
  
  try {
    log("Edge function create-checkout iniciada");
    
    // Verificar token de autenticação
    log("Verificando token de autenticação");
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Token de autenticação não fornecido");
    }
    
    const token = authHeader.replace("Bearer ", "");
    
    // Inicializar cliente Supabase com o token do usuário
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: `Bearer ${token}` } } }
    );
    
    // Obter dados do usuário autenticado
    const { data: userData, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !userData.user) {
      log("Erro ao autenticar usuário", userError || "Usuário não encontrado");
      throw new Error("Erro de autenticação: " + (userError?.message || "Usuário não encontrado"));
    }
    
    const user = userData.user;
    log("Usuário autenticado com sucesso", { id: user.id, email: user.email });
    
    // Verificar API key do Stripe
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      log("API key do Stripe não encontrada nas variáveis de ambiente");
      throw new Error("Configuração do servidor incompleta: Stripe API key não encontrada");
    }
    
    // Inicializar o Stripe
    const stripe = new Stripe(stripeKey, {
      apiVersion: "2023-10-16",
    });
    
    // Verificar cliente Stripe existente ou criar um novo
    log("Verificando cliente Stripe para:", user.email);
    const customers = await stripe.customers.list({
      email: user.email,
      limit: 1,
    });
    
    let customerId: string;
    
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      log("Cliente Stripe existente encontrado:", customerId);
    } else {
      log("Criando novo cliente Stripe");
      const newCustomer = await stripe.customers.create({
        email: user.email,
        metadata: {
          user_id: user.id
        }
      });
      customerId = newCustomer.id;
      log("Novo cliente Stripe criado:", customerId);
    }
    
    // Obter URL de origem da requisição ou usar a URL fornecida no corpo
    let requestBody = {};
    try {
      requestBody = await req.json();
    } catch (e) {
      log("Corpo da requisição vazio ou inválido");
    }
    
    // Use a URL de retorno fornecida ou gere uma URL padrão
    const returnUrl = (requestBody as any).returnUrl || Deno.env.get("SITE_URL") || req.headers.get("origin") || "http://localhost:8080";
    log("URL de origem para redirecionamento:", returnUrl);
    
    // Usar o ID do preço específico fornecido
    const pricePlanId = "price_1ROJxKQovJyvXFNJCRpnp3gE";
    log("Usando ID de preço específico:", pricePlanId);
    
    // Criar sessão de checkout
    log("Criando sessão de checkout com ID do preço específico");
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ["card"],
      line_items: [
        {
          price: pricePlanId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${returnUrl}/subscription?success=true`,
      cancel_url: `${returnUrl}/subscription?canceled=true`,
      allow_promotion_codes: true,
      billing_address_collection: "auto",
      metadata: {
        user_id: user.id,
      },
    });
    
    log("Sessão de checkout criada com sucesso", session);
    
    // Retornar URL da sessão de checkout
    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    log("Erro ao criar sessão de checkout", error.message || error);
    
    return new Response(
      JSON.stringify({
        error: error.message || "Erro interno ao criar sessão de checkout",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
