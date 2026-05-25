"use client";

import { create } from "zustand";
import toast from "react-hot-toast";

import API from "@/config/axios";

import { getAllPlans, getAllRestaurants } from "@/services/superAdminService";

// ======================================================
// TYPES
// ======================================================

export interface Plan {
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

export interface RestaurantSubscription {
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
interface PlanAnalytics {
    plan: string;

    totalRestaurants: number;

    activeSubscriptions: number;

    trialSubscriptions: number;

    expiredSubscriptions: number;

    revenue: number;
}
export interface Restaurant {
    _id: string;

    name: string;

    slug: string;

    contactEmail?: string;

    contactPhone?: string;

    subscriptionStatus: string;

    isActive: boolean;

    isDeleted: boolean;

    createdAt: string;

    updatedAt?: string;

    owner?: string;

    subscriptionId?: RestaurantSubscription;
}

interface SubscriptionStats {
    totalRestaurants: number;

    activeSubscriptions: number;

    trialSubscriptions: number;

    expiredSubscriptions: number;

    cancelledSubscriptions: number;

    monthlyRecurringRevenue: number;

    totalRevenue: number;
    planAnalytics: PlanAnalytics[];
}
interface SubscriptionStore {
    // ======================================================
    // DATA
    // ======================================================

    plans: Plan[];

    restaurants: Restaurant[];

    loading: boolean;

    error: string | null;

    // ======================================================
    // PAGINATION
    // ======================================================

    currentPage: number;

    totalPages: number;

    pageSize: number;

    totalRestaurantsCount: number;

    // ======================================================
    // FILTERS
    // ======================================================

    search: string;

    planFilter: string;

    statusFilter: string;

    // ======================================================
    // STATS
    // ======================================================

    stats: SubscriptionStats;

    // ======================================================
    // ACTIONS
    // ======================================================

    setSearch: (search: string) => void;

    setPlanFilter: (plan: string) => void;

    setStatusFilter: (status: string) => void;

    setCurrentPage: (page: number) => void;

    fetchPlans: () => Promise<void>;

    fetchRestaurants: () => Promise<void>;

    assignPlan: (restaurantId: string, planCode: string) => Promise<void>;

    refreshSubscriptions: () => Promise<void>;

    calculateStats: () => void;

