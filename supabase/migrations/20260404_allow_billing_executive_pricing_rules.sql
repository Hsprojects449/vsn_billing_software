-- Allow billing_executive to manage client pricing rules

DROP POLICY IF EXISTS "Privileged users can create pricing rules" ON public.client_product_pricing;
CREATE POLICY "Privileged users can create pricing rules"
  ON public.client_product_pricing FOR INSERT
  WITH CHECK (
    organization_id = public.get_user_organization(auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('super_admin', 'admin', 'billing_executive')
        AND p.is_active = true
    )
  );

DROP POLICY IF EXISTS "Privileged users can update pricing rules" ON public.client_product_pricing;
CREATE POLICY "Privileged users can update pricing rules"
  ON public.client_product_pricing FOR UPDATE
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

DROP POLICY IF EXISTS "Privileged users can delete pricing rules" ON public.client_product_pricing;
CREATE POLICY "Privileged users can delete pricing rules"
  ON public.client_product_pricing FOR DELETE
  USING (
    organization_id = public.get_user_organization(auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('super_admin', 'admin', 'billing_executive')
        AND p.is_active = true
    )
  );
