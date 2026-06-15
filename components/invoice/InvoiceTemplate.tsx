import { useAuthStore } from "@/store/useAuthStore";
import "@/styles/print.css";
import React, { forwardRef } from "react";

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

  specialInstructions?: string;

  customer: Customer;

  items: OrderItem[];

  subtotal: number;

  cgstAmount: number;

  sgstAmount: number;

  serviceChargeAmount: number;

  total: number;
}

interface Props {
  order: Order;

  restaurantName: string;
}

const InvoiceTemplate = forwardRef<HTMLDivElement, Props>(
  ({ order, restaurantName }, ref) => {
    const { restaurant } = useAuthStore();

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
        className="bg-white text-black w-full p-2 text-xs"
      >
        {/* ================= RESTAURANT HEADER ================= */}
        <div className="text-center border-b-2 border-dashed pb-4">
          {/* LOGO */}
          {restaurant?.logo && (
            <div className="flex justify-center mb-3">
              <img
                src={restaurant.logo}
                alt={restaurantName}
                className="h-10 w-10 object-cover rounded-full border"
              />
            </div>
          )}

          {/* NAME */}
          <h1 className="text-lg font-bold uppercase">
            {restaurantName}
          </h1>

          {/* ADDRESS */}
          <div className="mt-2 text-xs text-gray-700 leading-5">
            <p>
              {restaurant?.address?.street}, {restaurant?.address?.city},{" "}
              {restaurant?.address?.state} - {restaurant?.address?.pincode}
            </p>

            <p>Phone: {restaurant?.contactPhone || "-"}</p>

            <p>Email: {restaurant?.contactEmail || "-"}</p>
          </div>

          {/* LEGAL INFO */}
          <div className="mt-3 text-xs space-y-1">
            <p>
              <span className="font-semibold">GSTIN:</span>{" "}
              {restaurant?.legal?.gstNumber || "N/A"}
            </p>

            <p>
              <span className="font-semibold">FSSAI:</span>{" "}
              {restaurant?.legal?.fssaiNumber || "N/A"}
            </p>
          </div>

          {/* TITLE */}
          <div className="mt-4">
            <h2 className="font-bold text-lg tracking-wide">TAX INVOICE</h2>

            <p className="text-xs text-gray-500">Original Copy for Recipient</p>
          </div>
        </div>

        {/* ================= ORDER INFORMATION ================= */}
        <div className="flex justify-between gap-6 py-4 border-b border-dashed">
          <div className="space-y-1">
            <p>
              <span className="font-semibold">Invoice No:</span>{" "}
              {order.invoiceNumber}
            </p>

            <p>
              <span className="font-semibold">Order No:</span>{" "}
              {order.orderNumber}
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
            <p>
              <span className="font-semibold">Order Type:</span>{" "}
              {order.orderType?.toUpperCase() || "Dine-in"}
            </p>
            <p>
              <span className="font-semibold">Status:</span>{" "}
              {order.status || "Completed"}
            </p>
          </div>
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
