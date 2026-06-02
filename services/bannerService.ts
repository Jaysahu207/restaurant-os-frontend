import API from "@/config/axios";
import axios from "@/config/axios";

export interface BannerPayload {
    title: string;
    subtitle?: string;
    description?: string;

    type: string;

    actionType?: string;
    actionTarget?: string;

    buttonText?: string;

    priority?: number;

    startDate?: string;
    endDate?: string;

    image?: File | null;

    restaurantId: string;
}

// =========================
// GET ALL BANNERS
// =========================
export const getRestaurantBanners = async (restaurantId: string) => {
    const response = await API.get(`/api/banners/restaurant/${restaurantId}`);

    return response.data;
};

// =========================
// GET SINGLE BANNER
// =========================
export const getBanner = async (bannerId: string) => {
    const response = await API.get(`/api/banners/${bannerId}`);

    return response.data;
};

// =========================
// CREATE BANNER
// =========================
export const createBanner = async (data: any) => {
    const formData = new FormData();

    formData.append("restaurantId", data.restaurantId);

    formData.append("title", data.title);

    formData.append("subtitle", data.subtitle || "");

    formData.append("type", data.type);

    formData.append("isActive", String(data.isActive));

    if (data.image) {
        formData.append("image", data.image);
    }

    return API.post("/api/banners", formData);
};

// =========================
// UPDATE BANNER
// =========================
export const updateBanner = async (
    bannerId: string,
    payload: Partial<BannerPayload>,
) => {
    const formData = new FormData();

    Object.entries(payload).forEach(([key, value]) => {
        if (value !== undefined && value !== null && key !== "image") {
            formData.append(key, String(value));
        }
    });

    if (payload.image) {
        formData.append("image", payload.image);
    }

    const response = await API.put(`/api/banners/${bannerId}`, formData, {
        headers: {
            "Content-Type": "multipart/form-data",
        },
    });

    return response.data;
};

// =========================
// DELETE BANNER
// =========================
export const deleteBanner = async (bannerId: string) => {
    const response = await API.delete(`/api/banners/${bannerId}`);

    return response.data;
};

// =========================
// TOGGLE STATUS
// =========================
export const toggleBannerStatus = async (bannerId: string) => {
    const response = await API.patch(`/api/banners/${bannerId}/toggle-status`);

    return response.data;
};
