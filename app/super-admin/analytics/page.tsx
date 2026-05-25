"use client";

import { useEffect } from "react";

import {
  TrendingUp,
  Users,
  ShoppingBag,
  DollarSign,
  ArrowUp,
  ArrowDown,
  Eye,
  Calendar,
  Loader2,
} from "lucide-react";

import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

import { useAnalyticsStore } from "@/store/useAnalyticsStore";
import toast from "react-hot-toast";

// ======================================================
// COLORS
// ======================================================

const colorMap = {
  emerald:
    "bg-emerald-50 border-emerald-200 text-emerald-700",
  blue:
    "bg-blue-50 border-blue-200 text-blue-700",
  purple:
    "bg-purple-50 border-purple-200 text-purple-700",
  amber:
    "bg-amber-50 border-amber-200 text-amber-700",
};

const pieColors = [
  "#6366f1",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#06b6d4",
];

// ======================================================
// PAGE
// ======================================================

export default function AnalyticsPage() {
  const {
    analytics,
    loading,
    fetchAnalytics,
  } = useAnalyticsStore();

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  // ======================================================
  // SAFE FALLBACKS
  // ======================================================

  const statsData = [
    {
      title: "Subscription Revenue",
      value: `₹${(
        analytics?.stats?.subscriptionRevenue || 0
      ).toLocaleString()}`,

      change: `${analytics?.stats?.revenueGrowth || 0}%`,

      trend: "up",

      icon: DollarSign,

      color: "emerald",
    },

    {
      title: "Active Subscriptions",

      value:
        analytics?.stats?.activeSubscriptions || 0,

      change: `${analytics?.stats?.orderGrowth || 0}%`,

      trend: "up",

      icon: ShoppingBag,

      color: "purple",
    },

    {
      title: "Monthly Recurring Revenue",

      value: `₹${(
        analytics?.stats?.monthlyRecurringRevenue || 0
      ).toLocaleString()}`,

      change: `${analytics?.stats?.userGrowth || 0}%`,

      trend: "up",

      icon: TrendingUp,

      color: "amber",
    },

    {
      title: "Restaurants",

      value:
        analytics?.stats?.totalRestaurants || 0,

      change: `${analytics?.stats?.restaurantGrowth || 0}%`,

      trend: "up",

      icon: Users,

      color: "blue",
    },
  ];

  const revenueData =
    analytics?.revenueChart || [];

  const planDistribution =
    analytics?.planDistribution || [];

  const recentActivities =
    analytics?.recentActivities || [];

  // ======================================================
  // LOADING
  // ======================================================

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="flex items-center gap-3 text-slate-600">
          <Loader2 className="h-6 w-6 animate-spin" />

          <span className="text-lg font-medium">
            Loading analytics...
          </span>
        </div>
      </div>
    );
  }

  // ======================================================
  // EMPTY STATE
  // ======================================================

  if (!analytics) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-800">
            No Analytics Found
          </h2>

          <p className="mt-2 text-slate-500">
            Analytics data is currently unavailable.
          </p>
        </div>
      </div>
    );
  }

  // ======================================================
  // UI
  // ======================================================

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 p-6">
      {/* ====================================================== */}
      {/* HEADER */}
      {/* ====================================================== */}

      <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="bg-gradient-to-r from-indigo-700 to-purple-700 bg-clip-text text-3xl font-extrabold text-transparent">
            Analytics Dashboard
          </h1>

          <p className="mt-1 text-slate-500">
            Real-time insights & business
            performance metrics
          </p>
        </div>

        <button
          onClick={fetchAnalytics}
          className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
        >
          Refresh Analytics
        </button>
      </div>

      {/* ====================================================== */}
      {/* STATS */}
      {/* ====================================================== */}

      <div className="mb-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {statsData.map((stat, index) => {
          const Icon = stat.icon;

          return (
            <div
              key={index}
              className={`rounded-2xl border p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md ${colorMap[
                stat.color as keyof typeof colorMap
              ]
                }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium">
                    {stat.title}
                  </p>

                  <p className="mt-2 text-3xl font-bold">
                    {stat.value}
                  </p>
                </div>

                <div className="rounded-full bg-white/70 p-3">
                  <Icon className="h-5 w-5" />
                </div>
              </div>

              <div className="mt-4 flex items-center gap-1">
                {stat.trend === "up" ? (
                  <ArrowUp
                    size={14}
                    className="text-emerald-600"
                  />
                ) : (
                  <ArrowDown
                    size={14}
                    className="text-rose-600"
                  />
                )}

                <span
                  className={`text-xs font-semibold ${stat.trend === "up"
                    ? "text-emerald-600"
                    : "text-rose-600"
                    }`}
                >
                  {stat.change}
                </span>

                <span className="text-xs text-slate-500">
                  vs last month
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* ====================================================== */}
      {/* CHARTS */}
      {/* ====================================================== */}

      <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* ====================================================== */}
        {/* REVENUE TREND */}
        {/* ====================================================== */}

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-800">
                Revenue & Orders Trend
              </h2>

              <p className="text-sm text-slate-500">
                Monthly business growth overview
              </p>
            </div>

            <div className="flex gap-3 text-xs">
              <span className="flex items-center gap-1">
                <span className="h-3 w-3 rounded-full bg-indigo-500"></span>
                Revenue
              </span>

              <span className="flex items-center gap-1">
                <span className="h-3 w-3 rounded-full bg-emerald-500"></span>
                Orders
              </span>
            </div>
          </div>

          <ResponsiveContainer
            width="100%"
            height={320}
          >
            <LineChart data={revenueData}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#e2e8f0"
              />

              <XAxis
                dataKey="month"
                stroke="#64748b"
              />

              <YAxis
                yAxisId="left"
                stroke="#64748b"
              />

              <YAxis
                yAxisId="right"
                orientation="right"
                stroke="#64748b"
              />

              <Tooltip
                contentStyle={{
                  backgroundColor: "white",
                  borderRadius: "12px",
                  border:
                    "1px solid #e2e8f0",
                }}
              />

              <Legend />

              <Line
                yAxisId="left"
                type="monotone"
                dataKey="revenue"
                stroke="#6366f1"
                strokeWidth={3}
                dot={{
                  fill: "#6366f1",
                  r: 4,
                }}
                activeDot={{ r: 7 }}
                name="Revenue"
              />

              <Line
                yAxisId="right"
                type="monotone"
                dataKey="orders"
                stroke="#10b981"
                strokeWidth={3}
                dot={{
                  fill: "#10b981",
                  r: 4,
                }}
                activeDot={{ r: 7 }}
                name="Orders"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* ====================================================== */}
        {/* PLAN DISTRIBUTION */}
        {/* ====================================================== */}

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-5">
            <h2 className="text-lg font-bold text-slate-800">
              Subscription Plan Distribution
            </h2>

            <p className="text-sm text-slate-500">
              Restaurant distribution by plans
            </p>
          </div>

          <ResponsiveContainer
            width="100%"
            height={320}
          >
            <PieChart>
              <Pie
                data={planDistribution}
                cx="50%"
                cy="50%"
                innerRadius={70}
                outerRadius={100}
                paddingAngle={3}
                dataKey="value"
                nameKey="name"
                label={({
                  name,
                  percent,
                }) =>
                  `${name} ${(
                    (percent || 0) * 100
                  ).toFixed(0)}%`
                }
                labelLine={false}
              >
                {planDistribution.map(
                  (_item, index) => (
                    <Cell
                      key={index}
                      fill={
                        pieColors[
                        index %
                        pieColors.length
                        ]
                      }
                    />
                  )
                )}
              </Pie>

              <Tooltip
                formatter={(value: any) => [
                  value,
                  "Restaurants",
                ]}
                contentStyle={{
                  backgroundColor: "white",
                  borderRadius: "12px",
                  border:
                    "1px solid #e2e8f0",
                }}
              />
            </PieChart>
          </ResponsiveContainer>

          <div className="mt-4 flex flex-wrap justify-center gap-4">
            {planDistribution.map(
              (item: any, index: number) => (
                <div
                  key={index}
                  className="flex items-center gap-2"
                >
                  <span
                    className="h-3 w-3 rounded-full"
                    style={{
                      backgroundColor:
                        pieColors[
                        index %
                        pieColors.length
                        ],
                    }}
                  />

                  <span className="text-xs text-slate-600">
                    {item.name}
                  </span>
                </div>
              )
            )}
          </div>
        </div>
      </div>

      {/* ====================================================== */}
      {/* BOTTOM */}
      {/* ====================================================== */}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* ====================================================== */}
        {/* BAR CHART */}
        {/* ====================================================== */}

        <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-5">
            <h2 className="text-lg font-bold text-slate-800">
              Monthly Revenue Breakdown
            </h2>

            <p className="text-sm text-slate-500">
              Revenue generated month-wise
            </p>
          </div>

          <ResponsiveContainer
            width="100%"
            height={320}
          >
            <BarChart data={revenueData}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#e2e8f0"
              />

              <XAxis
                dataKey="month"
                stroke="#64748b"
              />

              <YAxis stroke="#64748b" />

              <Tooltip
                formatter={(value: any) => [
                  `₹${value}`,
                  "Revenue",
                ]}
                contentStyle={{
                  backgroundColor: "white",
                  borderRadius: "12px",
                  border:
                    "1px solid #e2e8f0",
                }}
              />

              <Bar
                dataKey="revenue"
                fill="#8b5cf6"
                radius={[8, 8, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* ====================================================== */}
        {/* RECENT ACTIVITY */}
        {/* ====================================================== */}

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-800">
                Recent Activity
              </h2>

              <p className="text-sm text-slate-500">
                Latest platform actions
              </p>
            </div>

            <Eye
              size={18}
              className="text-slate-400"
            />
          </div>

          <div className="space-y-5">
            {recentActivities.length > 0 ? (
              recentActivities.map(
                (
                  activity: any,
                  index: number
                ) => (
                  <div
                    key={index}
                    className="flex items-start gap-3"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-lg">
                      {activity.icon || "📌"}
                    </div>

                    <div className="flex-1">
                      <p className="text-sm font-semibold text-slate-800">
                        {activity.user}
                      </p>

                      <p className="text-xs text-slate-500">
                        {activity.action}
                      </p>

                      <p className="mt-1 flex items-center gap-1 text-xs text-slate-400">
                        <Calendar size={11} />

                        {activity.time}
                      </p>
                    </div>
                  </div>
                )
              )
            ) : (
              <div className="py-10 text-center text-sm text-slate-500">
                No recent activities found
              </div>
            )}
          </div>

          <button className="mt-6 w-full rounded-xl border border-indigo-200 bg-indigo-50 py-2.5 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-100"
            onClick={() => toast("View all activity coming soon 🚧")} >
            View all activity
          </button>
        </div>
      </div>
    </div>
  );
}