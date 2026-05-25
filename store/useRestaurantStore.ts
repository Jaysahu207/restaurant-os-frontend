import { create } from "zustand";
import axios from "axios";

interface Restaurant {
    _id: string;
    name: string;
    email: string;
    plan: string;
    status: string;
}

interface RestaurantStore {
    restaurants: Restaurant[];
    loading: boolean;

    fetchRestaurants: () => Promise<void>;
    addRestaurant: (restaurant: Restaurant) => void;
    removeRestaurant: (id: string) => void;
}

export const useRestaurantStore = create<RestaurantStore>(
    (set, get) => ({
        restaurants: [],
        loading: false,

        fetchRestaurants: async () => {
            // Prevent duplicate fetching
            if (get().restaurants.length > 0) return;

            try {
                set({ loading: true });

                const res = await axios.get(
                    `${process.env.NEXT_PUBLIC_API_URL}/super-admin/restaurants`,
                    {
                        withCredentials: true,
                    }
                );

                set({
                    restaurants: res.data.restaurants,
                    loading: false,
                });
            } catch (error) {
                set({ loading: false });
            }
        },

        addRestaurant: (restaurant) => {
            set((state) => ({
                restaurants: [restaurant, ...state.restaurants],
            }));
        },

        removeRestaurant: (id) => {
            set((state) => ({
                restaurants: state.restaurants.filter(
                    (item) => item._id !== id
                ),
            }));
        },
    })
);