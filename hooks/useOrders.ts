import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
    getOrders,
    updateOrderStatus as updateStatusAPI,
    verifyPayment as verifyPaymentAPI,
} from "@/services/orderService";
import { useAuthStore } from "@/store/useAuthStore";

// ==================== Types ====================
export interface OrderItem {
    _id: string;
    name: string;
    price: number;
    quantity: number;
    specialInstructions?: string;
}

export type OrderStatus =
    | "pending"
    | "preparing"
    | "ready"
    | "served"
    | "paid"
    | "out_for_delivery"
    | "delivered"
    | "completed"
    | "cancelled";

export interface Order {
    id: string;
    customer: { name: string; phone: string; email?: string };
    orderNumber: string;
    table: string;
    orderType: "dine_in" | "takeaway" | "delivery";
    items: OrderItem[];
    total: number;
    subtotal: number;
    cgstAmount: number;
    sgstAmount: number;
    serviceChargeAmount: number;
    deliveryCharge: number;
    deliveryDetails?: {
        address: string;
        landmark?: string;
        city?: string;
        pincode?: string;
        charge: number;
    };
    invoiceNumber: string;
    status: OrderStatus;
    createdAt: string;
    specialInstructions?: string;
    paymentMethod?: "cash" | "upi";
    paymentStatus?: "unpaid" | "pending" | "paid";
}

// ==================== Mapping (server shape -> UI shape) ====================
export const mapOrder = (o: any): Order => ({
    id: o._id,
    table: o.tableNumber,
    orderType: o.orderType,
    items: [...o.items],
    total: o.finalAmount ?? o.totalAmount ?? 0,
    subtotal: o.subtotal ?? o.totalAmount ?? 0,
    cgstAmount: o.cgstAmount ?? 0,
    sgstAmount: o.sgstAmount ?? 0,
    serviceChargeAmount: o.serviceChargeAmount ?? 0,
    status: o.status,
    invoiceNumber: o.invoiceNumber,
    orderNumber: o.orderNumber,
    paymentStatus: o.paymentStatus,
    paymentMethod: o.paymentMethod,
    createdAt: o.createdAt,
    specialInstructions: o.specialInstructions,
    customer: {
        name: o.customerId?.name || "Guest",
        phone: o.customerId?.phone || "",
        email: o.customerId?.email || "",
    },
    deliveryCharge: o.deliveryCharge ?? "Free Delivery",
    deliveryDetails: o.delivery
        ? {
            address: o.delivery.address?.house,
            landmark: o.delivery.address?.landmark,
            city: o.delivery.address?.city,
            pincode: o.delivery.address?.pincode,
            charge: o.delivery.deliveryCharge ?? 0,
        }
        : undefined,
});

// ==================== Query keys ====================
export const orderKeys = {
    list: (restaurantId: string, date: string) =>
        ["orders", restaurantId, date || "all"] as const,
};

// ==================== Query ====================
export function useOrders(restaurantId?: string, selectedDate?: string) {
    return useQuery({
        queryKey: orderKeys.list(restaurantId ?? "", selectedDate ?? ""),
        queryFn: async () => {
            const dateParam = selectedDate || undefined;
            const data = await getOrders(restaurantId!, dateParam);
            return data.map((o: any) => mapOrder(o));
        },
        enabled: !!restaurantId,
        staleTime: 10 * 1000, // socket keeps this fresh; short staleTime just covers gaps
        gcTime: 5 * 60 * 1000,
        retry: 1,
        refetchOnWindowFocus: false,
    });
}

// ==================== Mutations ====================
export function useUpdateOrderStatus(restaurantId?: string, selectedDate?: string) {
    const queryClient = useQueryClient();
    const key = orderKeys.list(restaurantId ?? "", selectedDate ?? "");

    return useMutation({
        mutationFn: ({ orderId, status }: { orderId: string; status: OrderStatus }) =>
            updateStatusAPI(orderId, status),
        onMutate: async ({ orderId, status }) => {
            if (!restaurantId) return;
            await queryClient.cancelQueries({ queryKey: key });
            const previous = queryClient.getQueryData<Order[]>(key);
            queryClient.setQueryData<Order[]>(key, (old) =>
                old?.map((o) => (o.id === orderId ? { ...o, status } : o)) ?? old,
            );
            return { previous };
        },
        onError: (_err, _vars, context) => {
            if (restaurantId && context?.previous) {
                queryClient.setQueryData(key, context.previous);
            }
        },
    });
}

export function useVerifyPayment() {
    return useMutation({
        mutationFn: (orderId: string) => verifyPaymentAPI(orderId),
    });
}


export function getISTDateString(date = new Date()) {
    return new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Kolkata",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    }).format(date);
}



