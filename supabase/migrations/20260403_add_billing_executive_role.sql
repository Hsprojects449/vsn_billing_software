DO $$
BEGIN
  ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'billing_executive';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
