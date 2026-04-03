"use client";

import { useMemo, useState } from "react";
import { ClientSelector } from "@/components/client-selector";
import { Card, CardContent } from "@/components/ui/card";

interface Client {
  id: string;
  name: string;
}

interface Invoice {
  id: string;
  client_id: string;
  invoice_number: string;
  issue_date: string;
  due_date: string;
  total_amount: string;
  amount_paid: string;
  status: string;
  clients: {
    name: string;
    email: string;
  };
  [key: string]: any;
}

interface DashboardClientProps {
  clients: Client[];
  invoices: Invoice[];
}

export function DashboardClient({ clients, invoices }: DashboardClientProps) {
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);

  const filteredInvoices = useMemo(
    () =>
      selectedClientId
        ? invoices.filter((invoice) => invoice.client_id === selectedClientId)
        : invoices,
    [selectedClientId, invoices],
  );

  const { totalPending, invoiceStats, overdueBuckets, overdueAmounts } = useMemo(() => {
    const msInDay = 1000 * 60 * 60 * 24;
    const today = new Date();
    let totalPendingAmount = 0;
    let paid = 0;
    let partiallyPaid = 0;
    let unpaid = 0;
    let overdue = 0;
    const buckets = {
      week1: 0,
      week2: 0,
      week3: 0,
      week3plus: 0,
    };
    const amounts = {
      week1: 0,
      week2: 0,
      week3: 0,
      week3plus: 0,
    };

    for (const invoice of filteredInvoices) {
      const totalAmount = Number(invoice.total_amount);
      const amountPaid = Number(invoice.amount_paid);
      const balance = totalAmount - amountPaid;
      totalPendingAmount += balance;

      if (invoice.status === "paid") {
        paid += 1;
      } else if (invoice.status === "partially_paid") {
        partiallyPaid += 1;
      } else if (invoice.status === "draft" || invoice.status === "recorded") {
        unpaid += 1;
      }

      const daysOverdue = Math.floor(
        (today.getTime() - new Date(invoice.due_date).getTime()) / msInDay,
      );
      if (balance > 0 && daysOverdue > 0) {
        overdue += 1;
        if (daysOverdue <= 7) {
          buckets.week1 += 1;
          amounts.week1 += balance;
        } else if (daysOverdue <= 14) {
          buckets.week2 += 1;
          amounts.week2 += balance;
        } else if (daysOverdue <= 21) {
          buckets.week3 += 1;
          amounts.week3 += balance;
        } else {
          buckets.week3plus += 1;
          amounts.week3plus += balance;
        }
      }
    }

    return {
      totalPending: totalPendingAmount,
      invoiceStats: {
        total: filteredInvoices.length,
        paid,
        partiallyPaid,
        unpaid,
        overdue,
      },
      overdueBuckets: buckets,
      overdueAmounts: amounts,
    };
  }, [filteredInvoices]);

  return (
    <div className="space-y-6 pt-6">
      <div className="flex items-center gap-4">
        <span className="text-sm font-medium text-muted-foreground">
          Select client:
        </span>
        <ClientSelector
          clients={clients}
          selectedClientId={selectedClientId}
          onClientChange={setSelectedClientId}
        />
      </div>

      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Total Invoices</p>
              <p className="text-2xl font-bold">{invoiceStats.total}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Paid</p>
              <p className="text-2xl font-bold text-green-600">
                {invoiceStats.paid}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Unpaid</p>
              <p className="text-2xl font-bold text-yellow-600">
                {invoiceStats.unpaid}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Overdue</p>
              <p className="text-2xl font-bold text-red-600">
                {invoiceStats.overdue}
              </p>
            </div>
          </div>
          <div className="mt-4">
            <p className="text-sm font-medium">Overdues</p>
            <p className="text-xs text-muted-foreground">
              Counts and amounts by weeks
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="rounded-lg border bg-white p-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-amber-500" />
                <p className="text-xs text-muted-foreground">1 week</p>
              </div>
              <p className="text-xl font-semibold">{overdueBuckets.week1}</p>
            </div>
            <p className="text-xs text-muted-foreground col-span-1">
              ₹
              {overdueAmounts.week1.toLocaleString("en-IN", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
            <div className="rounded-lg border bg-white p-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-orange-500" />
                <p className="text-xs text-muted-foreground">2 weeks</p>
              </div>
              <p className="text-xl font-semibold">{overdueBuckets.week2}</p>
            </div>
            <p className="text-xs text-muted-foreground col-span-1">
              ₹
              {overdueAmounts.week2.toLocaleString("en-IN", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
            <div className="rounded-lg border bg-white p-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-red-500" />
                <p className="text-xs text-muted-foreground">3 weeks</p>
              </div>
              <p className="text-xl font-semibold">{overdueBuckets.week3}</p>
            </div>
            <p className="text-xs text-muted-foreground col-span-1">
              ₹
              {overdueAmounts.week3.toLocaleString("en-IN", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
            <div className="rounded-lg border bg-white p-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-red-700" />
                <p className="text-xs text-muted-foreground">3+ weeks</p>
              </div>
              <p className="text-xl font-semibold">
                {overdueBuckets.week3plus}
              </p>
            </div>
            <p className="text-xs text-muted-foreground col-span-1">
              ₹
              {overdueAmounts.week3plus.toLocaleString("en-IN", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
          </div>
          <div className="mt-4 pt-4 border-t border-blue-200">
            <p className="text-sm text-muted-foreground">
              Total Pending Amount
            </p>
            <p className="text-3xl font-bold text-blue-600">
              ₹
              {totalPending.toLocaleString("en-IN", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
