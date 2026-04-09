import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DashboardPageWrapper } from "@/components/dashboard-page-wrapper"
import { SettingsForm } from "@/components/settings-form"
import { InvoiceTemplateForm } from "@/components/invoice-template-form"
import { AutomatedReportsSettings } from "@/components/automated-reports-settings"

export default async function SettingsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Check role (super_admin full, admin view-only)
  const { data: profile } = await supabase.from("profiles").select("role, organization_id").eq("id", user.id).single()

  if (!profile || (profile.role !== "super_admin" && profile.role !== "admin")) {
    redirect("/dashboard")
  }

  const isManagerViewOnly = profile.role === "admin"

  const [{ data: organization }, { data: templates }] = await Promise.all([
    supabase
      .from("organizations")
      .select("*")
      .eq("id", profile.organization_id)
      .single(),
    supabase
      .from("invoice_templates")
      .select("*")
      .eq("organization_id", profile.organization_id)
      .in("template_type", ["invoice", "quotation_whatsapp", "quotation_other"]),
  ])

  const invoiceTemplate = templates?.find((template) => template.template_type === "invoice") ?? null
  const whatsappQuotationTemplate = templates?.find((template) => template.template_type === "quotation_whatsapp") ?? null
  const otherQuotationTemplate = templates?.find((template) => template.template_type === "quotation_other") ?? null

  return (
    <DashboardPageWrapper title="System Settings">
      <div className="w-full p-4 sm:p-6 lg:p-8 space-y-6">
        {isManagerViewOnly && (
          <div className="px-4 py-2 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-sm text-amber-700">View-only access. Contact an admin to make changes.</p>
          </div>
        )}

        <div className="grid gap-6">
          <Card className={isManagerViewOnly ? "pointer-events-none opacity-60" : ""}>
            <CardHeader>
              <CardTitle>Organization Settings</CardTitle>
              <CardDescription>Configure your organization details and preferences</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <SettingsForm organization={organization} />
            </CardContent>
          </Card>

          <Card className={isManagerViewOnly ? "pointer-events-none opacity-60" : ""}>
            <CardHeader>
              <CardTitle>Tax Configuration</CardTitle>
              <CardDescription>Set default tax rates and rules</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-sm text-slate-500">
                Default tax rates are configured per product. You can set organization-wide defaults here in future
                updates.
              </p>
            </CardContent>
          </Card>

          <Card className={isManagerViewOnly ? "pointer-events-none opacity-60" : ""}>
            <CardHeader>
              <CardTitle>Invoice Template</CardTitle>
              <CardDescription>Customize invoice appearance and branding</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <InvoiceTemplateForm
                existingTemplate={invoiceTemplate}
                templateType="invoice"
                title="Invoice Template Settings"
                description="Customize how your invoices appear when printed"
              />
            </CardContent>
          </Card>

          <Card className={isManagerViewOnly ? "pointer-events-none opacity-60" : ""}>
            <CardHeader>
              <CardTitle>Quotation Template (WhatsApp)</CardTitle>
              <CardDescription>Customize WhatsApp quotation layout and category table</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <InvoiceTemplateForm
                existingTemplate={whatsappQuotationTemplate}
                templateType="quotation_whatsapp"
                title="WhatsApp Quotation Template Settings"
                description="Customize how WhatsApp quotations appear when printed"
                enableWhatsappTable
              />
            </CardContent>
          </Card>

          <Card className={isManagerViewOnly ? "pointer-events-none opacity-60" : ""}>
            <CardHeader>
              <CardTitle>Quotation Template (Other Services)</CardTitle>
              <CardDescription>Customize non-WhatsApp quotation layout and content</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <InvoiceTemplateForm
                existingTemplate={otherQuotationTemplate}
                templateType="quotation_other"
                title="Other Services Quotation Template Settings"
                description="Customize how other service quotations appear when printed"
              />
            </CardContent>
          </Card>

          <div className={isManagerViewOnly ? "pointer-events-none opacity-60" : ""}>
            <AutomatedReportsSettings organization={organization} />
          </div>
        </div>
      </div>
    </DashboardPageWrapper>
  )
}
