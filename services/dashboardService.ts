import API from "@/config/axios";

export const getDashboardData = async (restaurantId: string) => {
    const res = await API.get(`/api/analytics/dashboard/${restaurantId}`);
    return res;
};