    resetFilters: () => void;
}

// ======================================================
// STORE
// ======================================================

export const useSubscriptionStore = create<SubscriptionStore>((set, get) => ({
    // ======================================================
    // INITIAL STATE
    // ======================================================

    plans: [],

    restaurants: [],

    loading: false,

    error: null,

    currentPage: 1,

    totalPages: 1,

    pageSize: 50,

    totalRestaurantsCount: 0,

    search: "",

    planFilter: "all",

    statusFilter: "all",

    stats: {
        totalRestaurants: 0,

        activeSubscriptions: 0,

        trialSubscriptions: 0,

        expiredSubscriptions: 0,

        cancelledSubscriptions: 0,

        monthlyRecurringRevenue: 0,

        planAnalytics: [],
        totalRevenue: 0,
    },

    // ======================================================
    // FILTER ACTIONS
    // ======================================================

    setSearch: (search) =>
        set({
            search,
            currentPage: 1,
        }),

    setPlanFilter: (planFilter) =>
        set({
            planFilter,
            currentPage: 1,
        }),

    setStatusFilter: (statusFilter) =>
        set({
            statusFilter,
            currentPage: 1,
        }),

    setCurrentPage: (currentPage) =>
        set({
            currentPage,
        }),

    // ======================================================
    // FETCH PLANS
    // ======================================================

    fetchPlans: async () => {
        try {
            set({
                loading: true,
                error: null,
            });

            const response = await getAllPlans();

            set({
                plans: response?.plans || [],
            });
            // console.log("Subscription plans fetched:", response?.plans);
        } catch (error: any) {
            console.error("Fetch Plans Error:", error);

            set({
                error: error?.response?.data?.message || "Failed to fetch plans",
            });

            toast.error("Failed to load plans");
        } finally {
            set({
                loading: false,
            });
        }
    },

    // ======================================================
    // FETCH RESTAURANTS
    // ======================================================

    fetchRestaurants: async () => {
        try {
            set({
                loading: true,
                error: null,
            });

            const { currentPage, pageSize, search, planFilter, statusFilter } = get();

            // ==========================================
            // BUILD QUERY PARAMS
            // ==========================================

            const params = new URLSearchParams();

            params.append("page", String(currentPage));

            params.append("limit", String(pageSize));

            if (search) {
                params.append("search", search);
            }

            if (planFilter !== "all") {
                params.append("plan", planFilter);
            }

            if (statusFilter !== "all") {
                params.append("status", statusFilter);
            }

            // ==========================================
            // API CALL
            // ==========================================

            const response = await getAllRestaurants(params.toString());

            const restaurants = response?.restaurants || [];

            set({
                restaurants,

                totalPages: response?.totalPages || 1,

                totalRestaurantsCount: response?.total || 0,
            });
            // console.log("Total restaurants fetched:", restaurants);
            // ==========================================
            // CALCULATE STATS
            // ==========================================

            get().calculateStats();
        } catch (error: any) {
            console.error("Fetch Restaurants Error:", error);

            set({
                error: error?.response?.data?.message || "Failed to fetch restaurants",
            });

            toast.error("Failed to load subscriptions");
        } finally {
            set({
                loading: false,
            });
        }
    },

    // ======================================================
    // ASSIGN PLAN
    // ======================================================

    assignPlan: async (restaurantId, planCode) => {
        try {
            set({
                loading: true,
            });

            await API.patch(
                `/api/super-admin/restaurants/${restaurantId}/subscription`,
                {
                    planCode,
                },
            );

            toast.success("Subscription updated successfully");

            // refresh restaurants
            await get().fetchRestaurants();
        } catch (error: any) {
            console.error("Assign Plan Error:", error);

            toast.error(
                error?.response?.data?.message || "Failed to assign subscription",
            );
        } finally {
            set({
                loading: false,
            });
        }
    },

    // ======================================================
    // REFRESH
    // ======================================================

    refreshSubscriptions: async () => {
        try {
            set({
                loading: true,
                error: null,
            });

            await get().fetchPlans();

            await get().fetchRestaurants();

            // toast.success("Subscriptions refreshed");
        } catch (error) {
            console.error("Refresh Error:", error);

            toast.error("Failed to refresh subscriptions");
        } finally {
            set({
                loading: false,
            });
        }
    },

    // ======================================================
    // CALCULATE STATS
    // ======================================================

    calculateStats: () => {
        const restaurants = get().restaurants;

        // ==========================================
        // GLOBAL COUNTS
        // ==========================================

        const activeSubscriptions = restaurants.filter(
            (restaurant) =>
                restaurant.subscriptionId?.status === "active"
        ).length;

        const trialSubscriptions = restaurants.filter(
            (restaurant) =>
                restaurant.subscriptionId?.status === "trial"
        ).length;

        const expiredSubscriptions = restaurants.filter(
            (restaurant) =>
                restaurant.subscriptionId?.status === "expired"
        ).length;

        const cancelledSubscriptions = restaurants.filter(
            (restaurant) =>
                restaurant.subscriptionId?.status === "cancelled"
        ).length;

        // ==========================================
        // REVENUE
        // ==========================================

        const totalRevenue = restaurants.reduce(
            (total, restaurant) =>
                total +
                (restaurant.subscriptionId?.finalPrice || 0),
            0
        );

        // For now same as total revenue
        // Later you can calculate only current month revenue
        const monthlyRecurringRevenue = totalRevenue;

        // ==========================================
        // PLAN ANALYTICS
        // ==========================================

        const analyticsMap: Record<string, PlanAnalytics> = {};

        restaurants.forEach((restaurant) => {
            const subscription = restaurant.subscriptionId;

            if (!subscription?.plan) return;

            const plan = subscription.plan;

            if (!analyticsMap[plan]) {
                analyticsMap[plan] = {
                    plan,
                    totalRestaurants: 0,
                    activeSubscriptions: 0,
                    trialSubscriptions: 0,
                    expiredSubscriptions: 0,
                    revenue: 0,
                };
            }

            analyticsMap[plan].totalRestaurants += 1;

            if (subscription.status === "active") {
                analyticsMap[plan].activeSubscriptions += 1;
            }

            if (subscription.status === "trial") {
                analyticsMap[plan].trialSubscriptions += 1;
            }

            if (subscription.status === "expired") {
                analyticsMap[plan].expiredSubscriptions += 1;
            }

            analyticsMap[plan].revenue +=
                subscription.finalPrice || 0;
        });

        // ==========================================
        // SET STATS
        // ==========================================

        set({
            stats: {
                totalRestaurants: restaurants.length,

                activeSubscriptions,

                trialSubscriptions,

                expiredSubscriptions,

                cancelledSubscriptions,

                monthlyRecurringRevenue,

                totalRevenue,

                planAnalytics: Object.values(analyticsMap),
            },
        });
    },

    // ======================================================
    // RESET FILTERS
    // ======================================================

    resetFilters: () =>
        set({
            search: "",

            planFilter: "all",

            statusFilter: "all",

            currentPage: 1,
        }),
}));
