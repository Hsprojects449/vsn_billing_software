-- Move operator pricing source-of-truth to products
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS operator_price NUMERIC(10, 4);

-- Backfill from existing paper_price where operator_price is missing
UPDATE public.products
SET operator_price = COALESCE(operator_price, paper_price, 0)
WHERE operator_price IS NULL;

-- Ensure non-null + default for future rows
ALTER TABLE public.products
ALTER COLUMN operator_price SET DEFAULT 0;

ALTER TABLE public.products
ALTER COLUMN operator_price SET NOT NULL;
