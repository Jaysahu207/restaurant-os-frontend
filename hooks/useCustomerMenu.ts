import { useQuery } from "@tanstack/react-query";
import { fetchCustomerMenu } from "@/services/customerMenu";

export interface CustomerMenuItem {
    _id: string;
    name: string;
    description: string;
    price: number;
    category: string;
    image?: string;
    isAvailable?: boolean;
    isPopular?: boolean;
    variants?: { name: string; price: number }[];
    addons?: { name: string; price: number }[];
}

export const customerMenuKeys = {
    detail: (restaurantSlug: string) => ["customerMenu", restaurantSlug] as const,
};

export function useCustomerMenuQuery(restaurantSlug?: string) {
    return useQuery({
        queryKey: customerMenuKeys.detail(restaurantSlug ?? ""),
        queryFn: () => fetchCustomerMenu(restaurantSlug!),
        enabled: !!restaurantSlug,
        // Menu/restaurant config changes rarely from the customer's POV —
        // cache aggressively so a screen-lock/refresh doesn't re-fetch or re-flash loading.
        staleTime: 5 * 60 * 1000,
        gcTime: 15 * 60 * 1000,
        retry: 1,
        refetchOnWindowFocus: false,
    });
}