
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

// Configurações de cabeçalhos CORS expandidas para incluir mais cabeçalhos permitidos
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS, GET",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, cache-control, pragma, x-requested-with",
  "Access-Control-Max-Age": "86400",
};

// Função de log para depuração
const log = (message: string, data?: any) => {
  console.log(`[CUSTOMER-PORTAL] ${message}`, data ? JSON.stringify(data) : "");
};

serve(async (req) => {
  log("Requisição recebida - método: " + req.method);
  
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    log("Requisição OPTIONS de CORS recebida");
    return new Response(null, { 
      headers: corsHeaders,
      status: 204
    });
  }

  try {
    log("Edge function customer-portal iniciada");

    // Inicializar cliente Supabase
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error("Configuração do Supabase ausente");
    }
    
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);

    // Autenticar o usuário
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      log("Erro: Header de autorização ausente");
      throw new Error("Header de autorização ausente");
    }
    
    const token = authHeader.replace("Bearer ", "");
    log("Verificando token de autenticação");
    
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError) {
      log("Erro de autenticação:", userError);
      throw new Error(`Erro de autenticação: ${userError.message}`);
    }

    const user = userData.user;
    if (!user?.email) {
      log("Erro: Usuário sem email ou não autenticado");
      throw new Error("Usuário não autenticado ou email não disponível");
    }

    log("Usuário autenticado com sucesso:", { id: user.id, email: user.email });

    // Inicializar Stripe
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      log("Erro crítico: STRIPE_SECRET_KEY não configurada");
      throw new Error("STRIPE_SECRET_KEY não configurada");
    }
    
    const stripe = new Stripe(stripeKey, {
      apiVersion: "2023-10-16",
    });

    // Buscar cliente Stripe
    log("Buscando dados de assinatura para o usuário:", user.id);
    try {
      const { data: subscriptionData, error: subscriptionError } = await supabaseClient
        .from("subscriptions")
        .select("stripe_customer_id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (subscriptionError) {
        log("Erro ao buscar dados de assinatura:", subscriptionError);
        throw new Error(`Erro ao buscar dados de assinatura: ${subscriptionError.message}`);
      }

      // Se não há registro de cliente Stripe, tentar buscar pelo e-mail
      let stripeCustomerId = subscriptionData?.stripe_customer_id;

      if (!stripeCustomerId) {
        log("Cliente Stripe não encontrado no banco, buscando por e-mail:", user.email);
        const customers = await stripe.customers.list({
          email: user.email,
          limit: 1,
        });
        
        if (customers.data.length === 0) {
          log("Nenhum cliente Stripe encontrado para este usuário");
          throw new Error("Cliente Stripe não encontrado. Você precisa fazer upgrade para o plano Pro primeiro.");
        }
        
        stripeCustomerId = customers.data[0].id;
        log("Cliente Stripe encontrado pelo e-mail:", stripeCustomerId);
      } else {
        log("Cliente Stripe encontrado nos dados da assinatura:", stripeCustomerId);
      }

      // Definir URL de origem para redirecionamento
      let origin = req.headers.get("origin");
      if (!origin) {
        const referer = req.headers.get("referer");
        if (referer) {
          try {
            origin = new URL(referer).origin;
          } catch {
            origin = "http://localhost:8080";
          }
        } else {
          origin = "http://localhost:8080";
        }
      }

      log("URL de origem para redirecionamento:", origin);

      // Criar sessão do portal do cliente
      log("Criando sessão do portal do cliente");
      const session = await stripe.billingPortal.sessions.create({
        customer: stripeCustomerId,
        return_url: `${origin}/subscription`,
      });

      log("Sessão do portal do cliente criada com sucesso:", { id: session.id, url: session.url });

      return new Response(JSON.stringify({ url: session.url }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    } catch (stripeError) {
      log("Erro ao processar operação Stripe:", stripeError);
      throw new Error(`Erro no Stripe: ${stripeError.message}`);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Erro interno do servidor";
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    log("Erro na função customer-portal:", { message: errorMessage, stack: errorStack });
    
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        details: errorStack 
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
