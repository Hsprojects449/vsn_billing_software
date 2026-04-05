import { createClient } from "@/lib/supabase/server";
import { InvoiceForm } from "@/components/invoice-form";

const computeDueDate = (
  issueDate: string,
  days: number | null | undefined,
) => {
  const base = issueDate ? new Date(issueDate) : new Date();
  const increment = Number.isFinite(days ?? null) ? Number(days ?? 0) : 0;
  base.setDate(base.getDate() + increment);
  return base.toISOString().split("T")[0];
};

const computeDueDateByType = (
  issueDate: string,
  daysType: string | null | undefined,
  days: number | null | undefined,
) => {
  if (daysType === "end_of_month") {
    const base = issueDate ? new Date(issueDate) : new Date();
    const extraMonths = Number.isFinite(days ?? null) ? Number(days ?? 0) : 0;
    base.setMonth(base.getMonth() + extraMonths + 1, 0);
    return base.toISOString().split("T")[0];
  }

  return computeDueDate(issueDate, days);
};

export default async function NewInvoicePage({
  searchParams,
}: {
  searchParams: Promise<{ fromQuotation?: string }>;
}) {
  const supabase = await createClient();
  const params = await searchParams;
  const fromQuotationId = params.fromQuotation;

  // Fetch clients, products and client-specific pricing rules
  const [clientsResult, productsResult, pricingRulesResult, latestInvoiceResult] = await Promise.all([
    supabase
      .from("clients")
      .select("id, name, email, tax_id, due_days, due_days_type")
      .order("name"),
    supabase.from("products").select("*").eq("is_active", true).order("name"),
    supabase
      .from("client_product_pricing")
      .select(
        "product_id, price_rule_type, price_rule_value, price_category_id, fixed_base_value, client_id, conditional_threshold, conditional_discount_below, conditional_discount_above_equal",
      ),
    supabase
      .from("invoices")
      .select("invoice_number")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  let conversionQuotationId: string | null = null;
  let conversionInitialInvoice: {
    client_id: string;
    issue_date: string;
    due_date: string;
    due_days_type?: string | null;
    invoice_number: string;
    reference_number?: string | null;
    notes: string | null;
    subtotal?: number | null;
    tax_amount?: number | null;
    discount_amount?: number | null;
    total_amount?: number | null;
    total_birds?: number | null;
    gst_percent?: number | null;
    split_gst?: boolean | null;
  } | null = null;
  let conversionInitialItems: Array<{
    product_id: string | null;
    description: string;
    quantity: number;
    unit_price: number;
    tax_rate: number;
    discount: number;
    line_total?: number;
  }> | null = null;

  if (fromQuotationId) {
    const { data: quotation } = await supabase
      .from("quotations")
      .select(
        `
        id,
        quotation_number,
        client_id,
        issue_date,
        subtotal,
        total_amount,
        notes,
        status,
        converted_invoice_id,
        clients(due_days, due_days_type),
        quotation_items(product_id, description, quantity, unit_price, line_total)
      `,
      )
      .eq("id", fromQuotationId)
      .maybeSingle();

    if (quotation && quotation.status !== "converted" && !quotation.converted_invoice_id) {
      const dueDays = Number((quotation as any).clients?.due_days ?? 30);
      const dueDaysType = (quotation as any).clients?.due_days_type ?? "fixed_days";
      const computedDueDate = computeDueDateByType(quotation.issue_date, dueDaysType, dueDays);

      conversionQuotationId = quotation.id;
      conversionInitialInvoice = {
        client_id: quotation.client_id,
        invoice_number: "",
        issue_date: quotation.issue_date,
        due_date: computedDueDate,
        due_days_type: dueDaysType,
        reference_number: `Q-${quotation.quotation_number}`,
        notes: quotation.notes,
        subtotal: Number((quotation as any).subtotal || 0),
        tax_amount: 0,
        discount_amount: 0,
        total_amount: Number((quotation as any).total_amount || 0),
        total_birds: 0,
        gst_percent: 0,
        split_gst: false,
      };

      conversionInitialItems = ((quotation as any).quotation_items || []).map((item: any) => ({
        product_id: item.product_id,
        description: item.description,
        quantity: Number(item.quantity || 0),
        unit_price: Number(item.unit_price || 0),
        tax_rate: 0,
        discount: 0,
        line_total: Number(item.line_total || 0),
      }));
    }
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Create Invoice</h1>
        <p className="text-muted-foreground mt-1">
          {conversionQuotationId
            ? "Review and adjust IGST/quantity before finalizing conversion"
            : "Generate a new invoice for a client"}
        </p>
      </div>

      <InvoiceForm
        clients={clientsResult.data || []}
        products={productsResult.data || []}
        clientPricingRules={pricingRulesResult.data || []}
        lastInvoiceNumber={latestInvoiceResult.data?.invoice_number || null}
        initialInvoice={conversionInitialInvoice || undefined}
        initialItems={conversionInitialItems || undefined}
        conversionQuotationId={conversionQuotationId}
      />
    </div>
  );
}
