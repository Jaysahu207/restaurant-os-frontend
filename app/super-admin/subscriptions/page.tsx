"use client";

import { useEffect, useState } from "react";
import {
  CreditCard,
  Users,
  DollarSign,
  Search,
  Edit2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  X,
  Check,
  Crown,
  RefreshCcw,
  AlertCircle,
} from "lucide-react";

import { useSubscriptionStore } from "@/store/useSubscriptionStore";

// ----------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------

interface Plan {
  code: string;
  name: string;
  basePrice: number;
  finalPrice?: number;
  gstPercentage?: number;
  trialDays: number;
  features: {
    qrOrdering: boolean;
    billing: boolean;
    inventory: boolean;
    crm: boolean;
    analytics: boolean;
    marketing: boolean;
  };
}

interface RestaurantSubscription {
  _id?: string;
  plan: string;
  status: "active" | "trial" | "expired" | "cancelled";
  basePrice: number;
  finalPrice: number;
  startDate: string;
  expiryDate: string;
  features: {
    qrOrdering: boolean;
    billing: boolean;
    inventory: boolean;
    crm: boolean;
    analytics: boolean;
    marketing: boolean;
  };
}

interface Restaurant {
  _id: string;
  name: string;
  slug: string;
  currency: string;
  timezone: string;
  subscriptionStatus: string;
  isActive: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  owner: string;
  subscriptionId?: RestaurantSubscription;
}

// ----------------------------------------------------------------------
// Assign Plan Modal
// ----------------------------------------------------------------------

