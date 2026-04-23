
import { PublicAPI } from "@/config/axios";



// ===============================
// TYPES
// ===============================

export interface Customer {
    _id: string;
    name: string;
    phone: string;
    table?: number;
    totalOrders?: number;
    totalSpent?: number;
    lastVisit?: string;
}

export interface Order {
    _id: string;
    status: string;
    totalAmount: number;
    createdAt: string;
    items: any[];
}

// ===============================
// PublicAPI CALLS (CRM)
// ===============================

// ✅ Get all customers (with search & pagination)
export const getCustomers = async (
    restaurantId: string,
    search: string = "",
    page: number = 1,
    limit: number = 10,
    dateFilter: string = ""
) => {
    try {
        const res = await PublicAPI.get("/api/customers/", {
            params: { restaurantId, search, page, limit, dateFilter },
        });
        return res.data;
    } catch (error) {
        console.error("❌ getCustomers error:", error);
        throw error;
    }
};

// ✅ Get single customer detail (with analytics + orders)
export const getCustomerById = async (customerId: string) => {
    try {
        const res = await PublicAPI.get(`/customers/${customerId}`);
        return res.data;
    } catch (error) {
        console.error("❌ getCustomerById error:", error);
        throw error;
    }
};

// ✅ Get customer history (by phone + restaurantId)
export const getCustomerHistory = async (customerId: string) => {
    try {
        const res = await PublicAPI.get(`api/customers/history/${customerId}`);
        return res.data;
    } catch (error) {
        console.error("❌ getCustomerHistory error:", error);
        throw error;
    }
};
// ✅ Save / Update customer
export const saveCustomer = async (data: {
    name: string;
    phone: string;
    table: number;
    restaurantId: string;
}) => {
    try {
        const res = await PublicAPI.post("/customers/details", data);
        return res.data;
    } catch (error) {
        console.error("❌ saveCustomer error:", error);
        throw error;
    }
};

// ✅ Delete customer
export const deleteCustomer = async (customerId: string) => {
    try {
        const res = await PublicAPI.delete(`/customers/${customerId}`);
        return res.data;
    } catch (error) {
        console.error("❌ deleteCustomer error:", error);
        throw error;
    }
};

// ===============================
// OPTIONAL HELPERS
// ===============================

// 📊 Format currency
export const formatCurrency = (amount: number) => {
    return `₹${amount.toFixed(2)}`;
};

// 📅 Format date
export const formatDate = (date: string) => {
    return new Date(date).toLocaleString();
};

// 📅 Format time
export const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString();
};