"use client";

import {
  IndianRupee,
  ShoppingCart,
  Users,
  Utensils,
  TrendingUp,
  TrendingDown,
  Clock,
  ChefHat,
  CheckCircle2,
  XCircle,
  Package,
  AlertCircle,
  Calendar,
  Wallet,
  Smartphone,
  Hourglass,
  Bike,
  ShoppingBag,
  UtensilsCrossed,
  Repeat,
} from "lucide-react";
import { useEffect } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { io } from "socket.io-client";
import { redirect } from "next/navigation";
import TableManagement from "@/components/super-admin/TableManagement";
import toast from "react-hot-toast";
import DashboardSkeleton from "@/components/skeleton/DashboardSkeleton";
import { useQueryClient } from "@tanstack/react-query";
import { useRestaurant } from "@/hooks/useRestaurant";
import {
  useDashboard,
  dashboardKeys,
  type DashboardData,
  type RecentOrder,
  type TopItem,
  type HourlySales,
} from "@/hooks/useDashboard";

// ========== Reusable Components ==========

const StatCard = ({ title, value, icon: Icon, trend, color }: any) => {
  const TrendIcon = trend >= 0 ? TrendingUp : TrendingDown;
  const trendColor = trend >= 0 ? "text-green-600" : "text-red-600";

  return (
    <div className="group relative overflow-hidden rounded-lg border border-gray-100 bg-white p-2 sm:p-3 shadow-sm hover:shadow-md transition-all">
      {/* Top Accent */}
      <div
        className={`absolute left-0 top-0 h-1 w-full bg-linear-to-r ${color}`}
      />

      <div className="flex items-start justify-between gap-1">
        <div className="min-w-0 flex-1">
          <p className="truncate text-[9px] sm:text-[10px] font-medium text-gray-500">
            {title}
          </p>

          <h3 className="mt-0.5 text-sm sm:text-lg font-bold text-gray-800 leading-none">
            {value}
          </h3>

          {trend !== undefined && (
            <div className="mt-1 flex items-center gap-0.5">
              <TrendIcon className={`h-2.5 w-2.5 ${trendColor}`} />
              <span className={`text-[9px] font-medium ${trendColor}`}>
                {Math.abs(trend)}%
              </span>
            </div>
          )}
        </div>

        <div
          className={`flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg bg-linear-to-br ${color} text-white shrink-0`}
        >
          <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
        </div>
      </div>
    </div>
  );
};

const HourlySalesChart = ({ data }: { data: HourlySales[] }) => {
  const maxAmount = Math.max(...data.map((d) => d.amount), 1);

  const activeHours = data.filter((d) => d.orders > 0);

  const peakHour = activeHours.reduce(
    (best, cur) => (cur.amount > (best?.amount ?? -1) ? cur : best),
    activeHours[0],
  );

  const formatHour = (h: number) => {
    const period = h < 12 ? "AM" : "PM";
    const hour12 = h % 12 === 0 ? 12 : h % 12;
    return `${hour12}${period}`;
  };

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-100 px-3 py-2.5 sm:px-4">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-blue-500" />
          <h3 className="text-sm font-semibold text-gray-800 sm:text-base">
            Sales by Hour
          </h3>
        </div>

        {peakHour && peakHour.amount > 0 && (
          <span className="hidden text-[10px] text-gray-500 md:block">
            Peak {formatHour(peakHour.hour)}
          </span>
        )}
      </div>

      {/* Chart */}
      <div className="px-3 py-3 sm:px-4">
        <div className="flex h-28 sm:h-32 lg:h-36 items-end gap-[2px]">
          {data.map((hour) => {
            const height = Math.max(
              (hour.amount / maxAmount) * 100,
              hour.amount > 0 ? 6 : 2,
            );

            const isPeak =
              peakHour && hour.hour === peakHour.hour && hour.amount > 0;

            return (
              <div
                key={hour.hour}
                className="group flex h-full flex-1 items-end"
                title={`${formatHour(hour.hour)}
₹${hour.amount.toLocaleString("en-IN")}
${hour.orders} orders`}
              >
                <div
                  className={`
                    w-full rounded-t-sm transition-all duration-300
                    ${
                      isPeak
                        ? "bg-blue-600"
                        : hour.amount > 0
                          ? "bg-blue-300 group-hover:bg-blue-400"
                          : "bg-gray-100"
                    }
                  `}
                  style={{ height: `${height}%` }}
                />
              </div>
            );
          })}
        </div>

        {/* Time Labels */}
        <div className="mt-2 flex justify-between text-[9px] sm:text-[10px] text-gray-400">
          <span>12A</span>
          <span>6A</span>
          <span>12P</span>
          <span>6P</span>
          <span>11P</span>
        </div>

        {/* Mobile Peak */}
        {peakHour && peakHour.amount > 0 && (
          <div className="mt-2 text-center text-[10px] text-gray-500 md:hidden">
            Peak: {formatHour(peakHour.hour)} • ₹
            {peakHour.amount.toLocaleString("en-IN")}
          </div>
        )}
      </div>
    </div>
  );
};

