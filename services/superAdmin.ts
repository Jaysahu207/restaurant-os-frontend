import API from "../config/axios";


// =============================
// 🏢 RESTAURANTS
// =============================

export const getAllRestaurants = async () => {
    const res = await API.get("/api/super-admin/restaurants");
    return res.data;
};

export const getRestaurantDetails = async (id: string) => {
    const res = await API.get(`/api/super-admin/restaurants/${id}`);
    return res.data;
};

export const createRestaurant = async (data: any) => {
    const res = await API.post("/api/super-admin/restaurants", data);
    return res.data;
};

export const updateRestaurant = async (id: string, data: any) => {
    const res = await API.put(`/api/super-admin/restaurants/${id}`, data);
    return res.data;
};

export const toggleRestaurantStatus = async (id: string) => {
    const res = await API.patch(`/api/super-admin/restaurants/${id}/toggle`);
    return res.data;
};

export const deleteRestaurant = async (id: string) => {
    const res = await API.delete(`/api/super-admin/restaurants/${id}`);
    return res.data;
};


// =============================
// 👤 USERS & ADMINS
// =============================

export const getAllUsers = async () => {
    const res = await API.get("/api/super-admin/users");
    return res.data;
};

export const getAdminUsers = async () => {
    const res = await API.get("/api/super-admin/admins");
    return res.data;
};

export const createAdminUser = async (data: any) => {
    const res = await API.post("/api/super-admin/admins", data);
    return res.data;
};

export const updateUserRole = async (id: string, role: string) => {
    const res = await API.patch(`/api/super-admin/users/${id}/role`, { role });
    return res.data;
};

export const toggleUserStatus = async (id: string) => {
    const res = await API.patch(`/api/super-admin/users/${id}/toggle`);
    return res.data;
};

export const deleteUser = async (id: string) => {
    const res = await API.delete(`/api/super-admin/users/${id}`);
    return res.data;
};


// =============================
// 💳 SUBSCRIPTIONS & BILLING
// =============================

export const updateSubscription = async (
    restaurantId: string,
    data: {
        plan: "free" | "pro" | "enterprise";
        expiryDate?: string;
    }
) => {
    const res = await API.patch(
        `/api/super-admin/restaurants/${restaurantId}/subscription`,
        data
    );
    return res.data;
};

export const getAllSubscriptions = async () => {
    const res = await API.get("/api/super-admin/subscriptions");
    return res.data;
};

export const getRevenueStats = async () => {
    const res = await API.get("/api/super-admin/revenue");
    return res.data;
};


// =============================
// 📊 ANALYTICS & REPORTS
// =============================

export const getDashboardStats = async () => {
    const res = await API.get("/api/super-admin/dashboard");
    return res.data;
};

export const getRestaurantAnalytics = async (restaurantId: string) => {
    const res = await API.get(
        `/api/super-admin/analytics/${restaurantId}`
    );
    return res.data;
};

export const getOrderAnalytics = async () => {
    const res = await API.get("/api/super-admin/orders/analytics");
    return res.data;
};

export const getTopRestaurants = async () => {
    const res = await API.get("/api/super-admin/top-restaurants");
    return res.data;
};


// =============================
// 🎫 SUPPORT TICKETS
// =============================

export const getAllTickets = async () => {
    const res = await API.get("/api/super-admin/tickets");
    return res.data;
};

export const getTicketById = async (id: string) => {
    const res = await API.get(`/api/super-admin/tickets/${id}`);
    return res.data;
};

export const updateTicketStatus = async (
    id: string,
    status: "open" | "in_progress" | "resolved"
) => {
    const res = await API.patch(`/api/super-admin/tickets/${id}`, { status });
    return res.data;
};

export const replyToTicket = async (id: string, message: string) => {
    const res = await API.post(`/api/super-admin/tickets/${id}/reply`, {
        message,
    });
    return res.data;
};


// =============================
// ⚙️ PLATFORM SETTINGS
// =============================

export const getPlatformSettings = async () => {
    const res = await API.get("/api/super-admin/settings");
    return res.data;
};

export const updatePlatformSettings = async (data: any) => {
    const res = await API.put("/api/super-admin/settings", data);
    return res.data;
};