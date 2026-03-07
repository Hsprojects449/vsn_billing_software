import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { DashboardPageWrapper } from "@/components/dashboard-page-wrapper"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { MonthYearPicker } from "@/components/month-year-picker"

export const revalidate = 0

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; year?: string }>
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/auth/login")

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (!profile || (profile.role !== "super_admin" && profile.role !== "admin")) {
    redirect("/dashboard")
  }

  const params = await searchParams
  const today = new Date()
  const reportYear = params.year ? parseInt(params.year) : today.getFullYear()
  const reportMonth = params.month ? parseInt(params.month) : today.getMonth() + 1

  const monthStart = `${reportYear}-${String(reportMonth).padStart(2, "0")}-01`
  const daysInMonth = new Date(reportYear, reportMonth, 0).getDate()
  const monthEnd = `${reportYear}-${String(reportMonth).padStart(2, "0")}-${String(daysInMonth).padStart(2, "0")}`

  const monthLabel = new Date(reportYear, reportMonth - 1, 1).toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  })

  // Fetch all required data in parallel
  const [clientsResult, currentMonthInvoicesResult, allUnpaidInvoicesResult, currentMonthPaymentsResult] =
    await Promise.all([
      supabase.from("clients").select("id, name").order("name", { ascending: true }),

      supabase
        .from("invoices")
        .select("id, client_id, total_amount, invoice_items(quantity)")
        .gte("issue_date", monthStart)
        .lte("issue_date", monthEnd),

      supabase
        .from("invoices")
        .select("client_id, total_amount, amount_paid, issue_date")
        .neq("status", "cancelled")
        .neq("status", "paid"),

      supabase
        .from("payments")
        .select("amount, invoices(client_id)")
        .gte("payment_date", monthStart)
        .lte("payment_date", monthEnd),
    ])

  const clients = clientsResult.data || []
  const currentMonthInvoices = currentMonthInvoicesResult.data || []
  const allUnpaidInvoices = allUnpaidInvoicesResult.data || []
  const currentMonthPayments = currentMonthPaymentsResult.data || []

  type ClientRow = {
    id: string
    name: string
    sale: number
    saleKgs: number
    payments: number
    outstanding: number
    oldBal: number
  }

  const clientMap = new Map<string, ClientRow>()
  for (const client of clients) {
    clientMap.set(client.id, {
      id: client.id,
      name: client.name,
      sale: 0,
      saleKgs: 0,
      payments: 0,
      outstanding: 0,
      oldBal: 0,
    })
  }

  for (const invoice of currentMonthInvoices) {
    const row = clientMap.get(invoice.client_id)
    if (!row) continue
    row.sale += Number(invoice.total_amount)
    const items = (invoice.invoice_items as { quantity: string | number | null }[] | null) ?? []
    row.saleKgs += items.reduce((sum, item) => sum + Number(item.quantity || 0), 0)
  }

  for (const invoice of allUnpaidInvoices) {
    const balance = Number(invoice.total_amount) - Number(invoice.amount_paid)
    if (balance <= 0) continue
    const row = clientMap.get(invoice.client_id)
    if (!row) continue
    row.outstanding += balance
    if (invoice.issue_date < monthStart) {
      row.oldBal += balance
    }
  }

  for (const payment of currentMonthPayments) {
    const clientId = (payment.invoices as unknown as { client_id: string } | null)?.client_id
    if (!clientId) continue
    const row = clientMap.get(clientId)
    if (!row) continue
    row.payments += Number(payment.amount)
  }

  const rows = Array.from(clientMap.values()).filter(
    (r) => r.sale > 0 || r.payments > 0 || r.outstanding > 0 || r.oldBal > 0,
  )

  const totals = rows.reduce(
    (acc, r) => ({
      oldBal: acc.oldBal + r.oldBal,
      sale: acc.sale + r.sale,
      saleKgs: acc.saleKgs + r.saleKgs,
      payments: acc.payments + r.payments,
      outstanding: acc.outstanding + r.outstanding,
    }),
    { oldBal: 0, sale: 0, saleKgs: 0, payments: 0, outstanding: 0 },
  )

  const fmt = (n: number) =>
    n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  return (
    <DashboardPageWrapper title="Reports">
      <div className="w-full p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
          <div>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Monthly Report:{" "}
              <span className="font-semibold text-foreground">{monthLabel}</span>
            </p>
          </div>
          <MonthYearPicker currentYear={reportYear} currentMonth={reportMonth} />
        </div>

        {/* Report Table */}
        <div className="rounded-lg border bg-white overflow-x-auto">
          <Table className="text-xs sm:text-sm">
            <TableHeader>
              <TableRow>
                <TableHead className="px-2 sm:px-4 py-2 sm:py-3">Hotel</TableHead>
                <TableHead className="text-right px-2 sm:px-4 py-2 sm:py-3">Old Bal</TableHead>
                <TableHead className="text-right px-2 sm:px-4 py-2 sm:py-3">Sale</TableHead>
                <TableHead className="text-right px-2 sm:px-4 py-2 sm:py-3">Sale KGS</TableHead>
                <TableHead className="text-right px-2 sm:px-4 py-2 sm:py-3">Avg Qty</TableHead>
                <TableHead className="text-right px-2 sm:px-4 py-2 sm:py-3">Payments</TableHead>
                <TableHead className="text-right px-2 sm:px-4 py-2 sm:py-3">Outstanding</TableHead>
              </TableRow>
              <TableRow>
                <TableHead className="px-2 sm:px-4 py-1.5 font-normal text-muted-foreground" />
                <TableHead className="text-right px-2 sm:px-4 py-1.5 font-normal text-muted-foreground">
                  Outstanding − Current month Sale
                </TableHead>
                <TableHead className="text-right px-2 sm:px-4 py-1.5 font-normal text-muted-foreground">
                  Current Month Sale
                </TableHead>
                <TableHead className="text-right px-2 sm:px-4 py-1.5 font-normal text-muted-foreground">
                  Total Purchased Qty
                </TableHead>
                <TableHead className="text-right px-2 sm:px-4 py-1.5 font-normal text-muted-foreground leading-tight">
                  Avg Qty per Day
                  <br />
                  Total / {daysInMonth} days
                </TableHead>
                <TableHead className="text-right px-2 sm:px-4 py-1.5 font-normal text-muted-foreground">
                  Current Month Payments
                </TableHead>
                <TableHead className="text-right px-2 sm:px-4 py-1.5 font-normal text-muted-foreground">
                  Total Outstanding
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center text-muted-foreground py-16 px-2 sm:px-4"
                  >
                    No activity found for {monthLabel}.
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium px-2 sm:px-4 py-2 sm:py-3">
                      {row.name}
                    </TableCell>
                    <TableCell className="text-right px-2 sm:px-4 py-2 sm:py-3">
                      {row.oldBal > 0 ? `₹${fmt(row.oldBal)}` : "—"}
                    </TableCell>
                    <TableCell className="text-right px-2 sm:px-4 py-2 sm:py-3">
                      {row.sale > 0 ? `₹${fmt(row.sale)}` : "—"}
                    </TableCell>
                    <TableCell className="text-right px-2 sm:px-4 py-2 sm:py-3">
                      {row.saleKgs > 0 ? row.saleKgs.toFixed(2) : "—"}
                    </TableCell>
                    <TableCell className="text-right px-2 sm:px-4 py-2 sm:py-3">
                      {row.saleKgs > 0 ? (
                        <>
                          {(row.saleKgs / daysInMonth).toFixed(2)}
                          <span className="text-muted-foreground ml-1">
                            / {daysInMonth}d
                          </span>
                        </>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell className="text-right px-2 sm:px-4 py-2 sm:py-3 text-green-700">
                      {row.payments > 0 ? `₹${fmt(row.payments)}` : "—"}
                    </TableCell>
                    <TableCell className="text-right px-2 sm:px-4 py-2 sm:py-3 font-semibold text-orange-700">
                      {row.outstanding > 0 ? `₹${fmt(row.outstanding)}` : "—"}
                    </TableCell>
                  </TableRow>
                ))
              )}
              {/* Totals row */}
              {rows.length > 0 && (
                <TableRow className="border-t-2 font-bold bg-muted/30">
                  <TableCell className="px-2 sm:px-4 py-2 sm:py-3">Total Sale</TableCell>
                  <TableCell className="text-right px-2 sm:px-4 py-2 sm:py-3">
                    ₹{fmt(totals.oldBal)}
                  </TableCell>
                  <TableCell className="text-right px-2 sm:px-4 py-2 sm:py-3">
                    ₹{fmt(totals.sale)}
                  </TableCell>
                  <TableCell className="text-right px-2 sm:px-4 py-2 sm:py-3">
                    {totals.saleKgs > 0 ? totals.saleKgs.toFixed(2) : "0"}
                  </TableCell>
                  <TableCell className="text-right px-2 sm:px-4 py-2 sm:py-3 font-normal text-muted-foreground">
                    —
                  </TableCell>
                  <TableCell className="text-right px-2 sm:px-4 py-2 sm:py-3 text-green-700">
                    ₹{fmt(totals.payments)}
                  </TableCell>
                  <TableCell className="text-right px-2 sm:px-4 py-2 sm:py-3 text-orange-700">
                    ₹{fmt(totals.outstanding)}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </DashboardPageWrapper>
  )
}
