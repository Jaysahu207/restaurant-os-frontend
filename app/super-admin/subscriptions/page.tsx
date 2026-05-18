"use client";

import { useEffect, useState } from "react";
import {
  CreditCard,
  Users,
  Calendar,
  DollarSign,
  Search,
  Edit2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  X,
  Check,
  Crown,
} from "lucide-react";
import API from "@/config/axios";
import toast from "react-hot-toast";
import { getAllRestaurants, getAllPlans } from "@/services/superAdminService";

// ----------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------
interface Plan {
  code: string;
  name: string;

  basePrice: number;
  finalPrice: number;
  gstPercentage: number;

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
  plan: string;
  status: "active" | "trial" | "expired" | "cancelled";
  startDate: string;
  endDate: string;
  amount: number;
}

interface Restaurant {
  _id: string;
  name: string;
  contactEmail: string;
  contactPhone: string;
  subscription: RestaurantSubscription;
  isActive: boolean;
  createdAt: string;
}

interface PaginatedResponse {
  restaurants: Restaurant[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
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
    restaurant?.subscription?.plan || "",
  );
  const [loading, setLoading] = useState(false);

  if (!restaurant) return null;

  const handleSubmit = async () => {
    if (!selectedPlan) return;
    setLoading(true);
    try {
      await onAssign(restaurant._id, selectedPlan);
      onClose();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="flex justify-between items-center px-6 py-4 border-b">
          <h3 className="text-lg font-semibold text-slate-800">
            Assign Plan – {restaurant.name}
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-100"
          >
            <X size={18} />
          </button>
        </div>
       <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Select Plan
            </label>
            <select
              value={selectedPlan}
              onChange={(e) => setSelectedPlan(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="">-- None (No subscription) --</option>
              {plans.map((plan) => (
                <option key={plan.code} value={plan.code}>
                  {plan.name} – ₹{plan.basePrice}/month
                </option>
              ))}
            </select>
          </div>
          {selectedPlan && (
            <div className="bg-slate-50 rounded-lg p-3 text-sm text-slate-600">
              <p className="font-medium">Plan features:</p>
              <ul className="list-disc list-inside mt-1 space-y-0.5">
                {Object.entries(
                  plans.find((p) => p.code === selectedPlan)?.features || {},
                )
                  .slice(0, 3)
                  .map(
                    ([key, value], i) =>
                      value && (
                        <li key={i}>
                          {key.charAt(0).toUpperCase() + key.slice(1)}
                        </li>
                      ),
                  )}
                {Object.entries(
                  plans.find((p) => p.code === selectedPlan)?.features || {},
                ).filter(([_, v]) => v).length > 3 && <li>+ more</li>}
              </ul>
            </div>
          )}
        </div>
        <div className="flex justify-end gap-3 px-6 py-4 border-t bg-slate-50/50">
          <button
            onClick={onClose}
            className="px-4 py-2 border rounded-lg text-slate-700"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!selectedPlan || loading}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Assign Plan"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------
// Main Page Component
// ----------------------------------------------------------------------
export default function SubscriptionsPage() {
  // State
  const [plans, setPlans] = useState<Plan[]>([]);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Modal state
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedRestaurant, setSelectedRestaurant] =
    useState<Restaurant | null>(null);

  // Stats (derived)
  const [stats, setStats] = useState({
    totalRestaurants: 0,
    activeSubscriptions: 0,
    monthlyRecurringRevenue: 0,
  });

  useEffect(() => {
    fetchPlans();
    fetchRestaurants();
  }, []);

  // Fetch data
  const fetchPlans = async () => {
    setLoading(true);
    try {
      const response = await getAllPlans();

      setPlans(response.plans);
    } catch (error) {
      console.error("Failed to fetch plans", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRestaurants = async () => {
    try {
      setLoading(true);

      const data = await getAllRestaurants();

      setRestaurants(data.restaurants);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchPlans();
  }, []);

  useEffect(() => {
    fetchRestaurants();
  }, [currentPage, search, planFilter, statusFilter]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, planFilter, statusFilter]);

  // Handlers
  const handleAssignPlan = async (restaurantId: string, planCode: string) => {
    await API.put(`/api/super-admin/restaurants/${restaurantId}/subscription`, {
      planCode,
    });
    // Refresh list
    await fetchRestaurants();
  };

  const openAssignModal = (restaurant: Restaurant) => {
    setSelectedRestaurant(restaurant);
    setAssignModalOpen(true);
  };

  // Helper to format date
  const formatDate = (dateStr?: string) =>
    dateStr ? new Date(dateStr).toLocaleDateString() : "—";

  // Status badge styles
  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      active: "bg-emerald-100 text-emerald-700",
      trial: "bg-amber-100 text-amber-700",
      expired: "bg-rose-100 text-rose-700",
      cancelled: "bg-slate-100 text-slate-700",
    };
    return styles[status] || "bg-slate-100 text-slate-700";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">
          Subscription Plans
        </h1>
        <p className="text-slate-500 text-sm">
          Manage plans and active subscriptions across all restaurants
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-500 text-sm">Total Restaurants</p>
              <p className="text-2xl font-bold text-slate-800">
                {stats.totalRestaurants}
              </p>
            </div>
            <Users className="h-8 w-8 text-indigo-400" />
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-500 text-sm">Active Subscriptions</p>
              <p className="text-2xl font-bold text-slate-800">
                {stats.activeSubscriptions}
              </p>
            </div>
            <CreditCard className="h-8 w-8 text-indigo-400" />
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-500 text-sm">
                Monthly Recurring Revenue
              </p>
              <p className="text-2xl font-bold text-slate-800">
                ₹{stats.monthlyRecurringRevenue.toLocaleString()}
              </p>
            </div>
            <DollarSign className="h-8 w-8 text-indigo-400" />
          </div>
        </div>
      </div>

      {/* Plans Grid */}
      {/* Plans Grid */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-slate-800">
          Available Plans
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {plans.map((plan) => {
            const enabledFeatures = Object.entries(plan.features)
              .filter(([_, value]) => value)
              .map(([key]) => key);

            return (
              <div
                key={plan.code}
                className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow transition"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-lg text-slate-800">
                    {plan.name}
                  </h3>

                  <Crown className="h-5 w-5 text-indigo-500" />
                </div>

                <div className="mt-2 text-2xl font-bold text-slate-900">
                  ₹{plan.finalPrice}
                  <span className="text-sm font-normal text-slate-500">
                    /month
                  </span>
                </div>

                <div className="text-xs text-slate-500 mt-1">
                  GST: {plan.gstPercentage}%
                </div>

                <div className="mt-2 text-sm text-slate-500">
                  {plan.trialDays} days free trial
                </div>

                <ul className="mt-4 space-y-2 text-sm text-slate-600">
                  {enabledFeatures.slice(0, 3).map((feature, i) => (
                    <li key={i} className="flex items-center gap-2 capitalize">
                      <Check className="h-3.5 w-3.5 text-emerald-500" />

                      {feature.replace(/([A-Z])/g, " $1")}
                    </li>
                  ))}

                  {enabledFeatures.length > 3 && (
                    <li className="text-indigo-600 text-xs">
                      + {enabledFeatures.length - 3} more
                    </li>
                  )}
                </ul>
              </div>
            );
          })}
        </div>
      </div>

      {/* Restaurants Table with Subscriptions */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-slate-200 bg-slate-50/50 flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-semibold text-slate-800">
            Restaurant Subscriptions
          </h2>
          <div className="flex flex-wrap gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search restaurant..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-4 py-1.5 border border-slate-200 rounded-lg text-sm w-48 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
            <select
              value={planFilter}
              onChange={(e) => setPlanFilter(e.target.value)}
              className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm bg-white"
            >
              <option value="all">All Plans</option>
              {plans.map((p) => (
                <option key={p.code} value={p.code}>
                  {p.name}
                </option>
              ))}
              <option value="none">No Plan</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm bg-white"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="trial">Trial</option>
              <option value="expired">Expired</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-5 py-3 text-left font-semibold text-slate-600">
                  Restaurant
                </th>
                <th className="px-5 py-3 text-left font-semibold text-slate-600">
                  Plan
                </th>
                <th className="px-5 py-3 text-left font-semibold text-slate-600">
                  Status
                </th>
                <th className="px-5 py-3 text-left font-semibold text-slate-600">
                  Start Date
                </th>
                <th className="px-5 py-3 text-left font-semibold text-slate-600">
                  End Date
                </th>
                <th className="px-5 py-3 text-left font-semibold text-slate-600">
                  Amount
                </th>
                <th className="px-5 py-3 text-right font-semibold text-slate-600">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {restaurants.map((restaurant) => (
                <tr
                  key={restaurant._id}
                  className="hover:bg-slate-50 transition"
                >
                  <td className="px-5 py-3">
                    <div className="font-medium text-slate-800">
                      {restaurant.name}
                    </div>
                    <div className="text-xs text-slate-400">
                      {restaurant.contactEmail}
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    {restaurant.subscription?.plan ? (
                      <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700">
                        {restaurant.subscription.plan}
                      </span>
                    ) : (
                      <span className="text-slate-400 text-xs">No plan</span>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    {restaurant.subscription?.status ? (
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(
                          restaurant.subscription.status,
                        )}`}
                      >
                        {restaurant.subscription.status}
                      </span>
                    ) : (
                      <span className="text-slate-400 text-xs">—</span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-slate-600">
                    {formatDate(restaurant.subscription?.startDate)}
                  </td>
                  <td className="px-5 py-3 text-slate-600">
                    {formatDate(restaurant.subscription?.endDate)}
                  </td>
                  <td className="px-5 py-3 text-slate-600">
                    {restaurant.subscription?.amount
                      ? `₹${restaurant.subscription.amount}`
                      : "—"}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <button
                      onClick={() => openAssignModal(restaurant)}
                      className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500"
                      title="Assign Plan"
                    >
                      <Edit2 size={15} />
                    </button>
                  </td>
                </tr>
              ))}
              {restaurants.length === 0 && !loading && (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">
                    No restaurants found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-5 py-4 border-t border-slate-200 flex items-center justify-between">
            <div className="text-sm text-slate-500">
              Page {currentPage} of {totalPages}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border border-slate-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg border border-slate-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}

        {loading && (
          <div className="text-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-indigo-600 mx-auto" />
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
