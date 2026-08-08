// components/reports/HourlySalesChart.tsx

"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import type { HourlySales } from "@/types/reports";
import { EmptyChartState } from "./SalesTrendChart";

function formatHour(h: number) {
  const period = h < 12 ? "AM" : "PM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}${period}`;
}

export function HourlySalesChart({ hourlySales }: { hourlySales: HourlySales }) {
  const hasData = hourlySales.hourly.some((h) => h.orders > 0);
  if (!hasData) return <EmptyChartState label="hourly sales" />;

  const data = hourlySales.hourly.map((h) => ({ ...h, label: formatHour(h.hour) }));

  return (
    <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-gray-900">Hourly Sales</h3>
        {hourlySales.peakHour && (
          <span className="text-xs font-medium text-[#F97316] bg-orange-50 px-2.5 py-1 rounded-full">
            🔥 Peak: {formatHour(hourlySales.peakHour.hour)}
          </span>
        )}
      </div>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#94A3B8" }} axisLine={false} tickLine={false} interval={2} />
          <YAxis tick={{ fontSize: 12, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{
              borderRadius: 12,
              border: "1px solid #F1F5F9",
              fontSize: 13,
            }}
            formatter={(value, name) => {
              const numericValue = Number(value ?? 0);
              const label = String(name ?? "");

              if (label === "sales") {
                return [
                  `₹${numericValue.toLocaleString("en-IN")}`,
                  "Sales",
                ];
              }

              return [
                numericValue,
                "Orders",
              ];
            }}
          />
          <Bar dataKey="sales" radius={[4, 4, 0, 0]}>
            {data.map((d, i) => (
              <Cell key={i} fill={hourlySales.peakHour?.hour === d.hour ? "#F97316" : "#FDE4CC"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
