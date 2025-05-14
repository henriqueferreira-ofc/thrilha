
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
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Edge function customer-portal iniciada");

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

    // Buscar cliente Stripe
    console.log("Buscando dados de assinatura para o usuário:", user.id);
    const { data: subscriptionData, error: subscriptionError } = await supabaseClient
      .from("subscriptions")
      .select("stripe_customer_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (subscriptionError) {
      console.error("Erro ao buscar dados de assinatura:", subscriptionError);
      throw new Error(`Erro ao buscar dados de assinatura: ${subscriptionError.message}`);
    }

    // Se não há registro de cliente Stripe, tentar buscar pelo e-mail
    let stripeCustomerId = subscriptionData?.stripe_customer_id;

    if (!stripeCustomerId) {
      console.log("Cliente Stripe não encontrado no banco, buscando por e-mail:", user.email);
      const customers = await stripe.customers.list({
        email: user.email,
        limit: 1,
      });
      
      if (customers.data.length === 0) {
        console.log("Nenhum cliente Stripe encontrado para este usuário");
        throw new Error("Cliente Stripe não encontrado");
      }
      
      stripeCustomerId = customers.data[0].id;
      console.log("Cliente Stripe encontrado pelo e-mail:", stripeCustomerId);
    } else {
      console.log("Cliente Stripe encontrado nos dados da assinatura:", stripeCustomerId);
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

    // Criar sessão do portal do cliente
    console.log("Criando sessão do portal do cliente");
    const session = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: `${origin}/subscription`,
    });

    console.log("Sessão do portal do cliente criada com sucesso:", session.id);
    console.log("URL do portal:", session.url);

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Erro na função customer-portal:", error);
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
