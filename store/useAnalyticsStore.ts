"use client";

import { create } from "zustand";
import toast from "react-hot-toast";

import { getAnalyticsData } from "@/services/superAdminService";

// ======================================================
// TYPES
// ======================================================

interface RevenueChart {
    month: string;
    revenue: number;
    orders: number;
}

interface PlanDistribution {
    name: string;
    value: number;
    color: string;
}

interface RecentActivity {
    id: string;
    user: string;
    action: string;
    time: string;
    icon?: string;
}

interface AnalyticsStats {
    totalRevenue: number;

    totalOrders: number;

    activeUsers: number;

    totalRestaurants: number;

    // =====================================
    // SUBSCRIPTION METRICS
    // =====================================

    activeSubscriptions: number;

    monthlyRecurringRevenue: number;

    subscriptionRevenue: number;

    // =====================================
    // GROWTH
    // =====================================

    revenueGrowth: number;

    orderGrowth: number;

    userGrowth: number;

    restaurantGrowth: number;

    // =====================================
    // TRENDS
    // =====================================

    revenueTrend: number;

    orderTrend: number;

    userTrend: number;

    restaurantTrend: number;
}

interface AnalyticsData {
    stats: AnalyticsStats;

    revenueChart: RevenueChart[];

    planDistribution: PlanDistribution[];

    recentActivities: RecentActivity[];
}

interface AnalyticsStore {
    analytics: AnalyticsData | null;

    loading: boolean;

    error: string | null;

    fetchAnalytics: () => Promise<void>;

    refreshAnalytics: () => Promise<void>;
}

// ======================================================
// STORE
// ======================================================

export const useAnalyticsStore = create<AnalyticsStore>((set, get) => ({
    analytics: null,

    loading: false,

    error: null,

    // ======================================================
    // FETCH ANALYTICS
    // ======================================================

    fetchAnalytics: async () => {
        try {
            set({
                loading: true,
                error: null,
            });

            const response = await getAnalyticsData();

            set({
                analytics: response,
            });
        } catch (error: any) {
            console.error("Analytics Error:", error);

            set({
                error:
                    error?.response?.data?.message ||
                    "Failed to fetch analytics",
            });

            toast.error("Failed to load analytics");
        } finally {
            set({
                loading: false,
            });
        }
    },

    // ======================================================
    // REFRESH
    // ======================================================

    refreshAnalytics: async () => {
        await get().fetchAnalytics();

        toast.success("Analytics refreshed");
    },
}));