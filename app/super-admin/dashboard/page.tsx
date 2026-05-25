"use client";

import {
  Store,
  CreditCard,
  Users,
  TrendingUp,
  RefreshCcw,
  ShoppingBag,
  AlertCircle,
} from "lucide-react";


import { useDashboardStore } from "@/store/useDashboardStore";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

// ==============================
// TYPES
// ==============================

interface Restaurant {
  _id: string;
  name: string;
  slug: string;
  owner?: {
    name?: string;
  };
  subscriptionStatus?: string;
  isActive?: boolean;
  createdAt?: string;
}


interface SubscriptionStat {
  _id: string;
  totalRestaurants: number;
  totalRevenue: number;
  activeSubscriptions: number;
  trialSubscriptions: number;
  expiredSubscriptions: number;
}



// ==============================
// COLOR MAP
// ==============================

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

  rose: {
    bg: "bg-rose-50",
    iconBg: "bg-rose-100",
    iconText: "text-rose-600",
    badge: "bg-rose-100 text-rose-700",
    border: "border-rose-200",
    hover: "hover:border-rose-300",
  },

  blue: {
    bg: "bg-blue-50",
    iconBg: "bg-blue-100",
    iconText: "text-blue-600",
    badge: "bg-blue-100 text-blue-700",
    border: "border-blue-200",
    hover: "hover:border-blue-300",
  },
};

// ==============================
// COMPONENT
// ==============================






