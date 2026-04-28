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
  Eye,
  MoreHorizontal,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { getDashboardData } from "@/services/dashboardService";
import { useAuthStore } from "@/store/useAuthStore";
import { io } from "socket.io-client";
import { redirect } from "next/navigation";

interface DashboardData {
  revenue: { total: number; trend: number };
  ordersToday: { count: number; trend: number };
  customers: { count: number; trend: number };
  menuItems: number;
  orderStatus: {
    pending: number;
    preparing: number;
    ready: number;
    served: number;
    completed: number;
  };
  recentOrders: RecentOrder[];
  topItems: TopItem[];
  revenueByDay: { day: string; amount: number }[];
}

interface RecentOrder {
  id: string;
  table: number;
  items: number;
  total: number;
  status: "pending" | "preparing" | "ready" | "served" | "paid" | "completed";
  time: string;
}

interface TopItem {
  name: string;
  quantity: number;
  revenue: number;
}

// ========== Reusable Components ==========

const StatCard = ({
  title,
  value,
  icon: Icon,
  trend,
  trendLabel,
  color,
}: any) => {
  const TrendIcon = trend && trend > 0 ? TrendingUp : TrendingDown;
  const trendColor = trend && trend > 0 ? "text-green-600" : "text-red-600";

  return (
    <div className="relative overflow-hidden bg-white p-6 rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 group">
      <div
        className={`absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r ${color}`}
      />
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">
            {title}
          </p>
          <h3 className="text-2xl font-bold text-gray-800 mt-1">{value}</h3>
          {trend !== undefined && (
            <div className="flex items-center gap-1 mt-2 text-sm">
              <TrendIcon className={`w-4 h-4 ${trendColor}`} />
              <span className={trendColor}>{Math.abs(trend)}%</span>
              {trendLabel && (
                <span className="text-gray-400 text-xs ml-1">{trendLabel}</span>
              )}
            </div>
          )}
        </div>
        <div
          className={`p-3 rounded-full bg-gradient-to-br ${color} text-white shadow-lg group-hover:scale-110 transition-transform`}
        >
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
};

// Simple horizontal bar chart for revenue by day
const RevenueChart = ({
  data,
}: {
  data: { day: string; amount: number }[];
}) => {
  const maxAmount = Math.max(...data.map((d) => d.amount));
  return (
    <div className="bg-white p-5 rounded-2xl shadow-md">
      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
        <Calendar className="w-5 h-5 text-blue-500" />
        Weekly Revenue Trend
      </h3>
      <div className="space-y-3">
        {data.map((item) => {
          const percentage = (item.amount / maxAmount) * 100;
          return (
            <div key={item.day} className="flex items-center gap-3">
              <div className="w-10 text-sm font-medium text-gray-600">
                {item.day}
              </div>
              <div className="flex-1 h-8 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-end pr-2 text-xs text-white font-medium"
                  style={{ width: `${percentage}%` }}
                >
                  {percentage > 15 && `₹${item.amount / 1000}k`}
                </div>
              </div>
              <div className="w-16 text-right text-sm font-medium text-gray-700">
                ₹{(item.amount / 1000).toFixed(0)}k
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Order status distribution as progress bars
const OrderStatusBreakdown = ({
  status,
}: {
  status: DashboardData["orderStatus"];
}) => {
  const total = Object.values(status).reduce((a, b) => a + b, 0);
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
      label: "Paid",
      value: status.served,
      color: "bg-green-500",
      icon: CheckCircle2,
    },
    {
      label: "Completed",
      value: status.completed,
      color: "bg-gray-500",
      icon: XCircle,
    },
  ];

  return (
    <div className="bg-white p-5 rounded-2xl shadow-md">
      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
        <AlertCircle className="w-5 h-5 text-orange-500" />
        Order Status Distribution
      </h3>
      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.label}>
            <div className="flex justify-between text-sm mb-1">
              <div className="flex items-center gap-2">
                <item.icon className="w-4 h-4 text-gray-500" />
                <span className="font-medium text-gray-700">{item.label}</span>
              </div>
              <span className="text-gray-600">{item.value}</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full ${item.color}`}
                style={{ width: `${(item.value / total) * 100}%` }}
              />
            </div>
          </div>
        ))}
        <div className="pt-2 text-xs text-gray-400 text-right">
          Total orders: {total}
        </div>
      </div>
    </div>
  );
};

// Recent Orders Table
const RecentOrdersTable = ({ orders }: { orders: RecentOrder[] }) => {
  const statusColors = {
    pending: "bg-amber-100 text-amber-700",
    preparing: "bg-blue-100 text-blue-700",
    ready: "bg-emerald-100 text-emerald-700",
    served: "bg-purple-100 text-purple-700",
    completed: "bg-gray-100 text-gray-700",
  };
  return (
    <div className="bg-white rounded-2xl shadow-md overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <ShoppingCart className="w-5 h-5 text-blue-500" />
          Recent Orders
        </h3>
        <button
          className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          onClick={() => {
            redirect("/orders");
          }}
        >
          View All →
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-gray-500 text-sm">
            <tr>
              <th className="px-5 py-3 font-medium">Order ID</th>
              <th className="px-5 py-3 font-medium">Table</th>
              <th className="px-5 py-3 font-medium">Items</th>
              <th className="px-5 py-3 font-medium">Total</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium">Time</th>
              <th className="px-5 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {orders.map((order) => (
              <tr key={order.id} className="hover:bg-gray-50 transition">
                <td className="px-5 py-3 font-mono text-sm text-gray-800">
                  {order.id}
                </td>
                <td className="px-5 py-3 text-sm text-gray-600">
                  Table {order.table}
                </td>
                <td className="px-5 py-3 text-sm text-gray-600">
                  {order.items}
                </td>
                <td className="px-5 py-3 text-sm font-medium text-gray-800">
                  ₹{order.total}
                </td>
                <td className="px-5 py-3">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusColors[order.status]}`}
                  >
                    {order.status.charAt(0).toUpperCase() +
                      order.status.slice(1)}
                  </span>
                </td>
                <td className="px-5 py-3 text-sm text-gray-500">
                  {order.time}
                </td>
                <td className="px-5 py-3">
                  <button className="text-gray-400 hover:text-gray-600">
                    <Eye className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Top Selling Items
const TopItemsList = ({ items }: { items: TopItem[] }) => {
  return (
    <div className="bg-white p-5 rounded-2xl shadow-md">
      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
        <Utensils className="w-5 h-5 text-rose-500" />
        Top Selling Items
      </h3>
      <div className="space-y-4">
        {items.map((item, idx) => (
          <div key={item.name} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="w-6 text-sm font-bold text-gray-400">
                #{idx + 1}
              </span>
              <div>
                <p className="font-medium text-gray-800">{item.name}</p>
                <p className="text-xs text-gray-500">{item.quantity} sold</p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-semibold text-gray-800">
                ₹{item.revenue.toLocaleString()}
              </p>
              <p className="text-xs text-gray-400">revenue</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ========== Main Dashboard Component ==========

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const { restaurant } = useAuthStore();
  const socketRef = useRef<any>(null);

  useEffect(() => {
    if (!restaurant?._id) return;

    const load = async () => {
      try {
        setLoading(true);
        const res = await getDashboardData(restaurant._id);
        setData(res);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [restaurant?._id]);

  useEffect(() => {
    if (!restaurant?._id) return;

    const socket = io(process.env.NEXT_PUBLIC_API_URL, {
      transports: ["websocket"],
      withCredentials: true,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("🟢 Dashboard connected:", socket.id);
      socket.emit("joinRestaurant", restaurant._id);
    });

    socket.on("disconnect", () => {
      console.log("🔴 Dashboard disconnected:", socket.id);
    });

    // 🔥 IMPORTANT: LISTEN TO EVENTS
    socket.on("ORDER_UPDATED", (order) => {
      console.log("📦 ORDER UPDATED", order._id);
      refreshDashboard(); // 🔥 re-fetch dashboard
    });

    socket.on("ORDER_READY", (order) => {
      console.log("🍽️ ORDER READY", order._id);
      refreshDashboard();
    });

    socket.on("ORDER_COMPLETED", (order) => {
      console.log("✅ ORDER COMPLETED", order._id);
      refreshDashboard();
    });

    return () => {
      socket.disconnect();
    };
  }, [restaurant?._id]);

  const refreshDashboard = async () => {
    if (!restaurant?._id) return;

    const res = await getDashboardData(restaurant._id);
    setData(res);
  };
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const stats = [
    {
      title: "Total Revenue",
      value: `₹${data.revenue.total.toLocaleString()}`,
      icon: IndianRupee,
      trend: data.revenue.trend,
      trendLabel: "vs yesterday",
      color: "from-emerald-500 to-teal-500",
    },
    {
      title: "Orders Today",
      value: data.ordersToday.count.toString(),
      icon: ShoppingCart,
      trend: data.ordersToday.trend,
      trendLabel: "vs yesterday",
      color: "from-blue-500 to-indigo-500",
    },
    {
      title: "Customers",
      value: data.customers.count.toString(),
      icon: Users,
      trend: data.customers.trend,
      trendLabel: "vs yesterday",
      color: "from-amber-500 to-orange-500",
    },
    {
      title: "Menu Items",
      value: data.menuItems.toString(),
      icon: Utensils,
      color: "from-rose-500 to-pink-500",
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-gray-800">Dashboard Overview</h2>
        <p className="text-gray-500 mt-1">
          Real‑time insights for your restaurant
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </div>

      {/* Charts & Breakdowns Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RevenueChart data={data.revenueByDay} />
        <OrderStatusBreakdown status={data.orderStatus} />
      </div>

      {/* Recent Orders & Top Items */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RecentOrdersTable orders={data.recentOrders} />
        </div>
        <div>
          <TopItemsList items={data.topItems} />
        </div>
      </div>
    </div>
  );
}
