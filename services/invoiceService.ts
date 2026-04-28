import API from "../config/axios";



export const sendInvoice = async (data: {
    orderId: string;
    email: string;
}) => {
    const res = await API.post("/api/invoices/send", data);
    return res.data;
};