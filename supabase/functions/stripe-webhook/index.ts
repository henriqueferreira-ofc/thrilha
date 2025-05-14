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

serve(async (req) => {
  try {
    const signature = req.headers.get("stripe-signature");
    if (!signature) {
      return new Response("Assinatura Stripe ausente", { status: 400 });
    }

    const body = await req.text();
    let event;

    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        Deno.env.get("STRIPE_WEBHOOK_SECRET") || ""
      );
    } catch (err) {
      console.error(`Erro na assinatura do webhook: ${err.message}`);
      return new Response(`Erro na assinatura do webhook: ${err.message}`, { status: 400 });
    }

    // Processar eventos relevantes
    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated":
        const subscription = event.data.object;
        const customerId = subscription.customer as string;
        
        // Buscar cliente no Stripe para obter metadata com user_id
        const customer = await stripe.customers.retrieve(customerId);
        const userId = customer.metadata.user_id;

        if (!userId) {
          throw new Error("ID do usuário não encontrado nos metadados do cliente");
        }

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
        break;

      case "customer.subscription.deleted":
        const deletedSubscription = event.data.object;
        const deletedCustomerId = deletedSubscription.customer as string;
        const deletedCustomer = await stripe.customers.retrieve(deletedCustomerId);
        const deletedUserId = deletedCustomer.metadata.user_id;

        if (!deletedUserId) {
          throw new Error("ID do usuário não encontrado nos metadados do cliente");
        }

        // Atualizar para plano gratuito no Supabase
        await supabaseClient.from("subscriptions").upsert({
          user_id: deletedUserId,
          plan_type: "free",
          status: "active",
          stripe_customer_id: deletedCustomerId,
          updated_at: new Date().toISOString()
        }, { onConflict: "user_id" });
        break;
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Erro ao processar webhook:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Erro interno do servidor" }),
      {
        headers: { "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
}); 