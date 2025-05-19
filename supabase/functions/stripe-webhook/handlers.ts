
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { log } from "./utils.ts";

// Função para processar eventos de assinatura (criação/atualização)
export async function handleSubscriptionEvent(
  event: Stripe.Event,
  stripe: Stripe,
  supabaseClient: ReturnType<typeof createClient>
) {
  const subscription = event.data.object as Stripe.Subscription;
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
}

// Função para processar eventos de cancelamento de assinatura
export async function handleSubscriptionDeletedEvent(
  event: Stripe.Event,
  stripe: Stripe,
  supabaseClient: ReturnType<typeof createClient>
) {
  const deletedSubscription = event.data.object as Stripe.Subscription;
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
}

// Processador de eventos Stripe com tratamento por tipo
export async function processStripeEvent(
  event: Stripe.Event,
  stripe: Stripe,
  supabaseClient: ReturnType<typeof createClient>
): Promise<boolean> {
  switch (event.type) {
    case "customer.subscription.created":
    case "customer.subscription.updated":
      await handleSubscriptionEvent(event, stripe, supabaseClient);
      return true;

    case "customer.subscription.deleted":
      await handleSubscriptionDeletedEvent(event, stripe, supabaseClient);
      return true;
        
    default:
      log("Evento não processado", event.type);
      return false;
  }
}
