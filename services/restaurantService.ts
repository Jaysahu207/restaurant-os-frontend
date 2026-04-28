import API from "@/config/axios";

// ================= GET RESTAURANT =================
export const getRestaurant = async () => {
    const res = await API.get("/api/restaurant/get");
    console.log("Restaurant Data ->", res.data)
    return res.data.restaurant;
};

// ================= UPDATE RESTAURANT =================
export const updateRestaurant = async (data: any) => {
    const res = await API.put("/api/restaurant/update", data);
    console.log("Updated Data ->", res.data)
    return res.data;
};

// ================= CONNECT GMAIL =================
// NOTE: this is redirect-based (no axios)
export const connectGmail = (token: any) => {

    window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/api/auth/connect-gmail?token=${token}`;

};

// ================= DISCONNECT GMAIL =================
export const disconnectGmail = async () => {
    const res = await API.post("/api/auth/disconnect-gmail");
    return res.data;
};