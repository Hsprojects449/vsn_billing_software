ALTER TABLE public.invoice_templates
  ADD COLUMN IF NOT EXISTS template_type TEXT;

ALTER TABLE public.invoice_templates
  ADD COLUMN IF NOT EXISTS company_stamp_url TEXT DEFAULT '/hyd_stamp_%26_Sign.png';

ALTER TABLE public.invoice_templates
  ADD COLUMN IF NOT EXISTS company_stamp_file TEXT;

ALTER TABLE public.invoice_templates
  ADD COLUMN IF NOT EXISTS signatory_label TEXT DEFAULT 'Authorized Signatory';

UPDATE public.invoice_templates
SET company_stamp_url = '/hyd_stamp_%26_Sign.png'
WHERE company_stamp_url IS NULL;

UPDATE public.invoice_templates
SET signatory_label = 'Authorized Signatory'
WHERE signatory_label IS NULL OR btrim(signatory_label) = '';

UPDATE public.invoice_templates
SET template_type = 'invoice'
WHERE template_type IS NULL;

ALTER TABLE public.invoice_templates
  ALTER COLUMN template_type SET DEFAULT 'invoice';

ALTER TABLE public.invoice_templates
  ALTER COLUMN template_type SET NOT NULL;

ALTER TABLE public.invoice_templates
  DROP CONSTRAINT IF EXISTS invoice_templates_template_type_check;

ALTER TABLE public.invoice_templates
  ADD CONSTRAINT invoice_templates_template_type_check
  CHECK (template_type IN ('invoice', 'quotation_whatsapp', 'quotation_other'));

ALTER TABLE public.invoice_templates
  DROP CONSTRAINT IF EXISTS invoice_templates_organization_id_key;

ALTER TABLE public.invoice_templates
  DROP CONSTRAINT IF EXISTS invoice_templates_org_template_type_unique;

ALTER TABLE public.invoice_templates
  ADD CONSTRAINT invoice_templates_org_template_type_unique
  UNIQUE (organization_id, template_type);

INSERT INTO public.invoice_templates (
  organization_id,
  template_type,
  company_name,
  company_address,
  company_phone,
  company_email,
  company_logo_url,
  company_logo_file,
  company_stamp_url,
  company_stamp_file,
  signatory_label,
  tax_label,
  note_content,
  payment_instructions,
  terms_and_conditions,
  whatsapp_template_rows
)
SELECT
  base.organization_id,
  'quotation_whatsapp',
  base.company_name,
  base.company_address,
  base.company_phone,
  base.company_email,
  base.company_logo_url,
  base.company_logo_file,
  base.company_stamp_url,
  base.company_stamp_file,
  base.signatory_label,
  base.tax_label,
  base.note_content,
  base.payment_instructions,
  base.terms_and_conditions,
  base.whatsapp_template_rows
FROM public.invoice_templates base
WHERE base.template_type = 'invoice'
  AND NOT EXISTS (
    SELECT 1
    FROM public.invoice_templates t
    WHERE t.organization_id = base.organization_id
      AND t.template_type = 'quotation_whatsapp'
  );

INSERT INTO public.invoice_templates (
  organization_id,
  template_type,
  company_name,
  company_address,
  company_phone,
  company_email,
  company_logo_url,
  company_logo_file,
  company_stamp_url,
  company_stamp_file,
  signatory_label,
  tax_label,
  note_content,
  payment_instructions,
  terms_and_conditions,
  whatsapp_template_rows
)
SELECT
  base.organization_id,
  'quotation_other',
  base.company_name,
  base.company_address,
  base.company_phone,
  base.company_email,
  base.company_logo_url,
  base.company_logo_file,
  base.company_stamp_url,
  base.company_stamp_file,
  base.signatory_label,
  base.tax_label,
  base.note_content,
  base.payment_instructions,
  base.terms_and_conditions,
  base.whatsapp_template_rows
FROM public.invoice_templates base
WHERE base.template_type = 'invoice'
  AND NOT EXISTS (
    SELECT 1
    FROM public.invoice_templates t
    WHERE t.organization_id = base.organization_id
      AND t.template_type = 'quotation_other'
  );
