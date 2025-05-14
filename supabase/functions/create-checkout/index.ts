
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

// Configurações de cabeçalhos CORS expandidas para incluir mais cabeçalhos permitidos
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS, GET",
  "Access-Control-Allow-Headers": "*",
  "Access-Control-Max-Age": "86400",
};

// Função de log para depuração
const log = (message: string, data?: any) => {
  console.log(`[CREATE-CHECKOUT] ${message}`, data ? JSON.stringify(data) : "");
};

serve(async (req) => {
  log("Requisição recebida - método: " + req.method);
  
  // Lidar com requisições preflight do CORS
  if (req.method === "OPTIONS") {
    log("Requisição OPTIONS de CORS recebida");
    return new Response(null, {
      headers: corsHeaders,
      status: 204
    });
  }

  try {
    log("Edge function create-checkout iniciada");

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

    // Verificar se o cliente já existe no Stripe
    log("Verificando cliente Stripe para:", user.email);
    try {
      const customers = await stripe.customers.list({
        email: user.email,
        limit: 1,
      });
      
      let customerId;
      if (customers.data.length > 0) {
        customerId = customers.data[0].id;
        log("Cliente Stripe existente encontrado:", customerId);
      } else {
        // Criar novo cliente Stripe se não existir
        log("Criando novo cliente Stripe");
        const newCustomer = await stripe.customers.create({
          email: user.email,
          metadata: {
            user_id: user.id,
          }
        });
        customerId = newCustomer.id;
        log("Novo cliente Stripe criado:", customerId);
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

      // Criar sessão de checkout
      log("Criando sessão de checkout");
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "brl",
              product_data: {
                name: "Plano Pro - Trello Clone",
                description: "Acesso a quadros ilimitados e recursos avançados",
              },
              unit_amount: 1990, // R$19,90 em centavos
              recurring: {
                interval: "month",
              },
            },
            quantity: 1,
          },
        ],
        mode: "subscription",
        success_url: `${origin}/subscription?success=true`,
        cancel_url: `${origin}/subscription?canceled=true`,
      });

      log("Sessão de checkout criada com sucesso:", { id: session.id, url: session.url });

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
    
    log("Erro na função create-checkout:", { message: errorMessage, stack: errorStack });
    
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
