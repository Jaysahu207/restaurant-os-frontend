import axios from "axios";

const API = axios.create({
    baseURL: "http://localhost:5000/api",
});

// GET TABLES
export const getTables = (restaurantId: string) =>
    API.get(`/tables?restaurantId=${restaurantId}`);

// CREATE TABLE
export const createTable = (data: any) =>
    API.post("/tables", data);

// DELETE TABLE
export const deleteTable = (id: string) =>
    API.delete(`/tables/${id}`);

// TOGGLE TABLE
export const toggleTable = (id: string) =>
    API.patch(`/tables/${id}/toggle`);


export const updateTable = (id: string, data: any) =>
    API.put(`/tables/${id}`, data);