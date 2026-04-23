import axios from "axios";
import { useAuthStore } from "@/store/useAuthStore"; // ✅ import store

const API = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000",
    withCredentials: true,
});

// console.log("API URL:", process.env.NEXT_PUBLIC_API_URL);

// 🔐 Attach token automatically (Zustand)
API.interceptors.request.use((config) => {
    const token = useAuthStore.getState().token; // ✅ from Zustand
    
    // console.log("TOKEN =>", token); // 🔥
    // console.log("HEADERS =>", config.headers); // 🔥
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    } else {
        delete config.headers.Authorization; // ✅ cleanup
    }

    return config;
});

export default API;




export const PublicAPI = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL,
    withCredentials: true, // 👈 OK (ab backend match karega)
});