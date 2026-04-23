import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AuthState {
    user: any;
    restaurant: any;
    token: string | null;

    setAuth: (data: {
        user: any;
        restaurant: any;
        token: string | null;
    }) => void;

    setUser: (user: any) => void;
    setRestaurant: (restaurant: any) => void;
    setToken: (token: string | null) => void;

    logout: () => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            restaurant: null,
            token: null,

            // ✅ login
            setAuth: ({ user, restaurant, token }) =>
                set({
                    user,
                    restaurant,
                    token,
                }),

            // ✅ granular setters
            setUser: (user) => set({ user }),
            setRestaurant: (restaurant) => set({ restaurant }),
            setToken: (token) => set({ token }),

            // ✅ logout
            logout: () =>
                set({
                    user: null,
                    restaurant: null,
                    token: null,
                }),
        }),
        {
            name: "auth-storage", // 🔥 localStorage key
        }
    )
);