import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
    getPlans,
    getMySubscription,
    createOrder,
    verifyPayment,
    cancelSubscription,
} from "@/services/subscriptionService";

// ==================== Mock data fetchers ====================
// TODO: replace with real service calls when the backend endpoints exist
const fetchUsageStats = async () => ({
    ordersThisMonth: 342,
    totalStaff: 12,
    tableTurnover: 86,
    activeTables: 4,
});

const fetchInvoices = async () => [
    { id: "INV-001", date: "2025-04-01", amount: "₹1,499", status: "paid", downloadUrl: "#" },
    { id: "INV-002", date: "2025-03-01", amount: "₹1,499", status: "paid", downloadUrl: "#" },
    { id: "INV-003", date: "2025-02-01", amount: "₹1,499", status: "paid", downloadUrl: "#" },
];

const fetchPaymentMethods = async () => [
    { id: 1, type: "UPI", details: "owner@okhdfcbank", isDefault: true },
    { id: 2, type: "Card", details: "VISA **** 4242", isDefault: false },
];

// ==================== Query keys ====================
export const subscriptionKeys = {
    plans: ["plans"] as const,
    mine: ["subscription"] as const,
    usage: ["subscription", "usage"] as const,
    invoices: ["subscription", "invoices"] as const,
    paymentMethods: ["subscription", "paymentMethods"] as const,
};

// ==================== Queries ====================
export function usePlans() {
    return useQuery({
        queryKey: subscriptionKeys.plans,
        queryFn: async () => {
            const res = await getPlans();
            return res?.plans || [];
        },
        staleTime: 5 * 60 * 1000, // plan catalog rarely changes
        gcTime: 15 * 60 * 1000,
        retry: 1,
        refetchOnWindowFocus: false,
    });
}

export function useMySubscription() {
    return useQuery({
        queryKey: subscriptionKeys.mine,
        queryFn: async () => {
            const res = await getMySubscription();
            return res?.subscription || null;
        },
        staleTime: 30 * 1000,
        gcTime: 5 * 60 * 1000,
        retry: 1,
        refetchOnWindowFocus: false,
    });
}

export function useUsageStats() {
    return useQuery({
        queryKey: subscriptionKeys.usage,
        queryFn: fetchUsageStats,
        staleTime: 60 * 1000,
        gcTime: 5 * 60 * 1000,
        retry: 1,
        refetchOnWindowFocus: false,
    });
}

export function useInvoices() {
    return useQuery({
        queryKey: subscriptionKeys.invoices,
        queryFn: fetchInvoices,
        staleTime: 60 * 1000,
        gcTime: 5 * 60 * 1000,
        retry: 1,
        refetchOnWindowFocus: false,
    });
}

export function usePaymentMethods() {
    return useQuery({
        queryKey: subscriptionKeys.paymentMethods,
        queryFn: fetchPaymentMethods,
        staleTime: 60 * 1000,
        gcTime: 5 * 60 * 1000,
        retry: 1,
        refetchOnWindowFocus: false,
    });
}

// ==================== Mutations ====================
export function useCreateOrder() {
    return useMutation({
        mutationFn: ({ planCode, billingCycle }: { planCode: string; billingCycle: string }) =>
            createOrder({ planCode, billingCycle }),
    });
}

export function useVerifyPayment() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (payload: {
            razorpay_order_id: string;
            razorpay_payment_id: string;
            razorpay_signature: string;
            planCode: string;
        }) => verifyPayment(payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: subscriptionKeys.mine });
        },
    });
}

export function useCancelSubscription() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: () => cancelSubscription(),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: subscriptionKeys.mine });
        },
    });
}