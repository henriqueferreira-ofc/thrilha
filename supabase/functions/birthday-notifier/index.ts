import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function buildEmailHtml(userName: string, birthdays: Array<{ name: string; relationship: string | null; age: number; notes: string | null }>) {
  const items = birthdays
    .map(
      (b) => `
      <li style="margin-bottom:12px;padding:12px;background:#f5f3ff;border-left:4px solid #8b5cf6;border-radius:6px;">
        <strong style="font-size:16px;color:#1f2937;">🎂 ${b.name}</strong>
        ${b.relationship ? `<span style="color:#6b7280;"> — ${b.relationship}</span>` : ""}
        <div style="color:#374151;margin-top:4px;">Faz <strong>${b.age} anos</strong> hoje!</div>
        ${b.notes ? `<div style="color:#6b7280;font-style:italic;margin-top:4px;">"${b.notes}"</div>` : ""}
      </li>`
    )
    .join("");

  return `<!DOCTYPE html>
  <html><body style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;background:#f9fafb;padding:24px;">
    <div style="max-width:560px;margin:0 auto;background:white;border-radius:12px;padding:32px;box-shadow:0 2px 8px rgba(0,0,0,0.05);">
      <h1 style="color:#7c3aed;margin:0 0 8px 0;">🎉 Lembrete de Aniversário</h1>
      <p style="color:#4b5563;margin:0 0 24px 0;">Olá${userName ? `, ${userName}` : ""}! Hoje tem aniversariante na sua lista:</p>
      <ul style="list-style:none;padding:0;margin:0;">${items}</ul>
      <p style="color:#9ca3af;font-size:13px;margin-top:24px;text-align:center;">Não se esqueça de mandar um carinho! 💜</p>
    </div>
  </body></html>`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY não configurado");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

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

    const byUser: Record<string, typeof todays> = {};
    for (const b of todays) (byUser[b.user_id] ||= []).push(b);

    let sent = 0;
    const failures: any[] = [];

    for (const userId of Object.keys(byUser)) {
      const { data: userResp, error: userErr } = await supabase.auth.admin.getUserById(userId);
      if (userErr || !userResp?.user?.email) {
        failures.push({ user: userId, error: "email não encontrado" });
        continue;
      }
      const email = userResp.user.email;
      const userName = (userResp.user.user_metadata?.full_name as string) || "";

      const enriched = byUser[userId].map((b) => ({
        name: b.name,
        relationship: b.relationship,
        notes: b.notes,
        age: today.getUTCFullYear() - parseInt(String(b.birthdate).split("-")[0], 10),
      }));

      const subject = enriched.length === 1
        ? `🎂 Hoje é aniversário de ${enriched[0].name}!`
        : `🎂 ${enriched.length} aniversariantes hoje!`;

      try {
        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: "Trilha <onboarding@resend.dev>",
            to: [email],
            subject,
            html: buildEmailHtml(userName, enriched),
          }),
        });
        const payload = await res.json();
        if (res.ok) sent++;
        else failures.push({ user: userId, email, status: res.status, payload });
      } catch (e) {
        failures.push({ user: userId, email, error: String(e) });
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
