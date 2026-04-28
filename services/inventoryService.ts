import API from "@/config/axios";


export const getInventory = async () => {
    const res = await API.get("api/inventory");
    return res.data;
};

export const getInventoryById = async (id: string) => {
    const res = await API.get(`api/inventory/${id}`);
    return res.data;
}

export const createInventory = async (data: any) => {
    const res = await API.post("api/inventory", data);
    // console.log(res.data)
    return res.data;
}

export const updateInventory = async (id: string, data: any) => {
    const res = await API.put(`api/inventory/${id}`, data);
    // console.log(res.data)
    return res.data;
}

export const deleteInventory = async (id: string) => {
    const res = await API.delete(`api/inventory/${id}`);
    return res.data;
}

export const updateStock = async (
    id: string,
    quantity: number,
    type: "add" | "remove"
) => {
    const res = await API.patch(`api/inventory/${id}/stock`, {
        quantity,
        type,
    });
    return res.data;
};