import { PublicAPI } from "@/config/axios";

// Fetch Menu
export const fetchCustomerMenu = async (slug: string) => {
  try {
    const res = await PublicAPI.get(`/api/customers/menu/${slug}`);

    console.log("✅ RAW API RESPONSE:", res.data);

    return res.data;
  } catch (err: any) {
    console.log("❌ FULL ERROR:", err);
    throw err;
  }
};

// Check Table Status
export const checkTableStatus = async (
  slug: string,
  tableNumber: number,
  sessionId: string
) => {
  const res = await PublicAPI.get(
    "/api/customers/table-status",
    {
      params: {
        slug,
        tableNumber,
        sessionId,
      },
    }
  );

  return res.data;
};





// ✅ NEW: Release Table Service
export const releaseTable = async (
  slug: string,
  tableNumber: number,
  sessionId?: string
) => {
  try {
    const res = await PublicAPI.post("/api/customers/release-table", {
      slug,
      tableNumber,
      sessionId, // optional but useful for tracking session cleanup
    });

    return res.data;
  } catch (err: any) {
    console.log("❌ RELEASE TABLE ERROR:", err);
    throw err;
  }
};