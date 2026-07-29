import { useQuery } from "@tanstack/react-query";
import { getDashboardData } from "@/services/dashboardService";

export interface DashboardData {
    revenue: {
        today: number;
        yesterday: number;
        trend: number;
    };

    orders: {
        today: number;
        trend: number;
    };

    customers: {
        today: number;
        returning: number;
    };

    averageOrderValue: number;

    paymentAnalytics: {
        cash: {
            count: number;
            amount: number;
        };
        upi: {
            count: number;
            amount: number;
        };
        pending: {
            count: number;
            amount: number;
        };
    };

    orderTypes: {
        dine_in: number;
        takeaway: number;
        delivery: number;
    };

    orderStatus: {
        pending: number;
        preparing: number;
        ready: number;
        served: number;
        completed: number;
        cancelled: number;
    };

    menuItems: number;

    topItems: TopItem[];

    recentOrders: RecentOrder[];

    hourlySales: HourlySales[];
}

// Matches the actual payload: customer name, order type, flat amount,
// and payment method (nullable — an order can still be pending payment).
export interface RecentOrder {
    id: string;
    orderNumber: string;
    customer: string;
    table: number;
    type: "dine_in" | "takeaway" | "delivery";
    items: number;
    amount: number;
    payment: "cash" | "upi" | null;
    status: "pending" | "preparing" | "ready" | "served" | "completed" | "cancelled";
    time: string;
}

export interface TopItem {
    name: string;
    quantity: number;
    revenue: number;
}

export interface HourlySales {
    hour: number;
    amount: number;
    orders: number;
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