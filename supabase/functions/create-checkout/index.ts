
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, cache-control, x-requested-with",
  "Access-Control-Max-Age": "86400",
};

serve(async (req) => {
  // Lidar com requisições preflight do CORS
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders,
    });
  }

  try {
    console.log("Edge function create-checkout iniciada");

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
      throw new Error("Header de autorização ausente");
    }
    
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError) {
      console.error("Erro de autenticação:", userError);
      throw new Error(`Erro de autenticação: ${userError.message}`);
    }

    const user = userData.user;
    if (!user?.email) {
      throw new Error("Usuário não autenticado ou email não disponível");
    }

    console.log("Usuário autenticado:", user.id);

    // Inicializar Stripe
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      throw new Error("STRIPE_SECRET_KEY não configurada");
    }
    
    const stripe = new Stripe(stripeKey, {
      apiVersion: "2023-10-16",
    });

    // Verificar se o cliente já existe no Stripe
    console.log("Verificando cliente Stripe para:", user.email);
    const customers = await stripe.customers.list({
      email: user.email,
      limit: 1,
    });
    
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      console.log("Cliente Stripe existente encontrado:", customerId);
    } else {
      // Criar novo cliente Stripe se não existir
      console.log("Criando novo cliente Stripe");
      const newCustomer = await stripe.customers.create({
        email: user.email,
        metadata: {
          user_id: user.id,
        }
      });
      customerId = newCustomer.id;
      console.log("Novo cliente Stripe criado:", customerId);
    }

    // Definir URL de origem para redirecionamento
    let origin = req.headers.get("origin");
    if (!origin) {
      const referer = req.headers.get("referer");
      if (referer) {
        try {
          origin = new URL(referer).origin;
        } catch {
          origin = "http://localhost:3000";
        }
      } else {
        origin = "http://localhost:3000";
      }
    }

    console.log("URL de origem para redirecionamento:", origin);

    // Criar sessão de checkout
    console.log("Criando sessão de checkout");
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

    console.log("Sessão de checkout criada com sucesso:", session.id);
    console.log("URL do checkout:", session.url);

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Erro na função create-checkout:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message || "Erro interno do servidor",
        stack: error.stack 
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
