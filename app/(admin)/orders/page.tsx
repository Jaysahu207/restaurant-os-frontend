"use client";


import InvoiceTemplate from "@/components/invoice/InvoiceTemplate";
import {
  getISTDateString,
  mapOrder,
  orderKeys,
  useOrders,
  useUpdateOrderStatus,
  useVerifyPayment,
  type Order,
  type OrderStatus,
} from "@/hooks/useOrders";
import { printKOT } from "@/services/orderService";
import { useAuthStore } from "@/store/useAuthStore";
import { useNotificationStore } from "@/store/useNotificationStore";
import { useQueryClient } from "@tanstack/react-query";
import {
  Calendar,
  CheckCircle,
  ChefHat,
  Clock,
  Eye,
  Filter,
  Printer,
  RefreshCw,
  Search,
  ShoppingBag,
  TableIcon,
  Truck,
  User,
  X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { useReactToPrint } from "react-to-print";
import { io, Socket } from "socket.io-client";
import { getPageStyle, applyPrintBodyClass, clearPrintBodyClass, PrinterSize } from "@/utils/printConfig";
const statusColors: Record<OrderStatus, string> = {
  pending: "bg-yellow-100 text-yellow-700 border-yellow-200",
  preparing: "bg-blue-100 text-blue-700 border-blue-200",
  ready: "bg-green-100 text-green-700 border-green-200",
  served: "bg-purple-100 text-purple-700 border-purple-200",
  paid: "bg-emerald-100 text-emerald-700 border-emerald-200",
  out_for_delivery: "bg-indigo-100 text-indigo-700 border-indigo-200",
  delivered: "bg-slate-100 text-slate-600 border-slate-200",
  completed: "bg-gray-100 text-gray-700 border-gray-200",
  cancelled: "bg-red-100 text-red-700 border-red-200",
};

const statusLabels: Record<OrderStatus | "all", string> = {
  all: "All Orders",
  pending: "Pending",
  preparing: "Preparing",
  ready: "Ready",
  served: "Served",
  paid: "Paid",
  completed: "Completed",
  out_for_delivery: "Out for Delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

// ==================== Main Component ====================
export default function OrdersPage() {
  const { restaurant } = useAuthStore();
  const restaurantId = restaurant?._id;
  const queryClient = useQueryClient();
  const clearOrders = useNotificationStore((state) => state.clearOrders);

  const [filter, setFilter] = useState<OrderStatus | "all">("all");
  const [search, setSearch] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [kotModalOpen, setKotModalOpen] = useState(false);
  const [kotData, setKotData] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState(getISTDateString());

  const {
    data: orders = [],
    isLoading,
    isFetching,
    refetch,
  } = useOrders(restaurantId, selectedDate);
  const updateStatusMutation = useUpdateOrderStatus(restaurantId, selectedDate);
  const verifyPaymentMutation = useVerifyPayment();

  // Mark unread order badge as seen once the owner actually opens this page.
  useEffect(() => {
    clearOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRefresh = () => {
    refetch();
  };


  const updateOrderStatus = (orderId: string, newStatus: OrderStatus) => {
    updateStatusMutation.mutate(
      { orderId, status: newStatus },
      {
        onSuccess: () => {
          if (selectedOrder?.id === orderId) {
            setSelectedOrder((prev) =>
              prev ? { ...prev, status: newStatus } : prev,
            );
          }
          toast.success(`Order status updated to ${statusLabels[newStatus]}`);
        },
        onError: () => {
          toast.error("Failed to update status");
        },
      },
    );
  };

  const filteredOrders = orders
    .filter(
      (order = { status: "all" }) =>
        filter === "all" || order.status === filter,
    )
    .filter(
      (order = { id: "", orderNumber: "", customer: { name: "" } }) =>
        order.id.toLowerCase().includes(search.toLowerCase()) ||
        order.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
        order.customer.name.toLowerCase().includes(search.toLowerCase()),
    );

  const stats = {
    total: orders.length,
    pending: orders.filter((o: any) => o.status === "pending").length,
    preparing: orders.filter((o: any) => o.status === "preparing").length,
    ready: orders.filter((o: any) => o.status === "ready").length,
    served: orders.filter((o: any) => o.status === "served").length,
    paid: orders.filter((o: any) => o.status === "paid").length,
    completed: orders.filter((o: any) => o.status === "completed").length,
    cancelled: orders.filter((o: any) => o.status === "cancelled").length,
  };

  const openDetail = (order: Order) => {
    setSelectedOrder(order);
    setDetailModalOpen(true);
  };

  const openKOT = async (order: Order) => {
    try {
      const kot = await printKOT(order.id);
      setKotData(kot);
      setKotModalOpen(true);
    } catch (err) {
      toast.error("Failed to load KOT");
    }
  };

  const clearFilters = () => {
    setSearch("");
    setFilter("all");
    setSelectedDate(getISTDateString());
  };

  const handleVerifyPayment = (orderId: string) => {
    verifyPaymentMutation.mutate(orderId, {
      onSuccess: () => updateOrderStatus(orderId, "completed"),
      onError: () => toast.error("Payment verification failed"),
    });
  };

  if (isLoading) {
    return <OrdersSkeleton />;
  }

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-8xl mx-auto shadow-sm  bg-gray-50">
      {/* Header */}
      {/* Header */}
      <div className="rounded-xl border border-gray-100 bg-white px-3 py-3 shadow-sm sm:px-5 sm:py-4">
        {/* Top Row */}
        <div className="flex items-start justify-between gap-3">
          {/* Title Section */}
          <div className="min-w-0">
            <h1 className="text-lg font-bold tracking-tight text-gray-800 sm:text-xl lg:text-2xl">
              Order Management
            </h1>

            <p className="mt-1 truncate text-xs text-gray-500 sm:text-sm">
              {filteredOrders.length} order
              {filteredOrders.length !== 1 ? "s" : ""} •{" "}
              {new Date().toLocaleDateString("en-IN", {
                weekday: "short",
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </p>
          </div>

          {/* Refresh Button */}
          <button
            onClick={handleRefresh}
            disabled={isFetching}
            className="
        relative
        flex
        h-9
        w-9
        shrink-0
        items-center
        justify-center
        rounded-lg
        text-gray-600
        transition
        hover:bg-gray-100
        disabled:opacity-50

        sm:h-10
        sm:w-10
        sm:rounded-xl
      "
            title="Refresh orders"
          >
            <RefreshCw
              className={`
          h-4
          w-4
          sm:h-5
          sm:w-5
          ${isFetching
                  ? "animate-spin"
                  : "transition-transform duration-500 hover:rotate-180"
                }
        `}
            />

            {isFetching && (
              <span className="absolute bottom-1 right-1 h-1.5 w-1.5 rounded-full bg-blue-500 animate-ping" />
            )}
          </button>
        </div>

        {/* Filter Badge */}
        {filter !== "all" && (
          <div className="mt-3">
            <span className="inline-flex rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-medium text-blue-700 sm:px-3 sm:text-xs">
              Filtered: {filter}
            </span>
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3 md:grid-cols-3 lg:grid-cols-6">
        <StatCard
          label="Total Orders"
          value={stats.total}
          icon={Clock}
          color="bg-blue-500"
        />

        <StatCard
          label="Pending"
          value={stats.pending}
          icon={Clock}
          color="bg-yellow-500"
          highlight={stats.pending > 0}
        />

        <StatCard
          label="Preparing"
          value={stats.preparing}
          icon={ChefHat}
          color="bg-indigo-500"
        />

        <StatCard
          label="Ready"
          value={stats.ready}
          icon={CheckCircle}
          color="bg-green-500"
          highlight={stats.ready > 0}
        />

        <StatCard
          label="Served"
          value={stats.served}
          icon={CheckCircle}
          color="bg-purple-500"
        />

        <StatCard
          label="Completed"
          value={stats.completed}
          icon={CheckCircle}
          color="bg-gray-500"
        />
      </div>

      {/* Filters */}
      <div className="rounded-xl bg-white p-3 shadow-sm">
        {/* Search + Date */}
        <div className="flex flex-col gap-2 sm:flex-row">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

            <input
              type="text"
              placeholder="Search order..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="
          h-9
          w-full
          rounded-lg
          border
          border-gray-300
          bg-gray-50
          pl-9
          pr-3
          text-xs
          text-gray-700
          focus:border-orange-500
          focus:ring-2
          focus:ring-orange-100
        "
            />
          </div>

          {/* Date Actions */}
          <div className="flex gap-2">
            <div className="relative flex-1 sm:flex-none">
              <Calendar className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />

              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="
            h-9
            w-full
            rounded-lg
            border
            border-gray-300
            pl-8
            pr-2
            text-xs
            text-gray-700
          "
              />
            </div>

            <button
              onClick={() => setSelectedDate(getISTDateString())}
              className="
          h-9
          rounded-lg
          bg-orange-500
          px-3
          text-xs
          font-medium
          text-white
          hover:bg-orange-600
        "
            >
              Today
            </button>

            <button
              onClick={() => setSelectedDate("")}
              className="
          h-9
          rounded-lg
          bg-gray-100
          px-3
          text-xs
          font-medium
          text-gray-700
          hover:bg-gray-200
        "
            >
              All
            </button>
          </div>
        </div>

        {/* Status Filters */}
        <div className="mt-3 flex items-center gap-2 ">
          <div
            className="flex flex-1
    gap-1.5
    overflow-x-auto
    pb-1
    [-ms-overflow-style:none]
    [scrollbar-width:none]
    [&::-webkit-scrollbar]:hidden
  "
          >
            {(
              [
                "all",
                "pending",
                "preparing",
                "ready",
                "served",
                "completed",
                "cancelled",
              ] as const
            ).map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`
            flex
            shrink-0
            items-center
            gap-1
            rounded-full
            px-3
            py-1.5
            text-[11px]
            font-medium
            capitalize
            transition

            ${filter === status
                    ? "bg-orange-500 text-white shadow-sm"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }
          `}
              >
                {statusLabels[status]}

                {status !== "all" && (
                  <span
                    className={`
                rounded-full
                px-1.5
                text-[10px]

                ${filter === status
                        ? "bg-white/20 text-white"
                        : "bg-gray-200 text-gray-600"
                      }
              `}
                  >
                    {stats[status]}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Clear */}
          {(search ||
            filter !== "all" ||
            selectedDate !== getISTDateString()) && (
              <button
                onClick={clearFilters}
                className="
          flex
          shrink-0
          items-center
          gap-1
          rounded-lg
          px-2
          py-1.5
          text-xs
          text-gray-600
          hover:bg-gray-100
        "
              >
                <X className="h-3.5 w-3.5" />SsSS
                Clear
              </button>
            )}
        </div>
      </div>

      {/* Orders List */}
      <div className="rounded-xl p-2 sm:p-4">
        {filteredOrders.length === 0 ? (
          <div className="rounded-xl border border-gray-100 bg-white p-8 text-center shadow-sm sm:p-12">
            <div className="mx-auto max-w-md">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 sm:h-16 sm:w-16">
                <Filter className="h-6 w-6 text-gray-400 sm:h-8 sm:w-8" />
              </div>

              <h3 className="mb-1 text-base font-medium text-gray-800 sm:text-lg">
                No orders found
              </h3>

              <p className="text-xs text-gray-500 sm:text-sm">
                {search ||
                  filter !== "all" ||
                  selectedDate !== getISTDateString()
                  ? "Try adjusting your filters or search criteria."
                  : "Waiting for new orders to arrive."}
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="mb-2 text-xs text-gray-500 sm:text-sm">
              Showing {filteredOrders.length} order
              {filteredOrders.length !== 1 ? "s" : ""}
            </div>

            <div
              className="
          grid
          grid-cols-2
          gap-3

          sm:grid-cols-2
          lg:grid-cols-3
          2xl:grid-cols-4
        "
            >
              {filteredOrders.map((order: Order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  onViewDetails={() => openDetail(order)}
                  onKOT={() => openKOT(order)}
                  onUpdateStatus={(newStatus) =>
                    updateOrderStatus(order.id, newStatus)
                  }
                  onVerifyPayment={() => handleVerifyPayment(order.id)}
                />
              ))}
            </div>
          </>
        )}
      </div>
      {/* Modals */}
      {detailModalOpen && selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          onClose={() => setDetailModalOpen(false)}
          onUpdateStatus={(newStatus) =>
            updateOrderStatus(selectedOrder.id, newStatus)
          }
          restaurantName={restaurant?.name}
        />
      )}
      {kotModalOpen && kotData && (
        <KOTModal
          kot={kotData}
          restaurantName={restaurant?.name}
          onClose={() => setKotModalOpen(false)}
        />
      )}
    </div>
  );
}

// ==================== Loading Skeleton ====================
function OrdersSkeleton() {
  return (
    <div className="space-y-6 p-4 md:p-6 max-w-7xl mx-auto animate-pulse">
      <div className="h-8 w-48 bg-gray-200 rounded" />
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-white p-4 rounded-xl shadow-sm">
            <div className="flex justify-between">
              <div className="space-y-2">
                <div className="h-3 w-16 bg-gray-200 rounded" />
                <div className="h-6 w-8 bg-gray-200 rounded" />
              </div>
              <div className="h-8 w-8 bg-gray-200 rounded-full" />
            </div>
          </div>
        ))}
      </div>
      <div className="bg-white p-4 rounded-xl shadow-sm space-y-4">
        <div className="h-10 bg-gray-200 rounded-lg w-full" />
        <div className="flex gap-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-8 w-20 bg-gray-200 rounded-lg" />
          ))}
        </div>
      </div>
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white p-4 rounded-xl shadow-sm">
            <div className="flex justify-between">
              <div className="space-y-2 flex-1">
                <div className="h-4 w-32 bg-gray-200 rounded" />
                <div className="h-3 w-48 bg-gray-200 rounded" />
              </div>
              <div className="h-8 w-24 bg-gray-200 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ==================== Stat Card ====================
// ==================== Stat Card ====================
function StatCard({
  label,
  value,
  icon: Icon,
  color,
  highlight = false,
}: {
  label: string;
  value: number;
  icon: any;
  color: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`
        rounded-lg 
        border 
        bg-white 
        p-2
        shadow-sm
        transition
        hover:shadow-md

        sm:p-3
        lg:p-4

        ${highlight
          ? "border-orange-200 ring-1 ring-orange-200"
          : "border-gray-100"
        }
      `}
    >
      <div className="flex items-center justify-between gap-1">
        {/* Text */}
        <div className="min-w-0">
          <p className="truncate text-[9px] font-medium text-gray-500 sm:text-xs">
            {label}
          </p>

          <p className="text-base font-bold text-gray-800 sm:text-xl lg:text-2xl">
            {value}
          </p>
        </div>

        {/* Icon */}
        <div
          className={`
            flex
            h-6
            w-6
            shrink-0
            items-center
            justify-center
            rounded-full
            text-white

            sm:h-8
            sm:w-8

            lg:h-10
            lg:w-10

            ${color}
          `}
        >
          <Icon className="h-3 w-3 sm:h-4 sm:w-4" />
        </div>
      </div>
    </div>
  );
}

function OrderCard({
  order,
  onViewDetails,
  onKOT,
  onUpdateStatus,
  onVerifyPayment,
}: {
  order: Order;
  onViewDetails: () => void;
  onKOT: () => void;
  onUpdateStatus: (status: OrderStatus) => void;
  onVerifyPayment: () => void;
}) {
  const allStatuses: OrderStatus[] =
    order.orderType === "delivery"
      ? [
        "pending",
        "preparing",
        "out_for_delivery",
        "delivered",
        "completed",
        "cancelled",
      ]
      : [
        "pending",
        "preparing",
        "ready",
        "served",
        "paid",
        "completed",
        "cancelled",
      ];

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl bg-white shadow-sm transition hover:shadow-md">
      {/* Status line */}
      <div
        className={`h-1 w-full ${statusColors[order.status].split(" ")[0]}`}
      />

      <div className="flex flex-1 flex-col gap-3 p-3 sm:gap-5 sm:p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="font-mono text-xs font-bold text-gray-900 sm:text-sm">
              #{order.orderNumber?.slice(-3)}
            </span>

            <span
              className={`
                rounded-full 
                border
                px-2
                py-0.5
                text-[10px]
                font-semibold
                sm:text-xs
                ${statusColors[order.status]}
              `}
            >
              {statusLabels[order.status]}
            </span>

            <span className="flex items-center gap-1 text-[10px] text-gray-500 sm:text-xs">
              <Clock className="h-3 w-3" />
              {new Date(order.createdAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>

          {/* Actions */}
          <div className="flex gap-1">
            <button
              onClick={onViewDetails}
              className="rounded-lg p-1.5 text-blue-600 hover:bg-blue-50"
            >
              <Eye className="h-4 w-4" />
            </button>

            <button
              onClick={onKOT}
              className="rounded-lg p-1.5 text-indigo-600 hover:bg-indigo-50"
            >
              <Printer className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Customer + Billing */}
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {/* Customer */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-sm font-medium text-gray-800">
              <User className="h-3.5 w-3.5 text-gray-400" />
              <span className="truncate">{order.customer.name}</span>
            </div>

            <div className="flex flex-wrap gap-3 text-[11px] text-gray-500">
              {order.orderType === "delivery" ? (
                <span className="flex items-center gap-1">
                  <Truck className="h-3 w-3" />
                  Delivery
                </span>
              ) : order.orderType === "takeaway" ? (
                <span className="flex items-center gap-1">
                  <ShoppingBag className="h-3 w-3" />
                  Takeaway
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <TableIcon className="h-3 w-3" />
                  Table {order.table}
                </span>
              )}

              <span>{order.items.length} items</span>
            </div>

            {order.specialInstructions && (
              <p className="line-clamp-1 text-[11px] italic text-gray-400">
                💬 {order.specialInstructions}
              </p>
            )}

            {order.orderType === "delivery" &&
              order.deliveryDetails?.address && (
                <div className="rounded-md bg-orange-50 px-2 py-1.5 text-[11px] text-gray-600">
                  📍 {order.deliveryDetails.address}
                </div>
              )}
          </div>

          {/* Billing */}
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-2.5 text-xs space-y-1 sm:p-4">
            <div className="flex justify-between text-gray-500">
              <span>Subtotal</span>
              <span>₹{order.subtotal.toFixed(0)}</span>
            </div>

            {order.cgstAmount > 0 && (
              <div className="flex justify-between text-gray-500">
                <span>CGST</span>
                <span>₹{order.cgstAmount.toFixed(0)}</span>
              </div>
            )}

            {order.sgstAmount > 0 && (
              <div className="flex justify-between text-gray-500">
                <span>SGST</span>
                <span>₹{order.sgstAmount.toFixed(0)}</span>
              </div>
            )}

            <div className="mt-1 flex justify-between border-t pt-1.5 font-bold text-gray-800">
              <span>Total</span>

              <span>₹{order.total.toFixed(0)}</span>
            </div>
          </div>
        </div>

        {/* Bottom actions */}
        <div className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t pt-2">
          <div className="flex flex-wrap gap-2">
            <select
              value={order.status}
              onChange={(e) => onUpdateStatus(e.target.value as OrderStatus)}
              className="
                h-8
                rounded-lg
                border
                border-gray-300
                bg-white
                px-2
                text-xs
              "
            >
              {allStatuses.map((status) => (
                <option key={status} value={status}>
                  {statusLabels[status]}
                </option>
              ))}
            </select>

            {order.paymentStatus === "paid" && order.status !== "completed" && (
              <button
                onClick={onVerifyPayment}
                className="
                  h-8
                  rounded-lg
                  bg-green-600
                  px-2.5
                  text-xs
                  font-medium
                  text-white
                "
              >
                Verify
              </button>
            )}
          </div>

          <div className="flex gap-1.5">
            {order.paymentMethod && (
              <span
                className="
                rounded-full
                bg-green-100
                px-2
                py-1
                text-[10px]
                font-medium
                text-green-700
              "
              >
                {order.paymentMethod.toUpperCase()}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}



// ==================== Order Detail Modal (with full tax breakdown & print) ====================




function OrderDetailModal({
  order,
  onClose,
  onUpdateStatus,
  restaurantName = "Your Restaurant",
}: {
  order: Order;
  onClose: () => void;
  onUpdateStatus: (status: OrderStatus) => void;
  restaurantName?: string;
}) {
  const printRef = useRef<HTMLDivElement>(null);
  const [printerSize, setPrinterSize] = useState<PrinterSize>("80mm");

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Invoice-${order.invoiceNumber}`,
    pageStyle: getPageStyle(printerSize),
    onBeforePrint: () => {
      applyPrintBodyClass(printerSize);
      return Promise.resolve();
    },
    onAfterPrint: () => {
      clearPrintBodyClass();
    },
  });

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 no-print"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-800">Order Details</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Printer size toggle */}
        <div className="px-6 pt-4 flex items-center gap-2 text-sm">
          <span className="text-gray-500">Printer size:</span>
          <button
            onClick={() => setPrinterSize("58mm")}
            className={`px-3 py-1 rounded-full border transition ${printerSize === "58mm"
              ? "bg-indigo-600 text-white border-indigo-600"
              : "border-gray-300 text-gray-600 hover:bg-gray-50"
              }`}
          >
            58mm
          </button>
          <button
            onClick={() => setPrinterSize("80mm")}
            className={`px-3 py-1 rounded-full border transition ${printerSize === "80mm"
              ? "bg-indigo-600 text-white border-indigo-600"
              : "border-gray-300 text-gray-600 hover:bg-gray-50"
              }`}
          >
            80mm
          </button>
        </div>

        <div id="order-detail-print" className="p-6 space-y-6">
          <InvoiceTemplate
            ref={printRef}
            order={order}
            restaurantName={restaurantName}
            printerSize={printerSize}
          />
        </div>

        <div className="border-t px-6 py-4 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
          >
            Close
          </button>
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition flex items-center gap-2"
          >
            <Printer className="w-4 h-4" /> Print
          </button>
        </div>
      </div>
    </div>
  );
}

function KOTModal({
  kot,
  onClose,
  restaurantName = "Your Restaurant",
}: {
  kot: any;
  onClose: () => void;
  restaurantName?: string;
}) {
  const printRef = useRef<HTMLDivElement>(null);
  const [printerSize, setPrinterSize] = useState<PrinterSize>("80mm");

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `KOT-${kot.orderNumber}-Batch-${kot.batch}`,
    pageStyle: getPageStyle(printerSize),
    onBeforePrint: () => {
      applyPrintBodyClass(printerSize);
      return Promise.resolve();
    },
    onAfterPrint: () => {
      clearPrintBodyClass();
      onClose();
    },
  });

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl max-w-sm w-full"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-800">
            Kitchen Order Ticket
          </h3>

          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Printer size toggle */}
        <div className="px-6 pt-4 flex items-center gap-2 text-sm">
          <span className="text-gray-500">Printer size:</span>
          <button
            onClick={() => setPrinterSize("58mm")}
            className={`px-3 py-1 rounded-full border transition ${printerSize === "58mm"
              ? "bg-blue-600 text-white border-blue-600"
              : "border-gray-300 text-gray-600 hover:bg-gray-50"
              }`}
          >
            58mm
          </button>
          <button
            onClick={() => setPrinterSize("80mm")}
            className={`px-3 py-1 rounded-full border transition ${printerSize === "80mm"
              ? "bg-blue-600 text-white border-blue-600"
              : "border-gray-300 text-gray-600 hover:bg-gray-50"
              }`}
          >
            80mm
          </button>
        </div>

        {/* Printable Area */}
        <div ref={printRef} id="kot-print" className="px-3 py-3 space-y-3 mt-2">
          <div className="text-center">
            <h2 className="text-xl font-bold">{restaurantName}</h2>

            <p className="text-sm font-mono">
              KOT #{kot.orderNumber.slice(-3)}
            </p>

            <p className="font-bold text-base">Batch #{kot.batch}</p>

            <p className="text-sm">
              {new Date(kot.createdAt).toLocaleString()}
            </p>

            <p className="text-sm uppercase font-semibold">
              {kot.orderType.replace("_", " ")}
            </p>

            {kot.orderType === "dine_in" && kot.tableNumber && (
              <p className="font-medium">Table : {kot.tableNumber}</p>
            )}
          </div>

          <div className="border-y border-dashed py-3 space-y-2">
            {kot.items.map((item: any) => (
              <div key={item._id ?? item.name} className="flex gap-2">
                <span className="font-bold min-w-7">{item.quantity}x</span>

                <span className="flex-1 wrap-break">{item.name}</span>
              </div>
            ))}
          </div>

          {kot.specialInstructions && (
            <div className="text-sm border-t border-dashed pt-3">
              <span className="font-semibold">Special Note:</span>

              <div className="italic mt-1">{kot.specialInstructions}</div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t p-4 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 border rounded-lg">
            Close
          </button>

          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2 hover:bg-blue-700"
          >
            <Printer className="w-4 h-4" />
            Print KOT
          </button>
        </div>
      </div>
    </div>
  );
}
