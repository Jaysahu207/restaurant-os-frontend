import { PublicAPI } from "@/config/axios";
import axios from "axios";

export const getDashboardData = async (restaurantId: string) => {
    const token = localStorage.getItem("token"); // or from your auth store

    const res = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/analytics/dashboard/${restaurantId}`,
        {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }
    );

    return res.data;
};