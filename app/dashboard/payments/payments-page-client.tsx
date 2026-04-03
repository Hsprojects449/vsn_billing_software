"use client";

import { useMemo, useState } from "react";
import { ClientSelector } from "@/components/client-selector";
import { PaymentsTable } from "@/components/payments-table";
import { Card, CardContent } from "@/components/ui/card";
import {
  FinancialYearSelector,
  getFinancialYear,
  getFinancialYearDateRange,
} from "@/components/financial-year-selector";

interface Client {
  id: string;
  name: string;
}

interface Payment {
  id: string;
  invoice_id: string;
  amount: string;
  payment_date: string;
  payment_method: string;
  reference_number: string | null;
  status: string;
  invoices: {
    id: string;
    invoice_number: string;
    total_amount: string;
    amount_paid: string;
    client_id: string;
    status: string;
    clients: {
      name: string;
    };
  };
}

interface Invoice {
  id: string;
  invoice_number: string;
  total_amount: string;
  amount_paid: string;
  status: string;
}

interface PaymentsPageClientProps {
  clients: Client[];
  payments: Payment[];
  clientInvoices?: Record<string, Invoice[]>;
  userRole?: string;
}

export function PaymentsPageClient({
  clients,
  payments,
  clientInvoices = {},
  userRole,
}: PaymentsPageClientProps) {
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [selectedFY, setSelectedFY] = useState<string>(getFinancialYear());

  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const fyRange = useMemo(() => getFinancialYearDateRange(selectedFY), [selectedFY]);

  // Filter payments by client, financial year, and custom date range
  const filteredPayments = useMemo(() => payments.filter((payment) => {
    if (selectedClientId && payment.invoices?.client_id !== selectedClientId) return false;

    const paymentDate = payment.payment_date;
    if (paymentDate < fyRange.start || paymentDate > fyRange.end) return false;

    if (fromDate && paymentDate < fromDate) return false;
    if (toDate && paymentDate > toDate) return false;

    return true;
  }), [payments, selectedClientId, fyRange, fromDate, toDate]);

  // Get invoices for selected client
  const selectedClientInvoices = useMemo(
    () => (selectedClientId ? clientInvoices[selectedClientId] || [] : []),
    [selectedClientId, clientInvoices],
  );

  const { totalPending, invoiceStats } = useMemo(() => {
    let pendingTotal = 0;
    let paid = 0;
    let partiallyPaid = 0;
    let unpaid = 0;
    let overdue = 0;

    for (const invoice of selectedClientInvoices) {
      const totalAmount = Number(invoice.total_amount);
      const amountPaid = Number(invoice.amount_paid);
      pendingTotal += totalAmount - amountPaid;

      if (invoice.status === "paid") {
        paid += 1;
      } else if (invoice.status === "partially_paid" || (invoice.status === "recorded" && amountPaid > 0)) {
        partiallyPaid += 1;
      } else if (invoice.status === "recorded" && amountPaid === 0) {
        unpaid += 1;
      }

      if (invoice.status === "overdue") {
        overdue += 1;
      }
    }

    return {
      totalPending: pendingTotal,
      invoiceStats: {
        total: selectedClientInvoices.length,
        paid,
        partiallyPaid,
        unpaid,
        overdue,
      },
    };
  }, [selectedClientInvoices]);

  return (
    <div className="space-y-6">
      {selectedClientId && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Client Invoices Summary */}
          <Card className="bg-amber-50 border-amber-200">
            <CardContent className="pt-6">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    Total Invoices
                  </span>
                  <span className="font-semibold">{invoiceStats.total}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Paid</span>
                  <span className="font-semibold text-green-600">
                    {invoiceStats.paid}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    Partially Paid
                  </span>
                  <span className="font-semibold text-blue-600">
                    {invoiceStats.partiallyPaid}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Unpaid</span>
                  <span className="font-semibold text-yellow-600">
                    {invoiceStats.unpaid}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Overdue</span>
                  <span className="font-semibold text-red-600">
                    {invoiceStats.overdue}
                  </span>
                </div>
                <div className="border-t border-amber-200 pt-3 mt-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-muted-foreground">
                      Total Pending
                    </span>
                    <span className="text-lg font-bold text-amber-700">
                      ₹
                      {totalPending.toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Payments */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-6">
              <div className="space-y-2">
                {filteredPayments.slice(0, 5).map((payment) => (
                  <div
                    key={payment.id}
                    className="flex justify-between items-center text-sm pb-2 border-b border-blue-100 last:border-b-0"
                  >
                    <div>
                      <p className="font-medium">
                        {payment.invoices?.invoice_number}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {payment.payment_date}
                      </p>
                    </div>
                    <p className="font-semibold text-green-600">
                      ₹
                      {Number(payment.amount).toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </p>
                  </div>
                ))}
                {filteredPayments.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    No payments recorded yet
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <PaymentsTable
        payments={filteredPayments}
        fromDate={fromDate}
        toDate={toDate}
        userRole={userRole}
        toolbarLeft={
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex shrink-0 items-center gap-2 whitespace-nowrap">
              <span className="text-sm font-medium text-muted-foreground">FY:</span>
              <FinancialYearSelector
                selectedYear={selectedFY}
                onYearChange={setSelectedFY}
              />
            </div>
            <span className="text-sm font-medium text-muted-foreground">Client:</span>
            <ClientSelector
              clients={clients}
              selectedClientId={selectedClientId}
              onClientChange={setSelectedClientId}
            />
            <span className="text-sm font-medium text-muted-foreground">From:</span>
            <input
              type="date"
              className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
            />
            <span className="text-sm font-medium text-muted-foreground">To:</span>
            <input
              type="date"
              className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
            />
          </div>
        }
      />
    </div>
  );
}
