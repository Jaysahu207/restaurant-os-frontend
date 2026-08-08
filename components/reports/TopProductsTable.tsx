// components/reports/TopProductsTable.tsx

"use client";

import { useState } from "react";
import type { ProductPerformanceRow } from "@/types/reports";

interface TopProductsTableProps {
  topProducts: ProductPerformanceRow[];
  lowProducts: ProductPerformanceRow[];
}

export function TopProductsTable({ topProducts, lowProducts }: TopProductsTableProps) {
  const [view, setView] = useState<"top" | "low">("top");
  const rows = view === "top" ? topProducts : lowProducts;

  return (
    <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-gray-900">
          {view === "top" ? "Top Selling Products" : "Low-Selling Items"}
        </h3>
        <div className="flex bg-gray-100 rounded-lg p-1 text-xs font-medium">
          <button
            onClick={() => setView("top")}
            className={`px-3 py-1 rounded-md ${view === "top" ? "bg-white shadow-sm text-gray-900" : "text-gray-500"}`}
          >
            Top
          </button>
          <button
            onClick={() => setView("low")}
            className={`px-3 py-1 rounded-md ${view === "low" ? "bg-white shadow-sm text-gray-900" : "text-gray-500"}`}
          >
            Low-selling
          </button>
        </div>
      </div>

      {rows.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-10">No product data for this period.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-500 text-xs uppercase">
                <th className="text-left py-2 font-medium">#</th>
                <th className="text-left py-2 font-medium">Product</th>
                <th className="text-left py-2 font-medium">Category</th>
                <th className="text-right py-2 font-medium">Qty</th>
                <th className="text-right py-2 font-medium">Net Sales</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {rows.map((p, i) => (
                <tr key={`${p.menuItemId ?? p.name}-${i}`}>
                  <td className="py-2.5 text-gray-400">{i + 1}</td>
                  <td className="py-2.5 font-medium text-gray-900">{p.name}</td>
                  <td className="py-2.5 text-gray-500">{p.category}</td>
                  <td className="py-2.5 text-right text-gray-700">{p.quantitySold}</td>
                  <td className="py-2.5 text-right font-medium text-gray-900">
                    ₹{p.netSales.toLocaleString("en-IN")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
