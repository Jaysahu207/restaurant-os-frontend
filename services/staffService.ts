import API from "../config/axios";


// ================= CREATE STAFF =================
export const createStaff = async (data: {
    name: string;
    email: string;
    password: string;
    permissions: string[];
    restaurantId: string;
    phone: string;
    role: string;
    shift: string;
    joinDate: string;
    status: string;

}) => {
    const res = await API.post("/api/auth/staff", data);
    return res.data;
};

// ================= GET STAFF =================
export const getStaffList = async (restaurantId: string) => {
    const res = await API.get("/api/auth/staff");
    return res.data;
};

// ================= DELETE STAFF =================
export const deleteStaff = async (id: string) => {
    const res = await API.delete(`/api/auth/staff/${id}`);
    return res.data;


};


export const updateStaff = async (id: string, data: any) => {
    const res = await API.put(`/api/auth/staff/${id}`, data);
    return res.data;
};