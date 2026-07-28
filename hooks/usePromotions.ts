import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
    createPromotion,
    deletePromotion,
    getPromotions,
    updatePromotion,
    sendMarketingEmail,
} from "@/services/promotionService";

export interface Promotion {
    _id: string;
    code: string;
    description: string;
    type: "percentage" | "fixed";
    value: number;
    minOrder: number;
    startDate: string;
    endDate: string;
    applicableTo: "all" | "category" | "specific";
    applicableValue: string | null;
    usageLimit: number;
    usedCount: number;
    status: "active" | "inactive" | "expired" | "scheduled";
}

export const promotionKeys = {
    list: (restaurantId: string) => ["promotions", restaurantId] as const,
};

export function usePromotions(restaurantId?: string) {
    return useQuery({
        queryKey: promotionKeys.list(restaurantId ?? ""),
        queryFn: () => getPromotions(restaurantId!) as Promise<Promotion[]>,
        enabled: !!restaurantId,
        staleTime: 60 * 1000,
        gcTime: 10 * 60 * 1000,
        retry: 1,
        refetchOnWindowFocus: false,
    });
}

export function useCreatePromotion(restaurantId?: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (payload: any) => createPromotion(payload),
        onSuccess: () => {
            if (restaurantId) {
                queryClient.invalidateQueries({ queryKey: promotionKeys.list(restaurantId) });
            }
        },
    });
}

export function useUpdatePromotion(restaurantId?: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, payload }: { id: string; payload: any }) => updatePromotion(id, payload),
        onSuccess: () => {
            if (restaurantId) {
                queryClient.invalidateQueries({ queryKey: promotionKeys.list(restaurantId) });
            }
        },
    });
}

export function useDeletePromotion(restaurantId?: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => deletePromotion(id),
        onMutate: async (id) => {
            if (!restaurantId) return;
            const key = promotionKeys.list(restaurantId);
            await queryClient.cancelQueries({ queryKey: key });
            const previous = queryClient.getQueryData<Promotion[]>(key);
            queryClient.setQueryData<Promotion[]>(key, (old) =>
                old?.filter((p) => p._id !== id) ?? old,
            );
            return { previous };
        },
        onError: (_err, _id, context) => {
            if (restaurantId && context?.previous) {
                queryClient.setQueryData(promotionKeys.list(restaurantId), context.previous);
            }
        },
        onSettled: () => {
            if (restaurantId) {
                queryClient.invalidateQueries({ queryKey: promotionKeys.list(restaurantId) });
            }
        },
    });
}

export function useSendMarketingEmail() {
    return useMutation({
        mutationFn: (payload: {
            promotionId: string;
            customerIds: string[];
            subject: string;
            message: string;
            restaurantId?: string;
        }) => sendMarketingEmail(payload),
    });
}