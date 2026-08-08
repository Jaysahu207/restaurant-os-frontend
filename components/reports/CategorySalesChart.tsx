// components/reports/CategorySalesChart.tsx

import type { CategoryPerformanceRow } from "@/types/reports";

const PALETTE = ["#F97316", "#FB923C", "#FDBA74", "#FED7AA", "#0EA5E9", "#38BDF8", "#94A3B8"];

export function CategorySalesChart({ categories }: { categories: CategoryPerformanceRow[] }) {
  if (categories.length === 0) {
    return (
      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
        <h3 className="text-base font-semibold text-gray-900 mb-4">Category Performance</h3>
        <p className="text-sm text-gray-400 text-center py-10">No category data for this period.</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
      <h3 className="text-base font-semibold text-gray-900 mb-4">Category Performance</h3>
      <div className="space-y-3">
        {categories.map((c, i) => (
          <div key={c.category}>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-700 font-medium">{c.category}</span>
              <span className="text-gray-500">
                {c.percentOfTotal}% · ₹{c.grossSales.toLocaleString("en-IN")}
              </span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2">
              <div
                className="h-2 rounded-full"
                style={{ width: `${c.percentOfTotal}%`, backgroundColor: PALETTE[i % PALETTE.length] }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
