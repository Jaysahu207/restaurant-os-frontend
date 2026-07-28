import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
    getMenuItems,
    createMenuItem,
    deleteMenuItem,
    updateMenuItem,
} from "@/services/menuService";

export interface MenuVariant {
    name: string;
    price: number;
}

export interface MenuAddon {
    name: string;
    price: number;
}

export interface MenuItem {
    _id: string;
    name: string;
    description?: string;
    price: number;
    category: string;
    image: string;
    type: "veg" | "non-veg" | "egg";
    isAvailable: boolean;
    isPopular?: boolean;
    variants: MenuVariant[];
    addons: MenuAddon[];
    prepTime?: number;
    createdAt: string;
    updatedAt: string;
}

export const menuKeys = {
    list: (restaurantId: string) => ["menu", restaurantId] as const,
};

export function useMenu(restaurantId?: string) {
    return useQuery({
        queryKey: menuKeys.list(restaurantId ?? ""),
        queryFn: () => getMenuItems(restaurantId!) as Promise<MenuItem[]>,
        enabled: !!restaurantId,
        staleTime: 60 * 1000,
        gcTime: 10 * 60 * 1000,
        retry: 1,
        refetchOnWindowFocus: false,
    });
}

export function useCreateMenuItem(restaurantId?: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (formData: FormData) => createMenuItem(formData),
        onSuccess: () => {
            if (restaurantId) {
                queryClient.invalidateQueries({ queryKey: menuKeys.list(restaurantId) });
            }
        },
    });
}

export function useUpdateMenuItem(restaurantId?: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ itemId, formData }: { itemId: string; formData: FormData }) =>
            updateMenuItem(itemId, formData),
        onSuccess: () => {
            if (restaurantId) {
                queryClient.invalidateQueries({ queryKey: menuKeys.list(restaurantId) });
            }
        },
    });
}

export function useDeleteMenuItem(restaurantId?: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (itemId: string) => deleteMenuItem(itemId),
        onMutate: async (itemId) => {
            if (!restaurantId) return;
            const key = menuKeys.list(restaurantId);
            await queryClient.cancelQueries({ queryKey: key });
            const previous = queryClient.getQueryData<MenuItem[]>(key);
            queryClient.setQueryData<MenuItem[]>(key, (old) =>
                old?.filter((item) => item._id !== itemId) ?? old,
            );
            return { previous };
        },
        onError: (_err, _itemId, context) => {
            if (restaurantId && context?.previous) {
                queryClient.setQueryData(menuKeys.list(restaurantId), context.previous);
            }
        },
        onSettled: () => {
            if (restaurantId) {
                queryClient.invalidateQueries({ queryKey: menuKeys.list(restaurantId) });
            }
        },
    });
}