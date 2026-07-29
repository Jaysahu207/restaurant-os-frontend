import { useQuery } from "@tanstack/react-query";
import { getCustomers, getCustomerHistory } from "@/services/customerDetail";

export interface Customer {
    _id: string;
    name: string;
    phone: string;
    email: string;
    lastVisit?: string;
    totalOrders: number;
    totalSpent: number;
    isRegular: boolean;
    orders: string[];
    createdAt: string;
}

export interface OrderItem {
    _id: string;
    itemId: string;
    menuItemId: string;
    name: string;
    quantity: number;
    price: number;
    total: number;
    addons: any[];
    kotBatch: number;
    kotPrinted: boolean;
    addedAt: string;
}

export interface Order {
    _id: string;

    orderNumber: string;

    tableNumber: number | null;

    status:
    | "pending"
    | "preparing"
    | "ready"
    | "served"
    | "completed"
    | "cancelled";

    items: OrderItem[];

    totalAmount: number;
    cgstAmount: number;
    sgstAmount: number;
    finalAmount: number;

    createdAt: string;

    orderType?: "dine_in" | "takeaway" | "delivery";
    paymentMethod?: "cash" | "upi" | "card" | "online";
    paymentStatus?: string;
    specialInstructions?: string;
}
export const customerKeys = {
    list: (restaurantId: string) => ["customers", restaurantId] as const,
    history: (customerId: string) => ["customerHistory", customerId] as const,
};

export function useCustomers(restaurantId?: string) {
    return useQuery({
        queryKey: customerKeys.list(restaurantId ?? ""),
        queryFn: () => getCustomers(restaurantId!, "", 1, 1000) as Promise<Customer[]>,
        enabled: !!restaurantId,
        staleTime: 60 * 1000,
        gcTime: 10 * 60 * 1000,
        retry: 1,
        refetchOnWindowFocus: false,
    });
}

export function useCustomerHistory(customerId?: string | null) {
    return useQuery({
        queryKey: customerKeys.history(customerId ?? ""),
        queryFn: () => getCustomerHistory(customerId!),
        enabled: !!customerId,
        staleTime: 30 * 1000,
        gcTime: 5 * 60 * 1000,
        retry: 1,
        refetchOnWindowFocus: false,
    });
}