import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Today (UTC) — month/day match
    const today = new Date();
    const mm = String(today.getUTCMonth() + 1).padStart(2, "0");
    const dd = String(today.getUTCDate()).padStart(2, "0");

    const { data: birthdays, error } = await supabase
      .from("birthdays")
      .select("id, user_id, name, birthdate, relationship, notes");

    if (error) throw error;

    const todays = (birthdays ?? []).filter((b) => {
      const d = String(b.birthdate).split("T")[0];
      const [, m, day] = d.split("-");
      return m === mm && day === dd;
    });

    if (todays.length === 0) {
      return new Response(JSON.stringify({ ok: true, sent: 0, message: "Nenhum aniversário hoje" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Group by user
    const byUser: Record<string, typeof todays> = {};
    for (const b of todays) {
      (byUser[b.user_id] ||= []).push(b);
    }

    const userIds = Object.keys(byUser);
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, username, birthday_zapier_webhook")
      .in("id", userIds);

    let sent = 0;
    const failures: any[] = [];

    for (const profile of profiles ?? []) {
      const webhook = (profile as any).birthday_zapier_webhook;
      if (!webhook) continue;

      for (const b of byUser[profile.id]) {
        const ageYears = today.getUTCFullYear() - parseInt(String(b.birthdate).split("-")[0], 10);
        try {
          const res = await fetch(webhook, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              event: "birthday_today",
              name: b.name,
              relationship: b.relationship,
              birthdate: b.birthdate,
              age: ageYears,
              notes: b.notes ?? "",
              message: `Hoje é aniversário de ${b.name}! 🎉 (${ageYears} anos)`,
              triggered_at: today.toISOString(),
            }),
          });
          if (res.ok || res.type === "opaque") sent++;
          else failures.push({ user: profile.id, status: res.status });
        } catch (e) {
          failures.push({ user: profile.id, error: String(e) });
        }
      }
    }

    return new Response(JSON.stringify({ ok: true, sent, failures, total: todays.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("birthday-notifier error", e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
