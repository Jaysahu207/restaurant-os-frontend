import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
    getInventory,
    createInventory,
    updateInventory,
    deleteInventory,
} from "@/services/inventoryService";

export interface InventoryItem {
    _id: string;
    name: string;
    category: string;
    quantity: number;
    unit: string;
    reorderLevel: number;
    costPerUnit: number;
    supplier?: string;
}

export const normalizeItem = (item: any): InventoryItem | null => {
    if (!item || typeof item !== "object") return null;
    return {
        _id: item._id || item.id,
        name: item.name || "",
        category: item.category || "Other",
        quantity: Number(item.quantity) || 0,
        unit: item.unit || "",
        reorderLevel: Number(item.reorderLevel) || 0,
        costPerUnit: Number(item.costPerUnit) || 0,
        supplier: item.supplier || "",
    };
};

export const inventoryKeys = {
    list: (restaurantId: string) => ["inventory", restaurantId] as const,
};

export function useInventory(restaurantId?: string) {
    return useQuery({
        queryKey: inventoryKeys.list(restaurantId ?? ""),
        queryFn: async () => {
            const res = await getInventory();
            const items = Array.isArray(res) ? res : res?.data || [];
            return items
                .map((item: any) => normalizeItem(item))
                .filter((item: InventoryItem | null): item is InventoryItem => item !== null);
        },
        enabled: !!restaurantId,
        staleTime: 60 * 1000,
        gcTime: 10 * 60 * 1000,
        retry: 1,
        refetchOnWindowFocus: false,
    });
}

export function useCreateInventoryItem(restaurantId?: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (payload: any) => createInventory(payload),
        onSuccess: () => {
            if (restaurantId) {
                queryClient.invalidateQueries({ queryKey: inventoryKeys.list(restaurantId) });
            }
        },
    });
}

export function useUpdateInventoryItem(restaurantId?: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ itemId, payload }: { itemId: string; payload: any }) =>
            updateInventory(itemId, payload),
        onSuccess: () => {
            if (restaurantId) {
                queryClient.invalidateQueries({ queryKey: inventoryKeys.list(restaurantId) });
            }
        },
    });
}

export function useDeleteInventoryItem(restaurantId?: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (itemId: string) => deleteInventory(itemId),
        onMutate: async (itemId) => {
            if (!restaurantId) return;
            const key = inventoryKeys.list(restaurantId);
            await queryClient.cancelQueries({ queryKey: key });
            const previous = queryClient.getQueryData<InventoryItem[]>(key);
            queryClient.setQueryData<InventoryItem[]>(key, (old) =>
                old?.filter((item) => item._id !== itemId) ?? old,
            );
            return { previous };
        },
        onError: (_err, _itemId, context) => {
            if (restaurantId && context?.previous) {
                queryClient.setQueryData(inventoryKeys.list(restaurantId), context.previous);
            }
        },
        onSettled: () => {
            if (restaurantId) {
                queryClient.invalidateQueries({ queryKey: inventoryKeys.list(restaurantId) });
            }
        },
    });
}
