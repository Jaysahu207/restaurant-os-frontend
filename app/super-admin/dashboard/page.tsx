"use client";

import { Store, CreditCard, Users, TrendingUp } from "lucide-react";

const stats = [
  {
    title: "Total Restaurants",
    value: "248",
    icon: Store,
    change: "+12%",
    color: "indigo",
  },
  {
    title: "Active Subscriptions",
    value: "203",
    icon: CreditCard,
    change: "+8%",
    color: "emerald",
  },
  {
    title: "Total Admins",
    value: "12",
    icon: Users,
    change: "0%",
    color: "slate",
  },
  {
    title: "Monthly Revenue",
    value: "$48,290",
    icon: TrendingUp,
    change: "+23%",
    color: "amber",
  },
];

// Color mapping for dynamic Tailwind classes
const colorMap = {
  indigo: {
    bg: "bg-indigo-50",
    iconBg: "bg-indigo-100",
    iconText: "text-indigo-600",
    badge: "bg-indigo-100 text-indigo-700",
    border: "border-indigo-200",
    hover: "hover:border-indigo-300",
  },
  emerald: {
    bg: "bg-emerald-50",
    iconBg: "bg-emerald-100",
    iconText: "text-emerald-600",
    badge: "bg-emerald-100 text-emerald-700",
    border: "border-emerald-200",
    hover: "hover:border-emerald-300",
  },
  slate: {
    bg: "bg-slate-50",
    iconBg: "bg-slate-100",
    iconText: "text-slate-600",
    badge: "bg-slate-100 text-slate-700",
    border: "border-slate-200",
    hover: "hover:border-slate-300",
  },
  amber: {
    bg: "bg-amber-50",
    iconBg: "bg-amber-100",
    iconText: "text-amber-600",
    badge: "bg-amber-100 text-amber-700",
    border: "border-amber-200",
    hover: "hover:border-amber-300",
  },
};

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-slate-50 p-6 rounded-lg">
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold  bg-clip-text text-transparent">
          Dashboard
        </h1>
        <p className="text-slate-600 mt-1">
          Overview of your restaurant ecosystem
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {stats.map((stat) => {
          const colors = colorMap[stat.color as keyof typeof colorMap];
          return (
            <div
              key={stat.title}
              className={`${colors.bg} rounded-xl border ${colors.border} ${colors.hover} p-5 shadow-sm transition-all duration-200 hover:shadow-md`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">
                    {stat.title}
                  </p>
                  <p className="text-3xl font-bold text-slate-800 mt-1">
                    {stat.value}
                  </p>
                </div>
                <div
                  className={`h-12 w-12 rounded-full ${colors.iconBg} flex items-center justify-center shadow-sm`}
                >
                  <stat.icon className={`h-6 w-6 ${colors.iconText}`} />
                </div>
              </div>
              <div className="mt-4 flex items-center">
                <span
                  className={`text-xs font-semibold px-2 py-1 rounded-full ${colors.badge}`}
                >
                  {stat.change}
                </span>
                <span className="text-xs text-slate-500 ml-2">
                  vs last month
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Restaurants Table Preview */}
      <div className="mt-8 bg-white rounded-xl shadow-md overflow-hidden border border-slate-200">
        <div className="px-6 py-4 bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-slate-200 flex justify-between items-center">
          <h2 className="font-bold text-slate-800 text-lg">
            🍽️ Recently Added Restaurants
          </h2>
          <button className="text-sm font-medium text-indigo-600 hover:text-indigo-800 transition-colors">
            View all →
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-100 text-slate-700">
              <tr>
                <th className="px-6 py-3 text-left font-semibold">Name</th>
                <th className="px-6 py-3 text-left font-semibold">Owner</th>
                <th className="px-6 py-3 text-left font-semibold">Plan</th>
                <th className="px-6 py-3 text-left font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {mockRestaurants.slice(0, 4).map((r, idx) => (
                <tr
                  key={r.id}
                  className="hover:bg-gradient-to-r hover:from-slate-50 hover:to-transparent transition-all duration-150"
                >
                  <td className="px-6 py-3 font-medium text-slate-800">
                    {r.name}
                  </td>
                  <td className="px-6 py-3 text-slate-600">{r.owner}</td>
                  <td className="px-6 py-3">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                      {r.plan}
                    </span>
                  </td>
                  <td className="px-6 py-3">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
                      ✅ Active
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

const mockRestaurants = [
  { id: 1, name: "Pizza Paradise", owner: "John Doe", plan: "Pro Annual" },
  { id: 2, name: "Sushi Master", owner: "Emma Lee", plan: "Enterprise" },
  { id: 3, name: "Burger House", owner: "Mike Ross", plan: "Basic" },
  { id: 4, name: "Vegan Delight", owner: "Sarah Kim", plan: "Pro Monthly" },
];
