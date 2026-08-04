import API from "@/config/axios";

export interface UpdateStockPayload {
    quantity: number;
    type: "stock_in" | "adjustment" | "wastage" | "sale";
    note?: string;
}

// ==================== Inventory ====================

export const getInventory = async () => {
    const res = await API.get("/api/inventory");
    // console.log("getInventory response:", res.data.data); // Log the response data
    return res.data.data;
};

export const createInventory = async (data: any) => {
    const res = await API.post("/api/inventory", data);
    return res.data.data;
};

export const updateInventory = async (id: string, data: any) => {
    const res = await API.put(`/api/inventory/${id}`, data);
    return res.data.data;
};

export const deleteInventory = async (id: string) => {
    const res = await API.delete(`/api/inventory/${id}`);
    return res.data;
};

// ==================== Stock ====================

export const updateStock = async (
    id: string,
    data: UpdateStockPayload
) => {
    const res = await API.patch(`/api/inventory/${id}/stock`, data);
    return res.data.data;
};

// ==================== Summary ====================

export const getInventorySummary = async () => {
    const res = await API.get("/api/inventory/summary");
    console.log("getInventorySummary response:", res.data.data); // Log the response data
    return res.data.data;
};

// ==================== Transactions ====================

export const getInventoryTransactions = async (params?: {
    page?: number;
    limit?: number;
    type?: string;
    inventoryId?: string;
    startDate?: string;
    endDate?: string;
}) => {
    const res = await API.get("/api/inventory/transactions", {
        params,
    });
    // console.log("getInventoryTransactions response:", res.data); // Log the response data
    // Returns { success, data, pagination }
    return res.data;
};

export const getInventoryTransactionById = async (id: string) => {
    const res = await API.get(`/api/inventory/transactions/${id}`);
    return res.data.data;
};