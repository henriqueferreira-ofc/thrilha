
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2023-10-16",
});

const supabaseClient = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  { auth: { persistSession: false } }
);

// Função para log com prefixo
const log = (message: string, data?: any) => {
  const logMessage = data 
    ? `[STRIPE-WEBHOOK] ${message}: ${typeof data === 'object' ? JSON.stringify(data) : data}`
    : `[STRIPE-WEBHOOK] ${message}`;
  console.log(logMessage);
};

serve(async (req) => {
  try {
    log("Webhook recebido");
    const signature = req.headers.get("stripe-signature");
    if (!signature) {
      log("Assinatura Stripe ausente");
      return new Response("Assinatura Stripe ausente", { status: 400 });
    }

    const body = await req.text();
    let event;

    try {
      log("Verificando assinatura do webhook");
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        Deno.env.get("STRIPE_WEBHOOK_SECRET") || ""
      );
      log("Evento recebido", { type: event.type });
    } catch (err) {
      log(`Erro na assinatura do webhook: ${err.message}`);
      return new Response(`Erro na assinatura do webhook: ${err.message}`, { status: 400 });
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

        // Atualizar assinatura no Supabase
        await supabaseClient.from("subscriptions").upsert({
          user_id: userId,
          plan_type: subscription.status === "active" ? "pro" : "free",
          status: subscription.status,
          start_date: new Date(subscription.current_period_start * 1000).toISOString(),
          end_date: new Date(subscription.current_period_end * 1000).toISOString(),
          stripe_customer_id: customerId,
          stripe_subscription_id: subscription.id,
          updated_at: new Date().toISOString()
        }, { onConflict: "user_id" });
        
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

        // Atualizar para plano gratuito no Supabase
        await supabaseClient.from("subscriptions").upsert({
          user_id: deletedUserId,
          plan_type: "free",
          status: "canceled",
          stripe_customer_id: deletedCustomerId,
          updated_at: new Date().toISOString()
        }, { onConflict: "user_id" });
        
        log("Assinatura atualizada para o plano gratuito");
        break;
        
      default:
        log("Evento não processado", event.type);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    log("Erro ao processar webhook", error.message || error);
    return new Response(
      JSON.stringify({ error: error.message || "Erro interno do servidor" }),
      {
        headers: { "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
