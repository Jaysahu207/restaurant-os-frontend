import { useAuthStore } from "@/store/useAuthStore";
import "@/styles/print.css";
import React, { forwardRef } from "react";
import type { PrinterSize } from "@/utils/printConfig";

interface Addon {
  name: string;
  price: number;
}

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
  variant?: string;
  addons?: Addon[];
  specialInstructions?: string;
}

interface Customer {
  name: string;
  phone: string;
  email?: string;
}

interface Order {
  orderNumber: string;
  invoiceNumber: string;
  createdAt: string;
  table?: string;
  status?: string;
  orderType?: string;
  paymentStatus?: string;
  paymentMethod?: string;
  deliveryDetails?: {
    address: string;
    landmark?: string;
    city?: string;
    pincode?: string;
    charge: number;
  };
  specialInstructions?: string;
  customer?: Customer;
  items: OrderItem[];
  subtotal: number;
  cgstAmount: number;
  sgstAmount: number;
  serviceChargeAmount: number;
  total: number;
}

interface Props {
  order: Order;
  printerSize?: PrinterSize; // NEW
  restaurantName: string;
}

const InvoiceTemplate = forwardRef<HTMLDivElement, Props>(
  ({ order, restaurantName, printerSize = "80mm" }, ref) => {
    const { restaurant } = useAuthStore();
    const width = printerSize === "58mm" ? "58mm" : "80mm";

    const formatCurrency = (amount: number) => {
      return `₹${(amount || 0).toFixed(2)}`;
    };

    const totalItems = order.items.reduce(
      (acc, item) => acc + item.quantity,
      0,
    );

    return (
      <div
        ref={ref}
        id="invoice-print"
        className="bg-white text-black"
        style={{
          width,
          maxWidth: width,
          minWidth: width,
          padding: printerSize === "58mm" ? "2mm" : "3mm",
          boxSizing: "border-box",
          margin: "0 auto",
        }}
      >
        {/* ================= RESTAURANT HEADER ================= */}
        <div className="border-b border-dashed pb-2 text-center">
          {restaurant?.logo && (
            <img
              src={restaurant.logo}
              alt={restaurantName}
              className="mx-auto mb-1 h-8 w-8 rounded-full border object-cover"
            />
          )}

          <h1 className="text-base font-bold uppercase leading-none">
            {restaurantName}
          </h1>

          <p className="mt-1 text-[11px] leading-4 text-gray-700">
            {restaurant?.address?.street}, {restaurant?.address?.city},{" "}
            {restaurant?.address?.state} - {restaurant?.address?.pincode}
          </p>

          <p className="text-[11px] leading-4 text-gray-700">
            {restaurant?.contactPhone || "-"} |{" "}
            {restaurant?.contactEmail || "-"}
          </p>

          <p className="text-[11px] leading-4 text-gray-700">
            GST: {restaurant?.legal?.gstNumber || "N/A"} &nbsp;|&nbsp; FSSAI:{" "}
            {restaurant?.legal?.fssaiNumber || "N/A"}
          </p>

          <div className="mt-2 border-t border-dashed pt-1">
            <h2 className="text-sm font-bold tracking-wide">TAX INVOICE</h2>
            <p className="text-[10px] text-gray-500">
              Original Copy for Recipient
            </p>
          </div>
        </div>

        {/* ================= ORDER INFORMATION ================= */}
        <div className="border-b border-dashed py-2 text-sm">
          <div className="grid grid-cols-2 gap-x-6 ">
            <div className="space-y-1">
              <p>
                <span className="font-semibold">Invoice:</span>{" "}
                {order.invoiceNumber}
              </p>

              <p>
                <span className="font-semibold">Order:</span> #
                {order.orderNumber.slice(-3)}
              </p>

              {order.orderType === "dine_in" && order.table && (
                <p>
                  <span className="font-semibold">Table:</span> {order.table}
                </p>
              )}
            </div>

            <div className="space-y-1 text-right">
              <p>
                <span className="font-semibold">Date:</span>{" "}
                {new Date(order.createdAt).toLocaleDateString()}
              </p>

              <p>
                <span className="font-semibold">Time:</span>{" "}
                {new Date(order.createdAt).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>

              <p className="capitalize">
                <span className="font-semibold">Type:</span>{" "}
                {order.orderType?.replace("_", " ")}
              </p>
            </div>
          </div>

          {order.orderType === "delivery" && (
            <div className="mt-2 border-t border-dashed pt-2">
              <span className="font-semibold">Address:</span>{" "}
              {[
                order.deliveryDetails?.address,
                order.deliveryDetails?.landmark,
                order.deliveryDetails?.city,
                order.deliveryDetails?.pincode,
              ]
                .filter(Boolean)
                .join(", ")}
            </div>
          )}
        </div>

        {/* ================= CUSTOMER DETAILS ================= */}
        <div className="py-4 border-b border-dashed">
          <h3 className="font-bold text-sm mb-2 uppercase">Customer Details</h3>

          <div className="grid grid-cols-2 gap-2 text-sm">
            <p>
              <span className="text-gray-600">Name:</span>{" "}
              {order.customer?.name || "Guest"}
            </p>

            <p>
              <span className="text-gray-600">Phone:</span>{" "}
              {order.customer?.phone || "-"}
            </p>

            {order.customer?.email && (
              <p className="col-span-2">
                <span className="text-gray-600">Email:</span>{" "}
                {order.customer.email}
              </p>
            )}
          </div>
        </div>

        {/* ================= ITEMS TABLE ================= */}
        <div className="py-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-t border-dashed">
                <th className="py-2 text-left font-bold">Item</th>
                <th className="py-2 text-center font-bold w-10">Qty</th>
                <th className="py-2 text-right font-bold w-14">Rate</th>
                <th className="py-2 text-right font-bold w-14">Amount</th>
              </tr>
            </thead>

            <tbody>
              {order.items.map((item, index) => {
                const addonsTotal =
                  item.addons?.reduce((acc, addon) => acc + addon.price, 0) ||
                  0;

                const itemTotal = (item.price + addonsTotal) * item.quantity;

                return (
                  <tr key={index} className="border-b border-dashed align-top">
                    <td className="py-2 pr-1 break-all">
                      <div className="font-medium">{item.name}</div>

                      {item.variant && (
                        <div className="text-xs text-gray-500 mt-1">
                          Variant: {item.variant}
                        </div>
                      )}

                      {item.addons && item.addons.length > 0 && (
                        <div className="text-xs text-gray-500 mt-1">
                          Addons:
                          {item.addons.map((addon: Addon, idx: number) => (
                            <span key={idx}>
                              {" "}
                              {addon.name} (+₹
                              {addon.price.toFixed(2)})
                              {idx !== item.addons!.length - 1 && ","}
                            </span>
                          ))}
                        </div>
                      )}

                      {item.specialInstructions && (
                        <div className="text-xs italic text-gray-500 mt-1">
                          Note: {item.specialInstructions}
                        </div>
                      )}
                    </td>

                    <td className="py-3 text-center">{item.quantity}</td>

                    <td className="py-3 text-right whitespace-nowrap">
                      {formatCurrency(item.price)}
                    </td>

                    <td className="py-3 text-right font-medium">
                      {formatCurrency(itemTotal)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* ================= BILL SUMMARY ================= */}
        <div className="border-t border-dashed pt-4">
          <div className="ml-auto max-w-sm space-y-2">
            <div className="flex justify-between">
              <span>Items ({totalItems})</span>
              <span>{formatCurrency(order.subtotal)}</span>
            </div>

            {(order.cgstAmount || 0) > 0 && (
              <div className="flex justify-between">
                <span>CGST</span>
                <span>{formatCurrency(order.cgstAmount)}</span>
              </div>
            )}

            {(order.sgstAmount || 0) > 0 && (
              <div className="flex justify-between">
                <span>SGST</span>
                <span>{formatCurrency(order.sgstAmount)}</span>
              </div>
            )}

            {(order.serviceChargeAmount || 0) > 0 && (
              <div className="flex justify-between">
                <span>Service Charge</span>
                <span>{formatCurrency(order.serviceChargeAmount)}</span>
              </div>
            )}

            <div className="border-t border-dashed pt-3 flex justify-between text-lg font-bold">
              <span>GRAND TOTAL</span>
              <span>{formatCurrency(order.total)}</span>
            </div>
          </div>
        </div>

        {/* ================= PAYMENT SECTION ================= */}
        <div className="border-t border-dashed mt-5 pt-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="font-semibold mb-1">Payment Method</p>
              <p className="uppercase">{order.paymentMethod || "Cash"}</p>
            </div>

            <div className="text-right">
              <p className="font-semibold mb-1">Payment Status</p>
              <p className="uppercase">{order.paymentStatus || "Pending"}</p>
            </div>
          </div>
        </div>

        {/* ================= SPECIAL NOTE ================= */}
        {order.specialInstructions && (
          <div className="border-t border-dashed mt-5 pt-4">
            <h3 className="font-semibold mb-2">Special Instructions</h3>
            <p className="italic text-gray-600 text-sm">
              {order.specialInstructions}
            </p>
          </div>
        )}

        {/* ================= FOOTER ================= */}
        <div className="border-t-2 border-dashed mt-6 pt-5 text-center">
          <p className="font-semibold text-base">Thank You, Visit Again 🙏</p>
          <p className="text-xs text-gray-500 mt-2">
            This is a computer-generated invoice.
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Goods once sold will not be taken back.
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Please retain invoice for future reference.
          </p>
        </div>
      </div>
    );
  },
);

export default InvoiceTemplate;