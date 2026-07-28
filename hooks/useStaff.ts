import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
    getStaffList,
    deleteStaff,
    createStaff,
    updateStaff,
} from "@/services/staffService";

export interface StaffPermissions {
    canCreateOrder: boolean;
    canUpdateOrder: boolean;
    canViewCustomers: boolean;
    canManageMenu: boolean;
    canManageStaff: boolean;
    canViewAnalytics: boolean;
}

export interface Staff {
    _id: string;
    name: string;
    email: string;
    phone: string;
    role: string;
    shift?: string;
    status?: string;
    permissions: StaffPermissions;
    isActive: boolean;
    password?: string;
    restaurantId?: string;
    createdAt?: string;
    joinDate?: string;
}

export const staffKeys = {
    list: (restaurantId: string) => ["staff", restaurantId] as const,
};

export function useStaff(restaurantId?: string) {
    return useQuery({
        queryKey: staffKeys.list(restaurantId ?? ""),
        queryFn: () => getStaffList(restaurantId!) as Promise<Staff[]>,
        enabled: !!restaurantId,
        staleTime: 60 * 1000,
        gcTime: 10 * 60 * 1000,
        retry: 1,
        refetchOnWindowFocus: false,
    });
}

export function useCreateStaff(restaurantId?: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (payload: any) => createStaff(payload),
        onSuccess: () => {
            if (restaurantId) {
                queryClient.invalidateQueries({ queryKey: staffKeys.list(restaurantId) });
            }
        },
    });
}

export function useUpdateStaff(restaurantId?: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ staffId, payload }: { staffId: string; payload: any }) =>
            updateStaff(staffId, payload),
        onSuccess: () => {
            if (restaurantId) {
                queryClient.invalidateQueries({ queryKey: staffKeys.list(restaurantId) });
            }
        },
    });
}

export function useDeleteStaff(restaurantId?: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (staffId: string) => deleteStaff(staffId),
        onMutate: async (staffId) => {
            if (!restaurantId) return;
            const key = staffKeys.list(restaurantId);
            await queryClient.cancelQueries({ queryKey: key });
            const previous = queryClient.getQueryData<Staff[]>(key);
            queryClient.setQueryData<Staff[]>(key, (old) =>
                old?.filter((s) => s._id !== staffId) ?? old,
            );
            return { previous };
        },
        onError: (_err, _staffId, context) => {
            if (restaurantId && context?.previous) {
                queryClient.setQueryData(staffKeys.list(restaurantId), context.previous);
            }
        },
        onSettled: () => {
            if (restaurantId) {
                queryClient.invalidateQueries({ queryKey: staffKeys.list(restaurantId) });
            }
        },
    });
}