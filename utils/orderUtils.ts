import { Order, OrderStatus } from "@/hooks/useOrders";

// getISTDateString — converts a Date to a YYYY-MM-DD string in IST
export function getISTDateString(date: Date = new Date()): string {
    const istDate = new Date(
        date.toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
    );
    const year = istDate.getFullYear();
    const month = String(istDate.getMonth() + 1).padStart(2, "0");
    const day = String(istDate.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

// mapOrder — normalizes a raw backend order into your frontend Order shape
export function mapOrder(raw: any): Order {
    return {
        id: String(raw._id),
        orderNumber: raw.orderNumber,
        status: raw.status as OrderStatus,
        orderType: raw.orderType,
        table: raw.tableNumber ?? raw.table,
        createdAt: raw.createdAt,
        customer: {
            name: raw.customer?.name ?? "Guest",
            phone: raw.customer?.phone ?? "",
            email: raw.customer?.email,
        },
        items: raw.items ?? [],
        subtotal: raw.subtotal,
        total: raw.total,
        cgstAmount: raw.cgstAmount,
        sgstAmount: raw.sgstAmount,
        serviceChargeAmount: raw.serviceChargeAmount,
        deliveryCharge: raw.deliveryCharge ?? raw.deliveryDetails?.charge ?? 0,
        deliveryDetails: raw.deliveryDetails,
        invoiceNumber: raw.invoiceNumber,
        paymentStatus: raw.paymentStatus,
        paymentMethod: raw.paymentMethod,
        specialInstructions: raw.specialInstructions,
    };
}