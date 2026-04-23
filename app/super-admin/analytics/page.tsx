// app/super-admin/analytics/page.tsx
"use client";

import {
  TrendingUp,
  Users,
  ShoppingBag,
  DollarSign,
  ArrowUp,
  ArrowDown,
  Eye,
  Calendar,
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

// Mock data for charts
const revenueData = [
  { name: "Jan", revenue: 42000, orders: 320 },
  { name: "Feb", revenue: 45800, orders: 380 },
  { name: "Mar", revenue: 49200, orders: 410 },
  { name: "Apr", revenue: 51800, orders: 450 },
  { name: "May", revenue: 55200, orders: 490 },
  { name: "Jun", revenue: 58900, orders: 530 },
];

const trafficSources = [
  { name: "Direct", value: 35, color: "#6366f1" },
  { name: "Organic", value: 28, color: "#10b981" },
  { name: "Social", value: 22, color: "#f59e0b" },
  { name: "Referral", value: 15, color: "#ef4444" },
];

const recentActivities = [
  {
    id: 1,
    user: "John Doe",
    action: "Added new restaurant",
    time: "2 min ago",
    icon: "➕",
  },
  {
    id: 2,
    user: "Emma Lee",
    action: "Updated subscription plan",
    time: "15 min ago",
    icon: "🔄",
  },
  {
    id: 3,
    user: "Mike Ross",
    action: "Processed refund",
    time: "1 hour ago",
    icon: "💰",
  },
  {
    id: 4,
    user: "Sarah Kim",
    action: "Generated report",
    time: "3 hours ago",
    icon: "📊",
  },
];

const stats = [
  {
    title: "Total Revenue",
    value: "$58,920",
    change: "+12.5%",
    trend: "up",
    icon: DollarSign,
    color: "emerald",
  },
  {
    title: "Total Orders",
    value: "2,847",
    change: "+8.2%",
    trend: "up",
    icon: ShoppingBag,
    color: "blue",
  },
  {
    title: "Active Users",
    value: "1,203",
    change: "+5.1%",
    trend: "up",
    icon: Users,
    color: "purple",
  },
  {
    title: "Conversion Rate",
    value: "3.24%",
    change: "-0.5%",
    trend: "down",
    icon: TrendingUp,
    color: "amber",
  },
];

const colorMap = {
  emerald: "bg-emerald-50 border-emerald-200 text-emerald-700",
  blue: "bg-blue-50 border-blue-200 text-blue-700",
  purple: "bg-purple-50 border-purple-200 text-purple-700",
  amber: "bg-amber-50 border-amber-200 text-amber-700",
};

export default function AnalyticsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 p-6">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold bg-gradient-to-r from-indigo-700 to-purple-700 bg-clip-text text-transparent">
          Analytics Dashboard
        </h1>
        <p className="text-slate-500 mt-1">
          Real-time insights & performance metrics
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {stats.map((stat) => (
          <div
            key={stat.title}
            className={`rounded-xl border p-5 shadow-sm hover:shadow-md transition-all duration-200 ${colorMap[stat.color as keyof typeof colorMap]}`}
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium">{stat.title}</p>
                <p className="text-2xl font-bold mt-1">{stat.value}</p>
              </div>
              <div className="p-2 rounded-full bg-white/60">
                <stat.icon className="h-5 w-5" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-3">
              {stat.trend === "up" ? (
                <ArrowUp size={14} className="text-emerald-600" />
              ) : (
                <ArrowDown size={14} className="text-rose-600" />
              )}
              <span
                className={`text-xs font-semibold ${
                  stat.trend === "up" ? "text-emerald-600" : "text-rose-600"
                }`}
              >
                {stat.change}
              </span>
              <span className="text-xs text-slate-500">vs last month</span>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Revenue & Orders Line Chart */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-semibold text-slate-800">
              Revenue & Orders Trend
            </h2>
            <div className="flex gap-3 text-xs">
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-full bg-indigo-500"></span>{" "}
                Revenue
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-full bg-emerald-500"></span>{" "}
                Orders
              </span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" stroke="#64748b" />
              <YAxis yAxisId="left" stroke="#64748b" />
              <YAxis yAxisId="right" orientation="right" stroke="#64748b" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "white",
                  borderRadius: "8px",
                  border: "1px solid #e2e8f0",
                }}
              />
              <Legend />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="revenue"
                stroke="#6366f1"
                strokeWidth={2}
                dot={{ fill: "#6366f1", r: 4 }}
                activeDot={{ r: 6 }}
                name="Revenue ($)"
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="orders"
                stroke="#10b981"
                strokeWidth={2}
                dot={{ fill: "#10b981", r: 4 }}
                name="Orders"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Traffic Sources Pie Chart */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <h2 className="font-semibold text-slate-800 mb-4">Traffic Sources</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={trafficSources}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={2}
                dataKey="value"
                label={({ name, percent }) =>
                  `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
                }
                labelLine={false}
              >
                {trafficSources.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value) => `${value}%`}
                contentStyle={{
                  backgroundColor: "white",
                  borderRadius: "8px",
                  border: "1px solid #e2e8f0",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-4 mt-2">
            {trafficSources.map((source) => (
              <div key={source.name} className="flex items-center gap-1">
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: source.color }}
                ></span>
                <span className="text-xs text-slate-600">{source.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Row: Monthly Bar Chart & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Revenue Bar Chart */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <h2 className="font-semibold text-slate-800 mb-4">
            Monthly Revenue Breakdown
          </h2>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" stroke="#64748b" />
              <YAxis stroke="#64748b" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "white",
                  borderRadius: "8px",
                  border: "1px solid #e2e8f0",
                }}
                formatter={(value) => [`$${value}`, "Revenue"]}
              />
              <Bar dataKey="revenue" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-semibold text-slate-800">Recent Activity</h2>
            <Eye size={16} className="text-slate-400" />
          </div>
          <div className="space-y-4">
            {recentActivities.map((activity) => (
              <div key={activity.id} className="flex items-start gap-3">
                <div className="text-lg">{activity.icon}</div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-800">
                    {activity.user}
                  </p>
                  <p className="text-xs text-slate-500">{activity.action}</p>
                  <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                    <Calendar size={10} /> {activity.time}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <button className="w-full mt-4 text-center text-sm text-indigo-600 hover:text-indigo-800 font-medium">
            View all activity →
          </button>
        </div>
      </div>
    </div>
  );
}
