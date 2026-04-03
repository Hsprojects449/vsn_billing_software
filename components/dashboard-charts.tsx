"use client";

import { useMemo } from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface DashboardChartsProps {
  invoices: Array<{
    id: string;
    issue_date: string;
    due_date: string;
    total_amount: string;
    amount_paid: string;
    status: string;
  }>;
  payments: Array<{
    amount: string;
    payment_date: string;
  }>;
}

export function DashboardCharts({ invoices, payments }: DashboardChartsProps) {
  const {
    revenueChartData,
    statusChartData,
    invoicesChartData,
    totalInvoiced,
    totalPaid,
    pendingAmount,
    outstandingAmount,
    pendingInvoicesCount,
    outstandingInvoicesCount,
    collectionRate,
  } = useMemo(() => {
    const monthlyData: Record<string, number> = {};
    let paidAmount = 0;

    for (const payment of payments) {
      const date = new Date(payment.payment_date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      const amount = Number(payment.amount);
      monthlyData[monthKey] = (monthlyData[monthKey] || 0) + amount;
      paidAmount += amount;
    }

    const sortedMonths = Object.keys(monthlyData).sort();
    const last6Months = sortedMonths.slice(-6);
    const revenueData = last6Months.map((month) => ({
      month: new Date(month + "-01").toLocaleDateString("en-IN", {
        month: "short",
        year: "2-digit",
      }),
      revenue: monthlyData[month],
    }));

    const last30DaysData: Record<string, number> = {};
    const today = new Date();
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateKey = date.toISOString().split("T")[0];
      last30DaysData[dateKey] = 0;
    }

    const statusCount: Record<string, number> = {};
    let invoicedAmount = 0;
    let pending = 0;
    let outstanding = 0;
    let pendingCount = 0;
    let outstandingCount = 0;
    const todayStr = today.toISOString().split("T")[0];

    for (const inv of invoices) {
      statusCount[inv.status] = (statusCount[inv.status] || 0) + 1;
      const totalAmount = Number(inv.total_amount);
      const amountPaid = Number(inv.amount_paid);
      const balance = totalAmount - amountPaid;
      const isDue = inv.due_date <= todayStr;

      invoicedAmount += totalAmount;

      if (balance > 0 && !isDue) {
        pending += balance;
        pendingCount += 1;
      }

      if (balance > 0 && isDue) {
        outstanding += balance;
        outstandingCount += 1;
      }

      if (Object.prototype.hasOwnProperty.call(last30DaysData, inv.issue_date)) {
        last30DaysData[inv.issue_date] += totalAmount;
      }
    }

    const statusData = [
      { name: "Paid", value: statusCount.paid || 0, color: "#16a34a" },
      { name: "Recorded", value: statusCount.recorded || 0, color: "#3b82f6" },
      { name: "Overdue", value: statusCount.overdue || 0, color: "#dc2626" },
      { name: "Draft", value: statusCount.draft || 0, color: "#6b7280" },
    ].filter((item) => item.value > 0);

    const invoiceData = Object.entries(last30DaysData).map(([date, amount]) => ({
      date: new Date(date).toLocaleDateString("en-IN", {
        month: "short",
        day: "numeric",
      }),
      amount,
    }));

    return {
      revenueChartData: revenueData,
      statusChartData: statusData,
      invoicesChartData: invoiceData,
      totalInvoiced: invoicedAmount,
      totalPaid: paidAmount,
      pendingAmount: pending,
      outstandingAmount: outstanding,
      pendingInvoicesCount: pendingCount,
      outstandingInvoicesCount: outstandingCount,
      collectionRate:
        invoicedAmount > 0 ? ((paidAmount / invoicedAmount) * 100).toFixed(1) : "0",
    };
  }, [invoices, payments]);

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2 sm:pb-3">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
              Pending Amount
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline justify-between">
              <div className="text-xl sm:text-2xl font-bold text-orange-600">
                ₹
                {pendingAmount.toLocaleString("en-IN", {
                  maximumFractionDigits: 0,
                })}
              </div>
              <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4 text-orange-600" />
            </div>
            <p className="text-xs text-muted-foreground mt-1 sm:mt-2">
              Not yet due -{" "}
              {pendingInvoicesCount}{" "}
              invoices upcoming
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 sm:pb-3">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
              Outstanding Amount
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline justify-between">
              <div className="text-xl sm:text-2xl font-bold text-red-600">
                ₹
                {outstandingAmount.toLocaleString("en-IN", {
                  maximumFractionDigits: 0,
                })}
              </div>
              <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4 text-red-600" />
            </div>
            <p className="text-xs text-muted-foreground mt-1 sm:mt-2">
              Overdue -{" "}
              {outstandingInvoicesCount}{" "}
              invoices past due
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 sm:pb-3">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
              Collection Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline justify-between">
              <div className="text-xl sm:text-2xl font-bold">
                {collectionRate}%
              </div>
              <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
            </div>
            <p className="text-xs text-muted-foreground mt-1 sm:mt-2">
              ₹{totalPaid.toLocaleString("en-IN", { maximumFractionDigits: 0 })}{" "}
              / ₹
              {totalInvoiced.toLocaleString("en-IN", {
                maximumFractionDigits: 0,
              })}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 sm:pb-3">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
              Avg Invoice Value
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline justify-between">
              <div className="text-xl sm:text-2xl font-bold">
                ₹
                {invoices.length > 0
                  ? (totalInvoiced / invoices.length).toLocaleString("en-IN", {
                      maximumFractionDigits: 0,
                    })
                  : 0}
              </div>
              <TrendingDown className="h-3 w-3 sm:h-4 sm:w-4 text-slate-400" />
            </div>
            <p className="text-xs text-muted-foreground mt-1 sm:mt-2">
              {invoices.length} invoices in this FY
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2">
        {/* Revenue Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm sm:text-base">
              Revenue Trend
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Last 6 months revenue
            </CardDescription>
          </CardHeader>
          <CardContent>
            {revenueChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={revenueChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="month"
                    stroke="#6b7280"
                    style={{ fontSize: "12px" }}
                  />
                  <YAxis stroke="#6b7280" style={{ fontSize: "12px" }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#fff",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                    }}
                    formatter={(value) =>
                      `₹${Number(value).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`
                    }
                  />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={{ fill: "#3b82f6", r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No payment data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Invoice Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Invoice Status</CardTitle>
            <CardDescription>Distribution of invoice statuses</CardDescription>
          </CardHeader>
          <CardContent>
            {statusChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={statusChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {statusChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `${value} invoices`} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No invoice data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Daily Invoices (Last 30 Days) */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Invoice Amount (Last 30 Days)</CardTitle>
            <CardDescription>Daily invoice totals</CardDescription>
          </CardHeader>
          <CardContent>
            {invoicesChartData.some((item) => item.amount > 0) ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={invoicesChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="date"
                    stroke="#6b7280"
                    style={{ fontSize: "12px" }}
                    interval={Math.floor(invoicesChartData.length / 6)}
                  />
                  <YAxis stroke="#6b7280" style={{ fontSize: "12px" }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#fff",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                    }}
                    formatter={(value) =>
                      `₹${Number(value).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`
                    }
                  />
                  <Bar dataKey="amount" fill="#10b981" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No invoices in the last 30 days
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
