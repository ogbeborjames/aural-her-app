-- Harden daily_logs access so each journal entry is private to the authenticated owner.

ALTER TABLE public.daily_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "own logs" ON public.daily_logs;

CREATE POLICY "users_select_own_daily_logs"
  ON public.daily_logs
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "users_insert_own_daily_logs"
  ON public.daily_logs
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_update_own_daily_logs"
  ON public.daily_logs
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_delete_own_daily_logs"
  ON public.daily_logs
  FOR DELETE
  USING (auth.uid() = user_id);

-- Ensure the unique constraint is present for owner-scoped daily entries.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'daily_logs_user_id_log_date_key'
      AND conrelid = 'public.daily_logs'::regclass
  ) THEN
    ALTER TABLE public.daily_logs
      ADD CONSTRAINT daily_logs_user_id_log_date_key UNIQUE (user_id, log_date);
  END IF;
END $$;
