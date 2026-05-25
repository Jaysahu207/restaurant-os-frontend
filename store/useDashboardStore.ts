"use client";

import { create } from "zustand";
import { getDashboardStats } from "@/services/superAdminService";

// ==============================
// TYPES
// ==============================

interface Restaurant {
    _id: string;
    name: string;
    slug: string;

    owner?: string;

    subscriptionStatus?: string;

    isActive?: boolean;

    isDeleted?: boolean;

    createdAt?: string;

    updatedAt?: string;
}

interface SubscriptionStat {
    _id: string;

    totalRestaurants: number;

    totalRevenue: number;

    activeSubscriptions: number;

    trialSubscriptions: number;

    expiredSubscriptions: number;
}

interface Trend {
    _id: number;

    count: number;

    revenue: number;
}

interface TopRestaurant {
    _id: string;

    totalOrders: number;

    revenue: number;

    restaurant: Restaurant;
}

interface RecentOrder {
    _id: string;

    orderNumber: string;

    finalAmount: number;

    paymentStatus: string;

    paymentMethod: string;

    status: string;

    createdAt: string;

    restaurantId: {
        _id: string;

        name: string;
    };
}

interface DashboardStats {
    totalRestaurants: number;

    activeRestaurants: number;

    totalUsers: number;

    totalOrders: number;

    totalRevenue: number;

    newRestaurants: number;

    newUsers: number;

    openTickets: number;
}

interface DashboardData {
    stats: DashboardStats;

    trends: {
        ordersTrend: Trend[];
    };

    subscriptionStats: SubscriptionStat[];

    topRestaurants: TopRestaurant[];

    recentOrders: RecentOrder[];

    latestRestaurants: Restaurant[];

    expiringSubscriptions: any[];
}

interface DashboardStore {
    dashboardData: DashboardData | null;

    loading: boolean;

    error: string | null;

    lastFetched: number | null;

    fetchDashboard: (force?: boolean) => Promise<void>;

    refreshDashboard: () => Promise<void>;

    clearDashboard: () => void;
}

// ==============================
// STORE
// ==============================

export const useDashboardStore =
    create<DashboardStore>((set, get) => ({
        dashboardData: null,

        loading: false,

        error: null,

        lastFetched: null,

        // ==============================
        // FETCH DASHBOARD
        // ==============================

        fetchDashboard: async (force = false) => {
            try {
                const {
                    dashboardData,
                    loading,
                    lastFetched,
                } = get();

                // Prevent duplicate requests
                if (loading) return;

                // Cache validity (5 minutes)
                const isCacheValid =
                    lastFetched &&
                    Date.now() - lastFetched < 5 * 60 * 1000;

                // Use cached data if valid
                if (
                    !force &&
                    dashboardData &&
                    isCacheValid
                ) {
                    return;
                }

                set({
                    loading: true,
                    error: null,
                });

                const response =
                    await getDashboardStats();

                set({
                    dashboardData: response,
                    loading: false,
                    error: null,
                    lastFetched: Date.now(),
                });
            } catch (err: any) {
                set({
                    error:
                        err?.response?.data?.message ||
                        "Failed to load dashboard",

                    loading: false,
                });
            }
        },

        // ==============================
        // REFRESH DASHBOARD
        // ==============================

        refreshDashboard: async () => {
            await get().fetchDashboard(true);
        },

        // ==============================
        // CLEAR DASHBOARD
        // ==============================

        clearDashboard: () => {
            set({
                dashboardData: null,
                loading: false,
                error: null,
                lastFetched: null,
            });
        },
    }));