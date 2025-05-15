
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

// Configuração CORS segura
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json',
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  'Pragma': 'no-cache',
  'Expires': '0',
};

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2023-10-16",
  httpClient: Stripe.createFetchHttpClient(),
  maxNetworkRetries: 3, // Aumenta a confiabilidade com tentativas automáticas
});

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

// Função para log com prefixo e timestamp
const log = (message: string, data?: any) => {
  const now = new Date().toISOString();
  const logMessage = data 
    ? `[${now}][STRIPE-WEBHOOK] ${message}: ${typeof data === 'object' ? JSON.stringify(data) : data}`
    : `[${now}][STRIPE-WEBHOOK] ${message}`;
  console.log(logMessage);
};

// Evitar ataques de replay armazenando os IDs de eventos processados
const processedEvents = new Set<string>();
// Limite de 1000 para evitar consumo excessivo de memória
const MAX_PROCESSED_EVENTS = 1000;

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
      if (processedEvents.has(event.id)) {
        log(`Evento ${event.id} já foi processado. Ignorando.`);
        return new Response(JSON.stringify({ received: true, status: "already_processed" }), 
          { headers: corsHeaders, status: 200 });
      }
      
      // Adicionar ao conjunto de eventos processados
      processedEvents.add(event.id);
      
      // Limitar o tamanho do conjunto de eventos processados
      if (processedEvents.size > MAX_PROCESSED_EVENTS) {
        const iterator = processedEvents.values();
        processedEvents.delete(iterator.next().value); // Remove o mais antigo
      }
    } catch (err) {
      log(`Erro na assinatura do webhook: ${err.message}`);
      return new Response(JSON.stringify({ error: `Erro na assinatura do webhook: ${err.message}` }), 
        { status: 400, headers: corsHeaders });
    }

    // Processar eventos relevantes
    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated":
        const subscription = event.data.object;
        const customerId = subscription.customer as string;
        
        log("Processando evento de assinatura", { 
          id: subscription.id, 
          status: subscription.status, 
          customerId
        });
        
        // Buscar cliente no Stripe para obter metadata com user_id
        const customer = await stripe.customers.retrieve(customerId);
        const userId = customer.metadata.user_id;

        if (!userId) {
          log("ID do usuário não encontrado nos metadados do cliente");
          throw new Error("ID do usuário não encontrado nos metadados do cliente");
        }
        
        log("Atualizando registro de assinatura", { userId });

        // Atualizar assinatura no Supabase com tratamento de erros
        const { error: upsertError } = await supabaseClient.from("subscriptions").upsert({
          user_id: userId,
          plan_type: subscription.status === "active" ? "pro" : "free",
          status: subscription.status,
          start_date: new Date(subscription.current_period_start * 1000).toISOString(),
          end_date: new Date(subscription.current_period_end * 1000).toISOString(),
          stripe_customer_id: customerId,
          stripe_subscription_id: subscription.id,
          updated_at: new Date().toISOString()
        }, { onConflict: "user_id" });
        
        if (upsertError) {
          log("Erro ao atualizar assinatura no Supabase", upsertError);
          throw new Error(`Erro ao atualizar assinatura: ${upsertError.message}`);
        }
        
        log("Assinatura atualizada com sucesso");
        break;

      case "customer.subscription.deleted":
        const deletedSubscription = event.data.object;
        const deletedCustomerId = deletedSubscription.customer as string;
        
        log("Processando cancelamento de assinatura", { 
          id: deletedSubscription.id,
          customerId: deletedCustomerId
        });
        
        const deletedCustomer = await stripe.customers.retrieve(deletedCustomerId);
        const deletedUserId = deletedCustomer.metadata.user_id;

        if (!deletedUserId) {
          log("ID do usuário não encontrado nos metadados do cliente para exclusão");
          throw new Error("ID do usuário não encontrado nos metadados do cliente");
        }

        // Atualizar para plano gratuito no Supabase com tratamento de erros
        const { error: deleteError } = await supabaseClient.from("subscriptions").upsert({
          user_id: deletedUserId,
          plan_type: "free",
          status: "canceled",
          stripe_customer_id: deletedCustomerId,
          updated_at: new Date().toISOString()
        }, { onConflict: "user_id" });
        
        if (deleteError) {
          log("Erro ao atualizar assinatura para plano gratuito", deleteError);
          throw new Error(`Erro ao atualizar assinatura: ${deleteError.message}`);
        }
        
        log("Assinatura atualizada para o plano gratuito");
        break;
        
      default:
        log("Evento não processado", event.type);
    }

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
