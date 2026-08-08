// components/reports/OrderStatusChart.tsx

import type { OrderStatusAnalytics } from "@/types/reports";

const STATUS_COLORS: Record<string, string> = {
  completed: "bg-emerald-500",
  paid: "bg-emerald-500",
  delivered: "bg-emerald-500",
  served: "bg-sky-500",
  ready: "bg-sky-400",
  preparing: "bg-amber-400",
  pending: "bg-amber-400",
  out_for_delivery: "bg-sky-500",
  cancelled: "bg-red-500",
};

const STATUS_LABELS: Record<string, string> = {
  out_for_delivery: "Out for Delivery",
};

function label(status: string) {
  return STATUS_LABELS[status] ?? status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, " ");
}

export function OrderStatusChart({ orderStatus }: { orderStatus: OrderStatusAnalytics }) {
  if (orderStatus.totalOrders === 0) {
    return (
      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
        <h3 className="text-base font-semibold text-gray-900 mb-4">Order Status</h3>
        <p className="text-sm text-gray-400 text-center py-10">No orders for this period.</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
      <h3 className="text-base font-semibold text-gray-900 mb-4">Order Status</h3>
      <div className="flex h-3 rounded-full overflow-hidden mb-4">
        {orderStatus.statuses.map((s) => (
          <div
            key={s.status}
            className={STATUS_COLORS[s.status] ?? "bg-gray-400"}
            style={{ width: `${s.percentage}%` }}
            title={`${label(s.status)}: ${s.percentage}%`}
          />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-sm">
        {orderStatus.statuses.map((s) => (
          <div key={s.status} className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full shrink-0 ${STATUS_COLORS[s.status] ?? "bg-gray-400"}`} />
            <span className="text-gray-600 truncate">{label(s.status)}</span>
            <span className="font-medium text-gray-900 ml-auto">{s.percentage}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
