
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders, log, EventCache } from "./utils.ts";
import { processStripeEvent } from "./handlers.ts";

// Inicializar Stripe com retry para maior confiabilidade
const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2023-10-16",
  httpClient: Stripe.createFetchHttpClient(),
  maxNetworkRetries: 3, // Aumenta a confiabilidade com tentativas automáticas
});

// Inicializar cliente Supabase
const supabaseClient = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  { 
    auth: { persistSession: false },
    global: { 
      headers: { 
        'X-Client-Info': 'stripe-webhook-handler',
      }
    }
  }
);

// Evitar ataques de replay armazenando os IDs de eventos processados
const eventCache = new EventCache(1000);

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders, status: 204 });
  }
  
  // Verificar método
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: "Método não permitido" }), 
      { status: 405, headers: corsHeaders });
  }
  
  try {
    log("Webhook recebido");
    const signature = req.headers.get("stripe-signature");
    
    // Verificar assinatura
    if (!signature) {
      log("Assinatura Stripe ausente");
      return new Response(JSON.stringify({ error: "Assinatura Stripe ausente" }), 
        { status: 400, headers: corsHeaders });
    }

    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    if (!webhookSecret) {
      log("STRIPE_WEBHOOK_SECRET não definido");
      return new Response(JSON.stringify({ error: "Configuração de segurança ausente" }),
        { status: 500, headers: corsHeaders });
    }

    const body = await req.text();
    let event;

    try {
      log("Verificando assinatura do webhook");
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
      log("Evento recebido", { id: event.id, type: event.type });
      
      // Verificar se já processamos este evento (prevenção de replay)
      if (eventCache.hasProcessed(event.id)) {
        log(`Evento ${event.id} já foi processado. Ignorando.`);
        return new Response(JSON.stringify({ received: true, status: "already_processed" }), 
          { headers: corsHeaders, status: 200 });
      }
      
      // Adicionar ao conjunto de eventos processados
      eventCache.markAsProcessed(event.id);
    } catch (err) {
      log(`Erro na assinatura do webhook: ${err.message}`);
      return new Response(JSON.stringify({ error: `Erro na assinatura do webhook: ${err.message}` }), 
        { status: 400, headers: corsHeaders });
    }

    // Processar o evento Stripe
    await processStripeEvent(event, stripe, supabaseClient);

    return new Response(JSON.stringify({ received: true, event_id: event.id }), {
      headers: corsHeaders,
      status: 200,
    });
  } catch (error) {
    log("Erro ao processar webhook", error.message || error);
    return new Response(
      JSON.stringify({ 
        error: error.message || "Erro interno do servidor",
        timestamp: new Date().toISOString(), 
      }),
      {
        headers: corsHeaders,
        status: 500,
      }
    );
  }
});
