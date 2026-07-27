import { useQuery } from "@tanstack/react-query";
import { getRestaurant } from "@/services/restaurantService";

export const restaurantKeys = {
    current: ["restaurant", "current"] as const,
};

export function useRestaurant() {
    return useQuery({
        queryKey: restaurantKeys.current,
        queryFn: () => getRestaurant(),
        staleTime: 5 * 60 * 1000, // 5 min — restaurant profile rarely changes
        gcTime: 15 * 60 * 1000,
        retry: 1,
        refetchOnWindowFocus: false,
    });
}