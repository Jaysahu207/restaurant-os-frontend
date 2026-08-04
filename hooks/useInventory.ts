// hooks/useInventory.ts
import {
    useQuery,
    useMutation,
    useQueryClient,
    keepPreviousData,
} from "@tanstack/react-query";
import {
    getInventory,
    createInventory,
    updateInventory,
    deleteInventory,
    updateStock,
    getInventorySummary,
    getInventoryTransactions,
    getInventoryTransactionById,
} from "@/services/inventoryService";
import type {
    InventoryItemFormValues,
    UpdateStockPayload,
    InventoryTransactionsParams,
} from "@/types/inventory";

const keys = {
    all: ["inventory"] as const,
    list: () => [...keys.all, "list"] as const,
    summary: () => [...keys.all, "summary"] as const,
    transactions: (params?: InventoryTransactionsParams) =>
        [...keys.all, "transactions", params] as const,
    transaction: (id: string) => [...keys.all, "transaction", id] as const,
};

export function useInventoryItems() {
    return useQuery({
        queryKey: keys.list(),
        queryFn: getInventory,
    });
}

export function useInventorySummary() {
    return useQuery({
        queryKey: keys.summary(),
        queryFn: getInventorySummary,
    });
}

export function useInventoryTransactions(params?: InventoryTransactionsParams) {
    return useQuery({
        queryKey: keys.transactions(params),
        queryFn: () => getInventoryTransactions(params),
        placeholderData: keepPreviousData,
    });
}

export function useInventoryTransaction(id: string | undefined) {
    return useQuery({
        queryKey: keys.transaction(id ?? ""),
        queryFn: () => getInventoryTransactionById(id as string),
        enabled: !!id,
    });
}

export function useCreateInventoryItem() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: InventoryItemFormValues) => createInventory(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: keys.list() });
            queryClient.invalidateQueries({ queryKey: keys.summary() });
        },
    });
}

export function useUpdateInventoryItem() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<InventoryItemFormValues> }) =>
            updateInventory(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: keys.list() });
            queryClient.invalidateQueries({ queryKey: keys.summary() });
        },
    });
}

export function useDeleteInventoryItem() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => deleteInventory(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: keys.list() });
            queryClient.invalidateQueries({ queryKey: keys.summary() });
        },
    });
}

export function useUpdateStock() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: UpdateStockPayload }) =>
            updateStock(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: keys.list() });
            queryClient.invalidateQueries({ queryKey: keys.summary() });
            queryClient.invalidateQueries({ queryKey: [...keys.all, "transactions"] });
        },
    });
}