const OrderStatusBreakdown = ({
  status,
}: {
  status: DashboardData["orderStatus"];
}) => {
  const total = Object.values(status).reduce((a, b) => a + b, 0) || 1;

  const items = [
    {
      label: "Pending",
      value: status.pending,
      color: "bg-amber-500",
      icon: Clock,
    },
    {
      label: "Preparing",
      value: status.preparing,
      color: "bg-blue-500",
      icon: ChefHat,
    },
    {
      label: "Ready",
      value: status.ready,
      color: "bg-emerald-500",
      icon: CheckCircle2,
    },
    {
      label: "Served",
      value: status.served,
      color: "bg-purple-500",
      icon: Package,
    },
    {
      label: "Completed",
      value: status.completed,
      color: "bg-gray-500",
      icon: CheckCircle2,
    },
    {
      label: "Cancelled",
      value: status.cancelled,
      color: "bg-red-500",
      icon: XCircle,
    },
  ];

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-100 px-3 py-2.5 sm:px-4">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-orange-500" />
          <h3 className="text-sm font-semibold text-gray-800 sm:text-base">
            Order Status
          </h3>
        </div>

        <span className="rounded-md bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-600 sm:text-xs">
          {total} Total
        </span>
      </div>

      {/* Content */}
      <div className="space-y-3 px-3 py-3 sm:px-4">
        {items.map((item) => {
          const percentage = Math.round((item.value / total) * 100);

          return (
            <div key={item.label}>
              <div className="mb-1 flex items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2">
                  <item.icon className="h-3.5 w-3.5 shrink-0 text-gray-500" />

                  <span className="text-xs font-medium text-gray-700 sm:text-sm">
                    {item.label}
                  </span>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <span className="text-xs font-semibold text-gray-800 sm:text-sm">
                    {item.value}
                  </span>

                  <span className="text-[10px] text-gray-400 sm:text-xs">
                    ({percentage}%)
                  </span>
                </div>
              </div>

              <div className="h-1.5 overflow-hidden rounded-full bg-gray-100">
                <div
                  className={`${item.color} h-full rounded-full transition-all duration-500`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// New: dine-in vs takeaway vs delivery mix — was fetched but never displayed.
const OrderTypeBreakdown = ({
  types,
}: {
  types: DashboardData["orderTypes"];
}) => {
  const total = types.dine_in + types.takeaway + types.delivery || 1;

  const items = [
    {
      label: "Dine-in",
      value: types.dine_in,
      color: "bg-indigo-500",
      icon: UtensilsCrossed,
    },
    {
      label: "Takeaway",
      value: types.takeaway,
      color: "bg-teal-500",
      icon: ShoppingBag,
    },
    {
      label: "Delivery",
      value: types.delivery,
      color: "bg-orange-500",
      icon: Bike,
    },
  ];

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-gray-100 px-3 py-2.5 sm:px-4">
        <Utensils className="h-4 w-4 text-indigo-500" />
        <h3 className="text-sm font-semibold text-gray-800 sm:text-base">
          Order Type Mix
        </h3>
      </div>

      {/* Content */}
      <div className="space-y-3 px-3 py-3 sm:px-4">
        {items.map((item) => {
          const percentage = Math.round((item.value / total) * 100);

          return (
            <div key={item.label}>
              <div className="mb-1 flex items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2">
                  <item.icon className="h-3.5 w-3.5 shrink-0 text-gray-500" />

                  <span className="text-xs font-medium text-gray-700 sm:text-sm">
                    {item.label}
                  </span>
                </div>

                <div className="flex shrink-0 items-center gap-2 text-xs sm:text-sm">
                  <span className="font-semibold text-gray-800">
                    {item.value}
                  </span>

                  <span className="text-[10px] text-gray-400 sm:text-xs">
                    ({percentage}%)
                  </span>
                </div>
              </div>

              <div className="h-1.5 overflow-hidden rounded-full bg-gray-100">
                <div
                  className={`${item.color} h-full rounded-full transition-all duration-500`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// New: how revenue breaks down by payment method, with pending payments
// called out since that's actionable money an owner needs to chase down.
const PaymentAnalytics = ({
  payments,
}: {
  payments: DashboardData["paymentAnalytics"];
}) => {
  const totalAmount =
    payments.cash.amount + payments.upi.amount + payments.pending.amount || 1;

  const rows = [
    {
      label: "Cash",
      ...payments.cash,
      color: "bg-green-500",
      icon: Wallet,
    },
    {
      label: "UPI",
      ...payments.upi,
      color: "bg-blue-500",
      icon: Smartphone,
    },
    {
      label: "Pending",
      ...payments.pending,
      color: "bg-red-500",
      icon: Hourglass,
    },
  ];

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-gray-100 px-3 py-2.5 sm:px-4">
        <IndianRupee className="h-4 w-4 text-green-500" />
        <h3 className="text-sm font-semibold text-gray-800 sm:text-base">
          Payment Breakdown
        </h3>
      </div>

      {/* Content */}
      <div className="space-y-3 px-3 py-3 sm:px-4">
        {rows.map((row) => (
          <div key={row.label}>
            <div className="mb-1 flex items-center justify-between gap-2">
              <div className="flex min-w-0 items-center gap-2">
                <row.icon className="h-3.5 w-3.5 shrink-0 text-gray-500" />

                <span className="text-xs font-medium text-gray-700 sm:text-sm">
                  {row.label}
                </span>

                <span className="hidden text-[10px] text-gray-400 sm:inline">
                  ({row.count})
                </span>
              </div>

              <span
                className={`text-xs sm:text-sm font-semibold whitespace-nowrap ${
                  row.label === "Pending" && row.amount > 0
                    ? "text-red-600"
                    : "text-gray-800"
                }`}
              >
                ₹{row.amount.toLocaleString("en-IN")}
              </span>
            </div>

            <div className="h-1.5 overflow-hidden rounded-full bg-gray-100">
              <div
                className={`${row.color} h-full rounded-full transition-all duration-500`}
                style={{
                  width: `${(row.amount / totalAmount) * 100}%`,
                }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      {payments.pending.amount > 0 && (
        <div className="border-t border-gray-100 bg-red-50 px-3 py-2 sm:px-4">
          <div className="flex items-center gap-1.5 text-[11px] sm:text-xs text-red-600">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            <span>
              ₹{payments.pending.amount.toLocaleString("en-IN")} pending across{" "}
              {payments.pending.count} order
              {payments.pending.count > 1 ? "s" : ""}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

// Fixed to use the fields the API actually returns (customer, type, amount,
// payment) instead of the old total/afterTax/finalAmount fields.
const RecentOrdersTable = ({ orders }: { orders: RecentOrder[] }) => {
  const statusColors: Record<RecentOrder["status"], string> = {
    pending: "bg-amber-100 text-amber-700",
    preparing: "bg-blue-100 text-blue-700",
    ready: "bg-emerald-100 text-emerald-700",
    served: "bg-purple-100 text-purple-700",
    completed: "bg-gray-100 text-gray-700",
    cancelled: "bg-red-100 text-red-700",
  };
  const typeLabels: Record<RecentOrder["type"], string> = {
    dine_in: "Dine-in",
    takeaway: "Takeaway",
    delivery: "Delivery",
  };

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between border-b border-gray-100 px-3 py-2.5 sm:px-4">
        <h3 className="text-base sm:text-lg font-semibold text-gray-800 flex items-center gap-2">
          <ShoppingCart className="w-4 h-4 text-blue-500" />
          Recent Orders
        </h3>
        <button
          className="text-xs sm:text-sm text-blue-600 hover:text-blue-800 font-medium"
          onClick={() => redirect("/orders")}
        >
          View All →
        </button>
      </div>
      <div
        className="overflow-x-auto  [-ms-overflow-style:none]
    [scrollbar-width:none]
    [&::-webkit-scrollbar]:hidden"
      >
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-[11px] sm:text-xs uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-2 py-2 sm:px-3 font-medium">Order ID</th>
              <th className="px-2 py-2 sm:px-3 font-medium">Customer</th>
              <th className="px-2 py-2 sm:px-3 font-medium">Table</th>
              <th className="px-2 py-2 sm:px-3 font-medium">Type</th>
              <th className="px-2 py-2 sm:px-3 font-medium">Items</th>
              <th className="px-2 py-2 sm:px-3 font-medium">Amount</th>
              <th className="px-2 py-2 sm:px-3 font-medium">Payment</th>
              <th className="px-2 py-2 sm:px-3 font-medium">Status</th>
              <th className="px-2 py-2 sm:px-3 font-medium">Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {orders.map((order) => (
              <tr key={order.id} className="hover:bg-gray-50 transition">
                <td className="px-5 py-3 font-mono text-xs font-semibold text-gray-800">
                  {order.orderNumber?.slice(-3).toUpperCase() ||
                    order.id.slice(-8)}
                </td>
                <td className="px-5 py-3 text-xs sm:text-sm text-gray-600">
                  {order.customer}
                </td>
                <td className="px-5 py-3 text-xs sm:text-sm text-gray-600">
                  Table {order.table}
                </td>
                <td className="px-5 py-3 text-xs sm:text-sm text-gray-600">
                  {typeLabels[order.type]}
                </td>
                <td className="px-5 py-3 text-xs sm:text-sm text-gray-600">
                  {order.items}
                </td>
                <td className="px-5 py-3 text-xs sm:text-sm font-semibold text-gray-800">
                  ₹{order.amount}
                </td>
                <td className="px-5 py-3 text-xs sm:text-sm">
                  {order.payment ? (
                    <span className="text-gray-600 capitalize">
                      {order.payment}
                    </span>
                  ) : (
                    <span className="text-red-500 font-medium">Unpaid</span>
                  )}
                </td>
                <td className="px-5 py-3">
                  <span
                    className={`inline-flex items-center gap-1 px-1.5 py-0.5
rounded-md
text-[10px]
font-medium font-medium ${statusColors[order.status]}`}
                  >
                    {order.status.charAt(0).toUpperCase() +
                      order.status.slice(1)}
                  </span>
                </td>
                <td className="px-5 py-3 text-xs sm:text-sm text-gray-500">
                  {new Date(order.time).toLocaleTimeString("en-IN", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const TopItemsList = ({ items }: { items: TopItem[] }) => {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-gray-100 px-3 py-2.5 sm:px-4">
        <Utensils className="h-4 w-4 text-rose-500" />
        <h3 className="text-sm font-semibold text-gray-800 sm:text-base">
          Top Selling Items
        </h3>
      </div>

      {/* List */}
      <div className="divide-y divide-gray-100">
        {items.map((item, idx) => (
          <div
            key={item.name}
            className="flex items-center justify-between px-3 py-2.5 sm:px-4 hover:bg-gray-50 transition-colors"
          >
            {/* Left */}
            <div className="flex min-w-0 items-center gap-2">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gray-100 text-[10px] font-bold text-gray-600">
                {idx + 1}
              </span>

              <div className="min-w-0">
                <p className="truncate text-xs font-medium text-gray-800 sm:text-sm">
                  {item.name}
                </p>

                <p className="text-[10px] text-gray-500 sm:text-xs">
                  {item.quantity} sold
                </p>
              </div>
            </div>

            {/* Right */}
            <div className="ml-3 text-right shrink-0">
              <p className="text-xs font-semibold text-gray-800 sm:text-sm">
                ₹{item.revenue.toLocaleString("en-IN")}
              </p>

              <p className="text-[10px] text-gray-400">Revenue</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
// ========== Main Dashboard Component ==========

export default function DashboardPage() {
  const setAuth = useAuthStore((state) => state.setAuth);
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);
  const restaurant = useAuthStore((state) => state.restaurant);
  const queryClient = useQueryClient();

  // Bootstrap / refresh restaurant profile into the auth store
  const { data: restaurantData, isPending: isRestaurantPending } =
    useRestaurant();

  useEffect(() => {
    if (!restaurantData) return;
    setAuth({ user, token, restaurant: restaurantData });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restaurantData]);

  const restaurantId = restaurant?._id;

  const { data, isLoading: isDashboardLoading } = useDashboard(restaurantId);

  // Realtime updates: invalidate the dashboard query, don't hand-roll a refetch callback
  useEffect(() => {
    if (!restaurantId) return;

    const socket = io(process.env.NEXT_PUBLIC_API_URL, {
      transports: ["websocket"],
      withCredentials: true,
    });

    socket.emit("joinRestaurant", restaurantId);

    const handleUpdate = () => {
      queryClient.invalidateQueries({
        queryKey: dashboardKeys.detail(restaurantId),
      });
    };

    socket.on("ORDER_UPDATED", handleUpdate);
    socket.on("ORDER_READY", handleUpdate);
    socket.on("ORDER_COMPLETED", handleUpdate);

    return () => {
      socket.off("ORDER_UPDATED", handleUpdate);
      socket.off("ORDER_READY", handleUpdate);
      socket.off("ORDER_COMPLETED", handleUpdate);
      socket.disconnect();
    };
    // restaurantId is a primitive — this only reconnects when the restaurant actually changes
  }, [restaurantId, queryClient]);

  if (isRestaurantPending || isDashboardLoading) {
    return <DashboardSkeleton />;
  }

  if (!data || !restaurant) return null;

  const returningPct =
    data.customers.today > 0
      ? Math.round((data.customers.returning / data.customers.today) * 100)
      : 0;

  const stats = [
    {
      title: "Today's Revenue",
      value: `₹${data.revenue.today.toLocaleString("en-IN")}`,
      icon: IndianRupee,
      trend: data.revenue.trend,
      trendLabel: "vs yesterday",
      color: "from-emerald-400 to-teal-400",
    },

    {
      title: "Orders Today",
      value: data.orders.today,
      icon: ShoppingCart,
      trend: data.orders.trend,
      trendLabel: "vs yesterday",
      color: "from-sky-400 to-blue-400",
    },

    {
      title: "Customers",
      value: data.customers.today,
      icon: Users,
      color: "from-amber-400 to-orange-400",
    },

    {
      title: "Returning Customers",
      value: `${returningPct}%`,
      icon: Repeat,
      color: "from-cyan-400 to-sky-400",
    },

    {
      title: "Avg Order Value",
      value: `₹${data.averageOrderValue.toFixed(0)}`,
      icon: TrendingUp,
      color: "from-violet-400 to-indigo-400",
    },

    {
      title: "Cash Collection",
      value: `₹${data.paymentAnalytics.cash.amount}`,
      icon: IndianRupee,
      color: "from-green-400 to-emerald-400",
    },

    {
      title: "UPI Collection",
      value: `₹${data.paymentAnalytics.upi.amount}`,
      icon: IndianRupee,
      color: "from-blue-400 to-indigo-400",
    },

    {
      title: "Pending Payment",
      value: `₹${data.paymentAnalytics.pending.amount}`,
      icon: AlertCircle,
      color: "from-rose-400 to-red-400",
    },

    {
      title: "Menu Items",
      value: data.menuItems,
      icon: Utensils,
      color: "from-slate-400 to-gray-500",
    },
  ];

  return (
    <div className="space-y-4 sm:space-y-5 lg:space-y-6 rounded-xl border border-gray-200 bg-white p-3 sm:p-4 lg:p-5">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800">
            Dashboard Overview
          </h2>

          <p className="text-xs sm:text-sm text-gray-500">
            Real-time insights for your restaurant
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-2">
        {stats.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </div>

      <div className="p-4 md:p-6">
        <TableManagement restaurantId={restaurant._id} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <OrderTypeBreakdown types={data.orderTypes} />
        <PaymentAnalytics payments={data.paymentAnalytics} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RecentOrdersTable orders={data.recentOrders} />
        </div>
        <div>
          <TopItemsList items={data.topItems} />
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <HourlySalesChart data={data.hourlySales} />
        <OrderStatusBreakdown status={data.orderStatus} />
      </div>
    </div>
  );
}
