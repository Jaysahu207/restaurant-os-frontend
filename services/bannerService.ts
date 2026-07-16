import API from "@/config/axios";
import axios from "@/config/axios";

export interface BannerPayload {
    restaurantId: string;

    title: string;
    subtitle?: string;
    description?: string;

    image?: File | null;

    type:
    | "offer"
    | "combo"
    | "festival"
    | "announcement"
    | "special"
    | "new_item";

    actionType?: "none" | "category" | "product" | "offer";

    actionTarget?: string;

    buttonText?: string;

    priority?: number;

    startDate?: string;

    endDate?: string;

    isActive?: boolean;
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
// =========================
// CREATE BANNER
// =========================
export const createBanner = async (data: BannerPayload & { isActive?: boolean }) => {
    const formData = new FormData();

    formData.append("restaurantId", data.restaurantId);
    formData.append("title", data.title);
    formData.append("subtitle", data.subtitle || "");
    formData.append("description", data.description || "");

    formData.append("type", data.type);

    formData.append("actionType", data.actionType || "none");
    if (
        data.actionType !== "none" &&
        data.actionTarget?.trim()
    ) {
        formData.append("actionTarget", data.actionTarget);
    }

    formData.append("buttonText", data.buttonText || "");

    formData.append("priority", String(data.priority ?? 0));

    formData.append("startDate", data.startDate || "");
    formData.append("endDate", data.endDate || "");

    formData.append("isActive", String(data.isActive ?? true));

    if (data.image) {
        formData.append("image", data.image);
    }

    const response = await API.post("/api/banners", formData, {
        headers: {
            "Content-Type": "multipart/form-data",
        },
    });

    return response.data;
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
