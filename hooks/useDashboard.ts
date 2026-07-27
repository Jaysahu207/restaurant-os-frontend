import { useQuery } from "@tanstack/react-query";
import { getDashboardData } from "@/services/dashboardService";

export interface DashboardData {
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

export interface RecentOrder {
    id: string;
    orderNumber: string;
    finalAmount: number;
    afterTax: number;
    table: number;
    items: number;
    total: number;
    status: "pending" | "preparing" | "ready" | "served" | "paid" | "completed";
    time: string;
}

export interface TopItem {
    name: string;
    quantity: number;
    revenue: number;
}

export const dashboardKeys = {
    detail: (restaurantId: string) => ["dashboard", restaurantId] as const,
};

export function useDashboard(restaurantId?: string) {
    return useQuery({
        queryKey: dashboardKeys.detail(restaurantId ?? ""),
        queryFn: async () => {
            const res = await getDashboardData(restaurantId!);
            return res.data as DashboardData;
        },
        enabled: !!restaurantId,
        staleTime: 15 * 1000, // near-realtime data, socket invalidates on top of this
        gcTime: 5 * 60 * 1000,
        retry: 1,
        refetchOnWindowFocus: false,
    });
}