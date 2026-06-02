"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { getRestaurant } from "@/services/restaurantService";

export default function AuthInitializer() {
    const token = useAuthStore((s) => s.token);
    const restaurant = useAuthStore((s) => s.restaurant);
    const setRestaurant = useAuthStore((s) => s.setRestaurant);

    useEffect(() => {
        const loadRestaurant = async () => {
            try {
                if (!token || restaurant) return;

                // console.log("🔄 Loading restaurant...");

                const data = await getRestaurant();

                // console.log("🏪 Restaurant loaded:", data);

                setRestaurant(data);
            } catch (err) {
                console.error("❌ Failed to load restaurant", err);
            }
        };

        loadRestaurant();
    }, [token, restaurant, setRestaurant]);

    return null;
}