// components/reports/PaymentBreakdown.tsx

import type { PaymentAnalytics } from "@/types/reports";

const METHOD_LABELS: Record<string, string> = {
  cash: "Cash",
  upi: "UPI",
  unspecified: "Unspecified",
};

const METHOD_COLORS: Record<string, string> = {
  cash: "bg-emerald-500",
  upi: "bg-[#F97316]",
  unspecified: "bg-gray-400",
};

export function PaymentBreakdown({ payment }: { payment: PaymentAnalytics }) {
  if (payment.methods.length === 0) {
    return (
      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
        <h3 className="text-base font-semibold text-gray-900 mb-4">Payment Analytics</h3>
        <p className="text-sm text-gray-400 text-center py-10">No payment data for this period.</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-gray-900">Payment Analytics</h3>
        <span className="text-sm text-gray-500">
          Total: <span className="font-semibold text-gray-900">₹{payment.totalSales.toLocaleString("en-IN")}</span>
        </span>
      </div>
      <div className="space-y-3">
        {payment.methods.map((m) => (
          <div key={m.method} className="flex items-center gap-3">
            <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${METHOD_COLORS[m.method] ?? "bg-gray-400"}`} />
            <span className="text-sm text-gray-700 w-16">{METHOD_LABELS[m.method] ?? m.method}</span>
            <div className="flex-1 bg-gray-100 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${METHOD_COLORS[m.method] ?? "bg-gray-400"}`}
                style={{ width: `${m.percentage}%` }}
              />
            </div>
            <span className="text-sm font-medium text-gray-900 w-24 text-right">
              ₹{m.amount.toLocaleString("en-IN")}
            </span>
            <span className="text-xs text-gray-400 w-10 text-right">{m.percentage}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
