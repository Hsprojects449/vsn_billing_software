-- ============================================================================
-- ACCOUNTANT ROLE RLS RESTRICTIONS (April 5, 2026)
-- ============================================================================
-- Purpose:
--   Enforce accountant role restrictions at the database level via RLS policies.
--   Accountants can only access:
--   - Clients with valid GST IDs (non-null, non-empty, not "no gst")
--   - Paid invoices linked to valid GST ID clients
--   - Quotations linked to valid GST ID clients
--
-- Notes:
--   - These policies complement application-level filtering
--   - All other roles continue with existing access patterns
-- ============================================================================

-- --------------------------------------------------------------------------
-- 1) CLIENTS - Restrict accountants to clients with valid tax_id
-- --------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view clients in their organization" ON public.clients;
CREATE POLICY "Users can view clients in their organization"
  ON public.clients FOR SELECT
  USING (
    organization_id = public.get_user_organization(auth.uid())
    AND (
      -- Non-accountants see all clients
      EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid()
          AND p.role IN ('super_admin', 'admin', 'billing_executive')
          AND p.is_active = true
      )
      OR
      -- Accountants only see clients with valid GST IDs
      (
        EXISTS (
          SELECT 1 FROM public.profiles p
          WHERE p.id = auth.uid()
            AND p.role = 'accountant'
            AND p.is_active = true
        )
        AND clients.tax_id IS NOT NULL
        AND clients.tax_id != ''
        AND clients.tax_id NOT ILIKE 'no gst%'
      )
    )
  );

DROP POLICY IF EXISTS "Users can create clients in their organization" ON public.clients;
CREATE POLICY "Users can create clients in their organization"
  ON public.clients FOR INSERT
  WITH CHECK (organization_id = public.get_user_organization(auth.uid()));

DROP POLICY IF EXISTS "Users can update clients in their organization" ON public.clients;
CREATE POLICY "Users can update clients in their organization"
  ON public.clients FOR UPDATE
  USING (organization_id = public.get_user_organization(auth.uid()));

-- --------------------------------------------------------------------------
-- 2) INVOICES - Restrict accountants to paid invoices of valid GST clients
-- --------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view invoices in their organization" ON public.invoices;
CREATE POLICY "Users can view invoices in their organization"
  ON public.invoices FOR SELECT
  USING (
    organization_id = public.get_user_organization(auth.uid())
    AND EXISTS (
      SELECT 1
      FROM public.profiles viewer
      WHERE viewer.id = auth.uid()
        AND viewer.is_active = true
        AND (
          -- Super admin can see all
          viewer.role = 'super_admin'
          -- Non-accountant roles with standard creator-based visibility
          OR (
            viewer.role IN ('admin', 'billing_executive')
            AND EXISTS (
              SELECT 1
              FROM public.profiles creator
              WHERE creator.id = invoices.created_by
                AND creator.organization_id = invoices.organization_id
                AND creator.role IN ('admin', 'billing_executive')
            )
          )
          -- Accountants: only paid invoices from clients with valid GST ID
          OR (
            viewer.role = 'accountant'
            AND invoices.status = 'paid'
            AND EXISTS (
              SELECT 1
              FROM public.clients c
              WHERE c.id = invoices.client_id
                AND c.tax_id IS NOT NULL
                AND c.tax_id != ''
                AND c.tax_id NOT ILIKE 'no gst%'
            )
          )
        )
    )
  );

DROP POLICY IF EXISTS "Users can create invoices in their organization" ON public.invoices;
CREATE POLICY "Users can create invoices in their organization"
  ON public.invoices FOR INSERT
  WITH CHECK (organization_id = public.get_user_organization(auth.uid()));

DROP POLICY IF EXISTS "Users can update invoices in their organization" ON public.invoices;
CREATE POLICY "Users can update invoices in their organization"
  ON public.invoices FOR UPDATE
  USING (
    organization_id = public.get_user_organization(auth.uid())
    AND EXISTS (
      SELECT 1
      FROM public.profiles viewer
      WHERE viewer.id = auth.uid()
        AND viewer.is_active = true
        AND (
          viewer.role = 'super_admin'
          OR (
            viewer.role IN ('admin', 'billing_executive')
            AND EXISTS (
              SELECT 1
              FROM public.profiles creator
              WHERE creator.id = invoices.created_by
                AND creator.organization_id = invoices.organization_id
                AND creator.role IN ('admin', 'billing_executive')
            )
          )
        )
    )
  )
  WITH CHECK (
    organization_id = public.get_user_organization(auth.uid())
    AND EXISTS (
      SELECT 1
      FROM public.profiles viewer
      WHERE viewer.id = auth.uid()
        AND viewer.is_active = true
        AND (
          viewer.role = 'super_admin'
          OR (
            viewer.role IN ('admin', 'billing_executive')
            AND EXISTS (
              SELECT 1
              FROM public.profiles creator
              WHERE creator.id = invoices.created_by
                AND creator.organization_id = invoices.organization_id
                AND creator.role IN ('admin', 'billing_executive')
            )
          )
        )
    )
  );

