import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
    createBanner,
    deleteBanner,
    getRestaurantBanners,
    toggleBannerStatus,
    updateBanner,
} from "@/services/bannerService";

export interface Banner {
    _id: string;
    title: string;
    subtitle?: string;
    description?: string;
    image: string;
    type: "offer" | "combo" | "festival" | "announcement" | "special" | "new_item";
    isActive: boolean;
    views: number;
    clicks: number;
    createdAt: string;
    updatedAt: string;
    actionType: "none" | "category" | "product" | "offer";
    actionTarget?: string;
    buttonText?: string;
    priority?: number;
    startDate?: string;
    endDate?: string;
}

export const bannerKeys = {
    list: (restaurantId: string) => ["banners", restaurantId] as const,
};

export function useBanners(restaurantId?: string) {
    return useQuery({
        queryKey: bannerKeys.list(restaurantId ?? ""),
        queryFn: async () => {
            const res = await getRestaurantBanners(restaurantId!);
            return (res.banners ?? []) as Banner[];
        },
        enabled: !!restaurantId,
        staleTime: 60 * 1000,
        gcTime: 5 * 60 * 1000,
        retry: 1,
        refetchOnWindowFocus: false,
    });
}

export function useCreateBanner(restaurantId?: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (payload: any) => createBanner(payload),
        onSuccess: () => {
            if (restaurantId) {
                queryClient.invalidateQueries({ queryKey: bannerKeys.list(restaurantId) });
            }
        },
    });
}

export function useUpdateBanner(restaurantId?: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ bannerId, payload }: { bannerId: string; payload: any }) =>
            updateBanner(bannerId, payload),
        onSuccess: () => {
            if (restaurantId) {
                queryClient.invalidateQueries({ queryKey: bannerKeys.list(restaurantId) });
            }
        },
    });
}

export function useDeleteBanner(restaurantId?: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (bannerId: string) => deleteBanner(bannerId),
        onMutate: async (bannerId) => {
            if (!restaurantId) return;
            const key = bannerKeys.list(restaurantId);
            await queryClient.cancelQueries({ queryKey: key });
            const previous = queryClient.getQueryData<Banner[]>(key);
            queryClient.setQueryData<Banner[]>(key, (old) =>
                old?.filter((b) => b._id !== bannerId) ?? old,
            );
            return { previous };
        },
        onError: (_err, _bannerId, context) => {
            if (restaurantId && context?.previous) {
                queryClient.setQueryData(bannerKeys.list(restaurantId), context.previous);
            }
        },
        onSettled: () => {
            if (restaurantId) {
                queryClient.invalidateQueries({ queryKey: bannerKeys.list(restaurantId) });
            }
        },
    });
}

export function useToggleBannerStatus(restaurantId?: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (bannerId: string) => toggleBannerStatus(bannerId),
        onMutate: async (bannerId) => {
            if (!restaurantId) return;
            const key = bannerKeys.list(restaurantId);
            await queryClient.cancelQueries({ queryKey: key });
            const previous = queryClient.getQueryData<Banner[]>(key);
            queryClient.setQueryData<Banner[]>(key, (old) =>
                old?.map((b) => (b._id === bannerId ? { ...b, isActive: !b.isActive } : b)) ?? old,
            );
            return { previous };
        },
        onError: (_err, _bannerId, context) => {
            if (restaurantId && context?.previous) {
                queryClient.setQueryData(bannerKeys.list(restaurantId), context.previous);
            }
        },
        onSettled: () => {
            if (restaurantId) {
                queryClient.invalidateQueries({ queryKey: bannerKeys.list(restaurantId) });
            }
        },
    });
}