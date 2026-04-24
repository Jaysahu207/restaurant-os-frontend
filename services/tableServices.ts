import axios from "axios";
import API from "../config/axios";

// const API = axios.create({
//     baseURL: "http://localhost:5000/api",
// });

// GET TABLES
export const getTables = (restaurantId: string) =>
    API.get(`api/tables?restaurantId=${restaurantId}`);

// CREATE TABLE
export const createTable = (data: any) =>
    API.post("api/tables", data);

// DELETE TABLE
export const deleteTable = (id: string) =>
    API.delete(`api/tables/${id}`);

// TOGGLE TABLE
export const toggleTable = (id: string) =>
    API.patch(`api/tables/${id}/toggle`);


export const updateTable = (id: string, data: any) =>
    API.put(`api/tables/${id}`, data);