DROP POLICY IF EXISTS "Privileged users can delete invoices" ON public.invoices;
CREATE POLICY "Privileged users can delete invoices"
  ON public.invoices FOR DELETE
  USING (
    organization_id = public.get_user_organization(auth.uid())
    AND EXISTS (
      SELECT 1
      FROM public.profiles viewer
      WHERE viewer.id = auth.uid()
        AND viewer.is_active = true
        AND (
          viewer.role = 'super_admin'
          OR (
            viewer.role IN ('admin', 'billing_executive')
            AND EXISTS (
              SELECT 1
              FROM public.profiles creator
              WHERE creator.id = invoices.created_by
                AND creator.organization_id = invoices.organization_id
                AND creator.role IN ('admin', 'billing_executive')
            )
          )
        )
    )
  );

-- --------------------------------------------------------------------------
-- 3) INVOICE_ITEMS - Inherit restrictions from invoices
-- --------------------------------------------------------------------------
DROP POLICY IF EXISTS "Authenticated users can view invoice items" ON public.invoice_items;
CREATE POLICY "Authenticated users can view invoice items"
  ON public.invoice_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.invoices i
      JOIN public.profiles viewer ON viewer.id = auth.uid()
      LEFT JOIN public.profiles creator ON creator.id = i.created_by
      LEFT JOIN public.clients c ON c.id = i.client_id
      WHERE i.id = invoice_items.invoice_id
        AND i.organization_id = public.get_user_organization(auth.uid())
        AND viewer.is_active = true
        AND (
          -- Super admin can see all
          viewer.role = 'super_admin'
          -- Non-accountant roles with standard creator-based visibility
          OR (
            viewer.role IN ('admin', 'billing_executive')
            AND creator.role IN ('admin', 'billing_executive')
          )
          -- Accountants: only items from paid invoices with valid GST clients
          OR (
            viewer.role = 'accountant'
            AND i.status = 'paid'
            AND c.tax_id IS NOT NULL
            AND c.tax_id != ''
            AND c.tax_id NOT ILIKE 'no gst%'
          )
        )
    )
  );

-- --------------------------------------------------------------------------
-- 4) QUOTATIONS - Restrict accountants to quotations of valid GST clients
-- --------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view quotations in their organization" ON public.quotations;
CREATE POLICY "Users can view quotations in their organization"
  ON public.quotations FOR SELECT
  USING (
    organization_id = public.get_user_organization(auth.uid())
    AND EXISTS (
      SELECT 1
      FROM public.profiles viewer
      WHERE viewer.id = auth.uid()
        AND viewer.is_active = true
        AND (
          -- Super admin can see all
          viewer.role = 'super_admin'
          -- Non-accountant roles with standard creator-based visibility
          OR (
            viewer.role IN ('admin', 'billing_executive')
            AND EXISTS (
              SELECT 1
              FROM public.profiles creator
              WHERE creator.id = quotations.created_by
                AND creator.organization_id = quotations.organization_id
                AND creator.role IN ('admin', 'billing_executive')
            )
          )
          -- Accountants: only quotations from clients with valid GST ID
          OR (
            viewer.role = 'accountant'
            AND EXISTS (
              SELECT 1
              FROM public.clients c
              WHERE c.id = quotations.client_id
                AND c.tax_id IS NOT NULL
                AND c.tax_id != ''
                AND c.tax_id NOT ILIKE 'no gst%'
            )
          )
        )
    )
  );

-- --------------------------------------------------------------------------
-- 5) QUOTATION_ITEMS - Inherit restrictions from quotations
-- --------------------------------------------------------------------------
DROP POLICY IF EXISTS "Authenticated users can view quotation items" ON public.quotation_items;
CREATE POLICY "Authenticated users can view quotation items"
  ON public.quotation_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.quotations q
      JOIN public.profiles viewer ON viewer.id = auth.uid()
      LEFT JOIN public.profiles creator ON creator.id = q.created_by
      LEFT JOIN public.clients c ON c.id = q.client_id
      WHERE q.id = quotation_items.quotation_id
        AND q.organization_id = public.get_user_organization(auth.uid())
        AND viewer.is_active = true
        AND (
          -- Super admin can see all
          viewer.role = 'super_admin'
          -- Non-accountant roles with standard creator-based visibility
          OR (
            viewer.role IN ('admin', 'billing_executive')
            AND creator.role IN ('admin', 'billing_executive')
          )
          -- Accountants: only items from quotations with valid GST clients
          OR (
            viewer.role = 'accountant'
            AND c.tax_id IS NOT NULL
            AND c.tax_id != ''
            AND c.tax_id NOT ILIKE 'no gst%'
          )
        )
    )
  );
