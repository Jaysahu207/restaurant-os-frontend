import API from "../config/axios";

// ✅ Get all menu items
// ✅ Get menu by restaurantId
export const getMenuItems = async (restaurantId: string) => {
  console.log("📡 GET API called with ID:", restaurantId);
  const res = await API.get(`/api/menu/${restaurantId}`);
  return res.data;
};

// ✅ Create menu item
export const createMenuItem = async (formData: FormData) => {
  console.log("Form Data => ", Object.fromEntries(formData));
  const res = await API.post("/api/menu", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return res.data;
};

// ✅ Update menu item
export const updateMenuItem = async (id: string, formData: FormData) => {
  // console.log("📡 Sending FormData...");

  const res = await API.put(`/api/menu/${id}`, formData);
  // console.log(" Form Data ", formData);
  return res.data;
};

// ✅ Delete menu item
export const deleteMenuItem = async (id: string) => {
  console.log("📡 DELETE API called with ID:", id);

  const res = await API.delete(`/api/menu/${id}`);

  console.log("📡 API Response:", res);

  return res.data;
};
