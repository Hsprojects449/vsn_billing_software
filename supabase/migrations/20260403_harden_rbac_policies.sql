-- RBAC hardening for Admin, Billing Executive, and Accountant flows.
-- 1) Billing Executive: clients/products view-only
-- 2) Admin: full operational access outside Team/Settings
-- 3) Accountant: no write access to invoice/payment/quotation domains

-- Clients write policies: super_admin/admin only
DROP POLICY IF EXISTS "Users can create clients in their organization" ON public.clients;
CREATE POLICY "Users can create clients in their organization"
  ON public.clients FOR INSERT
  WITH CHECK (
    organization_id = public.get_user_organization(auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('super_admin', 'admin')
        AND p.is_active = true
    )
  );

DROP POLICY IF EXISTS "Users can update clients in their organization" ON public.clients;
CREATE POLICY "Users can update clients in their organization"
  ON public.clients FOR UPDATE
  USING (
    organization_id = public.get_user_organization(auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('super_admin', 'admin')
        AND p.is_active = true
    )
  )
  WITH CHECK (
    organization_id = public.get_user_organization(auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('super_admin', 'admin')
        AND p.is_active = true
    )
  );

-- Products write policies: super_admin/admin only
DROP POLICY IF EXISTS "Users can create products in their organization" ON public.products;
CREATE POLICY "Users can create products in their organization"
  ON public.products FOR INSERT
  WITH CHECK (
    organization_id = public.get_user_organization(auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('super_admin', 'admin')
        AND p.is_active = true
    )
  );

DROP POLICY IF EXISTS "Users can update products in their organization" ON public.products;
CREATE POLICY "Users can update products in their organization"
  ON public.products FOR UPDATE
  USING (
    organization_id = public.get_user_organization(auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('super_admin', 'admin')
        AND p.is_active = true
    )
  )
  WITH CHECK (
    organization_id = public.get_user_organization(auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('super_admin', 'admin')
        AND p.is_active = true
    )
  );

-- Admin operational access expansions
DROP POLICY IF EXISTS "Super Admins can delete operators" ON public.operators;
CREATE POLICY "Privileged users can delete operators"
  ON public.operators FOR DELETE
  USING (
    organization_id = public.get_user_organization(auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('super_admin', 'admin')
        AND p.is_active = true
    )
  );

DROP POLICY IF EXISTS "Super Admins can create pricing rules" ON public.client_product_pricing;
CREATE POLICY "Privileged users can create pricing rules"
  ON public.client_product_pricing FOR INSERT
  WITH CHECK (
    organization_id = public.get_user_organization(auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('super_admin', 'admin')
        AND p.is_active = true
    )
  );

DROP POLICY IF EXISTS "Super Admins can update pricing rules" ON public.client_product_pricing;
CREATE POLICY "Privileged users can update pricing rules"
  ON public.client_product_pricing FOR UPDATE
  USING (
    organization_id = public.get_user_organization(auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('super_admin', 'admin')
        AND p.is_active = true
    )
  )
  WITH CHECK (
    organization_id = public.get_user_organization(auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('super_admin', 'admin')
        AND p.is_active = true
    )
  );

DROP POLICY IF EXISTS "Super Admins can delete pricing rules" ON public.client_product_pricing;
CREATE POLICY "Privileged users can delete pricing rules"
  ON public.client_product_pricing FOR DELETE
  USING (
    organization_id = public.get_user_organization(auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('super_admin', 'admin')
        AND p.is_active = true
    )
  );

-- Invoices: allow super_admin/admin/billing_executive writes/deletes
DROP POLICY IF EXISTS "Users can create invoices in their organization" ON public.invoices;
CREATE POLICY "Users can create invoices in their organization"
  ON public.invoices FOR INSERT
  WITH CHECK (
    organization_id = public.get_user_organization(auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('super_admin', 'admin', 'billing_executive')
        AND p.is_active = true
    )
  );

DROP POLICY IF EXISTS "Users can update invoices in their organization" ON public.invoices;
CREATE POLICY "Users can update invoices in their organization"
  ON public.invoices FOR UPDATE
  USING (
    organization_id = public.get_user_organization(auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('super_admin', 'admin', 'billing_executive')
        AND p.is_active = true
    )
  )
  WITH CHECK (
    organization_id = public.get_user_organization(auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('super_admin', 'admin', 'billing_executive')
        AND p.is_active = true
    )
  );

DROP POLICY IF EXISTS "Super Admins can delete invoices" ON public.invoices;
CREATE POLICY "Privileged users can delete invoices"
  ON public.invoices FOR DELETE
  USING (
    organization_id = public.get_user_organization(auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('super_admin', 'admin', 'billing_executive')
        AND p.is_active = true
    )
  );

