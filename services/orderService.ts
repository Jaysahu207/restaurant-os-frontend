import { PublicAPI } from "@/config/axios";

type OrderItem = {
  menuItemId: string;
  name: string;
  quantity: number;
  price: number;
  variant?: string;
  addons?: { name: string; price: number }[];
};

type CustomerInfo = {
  name: string;
  phone: string;
};

type OrderPayload = {
  restaurantId: string;
  tableNumber: number;
  items: OrderItem[];
  customer?: CustomerInfo;
};

// 🔥 PLACE ORDER
export const placeOrder = async (orderData: OrderPayload) => {
  try {
    const res = await PublicAPI.post("/api/orders", orderData);
    return res.data;
  } catch (error: any) {
    console.error("ORDER ERROR:", error?.response?.data || error.message);
    throw error;
  }
};

// 🔥 GET ORDERS (✅ FIXED)
export const getOrders = async (restaurantId: string, date?: string) => {
  console.log(" Get Order -->> ", restaurantId, date)
  try {
    const res = await PublicAPI.get(
      `/api/orders?restaurantId=${restaurantId}&date=${date}`
    );
    console.log("Fetched order -->>  ", res.data)
    return res.data;
  } catch (error: any) {
    console.error("GET ORDERS ERROR:", error?.response?.data || error.message);
    throw error;
  }
};

// 🔥 UPDATE STATUS
export const updateOrderStatus = async (id: string, status: string) => {
  try {
    const res = await PublicAPI.put(`/api/orders/${id}`, { status });
    return res.data;
  } catch (error: any) {
    console.error(
      "UPDATE ORDER STATUS ERROR:",
      error?.response?.data || error.message
    );
    throw error;
  }
};

// 🔥 ADD ITEMS TO ORDER
export const addItemsToOrder = async (id: string, items: OrderItem[]) => {
  try {
    const res = await PublicAPI.put(`/api/orders/${id}/add-items`, { items });
    return res.data;
  } catch (error: any) {
    console.error(
      "ADD ITEMS TO ORDER ERROR:",
      error?.response?.data || error.message
    );
    throw error;
  }
};

// 🔥 DELETE ORDER
export const deleteOrder = async (id: string) => {
  try {
    const res = await PublicAPI.delete(`/api/orders/${id}`);
    return res.data;
  } catch (error: any) {
    console.error("DELETE ORDER ERROR:", error?.response?.data || error.message);
    throw error;
  }
};

// 🔥 COMPLETE PAYMENT
export const completePayment = async (id: string, method: string) => {
  try {
    const res = await PublicAPI.put(`/api/orders/${id}/pay`, {
      paymentMethod: method, // ✅ IMPORTANT
    });
    return res.data;
  } catch (error: any) {
    console.error(
      "COMPLETE PAYMENT ERROR:",
      error?.response?.data || error.message
    );
    throw error;
  }
};

// 🔥 GET ORDER BY ID
export const getOrderById = async (id: string) => {
  try {
    const res = await PublicAPI.get(`/api/orders/${id}`);
    return res.data;
  } catch (error: any) {
    console.error("GET ORDER BY ID ERROR:", error?.response?.data || error.message);
    throw error;
  }
};