import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

// Cabeçalhos CORS expandidos para permitir todos os headers necessários
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "*", // Permitir todos os headers
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Max-Age": "86400",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders, status: 204 });
  }

  try {
    // Inicializar cliente Supabase com a chave de serviço para operações de escrita
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Autenticar o usuário
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError) {
      throw new Error(`Erro de autenticação: ${userError.message}`);
    }

    const user = userData.user;
    if (!user?.email) {
      throw new Error("Usuário não autenticado ou email não disponível");
    }

    // Inicializar Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    // Verificar se o cliente já existe no Stripe
    const customers = await stripe.customers.list({
      email: user.email,
      limit: 1,
    });
    
    if (customers.data.length === 0) {
      // Usuário não tem assinatura Stripe
      // Atualizar Supabase para garantir que esteja no plano gratuito
      await supabaseClient.from("subscriptions").upsert({
        user_id: user.id,
        plan_type: "free",
        status: "active",
        updated_at: new Date().toISOString()
      }, { onConflict: "user_id" });
      
      return new Response(JSON.stringify({ 
        subscribed: false,
        plan_type: "free"
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const customerId = customers.data[0].id;
    
    // Buscar assinaturas ativas do cliente
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
    });

    let isPro = false;
    let subscriptionEndDate = null;

    if (subscriptions.data.length > 0) {
      isPro = true;
      subscriptionEndDate = new Date(subscriptions.data[0].current_period_end * 1000).toISOString();
      
      // Atualizar o status da assinatura no Supabase
      await supabaseClient.from("subscriptions").upsert({
        user_id: user.id,
        plan_type: "pro",
        status: "active",
        start_date: new Date(subscriptions.data[0].current_period_start * 1000).toISOString(),
        end_date: subscriptionEndDate,
        stripe_customer_id: customerId,
        stripe_subscription_id: subscriptions.data[0].id,
        updated_at: new Date().toISOString()
      }, { onConflict: "user_id" });
    } else {
      // Cliente existe mas não tem assinaturas ativas
      // Atualizar para plano gratuito no Supabase
      await supabaseClient.from("subscriptions").upsert({
        user_id: user.id,
        plan_type: "free",
        status: "active",
        stripe_customer_id: customerId,
        updated_at: new Date().toISOString()
      }, { onConflict: "user_id" });
    }

    return new Response(JSON.stringify({
      subscribed: isPro,
      plan_type: isPro ? "pro" : "free",
      end_date: subscriptionEndDate
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Erro:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Erro interno do servidor" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
