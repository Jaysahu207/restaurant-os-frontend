// app/reports/page.tsx

"use client";

import { useState } from "react";
import {
  IndianRupee ,
  Receipt,
  ShoppingBag,
  TrendingUp,
  XCircle,
  Download,
} from "lucide-react";
import { useReportsOverview } from "@/hooks/useReportsOverview";
import { KpiCard } from "@/components/reports/KpiCard";
import { DateRangeFilter } from "@/components/reports/DateRangeFilter";
import { SalesTrendChart } from "@/components/reports/SalesTrendChart";
import { HourlySalesChart } from "@/components/reports/HourlySalesChart";
import { TopProductsTable } from "@/components/reports/TopProductsTable";
import { CategorySalesChart } from "@/components/reports/CategorySalesChart";
import { PaymentBreakdown } from "@/components/reports/PaymentBreakdown";
import { OrderStatusChart } from "@/components/reports/OrderStatusChart";
import { CustomerAnalytics } from "@/components/reports/CustomerAnalytics";
import { ReportInsights } from "@/components/reports/ReportInsights";
import { ReportsSkeleton } from "@/components/reports/ReportsSkeleton";
import type { DateRangePreset } from "@/types/reports";
import { exportReportsToExcel } from "@/utils/exportReportsExcel";

export default function ReportsPage() {
  const [range, setRange] = useState<DateRangePreset>("last7");
  const [customFrom, setCustomFrom] = useState<string | undefined>();
  const [customTo, setCustomTo] = useState<string | undefined>();
  const [compare, setCompare] = useState(true);

  const { data, isLoading, isError, error, refetch, isFetching } =
    useReportsOverview({
      range,
      from: customFrom,
      to: customTo,
      compare,
    });

  if (isLoading) return <ReportsSkeleton />;

  if (isError) {
    return (
      <div className="p-6 md:p-10">
        <div className="bg-white rounded-2xl border border-red-100 p-10 text-center">
          <p className="text-sm font-medium text-red-600">
            Unable to load reports
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {(error as Error)?.message ?? "Something went wrong."}
          </p>
          <button
            onClick={() => refetch()}
            className="mt-4 px-4 py-2 text-sm font-medium text-white bg-[#F97316] rounded-lg"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { summary } = data;
  // console.log("data", data);
  return (
    <div className="p-2 space-y-4 md:p-6 md:space-y-6 ">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold font-poppins text-gray-900">
            Reports & Analytics
          </h2>
          {/* <p className="text-sm text-orange-600 font-medium mt-1">{data.restaurant.name}</p> */}
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <DateRangeFilter
            range={range}
            from={customFrom}
            to={customTo}
            compare={compare}
            onChange={(next) => {
              setRange(next.range);
              setCustomFrom(next.from);
              setCustomTo(next.to);
            }}
            onCompareChange={setCompare}
          />
          <button
            type="button"
            onClick={() => exportReportsToExcel(data)}
            disabled={!data || isFetching}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4" />

            {isFetching ? "Preparing..." : "Export"}
          </button>
        </div>
      </div>

      {isFetching && <p className="text-xs text-gray-400">Refreshing…</p>}

      {summary.totalOrders === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
          <p className="text-base font-medium text-gray-700">
            No sales data available
          </p>
          <p className="text-sm text-gray-400 mt-1">
            There are no completed orders for the selected date range. Try
            selecting a different period.
          </p>
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <KpiCard
              label="Gross Sales"
              value={`₹${summary.grossSales.toLocaleString("en-IN")}`}
              icon={IndianRupee}
              growth={summary.comparison?.grossSales}
            />
            <KpiCard
              label="Net Sales"
              value={`₹${summary.netSales.toLocaleString("en-IN")}`}
              icon={TrendingUp}
              growth={summary.comparison?.netSales}
            />
            <KpiCard
              label="Total Orders"
              value={summary.totalOrders.toString()}
              icon={ShoppingBag}
              growth={summary.comparison?.totalOrders}
            />
            <KpiCard
              label="Avg. Order Value"
              value={`₹${summary.avgOrderValue.toLocaleString("en-IN")}`}
              icon={Receipt}
              growth={summary.comparison?.avgOrderValue}
            />
            <KpiCard
              label="Cancelled Orders"
              value={
                data.orderStatusAnalytics.statuses
                  .find((s: any) => s.status === "cancelled")
                  ?.count.toString() ?? "0"
              }
              icon={XCircle}
              invertColor
            />
          </div>

          {/* Sales trend + hourly */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SalesTrendChart trend={data.salesTrend} />
            <HourlySalesChart hourlySales={data.hourlySales} />
          </div>

          {/* Products + Categories */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <TopProductsTable
              topProducts={data.topProducts}
              lowProducts={data.lowProducts}
            />
            <CategorySalesChart categories={data.categoryPerformance} />
          </div>

          {/* Payments + Order status */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <PaymentBreakdown payment={data.paymentAnalytics} />
            <OrderStatusChart orderStatus={data.orderStatusAnalytics} />
          </div>

          {/* Customers */}
          <CustomerAnalytics customers={data.customerAnalytics} />

          {/* Insights */}
          <ReportInsights insights={data.insights} />
        </>
      )}
    </div>
  );
}
