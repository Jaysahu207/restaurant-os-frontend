import API from "@/config/axios";

// ======================= TYPES =======================

export interface PromotionPayload {
    code: string;
    description?: string;
    type: "percentage" | "fixed";
    value: number;
    minOrder?: number;
    startDate: string;
    endDate: string;
    applicableTo?: "all" | "category" | "specific";
    applicableValue?: string;
    usageLimit?: number;
    status?: "active" | "inactive";
    restaurantId?: string;
}


export interface SendEmailPayload {
    subject?: string;
    message: string;
    customerIds?: string[];
    promotionId?: string;
    restaurantId?: string;
}

// ======================= PROMOTION APIs =======================

// ➕ Create Promotion
export const createPromotion = async (data: PromotionPayload) => {
    try {
        const res = await API.post("/api/marketing/promotions", data);
        return res.data;
    } catch (err: any) {
        throw err.response?.data || { message: "Something went wrong" };
    }
};

// 📋 Get All Promotions
export const getPromotions = async (_id: string) => {
    const res = await API.get("/api/marketing/promotions");
    return res.data;
};

// 🔍 Get Single Promotion
export const getPromotionById = async (id: string) => {
    const res = await API.get(`/api/marketing/promotions/${id}`);
    return res.data;
};

// ✏️ Update Promotion
export const updatePromotion = async (
    id: string,
    data: Partial<PromotionPayload>
) => {
    const res = await API.put(`/api/marketing/promotions/${id}`, data);
    return res.data;
};

// ❌ Delete Promotion
export const deletePromotion = async (id: string) => {
    const res = await API.delete(`/api/marketing/promotions/${id}`);
    return res.data;
};

// ======================= MARKETING EMAIL =======================

// 📧 Send Marketing Email
export const sendMarketingEmail = async (data: SendEmailPayload) => {
    const res = await API.put("/api/marketing/send-email", data);
    return res.data;
};