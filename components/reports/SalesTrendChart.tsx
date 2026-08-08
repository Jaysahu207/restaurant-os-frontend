
"use client";

import { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

import type { SalesTrend } from "@/types/reports";

interface SalesTrendChartProps {
  trend: SalesTrend;
}

type MetricKey = "grossSales" | "netSales" | "orders";

const METRICS: {
  key: MetricKey;
  label: string;
  color: string;
  isCurrency?: boolean;
}[] = [
    {
      key: "netSales",
      label: "Net Sales",
      color: "#F97316",
      isCurrency: true,
    },
    {
      key: "grossSales",
      label: "Gross Sales",
      color: "#FDBA74",
      isCurrency: true,
    },
    {
      key: "orders",
      label: "Orders",
      color: "#0EA5E9",
      isCurrency: false,
    },
  ];

function formatDate(
  iso: string,
  granularity: SalesTrend["granularity"]
) {
  const date = new Date(iso);

  if (granularity === "month") {
    return date.toLocaleDateString("en-IN", {
      month: "short",
      year: "2-digit",
    });
  }

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });
}

function formatCurrency(value: number) {
  return `₹${value.toLocaleString("en-IN", {
    maximumFractionDigits: 0,
  })}`;
}

export function SalesTrendChart({
  trend,
}: SalesTrendChartProps) {
  const [active, setActive] = useState<Set<MetricKey>>(
    new Set<MetricKey>(["netSales", "orders"])
  );

  const toggle = (key: MetricKey) => {
    setActive((previous) => {
      const next = new Set(previous);

      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }

      return next;
    });
  };

  // No data
  if (!trend?.points || trend.points.length === 0) {
    return <EmptyChartState label="Sales" />;
  }

  /*
   * Convert API response into Recharts data.
   *
   * Backend:
   * {
   *   date: "2026-08-02T00:00:00.000Z",
   *   grossSales: 6074,
   *   netSales: 6074,
   *   orders: 23
   * }
   */
  const data = trend.points.map((point) => ({
    ...point,
    label: formatDate(point.date, trend.granularity),
  }));

  return (
    <div className="w-full rounded-2xl border border-gray-100 bg-white p-5">
      {/* Header */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-base font-semibold text-gray-900">
            Sales Overview
          </h3>

          <p className="mt-1 text-xs text-gray-500">
            Sales and order performance over time
          </p>
        </div>

        {/* Metric buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {METRICS.map((metric) => {
            const isActive = active.has(metric.key);

            return (
              <button
                key={metric.key}
                type="button"
                onClick={() => toggle(metric.key)}
                className={`rounded-md border px-2.5 py-1 text-xs font-medium transition-colors ${isActive
                  ? "border-transparent text-white"
                  : "border-gray-200 bg-white text-gray-500 hover:bg-gray-50"
                  }`}
                style={
                  isActive
                    ? {
                      backgroundColor: metric.color,
                    }
                    : undefined
                }
              >
                {metric.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Chart */}
      <div className="h-[320px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{
              top: 10,
              right: 10,
              left: 0,
              bottom: 5,
            }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="#E5E7EB"
            />

            <XAxis
              dataKey="label"
              tick={{
                fontSize: 12,
                fill: "#94A3B8",
              }}
              axisLine={false}
              tickLine={false}
            />

            <YAxis
              tick={{
                fontSize: 12,
                fill: "#94A3B8",
              }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(value) =>
                Number(value) >= 1000
                  ? `₹${(Number(value) / 1000).toFixed(1)}k`
                  : `₹${Number(value)}`
              }
            />

            <Tooltip
              cursor={{
                stroke: "#CBD5E1",
                strokeWidth: 1,
              }}
              contentStyle={{
                borderRadius: "10px",
                border: "1px solid #E5E7EB",
                boxShadow:
                  "0 4px 12px rgba(0,0,0,0.08)",
              }}
              labelStyle={{
                color: "#111827",
                fontWeight: 600,
                marginBottom: 6,
              }}
              formatter={(value, name) => {
                const numericValue = Number(value ?? 0);
                const metricName = String(name);

                if (
                  metricName === "Net Sales" ||
                  metricName === "Gross Sales"
                ) {
                  return [
                    formatCurrency(numericValue),
                    metricName,
                  ];
                }

                if (metricName === "Orders") {
                  return [
                    numericValue.toLocaleString("en-IN"),
                    "Orders",
                  ];
                }

                return [
                  numericValue.toLocaleString("en-IN"),
                  metricName,
                ];
              }}
            />

            <Legend
              wrapperStyle={{
                fontSize: 12,
                paddingTop: 10,
              }}
            />

            {/* Lines */}
            {METRICS.filter((metric) =>
              active.has(metric.key)
            ).map((metric) => (
              <Line
                key={metric.key}
                type="monotone"
                dataKey={metric.key}
                name={metric.label}
                stroke={metric.color}
                strokeWidth={2}
                dot={false}
                activeDot={{
                  r: 5,
                }}
                connectNulls
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function EmptyChartState({
  label,
}: {
  label: string;
}) {
  return (
    <div className="flex min-h-[320px] items-center justify-center rounded-2xl border border-gray-100 bg-white p-10">
      <div className="text-center">
        <p className="text-sm font-medium text-gray-700">
          No {label} data available
        </p>

        <p className="mt-1 text-xs text-gray-500">
          There are no completed orders for the selected
          date range. Try a different period.
        </p>
      </div>
    </div>
  );
}

