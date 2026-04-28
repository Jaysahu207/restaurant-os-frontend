import { create } from "zustand";

interface Owner {
    _id: string;
    name: string;
    email: string;
}

interface Restaurant {
    _id: string;
    restaurantName: string;
    owner: Owner;
    isActive: boolean;
}

interface SuperAdminStore {
    restaurants: Restaurant[];

    selectedRestaurant: Restaurant | null;

    loading: boolean;

    setRestaurants: (
        restaurants: Restaurant[]
    ) => void;

    setSelectedRestaurant: (
        restaurant: Restaurant | null
    ) => void;

    setLoading: (loading: boolean) => void;

    clearStore: () => void;
}

export const useSuperAdminStore =
    create<SuperAdminStore>((set) => ({
        restaurants: [],

        selectedRestaurant: null,

        loading: false,

        setRestaurants: (restaurants) =>
            set({ restaurants }),

        setSelectedRestaurant: (
            selectedRestaurant
        ) => set({ selectedRestaurant }),

        setLoading: (loading) =>
            set({ loading }),

        clearStore: () =>
            set({
                restaurants: [],
                selectedRestaurant: null,
                loading: false,
            }),
    }));