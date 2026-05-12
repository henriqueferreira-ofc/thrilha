
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS birthday_zapier_webhook text;

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

SELECT cron.unschedule('birthday-notifier-daily') WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname='birthday-notifier-daily');

SELECT cron.schedule(
  'birthday-notifier-daily',
  '0 8 * * *',
  $$
  SELECT net.http_post(
    url:='https://yieihrvcbshzmxieflsv.supabase.co/functions/v1/birthday-notifier',
    headers:='{"Content-Type":"application/json","apikey":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlpZWlocnZjYnNoem14aWVmbHN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQwMjU2MDYsImV4cCI6MjA1OTYwMTYwNn0.fOBINx1LP_fxvnboVkJEAYTI_GVcI9gzKBhVAqXPrsY"}'::jsonb,
    body:=concat('{"triggered_at":"', now(), '"}')::jsonb
  );
  $$
);