-- Invoice items management restricted to invoice domain writers
DROP POLICY IF EXISTS "Authenticated users can manage invoice items" ON public.invoice_items;
CREATE POLICY "Authorized users can manage invoice items"
  ON public.invoice_items FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM public.invoices i
      JOIN public.profiles p ON p.id = auth.uid()
      WHERE i.id = invoice_items.invoice_id
        AND i.organization_id = public.get_user_organization(auth.uid())
        AND p.role IN ('super_admin', 'admin', 'billing_executive')
        AND p.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.invoices i
      JOIN public.profiles p ON p.id = auth.uid()
      WHERE i.id = invoice_items.invoice_id
        AND i.organization_id = public.get_user_organization(auth.uid())
        AND p.role IN ('super_admin', 'admin', 'billing_executive')
        AND p.is_active = true
    )
  );

-- Payments: allow super_admin/admin/billing_executive writes/deletes
DROP POLICY IF EXISTS "Users can create payments in their organization" ON public.payments;
CREATE POLICY "Users can create payments in their organization"
  ON public.payments FOR INSERT
  WITH CHECK (
    organization_id = public.get_user_organization(auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('super_admin', 'admin', 'billing_executive')
        AND p.is_active = true
    )
  );

DROP POLICY IF EXISTS "Super Admins can update payments" ON public.payments;
CREATE POLICY "Privileged users can update payments"
  ON public.payments FOR UPDATE
  USING (
    organization_id = public.get_user_organization(auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('super_admin', 'admin', 'billing_executive')
        AND p.is_active = true
    )
  )
  WITH CHECK (
    organization_id = public.get_user_organization(auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('super_admin', 'admin', 'billing_executive')
        AND p.is_active = true
    )
  );

DROP POLICY IF EXISTS "Super Admins can delete payments" ON public.payments;
CREATE POLICY "Privileged users can delete payments"
  ON public.payments FOR DELETE
  USING (
    organization_id = public.get_user_organization(auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('super_admin', 'admin', 'billing_executive')
        AND p.is_active = true
    )
  );

-- Quotations: allow super_admin/admin/billing_executive writes/deletes
DROP POLICY IF EXISTS "Users can create quotations in their organization" ON public.quotations;
CREATE POLICY "Users can create quotations in their organization"
  ON public.quotations FOR INSERT
  WITH CHECK (
    organization_id = public.get_user_organization(auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('super_admin', 'admin', 'billing_executive')
        AND p.is_active = true
    )
  );

DROP POLICY IF EXISTS "Users can update quotations in their organization" ON public.quotations;
CREATE POLICY "Users can update quotations in their organization"
  ON public.quotations FOR UPDATE
  USING (
    organization_id = public.get_user_organization(auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('super_admin', 'admin', 'billing_executive')
        AND p.is_active = true
    )
  )
  WITH CHECK (
    organization_id = public.get_user_organization(auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('super_admin', 'admin', 'billing_executive')
        AND p.is_active = true
    )
  );

DROP POLICY IF EXISTS "Super Admins can delete quotations" ON public.quotations;
CREATE POLICY "Privileged users can delete quotations"
  ON public.quotations FOR DELETE
  USING (
    organization_id = public.get_user_organization(auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('super_admin', 'admin', 'billing_executive')
        AND p.is_active = true
    )
  );

-- Quotation items management restricted to quotation domain writers
DROP POLICY IF EXISTS "Authenticated users can manage quotation items" ON public.quotation_items;
CREATE POLICY "Authorized users can manage quotation items"
  ON public.quotation_items FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM public.quotations q
      JOIN public.profiles p ON p.id = auth.uid()
      WHERE q.id = quotation_items.quotation_id
        AND q.organization_id = public.get_user_organization(auth.uid())
        AND p.role IN ('super_admin', 'admin', 'billing_executive')
        AND p.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.quotations q
      JOIN public.profiles p ON p.id = auth.uid()
      WHERE q.id = quotation_items.quotation_id
        AND q.organization_id = public.get_user_organization(auth.uid())
        AND p.role IN ('super_admin', 'admin', 'billing_executive')
        AND p.is_active = true
    )
  );

-- Categories and price history deletes: admin allowed
DROP POLICY IF EXISTS "Super Admins can delete categories" ON public.price_categories;
CREATE POLICY "Privileged users can delete categories"
  ON public.price_categories FOR DELETE
  USING (
    organization_id = public.get_user_organization(auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('super_admin', 'admin')
        AND p.is_active = true
    )
  );

DROP POLICY IF EXISTS "Super Admins can delete price history" ON public.price_category_history;
CREATE POLICY "Privileged users can delete price history"
  ON public.price_category_history FOR DELETE
  USING (
    organization_id = public.get_user_organization(auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('super_admin', 'admin')
        AND p.is_active = true
    )
  );

-- Clients and products deletes: admin allowed
DROP POLICY IF EXISTS "Super Admins can delete clients" ON public.clients;
CREATE POLICY "Privileged users can delete clients"
  ON public.clients FOR DELETE
  USING (
    organization_id = public.get_user_organization(auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('super_admin', 'admin')
        AND p.is_active = true
    )
  );

DROP POLICY IF EXISTS "Super Admins can delete products" ON public.products;
CREATE POLICY "Privileged users can delete products"
  ON public.products FOR DELETE
  USING (
    organization_id = public.get_user_organization(auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('super_admin', 'admin')
        AND p.is_active = true
    )
  );
