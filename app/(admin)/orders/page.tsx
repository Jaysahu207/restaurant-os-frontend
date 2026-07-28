"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Search,
  Clock,
  CheckCircle,
  ChefHat,
  Eye,
  Printer,
  Filter,
  X,
  RefreshCw,
  Calendar,
  TableIcon,
  User,
  Truck,
  ShoppingBag,
} from "lucide-react";
import { printKOT } from "@/services/orderService";
import { io, Socket } from "socket.io-client";
import { useAuthStore } from "@/store/useAuthStore";
import toast from "react-hot-toast";
import InvoiceTemplate from "@/components/invoice/InvoiceTemplate";
import { useReactToPrint } from "react-to-print";
import { useNotificationStore } from "@/store/useNotificationStore";
import { useQueryClient } from "@tanstack/react-query";
import {
  useOrders,
  useUpdateOrderStatus,
  useVerifyPayment,
  mapOrder,
  orderKeys,
  type Order,
  type OrderStatus,
  getISTDateString,
} from "@/hooks/useOrders";

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
  const [soundEnabled] = useState(true);
  const [selectedDate, setSelectedDate] = useState(getISTDateString());

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const key = orderKeys.list(restaurantId ?? "", selectedDate);

  const { data: orders = [], isLoading, isFetching, refetch } = useOrders(
    restaurantId,
    selectedDate,
  );
  const updateStatusMutation = useUpdateOrderStatus(restaurantId, selectedDate);
  const verifyPaymentMutation = useVerifyPayment();

  useEffect(() => {
    clearOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRefresh = () => {
    refetch();
  };

  const playSound = useCallback(() => {
    if (!soundEnabled || !audioRef.current) return;
    audioRef.current.currentTime = 0;
    audioRef.current.play().catch((err) => console.warn("Audio play failed:", err));
  }, [soundEnabled]);

  useEffect(() => {
    audioRef.current = new Audio("/sounds/new-order.mp3");
    audioRef.current.load();
  }, []);

  useEffect(() => {
    const unlockAudio = () => {
      if (audioRef.current) {
        audioRef.current.play().then(() => audioRef.current?.pause()).catch(() => { });
      }
      window.removeEventListener("click", unlockAudio);
    };
    window.addEventListener("click", unlockAudio);
    return () => window.removeEventListener("click", unlockAudio);
  }, []);

  // Real-time socket connection — updates the React Query cache directly
  // instead of invalidating (so new/updated orders appear instantly, no refetch flash)
  useEffect(() => {
    if (!restaurantId) return;

    const socket: Socket = io(process.env.NEXT_PUBLIC_API_URL, {
      withCredentials: true,
      transports: ["websocket"],
    });

    socket.on("connect", () => {
      socket.emit("joinRestaurant", restaurantId);
    });

    socket.on("connect_error", (err) => {
      console.error("❌ Socket connection error:", err.message);
    });

    socket.on("NEW_ORDER", (newOrder: any) => {
      const orderDate = getISTDateString(new Date(newOrder.createdAt));
      if (selectedDate && orderDate !== selectedDate) return;

      const formattedOrder = mapOrder(newOrder);
      queryClient.setQueryData<Order[]>(key, (old) => {
        if (!old) return old;
        if (old.find((o) => o.id === formattedOrder.id)) return old;
        return [formattedOrder, ...old];
      });
      playSound();
      toast.success(`New order #${newOrder.orderNumber.slice(-3)} received!`);
    });

    socket.on("ORDER_UPDATED", (updatedOrder: any) => {
      queryClient.setQueryData<Order[]>(key, (old) =>
        old?.map((order) =>
          order.id === String(updatedOrder._id) ? mapOrder(updatedOrder) : order,
        ) ?? old,
      );
      playSound();
      toast.success(`Order #${updatedOrder.orderNumber.slice(-3)} updated!`);
    });

    socket.on("PAYMENT_UPDATED", (updatedOrder: any) => {
      queryClient.setQueryData<Order[]>(key, (old) =>
        old?.map((order) =>
          order.id === updatedOrder._id
            ? {
              ...order,
              paymentStatus: updatedOrder.paymentStatus,
              paymentMethod: updatedOrder.paymentMethod,
            }
            : order,
        ) ?? old,
      );
      toast.success(`Payment received for order #${updatedOrder._id.slice(-3)}`);
    });

    return () => {
      socket.disconnect();
    };
  }, [restaurantId, selectedDate, queryClient, playSound]);
  // Note: `key` intentionally omitted from deps — it's derived from
  // restaurantId/selectedDate which are already listed, and including
  // the array itself would reconnect the socket every render.

  const updateOrderStatus = (orderId: string, newStatus: OrderStatus) => {
    updateStatusMutation.mutate(
      { orderId, status: newStatus },
      {
        onSuccess: () => {
          if (selectedOrder?.id === orderId) {
            setSelectedOrder((prev) => (prev ? { ...prev, status: newStatus } : prev));
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
    .filter((order = { status: "all" }) => filter === "all" || order.status === filter)
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
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 tracking-tight">Order Management</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {filteredOrders.length} order{filteredOrders.length !== 1 ? "s" : ""} •{" "}
            {new Date().toLocaleDateString("en-IN", {
              weekday: "short",
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {filter !== "all" && (
            <span className="px-3 py-1 text-xs font-medium bg-blue-50 text-blue-700 rounded-full">
              Filtered: {filter}
            </span>
          )}
          <button
            onClick={handleRefresh}
            disabled={isFetching}
            className="relative p-2.5 text-gray-600 hover:bg-gray-100 rounded-xl transition disabled:opacity-50 group"
            title="Refresh orders"
          >
            <RefreshCw
              className={`w-5 h-5 ${isFetching ? "animate-spin" : "group-hover:rotate-180 transition-transform duration-500"}`}
            />
            {isFetching && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-blue-500 rounded-full animate-ping" />
            )}
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard label="Total Orders" value={stats.total} icon={Clock} color="bg-blue-500" />
        <StatCard label="Pending" value={stats.pending} icon={Clock} color="bg-yellow-500" highlight={stats.pending > 0} />
        <StatCard label="Preparing" value={stats.preparing} icon={ChefHat} color="bg-indigo-500" />
        <StatCard label="Ready" value={stats.ready} icon={CheckCircle} color="bg-green-500" highlight={stats.ready > 0} />
        <StatCard label="Served" value={stats.served} icon={CheckCircle} color="bg-purple-500" />
        <StatCard label="Completed" value={stats.completed} icon={CheckCircle} color="bg-gray-500" />
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by Order No. or Customer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
            <button
              onClick={() => setSelectedDate(getISTDateString())}
              className="px-3 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600"
            >
              Today
            </button>
            <button
              onClick={() => setSelectedDate("")}
              className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200"
            >
              All Dates
            </button>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {(["all", "pending", "preparing", "ready", "served", "completed", "cancelled"] as const).map(
              (status) => (
                <button
                  key={status}
                  onClick={() => setFilter(status)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium capitalize whitespace-nowrap transition flex items-center gap-2 ${filter === status
                    ? "bg-orange-500 text-white shadow-sm"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                >
                  {statusLabels[status]}
                  {status !== "all" && (
                    <span
                      className={`px-1.5 py-0.5 rounded-full text-xs ${filter === status ? "bg-white/20 text-white" : "bg-gray-200 text-gray-600"
                        }`}
                    >
                      {stats[status]}
                    </span>
                  )}
                </button>
              ),
            )}
          </div>
          {(search || filter !== "all" || selectedDate !== getISTDateString()) && (
            <button
              onClick={clearFilters}
              className="ml-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-800 flex items-center gap-1"
            >
              <X className="w-4 h-4" /> Clear
            </button>
          )}
        </div>
      </div>

      {/* Orders List */}
      <div className="space-y-4  p-4 rounded-xl shadow-sm">
        {filteredOrders.length === 0 ? (
          <div className="bg-white p-12 rounded-xl text-center shadow-sm border border-gray-100">
            <div className="max-w-md mx-auto">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Filter className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-800 mb-2">No orders found</h3>
              <p className="text-gray-500">
                {search || filter !== "all" || selectedDate !== getISTDateString()
                  ? "Try adjusting your filters or search criteria."
                  : "Waiting for new orders to arrive."}
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="text-sm text-gray-500 mb-2 ">
              Showing {filteredOrders.length} order{filteredOrders.length !== 1 ? "s" : ""}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4 ">
              {filteredOrders.map((order: Order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  onViewDetails={() => openDetail(order)}
                  onKOT={() => openKOT(order)}
                  onUpdateStatus={(newStatus) => updateOrderStatus(order.id, newStatus)}
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
          onUpdateStatus={(newStatus) => updateOrderStatus(selectedOrder.id, newStatus)}
          restaurantName={restaurant?.name}
        />
      )}
      {kotModalOpen && kotData && (
        <KOTModal kot={kotData} restaurantName={restaurant?.name} onClose={() => setKotModalOpen(false)} />
      )}
    </div>
  );
}

// ==================== Loading Skeleton, StatCard, OrderCard, OrderDetailModal, KOTModal ====================
// unchanged from your original file — none of them touch data fetching directly.
// Only the OrderCard's payment-verify button changes signature slightly:
// it now calls the `onVerifyPayment` prop instead of inlining the
// verifyPayment + updateOrderStatus calls itself, since that logic
// moved into the mutation hook on the page.
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
      className={`bg-white p-4 rounded-xl shadow-sm hover:shadow-md transition border ${highlight ? "border-orange-200 ring-1 ring-orange-200" : "border-gray-100"}`}
    >
      <div className="flex justify-between items-center">
        <div>
          <p className="text-xs text-gray-500">{label}</p>
          <p className="text-2xl font-bold text-gray-800">{value}</p>
        </div>
        <div className={`p-2 rounded-full ${color} text-white`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
    </div>
  );
}

// ==================== Order Card (Polished) ====================
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
    <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition h-full flex flex-col">
      {/* Top accent border based on status */}
      <div
        className={`h-1 w-full rounded-t-xl ${statusColors[order.status].split(" ")[0]}`}
      />

      <div className="p-5 flex flex-col gap-5 flex-1">
        {/* ---------- TOP ROW: Order ID, status, time & quick actions ---------- */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono font-bold text-sm text-gray-900">
              #{order.orderNumber?.slice(-3)}
            </span>
            <span
              className={`px-2.5 py-0.5 text-xs font-semibold rounded-full border ${statusColors[order.status]}`}
            >
              {statusLabels[order.status]}
            </span>
            <span className="text-xs text-gray-500 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              {new Date(order.createdAt).toLocaleString()}
            </span>
          </div>

          {/* View & KOT buttons */}
          <div className="flex items-center gap-1">
            <button
              onClick={onViewDetails}
              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition"
              title="View Details"
            >
              <Eye className="w-4.5 h-4.5" />
            </button>
            <button
              onClick={onKOT}
              className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
              title="Print KOT"
            >
              <Printer className="w-4.5 h-4.5" />
            </button>
          </div>
        </div>

        {/* ---------- MIDDLE SECTION: Customer + Billing (grid) ---------- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Customer details */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-800">
              <User className="w-4 h-4 text-gray-400" />
              {order.customer.name}
            </div>

            <div className="flex items-center gap-4 text-xs text-gray-500">
              {order.orderType === "delivery" ? (
                <span className="flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5" />
                  Delivery
                </span>
              ) : order.orderType === "takeaway" ? (
                <span className="flex items-center gap-1.5">
                  <ShoppingBag className="w-3.5 h-3.5" />
                  Takeaway
                </span>
              ) : (
                <span className="flex items-center gap-1.5">
                  <TableIcon className="w-3.5 h-3.5" />
                  Table {order.table}
                </span>
              )}

              <span>{order.items.length} items</span>
            </div>

            {order.specialInstructions && (
              <p className="text-xs italic text-gray-400 wrap-break-words">
                💬 {order.specialInstructions}
              </p>
            )}

            {/* Delivery address (if applicable) */}
            {order.orderType === "delivery" &&
              order.deliveryDetails?.address && (
                <div className="mt-1 rounded-md border border-orange-100 bg-orange-50 px-3 py-2 text-xs text-gray-600 space-y-0.5">
                  <p>📍 {order.deliveryDetails.address}</p>
                  {order.deliveryDetails.landmark && (
                    <p>{order.deliveryDetails.landmark}</p>
                  )}
                  <p>
                    {order.deliveryDetails.city} -{" "}
                    {order.deliveryDetails.pincode}
                  </p>
                </div>
              )}
          </div>

          {/* Billing (styled like a receipt) */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm space-y-1">
            <div className="flex justify-between text-xs text-gray-500">
              <span>Subtotal</span>
              <span>₹{order.subtotal.toFixed(2)}</span>
            </div>
            {order.cgstAmount > 0 && (
              <div className="flex justify-between text-xs text-gray-500">
                <span>CGST</span>
                <span>₹{order.cgstAmount.toFixed(2)}</span>
              </div>
            )}
            {order.sgstAmount > 0 && (
              <div className="flex justify-between text-xs text-gray-500">
                <span>SGST</span>
                <span>₹{order.sgstAmount.toFixed(2)}</span>
              </div>
            )}
            {order.serviceChargeAmount > 0 && (
              <div className="flex justify-between text-xs text-gray-500">
                <span>Service</span>
                <span>₹{order.serviceChargeAmount.toFixed(2)}</span>
              </div>
            )}

            {order.orderType === "delivery" && (
              <div className="flex justify-between text-xs text-gray-500">
                <span>Delivery</span>
                <span>
                  {order.deliveryCharge > 0 ? (
                    `₹${order.deliveryCharge.toFixed(2)}`
                  ) : (
                    <span className="font-semibold text-green-600">FREE</span>
                  )}
                </span>
              </div>
            )}
            <div className="flex justify-between font-bold text-gray-800 border-t border-gray-300 pt-2 mt-2">
              <span>Total</span>
              <span>₹{order.total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* ---------- BOTTOM ROW: Status control + badges ---------- */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-gray-100 mt-auto">
          {/* Left: status dropdown & verify payment button */}
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={order.status}
              onChange={(e) => onUpdateStatus(e.target.value as OrderStatus)}
              className="text-xs border border-gray-300 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                className="px-3 py-1.5 text-xs font-medium bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-1.5"
              >
                ✅ Verify Payment
              </button>
            )}
          </div>

          {/* Right: payment method & status badges */}
          <div className="flex flex-wrap items-center gap-2">
            {order.paymentMethod && (
              <span className="px-2.5 py-1 text-xs bg-green-100 text-green-700 rounded-full font-medium">
                {order.paymentMethod.toUpperCase()}
              </span>
            )}
            {order.paymentStatus === "paid" && order.status !== "completed" && (
              <span className="px-2.5 py-1 text-xs bg-yellow-100 text-yellow-700 rounded-full font-medium">
                ⏳ Awaiting Verification
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
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Invoice-${order.invoiceNumber}`,
    pageStyle: `
    @page {
      size: 80mm auto;
      margin: 0;
    }

    html, body {
      margin: 0;
      padding: 0;
      width: 80mm;
      background: white;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
  `,
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
        <div id="order-detail-print" className="p-6 space-y-6">
          <InvoiceTemplate
            ref={printRef}
            order={order}
            restaurantName={restaurantName}
          />
        </div>

        <div className="border-t px-6 py-4 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
          >
            Close
          </button>
          {/* <button
            onClick={handleDownloadPDF}
            className="px-4 py-2 bg-green-600 text-white rounded-lg"
          >
            Download PDF
          </button> */}
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

// ==================== KOT Modal (Kitchen Order Ticket) ====================
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

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `KOT-${kot.orderNumber}-Batch-${kot.batch}`,
    pageStyle: `
    @page {
      size: 80mm auto;
      margin: 0;
    }

    html, body {
      margin: 0;
      padding: 0;
      width: 80mm;
      background: white;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
  `,
    onAfterPrint: () => {
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

        {/* Printable Area */}
        <div ref={printRef} id="kot-print" className="px-3 py-3 space-y-3">
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
