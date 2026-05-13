DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'birthday-notifier-daily') THEN
    PERFORM cron.unschedule('birthday-notifier-daily');
  END IF;
END $$;

SELECT cron.schedule(
  'birthday-notifier-daily',
  '0 8 * * *',
  $$
  SELECT net.http_post(
    url:='https://yieihrvcbshzmxieflsv.supabase.co/functions/v1/birthday-notifier',
    headers:='{"Content-Type":"application/json","apikey":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlpZWlocnZjYnNoem14aWVmbHN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQwMjU2MDYsImV4cCI6MjA1OTYwMTYwNn0.fOBINx1LP_fxvnboVkJEAYTI_GVcI9gzKBhVAqXPrsY"}'::jsonb,
    body:=concat('{"time":"', now(), '"}')::jsonb
  );
  $$
);