function AssignPlanModal({
  restaurant,
  plans,
  onClose,
  onAssign,
}: {
  restaurant: Restaurant | null;
  plans: Plan[];
  onClose: () => void;
  onAssign: (restaurantId: string, planCode: string) => Promise<void>;
}) {
  const [selectedPlan, setSelectedPlan] = useState<string>(
    restaurant?.subscriptionId?.plan || ""
  );
  const [loading, setLoading] = useState(false);

  if (!restaurant) return null;

  const selectedPlanData = plans.find((p) => p.code === selectedPlan);

  const handleSubmit = async () => {
    if (!selectedPlan) return;
    try {
      setLoading(true);
      await onAssign(restaurant._id, selectedPlan);
      onClose();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
          <div>
            <h3 className="text-xl font-bold text-slate-800">Assign Subscription</h3>
            <p className="mt-1 text-sm text-slate-500">{restaurant.name}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="space-y-5 p-6">
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Select Plan
            </label>
            <select
              value={selectedPlan}
              onChange={(e) => setSelectedPlan(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
            >
              <option value="">Choose Subscription Plan</option>
              {plans.map((plan) => (
                <option key={plan.code} value={plan.code}>
                  {plan.name} — ₹{plan.basePrice}/month
                </option>
              ))}
            </select>
          </div>

          {/* Plan Details Preview */}
          {selectedPlanData && (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-lg font-bold text-slate-800">{selectedPlanData.name}</h4>
                  <p className="mt-1 text-sm text-indigo-600">₹{selectedPlanData.basePrice}/month</p>
                </div>
                <div className="rounded-xl bg-indigo-100 p-2">
                  <Crown className="h-5 w-5 text-indigo-600" />
                </div>
              </div>
              <div className="mt-3 text-sm text-slate-500">{selectedPlanData.trialDays} days free trial</div>

              <div className="mt-5">
                <p className="mb-3 text-sm font-semibold text-slate-700">Included Features</p>
                <div className="space-y-2">
                  {Object.entries(selectedPlanData.features || {})
                    .filter(([, value]) => value)
                    .map(([key], idx) => (
                      <div key={idx} className="flex items-center gap-2 text-sm text-slate-600">
                        <div className="rounded-full bg-emerald-100 p-1">
                          <Check className="h-3 w-3 text-emerald-600" />
                        </div>
                        <span className="capitalize">{key.replace(/([A-Z])/g, " $1")}</span>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!selectedPlan || loading}
            className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-5 py-2 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Assign Plan"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------
// Main Component
// ----------------------------------------------------------------------

export default function SubscriptionsPage() {
  const {
    plans,
    restaurants,
    loading,
    error,
    stats,
    currentPage,
    totalPages,
    search,
    planFilter,
    statusFilter,
    fetchPlans,
    fetchRestaurants,
    refreshSubscriptions,
    assignPlan,
    setCurrentPage,
    setSearch,
    setPlanFilter,
    setStatusFilter,
  } = useSubscriptionStore();

  // Local UI state
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);

  // Fetch data on mount & filter changes
  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  useEffect(() => {
    fetchRestaurants();
  }, [currentPage, search, planFilter, statusFilter, fetchRestaurants]);

  // Handlers
  const handleAssignPlan = async (restaurantId: string, planCode: string) => {
    await assignPlan(restaurantId, planCode);
  };

  const openAssignModal = (restaurant: any) => {
    setSelectedRestaurant(restaurant as Restaurant);
    setAssignModalOpen(true);
  };

  // Helpers
  const formatDate = (dateStr?: string) =>
    dateStr ? new Date(dateStr).toLocaleDateString() : "—";

  const getStatusBadge = (status?: string) => {
    const styles: Record<string, string> = {
      active: "bg-emerald-100 text-emerald-700",
      trial: "bg-amber-100 text-amber-700",
      expired: "bg-rose-100 text-rose-700",
      cancelled: "bg-slate-100 text-slate-700",
    };
    return styles[status || ""] || "bg-slate-100 text-slate-700";
  };

  // Safe stats defaults
  const safeStats = {
    totalRestaurants: stats?.totalRestaurants ?? 0,
    activeSubscriptions: stats?.activeSubscriptions ?? 0,
    monthlyRecurringRevenue: stats?.monthlyRecurringRevenue ?? 0,
  };

  // Error UI
  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
        <div className="flex items-center gap-3">
          <AlertCircle className="h-6 w-6 text-red-500" />
          <div>
            <h2 className="font-semibold text-red-700">Something went wrong</h2>
            <p className="text-sm text-red-600">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800">Subscription Management</h1>
          <p className="mt-1 text-sm text-slate-500">Manage plans, subscriptions and recurring revenue</p>
        </div>
        <button
          onClick={refreshSubscriptions}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
        >
          <RefreshCcw
            className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
          />

          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Total Restaurants</p>
              <h2 className="mt-2 text-3xl font-bold text-slate-800">{safeStats.totalRestaurants}</h2>
            </div>
            <div className="rounded-2xl bg-indigo-100 p-3">
              <Users className="h-7 w-7 text-indigo-600" />
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Active Subscriptions</p>
              <h2 className="mt-2 text-3xl font-bold text-slate-800">{safeStats.activeSubscriptions}</h2>
            </div>
            <div className="rounded-2xl bg-emerald-100 p-3">
              <CreditCard className="h-7 w-7 text-emerald-600" />
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Monthly Revenue</p>
              <h2 className="mt-2 text-3xl font-bold text-slate-800">
                ₹{safeStats.monthlyRecurringRevenue.toLocaleString()}
              </h2>
            </div>
            <div className="rounded-2xl bg-amber-100 p-3">
              <DollarSign className="h-7 w-7 text-amber-600" />
            </div>
          </div>
        </div>
      </div>
      {/* Revenue Analytics */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">

        {/* Total Revenue */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-500">
            Total Revenue
          </p>

          <h2 className="mt-3 text-3xl font-extrabold text-slate-800">
            ₹{stats?.totalRevenue?.toLocaleString?.() || 0}
          </h2>

          <p className="mt-2 text-xs text-slate-400">
            Lifetime subscription earnings
          </p>
        </div>

        {/* Trial Restaurants */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-500">
            Trial Restaurants
          </p>

          <h2 className="mt-3 text-3xl font-extrabold text-amber-600">
            {stats?.trialSubscriptions || 0}
          </h2>

          <p className="mt-2 text-xs text-slate-400">
            Currently using trial plans
          </p>
        </div>

        {/* Expired Subscriptions */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-500">
            Expired Subscriptions
          </p>

          <h2 className="mt-3 text-3xl font-extrabold text-rose-600">
            {stats?.expiredSubscriptions || 0}
          </h2>

          <p className="mt-2 text-xs text-slate-400">
            Need renewal attention
          </p>
        </div>
      </div>
      {/* Available Plans Section */}
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Available Plans</h2>
          <p className="text-sm text-slate-500">Subscription packages for restaurants</p>
        </div>

        {loading && plans.length === 0 ? (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="h-28 animate-pulse rounded-lg bg-slate-100" />
              </div>
            ))}
          </div>
        ) : plans.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500">
            No subscription plans available.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
            {plans.map((plan) => {
              const enabledFeatures = Object.entries(plan.features || {})
                .filter(([, value]) => value)
                .map(([key]) => key);

              return (
                <div
                  key={plan.code}
                  className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-slate-800">{plan.name}</h3>
                      <p className="mt-1 text-xs uppercase tracking-wide text-slate-400">{plan.code}</p>
                    </div>
                    <div className="rounded-xl bg-indigo-100 p-2">
                      <Crown className="h-5 w-5 text-indigo-600" />
                    </div>
                  </div>
                  <div className="mt-5">
                    <div className="flex items-end gap-1">
                      <span className="text-4xl font-extrabold text-slate-900">₹{plan.basePrice}</span>
                      <span className="mb-1 text-sm text-slate-500">/month</span>
                    </div>
                    <p className="mt-2 text-sm font-medium text-indigo-600">{plan.trialDays} days free trial</p>
                  </div>
                  <div className="mt-6 space-y-3">
                    {enabledFeatures.length > 0 ? (
                      enabledFeatures.map((feature, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-sm text-slate-600">
                          <div className="rounded-full bg-emerald-100 p-1">
                            <Check className="h-3 w-3 text-emerald-600" />
                          </div>
                          <span className="capitalize">{feature.replace(/([A-Z])/g, " $1")}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-slate-400">No features listed</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      {/* Plan Revenue Analytics */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">

        <div className="border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-bold text-slate-800">
            Revenue By Plan
          </h2>

          <p className="text-sm text-slate-500">
            Earnings breakdown for each subscription plan
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-sm">

            <thead className="bg-slate-100 text-slate-700">
              <tr>
                <th className="px-6 py-4 text-left">
                  Plan
                </th>

                <th className="px-6 py-4 text-left">
                  Active
                </th>

                <th className="px-6 py-4 text-left">
                  Trial
                </th>

                <th className="px-6 py-4 text-left">
                  Expired
                </th>

                <th className="px-6 py-4 text-left">
                  Revenue
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {stats?.planAnalytics?.map((plan: any) => (
                <tr key={plan.plan}>
                  <td className="px-6 py-4 font-semibold capitalize">
                    {plan.plan}
                  </td>

                  <td className="px-6 py-4">
                    {plan.activeSubscriptions}
                  </td>

                  <td className="px-6 py-4">
                    {plan.trialSubscriptions}
                  </td>

                  <td className="px-6 py-4">
                    {plan.expiredSubscriptions}
                  </td>

                  <td className="px-6 py-4 font-bold text-emerald-600">
                    ₹{plan.revenue.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {/* Restaurant Subscriptions Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {/* Table Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-5 py-4">
          <div>
            <h2 className="font-bold text-slate-800">Restaurant Subscriptions</h2>
            <p className="text-xs text-slate-500">Manage restaurant subscription plans</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search restaurant..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-56 rounded-xl border border-slate-200 py-2 pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
            <select
              value={planFilter}
              onChange={(e) => setPlanFilter(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm"
            >
              <option value="all">All Plans</option>
              {plans.map((plan) => (
                <option key={plan.code} value={plan.code}>
                  {plan.name}
                </option>
              ))}
              <option value="none">No Plan</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="trial">Trial</option>
              <option value="inactive">Inactive</option>
              <option value="expired">Expired</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] text-sm">
            <thead className="bg-slate-100 text-slate-700">
              <tr>
                <th className="px-5 py-4 text-left font-semibold">Restaurant</th>
                <th className="px-5 py-4 text-left font-semibold">Plan</th>
                <th className="px-5 py-4 text-left font-semibold">Status</th>
                <th className="px-5 py-4 text-left font-semibold">Start Date</th>
                <th className="px-5 py-4 text-left font-semibold">End Date</th>
                <th className="px-5 py-4 text-left font-semibold">Amount</th>
                <th className="px-5 py-4 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && restaurants.length === 0 ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    <td colSpan={7} className="px-5 py-4">
                      <div className="h-10 animate-pulse rounded bg-slate-100" />
                    </td>
                  </tr>
                ))
              ) : restaurants.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-slate-400">
                    No restaurants found
                  </td>
                </tr>
              ) : (
                restaurants.map((restaurant) => (
                  <tr key={restaurant._id} className="transition hover:bg-slate-50">
                    <td className="px-5 py-4">
                      <div className="font-semibold text-slate-800">{restaurant.name}</div>
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded-full px-2 py-1 text-[10px] font-semibold ${restaurant.isActive
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-rose-100 text-rose-700"
                            }`}
                        >
                          {restaurant.isActive ? "Active" : "Inactive"}
                        </span>
                        {restaurant.isDeleted && (
                          <span className="rounded-full bg-slate-200 px-2 py-1 text-[10px] font-semibold text-slate-700">
                            Deleted
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      {restaurant.subscriptionId?.plan ? (
                        <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold uppercase text-indigo-700">
                          {restaurant.subscriptionId.plan}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">No Plan</span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusBadge(
                          restaurant.subscriptionId?.status || restaurant.subscriptionStatus
                        )}`}
                      >
                        {restaurant.subscriptionId?.status || restaurant.subscriptionStatus || "—"}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-slate-600">{formatDate(restaurant.subscriptionId?.startDate)}</td>
                    <td className="px-5 py-4 text-slate-600">{formatDate(restaurant.subscriptionId?.expiryDate)}</td>
                    <td className="px-5 py-4 font-medium text-slate-700">
                      {restaurant.subscriptionId?.finalPrice !== undefined
                        ? `₹${restaurant.subscriptionId.finalPrice}`
                        : "—"}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={() => openAssignModal(restaurant)}
                        className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100"
                      >
                        <Edit2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-200 px-5 py-4 sm:flex-row">
            <div className="text-sm text-slate-500">
              Page {currentPage} of {totalPages}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="rounded-xl border border-slate-200 p-2 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="rounded-xl border border-slate-200 p-2 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Assign Plan Modal */}
      {assignModalOpen && selectedRestaurant && (
        <AssignPlanModal
          restaurant={selectedRestaurant}
          plans={plans}
          onClose={() => setAssignModalOpen(false)}
          onAssign={handleAssignPlan}
        />
      )}
    </div>
  );
}