export default function DashboardPage() {
  const router = useRouter();
  const dashboardData = useDashboardStore(
    (state) => state.dashboardData
  );

  const loading = useDashboardStore(
    (state) => state.loading
  );

  const error = useDashboardStore(
    (state) => state.error
  );

  const fetchDashboard = useDashboardStore(
    (state) => state.fetchDashboard
  );

  const refreshDashboard = useDashboardStore(
    (state) => state.refreshDashboard
  );

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  // console.log("Dashboard Data:", dashboardData);
  const totalSubscriptionRevenue =
    dashboardData?.subscriptionStats?.reduce(
      (acc, plan) => acc + plan.totalRevenue,
      0
    ) || 0;

  const totalActiveSubscriptions =
    dashboardData?.subscriptionStats?.reduce(
      (acc, plan) => acc + plan.activeSubscriptions,
      0
    ) || 0;

  const totalTrialSubscriptions =
    dashboardData?.subscriptionStats?.reduce(
      (acc, plan) => acc + plan.trialSubscriptions,
      0
    ) || 0;

  const stats = [
    {
      title: "Total Restaurants",
      value: dashboardData?.stats?.totalRestaurants || 0,
      icon: Store,
      change: `+${dashboardData?.stats?.newRestaurants || 0}`,
      changeLabel: "new restaurants",
      color: "indigo",
    },

    {
      title: "Active Restaurants",
      value: dashboardData?.stats?.activeRestaurants || 0,
      icon: CreditCard,
      change: `${totalActiveSubscriptions}`,
      changeLabel: "active subscriptions",
      color: "emerald",
    },

    {
      title: "Total Users",
      value: dashboardData?.stats?.totalUsers || 0,
      icon: Users,
      change: `+${dashboardData?.stats?.newUsers || 0}`,
      changeLabel: "new users",
      color: "slate",
    },

    {
      title: "Total Orders",
      value: dashboardData?.stats?.totalOrders || 0,
      icon: ShoppingBag,
      change: "Live",
      changeLabel: "orders received",
      color: "blue",
    },

    {
      title: "Subscription Revenue",
      value: `₹${totalSubscriptionRevenue.toLocaleString()}`,
      icon: TrendingUp,
      change: `${totalTrialSubscriptions}`,
      changeLabel: "trial subscriptions",
      color: "amber",
    },

    {
      title: "Open Tickets",
      value: dashboardData?.stats?.openTickets || 0,
      icon: AlertCircle,
      change: "Support",
      changeLabel: "pending tickets",
      color: "rose",
    },
  ];
  // ==============================
  // LOADING
  // ==============================

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="animate-pulse">
          <div className="mb-6 h-10 w-48 rounded bg-slate-200" />

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <div
                key={item}
                className="h-36 rounded-2xl bg-white"
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ==============================
  // ERROR
  // ==============================

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <div className="rounded-2xl bg-white p-8 shadow-lg">
          <h2 className="text-2xl font-bold text-red-600">
            Error
          </h2>

          <p className="mt-2 text-slate-600">{error}</p>

          <button
            onClick={refreshDashboard}
            className="mt-5 rounded-xl bg-indigo-600 px-5 py-2 text-white"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // ==============================
  // MAIN UI
  // ==============================

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      {/* HEADER */}

      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-4xl font-extrabold text-transparent">
            Super Admin Dashboard
          </h1>

          <p className="mt-2 text-slate-600">
            Complete overview of your Qrasoi ecosystem
          </p>
        </div>

        <button
          onClick={refreshDashboard}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-100"
        >
          <RefreshCcw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {/* STATS */}

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
        {stats.map((stat) => {
          const colors =
            colorMap[stat.color as keyof typeof colorMap];

          return (
            <div
              key={stat.title}
              className={`${colors.bg} ${colors.border} ${colors.hover} rounded-2xl border p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">
                    {stat.title}
                  </p>

                  <h2 className="mt-2 text-3xl font-bold text-slate-800">
                    {stat.value}
                  </h2>
                </div>

                <div
                  className={`flex h-14 w-14 items-center justify-center rounded-2xl ${colors.iconBg}`}
                >
                  <stat.icon
                    className={`h-7 w-7 ${colors.iconText}`}
                  />
                </div>
              </div>

              <div className="mt-5 flex items-center">
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${colors.badge}`}
                >
                  {stat.change}
                </span>

                <span className="ml-2 text-xs text-slate-500">
                  {stat.changeLabel}
                </span>
              </div>
            </div>
          );
        })}
      </div>
      {/* SUBSCRIPTION ANALYTICS */}

      <div className="mt-10 rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-bold text-slate-800">
            💳 Subscription Plans
          </h2>

          <p className="text-sm text-slate-500">
            Revenue and restaurants by subscription plan
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-sm">
            <thead className="bg-slate-100 text-slate-700">
              <tr>
                <th className="px-6 py-4 text-left font-semibold">
                  Plan
                </th>

                <th className="px-6 py-4 text-left font-semibold">
                  Restaurants
                </th>

                <th className="px-6 py-4 text-left font-semibold">
                  Active
                </th>

                <th className="px-6 py-4 text-left font-semibold">
                  Trial
                </th>

                <th className="px-6 py-4 text-left font-semibold">
                  Revenue
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {dashboardData?.subscriptionStats?.map((plan) => (
                <tr
                  key={plan._id}
                  className="hover:bg-slate-50"
                >
                  <td className="px-6 py-4 font-semibold capitalize text-slate-800">
                    {plan._id}
                  </td>

                  <td className="px-6 py-4 text-slate-600">
                    {plan.totalRestaurants}
                  </td>

                  <td className="px-6 py-4">
                    <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                      {plan.activeSubscriptions}
                    </span>
                  </td>

                  <td className="px-6 py-4">
                    <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                      {plan.trialSubscriptions}
                    </span>
                  </td>

                  <td className="px-6 py-4 font-semibold text-slate-800">
                    ₹{plan.totalRevenue.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* RECENT RESTAURANTS */}

      <div className="mt-10 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200 bg-gradient-to-r from-indigo-50 to-purple-50 px-6 py-4">
          <div>
            <h2 className="text-lg font-bold text-slate-800">
              🍽️ Recently Added Restaurants
            </h2>

            <p className="text-sm text-slate-500">
              Latest restaurants joined Qrasoi
            </p>
          </div>

          <button className="text-sm font-semibold text-indigo-600 hover:text-indigo-800"
            onClick={() => {
              router.push("/super-admin/restaurants");
            }}
          >
            View all →
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-sm">
            <thead className="bg-slate-100 text-slate-700">
              <tr>
                <th className="px-6 py-4 text-left font-semibold">
                  Restaurant
                </th>

                <th className="px-6 py-4 text-left font-semibold">
                  Slug
                </th>

                <th className="px-6 py-4 text-left font-semibold">
                  Status
                </th>

                <th className="px-6 py-4 text-left font-semibold">
                  Subscription
                </th>

                <th className="px-6 py-4 text-left font-semibold">
                  Created
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {dashboardData?.latestRestaurants?.length ? (
                dashboardData.latestRestaurants.map((restaurant) => (
                  <tr
                    key={restaurant._id}
                    className="transition hover:bg-slate-50"
                  >
                    <td className="px-6 py-4 font-semibold text-slate-800">
                      {restaurant.name}
                    </td>

                    <td className="px-6 py-4 text-slate-600">
                      {restaurant.slug}
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${restaurant.isActive
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-red-100 text-red-700"
                          }`}
                      >
                        {restaurant.isActive
                          ? "Active"
                          : "Inactive"}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${restaurant.subscriptionStatus ===
                          "active"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-amber-100 text-amber-700"
                          }`}
                      >
                        {restaurant.subscriptionStatus || "trial"}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-slate-600">
                      {restaurant.createdAt
                        ? new Date(
                          restaurant.createdAt
                        ).toLocaleDateString()
                        : "N/A"}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-10 text-center text-slate-500"
                  >
                    No restaurants found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

