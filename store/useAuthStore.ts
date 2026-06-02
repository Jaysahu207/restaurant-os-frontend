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

            setAuth: ({ user, restaurant, token }) =>
                set({
                    user,
                    restaurant,
                    token,
                }),

            setUser: (user) => set({ user }),
            setRestaurant: (restaurant) => set({ restaurant }),
            setToken: (token) => set({ token }),

            logout: () => {
                set({
                    user: null,
                    restaurant: null,
                    token: null,
                });

                localStorage.removeItem("auth-storage");
            },
        }),
        {
            name: "auth-storage",

            onRehydrateStorage: () => {
                // console.log("🔥 Zustand hydration started");

                return (state, error) => {
                    if (error) {
                        console.error("❌ Hydration failed:", error);
                    } else {
                        // console.log("✅ Hydration completed");
                        // console.log("📦 Hydrated state:", state);
                    }
                };
            },
        }
    )
);