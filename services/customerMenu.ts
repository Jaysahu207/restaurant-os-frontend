
import { PublicAPI } from "@/config/axios";


export const fetchCustomerMenu = async (restaurantId: string) => {
    console.log("🌐 BASE URL:", process.env.NEXT_PUBLIC_API_URL);

    try {
        if (!restaurantId) throw new Error("No restaurantId provided");

        const res = await PublicAPI.get(`/api/customers/menu/${restaurantId}`);
        // ✅ Fetch restaurant details
        console.log("✅ RAW API RESPONSE:", res.data);

        return res.data;

    } catch (err: any) {
        console.log("❌ FULL ERROR:", err);
        console.log("❌ MESSAGE:", err.message);
        console.log("❌ CODE:", err.code);
        console.log("❌ RESPONSE:", err.response);

        throw err;
    }
};