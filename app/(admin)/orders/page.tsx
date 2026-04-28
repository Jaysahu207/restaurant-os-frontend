"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Search,
  Clock,
  CheckCircle,
  ChefHat,
  XCircle,
  Eye,
  Printer,
  Filter,
  X,
  RefreshCw,
  Calendar,
  ChevronDown,
} from "lucide-react";
import {
  getOrders,
  updateOrderStatus as updateStatusAPI,
  verifyPayment,
} from "@/services/orderService";
import { io, Socket } from "socket.io-client";
import { useAuthStore } from "@/store/useAuthStore";
import toast from "react-hot-toast";
import InvoiceTemplate from "@/components/invoice/InvoiceTemplate";
import { printInvoice } from "@/components/invoice/PrintInvoice";

// ==================== Types ====================
interface OrderItem {
  _id: string;
  name: string;
  price: number;
  quantity: number;
  specialInstructions?: string;
}

interface Order {
  id: string;
  customer: {
    name: string;
    phone: string;
    email?: string;
  };
  orderNumber: string;
  table: number;
  items: OrderItem[];
  total: number; // Grand total after all taxes (final amount)
  subtotal: number; // Subtotal before taxes
  cgstAmount: number; // CGST amount
  sgstAmount: number; // SGST amount
  serviceChargeAmount: number;
  invoiceNumber: string;
  status: OrderStatus;
  createdAt: string;
  specialInstructions?: string;
  paymentMethod?: "cash" | "upi";
  paymentStatus?: "unpaid" | "pending" | "paid";
}

type OrderStatus =
  | "pending"
  | "preparing"
  | "ready"
  | "served"
  | "paid"
  | "completed"
  | "cancelled";

const statusColors: Record<OrderStatus, string> = {
  pending: "bg-yellow-100 text-yellow-700 border-yellow-200",
  preparing: "bg-blue-100 text-blue-700 border-blue-200",
  ready: "bg-green-100 text-green-700 border-green-200",
  served: "bg-purple-100 text-purple-700 border-purple-200",
  paid: "bg-emerald-100 text-emerald-700 border-emerald-200",
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
  cancelled: "Cancelled",
};

// ==================== Main Component ====================
export default function OrdersPage() {
  const { restaurant } = useAuthStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState<OrderStatus | "all">("all");
  const [search, setSearch] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [kotModalOpen, setKotModalOpen] = useState(false);
  const [kotOrder, setKotOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0],
  );

  // Load orders with optional date filter
  const loadOrders = useCallback(async () => {
    if (!restaurant?._id) return;
    try {
      setLoading(true);
      const dateParam = selectedDate || undefined;
      const data = await getOrders(restaurant._id, dateParam);
      const formatted: Order[] = data.map((o: any) => mapOrder(o));
      setOrders(formatted);
    } catch (error) {
      console.error("Failed to load orders:", error);
      toast.error("Could not load orders");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [restaurant?._id, selectedDate]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadOrders();
  };

  // Real-time socket connection
  useEffect(() => {
    if (!restaurant?._id) return;

    const socket = io(process.env.NEXT_PUBLIC_API_URL, {
      withCredentials: true,
      transports: ["websocket"],
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("🟢 Admin socket connected:", socket.id);
      socket.emit("joinRestaurant", restaurant._id);
    });

    socket.on("connect_error", (err) => {
      console.error("❌ Socket connection error:", err.message);
    });

    socket.on("NEW_ORDER", (newOrder: any) => {
      const orderDate = new Date(newOrder.createdAt)
        .toISOString()
        .split("T")[0];
      if (selectedDate && orderDate !== selectedDate) return;
      const formattedOrder = mapOrder(newOrder);
      setOrders((prev) => {
        if (prev.find((o) => o.id === formattedOrder.id)) return prev;
        return [formattedOrder, ...prev];
      });
      playSound();
      toast.success(`New order #${newOrder._id.slice(-6)} received!`);
    });

    socket.on("ORDER_UPDATED", (updatedOrder: any) => {
      setOrders((prev) =>
        prev.map((order) =>
          order.id === String(updatedOrder._id)
            ? mapOrder(updatedOrder)
            : order,
        ),
      );
    });

    socket.on("PAYMENT_UPDATED", (updatedOrder: any) => {
      setOrders((prev) =>
        prev.map((order) =>
          order.id === updatedOrder._id
            ? {
                ...order,
                paymentStatus: updatedOrder.paymentStatus,
                paymentMethod: updatedOrder.paymentMethod,
              }
            : order,
        ),
      );
      toast.success(
        `Payment received for order #${updatedOrder._id.slice(-6)}`,
      );
    });

    return () => {
      socket.disconnect();
    };
  }, [restaurant?._id, selectedDate]);

  const mapOrder = (o: any): Order => ({
    id: o._id,
    table: o.tableNumber,
    items: [...o.items],
    total: o.finalAmount ?? o.totalAmount, // finalAmount is the grand total after taxes
    subtotal: o.subtotal ?? o.totalAmount,
    cgstAmount: o.cgstAmount ?? 0,
    sgstAmount: o.sgstAmount ?? 0,
    serviceChargeAmount: o.serviceChargeAmount ?? 0,
    status: o.status,
    invoiceNumber: o.invoiceNumber,
    orderNumber: o.orderNumber,
    paymentStatus: o.paymentStatus,
    paymentMethod: o.paymentMethod,
    createdAt: o.createdAt,
    specialInstructions: o.specialInstructions,
    customer: {
      name: o.customerId?.name || "Guest",
      phone: o.customerId?.phone || "",
      email: o.customerId?.email || "",
    },
  });

  const updateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    try {
      await updateStatusAPI(orderId, newStatus);
      setOrders((prev) =>
        prev.map((order) =>
          order.id === orderId ? { ...order, status: newStatus } : order,
        ),
      );
      if (selectedOrder?.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status: newStatus });
      }
      toast.success(`Order status updated to ${statusLabels[newStatus]}`);
    } catch (error) {
      console.error("Status update failed:", error);
      toast.error("Failed to update status");
      loadOrders();
    }
  };

  const filteredOrders = orders
    .filter((order) => filter === "all" || order.status === filter)
    .filter(
      (order) =>
        order.id.toLowerCase().includes(search.toLowerCase()) ||
        order.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
        order.customer.name.toLowerCase().includes(search.toLowerCase()),
    );

  const stats = {
    total: orders.length,
    pending: orders.filter((o) => o.status === "pending").length,
    preparing: orders.filter((o) => o.status === "preparing").length,
    ready: orders.filter((o) => o.status === "ready").length,
    served: orders.filter((o) => o.status === "served").length,
    paid: orders.filter((o) => o.status === "paid").length,
    completed: orders.filter((o) => o.status === "completed").length,
    cancelled: orders.filter((o) => o.status === "cancelled").length,
  };

  const openDetail = (order: Order) => {
    setSelectedOrder(order);
    setDetailModalOpen(true);
  };

  const openKOT = (order: Order) => {
    setKotOrder(order);
    setKotModalOpen(true);
  };

  const clearFilters = () => {
    setSearch("");
    setFilter("all");
    setSelectedDate(new Date().toISOString().split("T")[0]);
  };

  useEffect(() => {
    const unlockAudio = () => {
      if (audioRef.current) {
        audioRef.current
          .play()
          .then(() => audioRef.current?.pause())
          .catch(() => {});
      }
      window.removeEventListener("click", unlockAudio);
    };
    window.addEventListener("click", unlockAudio);
    return () => window.removeEventListener("click", unlockAudio);
  }, []);

  useEffect(() => {
    audioRef.current = new Audio("/sounds/new-order.mp3");
    audioRef.current.load();
  }, []);

  const playSound = useCallback(() => {
    if (!soundEnabled || !audioRef.current) return;
    audioRef.current.currentTime = 0;
    audioRef.current
      .play()
      .catch((err) => console.warn("Audio play failed:", err));
  }, [soundEnabled]);

  if (loading && !refreshing) {
    return <OrdersSkeleton />;
  }

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Order Management</h1>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition disabled:opacity-50"
          title="Refresh orders"
        >
          <RefreshCw
            className={`w-5 h-5 ${refreshing ? "animate-spin" : ""}`}
          />
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
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
      <div className="bg-white p-4 rounded-xl shadow-sm space-y-4 border border-gray-100">
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
              onClick={() =>
                setSelectedDate(new Date().toISOString().split("T")[0])
              }
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
                className={`px-4 py-2 rounded-lg text-sm font-medium capitalize whitespace-nowrap transition flex items-center gap-2 ${
                  filter === status
                    ? "bg-orange-500 text-white shadow-sm"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {statusLabels[status]}
                {status !== "all" && (
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-xs ${filter === status ? "bg-white/20 text-white" : "bg-gray-200 text-gray-600"}`}
                  >
                    {stats[status]}
                  </span>
                )}
              </button>
            ))}
          </div>
          {(search ||
            filter !== "all" ||
            selectedDate !== new Date().toISOString().split("T")[0]) && (
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
      <div className="space-y-4">
        {filteredOrders.length === 0 ? (
          <div className="bg-white p-12 rounded-xl text-center shadow-sm border border-gray-100">
            <div className="max-w-md mx-auto">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Filter className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-800 mb-2">
                No orders found
              </h3>
              <p className="text-gray-500">
                {search ||
                filter !== "all" ||
                selectedDate !== new Date().toISOString().split("T")[0]
                  ? "Try adjusting your filters or search criteria."
                  : "Waiting for new orders to arrive."}
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="text-sm text-gray-500 mb-2">
              Showing {filteredOrders.length} order
              {filteredOrders.length !== 1 ? "s" : ""}
            </div>
            {filteredOrders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                onViewDetails={() => openDetail(order)}
                onKOT={() => openKOT(order)}
                onUpdateStatus={(newStatus) =>
                  updateOrderStatus(order.id, newStatus)
                }
              />
            ))}
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
      {kotModalOpen && kotOrder && (
        <KOTModal
          order={kotOrder}
          onClose={() => setKotModalOpen(false)}
          restaurantName={restaurant?.name}
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

// ==================== Order Card ====================
function OrderCard({
  order,
  onViewDetails,
  onKOT,
  onUpdateStatus,
}: {
  order: Order;
  onViewDetails: () => void;
  onKOT: () => void;
  onUpdateStatus: (status: OrderStatus) => void;
}) {
  const getNextStatuses = (current: OrderStatus): OrderStatus[] => {
    const flow: Record<OrderStatus, OrderStatus[]> = {
      pending: ["preparing", "cancelled"],
      preparing: ["ready", "cancelled"],
      ready: ["served", "cancelled"],
      served: ["paid"],
      paid: ["completed"],
      completed: [],
      cancelled: [],
    };
    return flow[current] || [];
  };

  return (
    <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition p-4 border border-gray-100 group">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2 flex-wrap">
            <span className="text-sm font-mono font-semibold text-gray-700">
              #{order.orderNumber?.slice(-3)}
            </span>
            <span
              className={`px-2 py-1 text-xs font-medium rounded-full border ${statusColors[order.status]}`}
            >
              {statusLabels[order.status]}
            </span>
            <span className="text-xs text-gray-500 flex items-center gap-1">
              <Clock className="w-3 h-3" />{" "}
              {new Date(order.createdAt).toLocaleString()}
            </span>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <span className="font-medium text-gray-800">
              {order.customer.name}
            </span>
            <span className="text-gray-500">Table {order.table}</span>
            <span className="text-gray-500">{order.items.length} items</span>
          </div>
          {order.specialInstructions && (
            <p className="text-xs text-gray-500 mt-1 italic truncate">
              Note: {order.specialInstructions}
            </p>
          )}
        </div>

        <div className="flex items-center gap-4 md:gap-6">
          <div className="text-right">
            <p className="text-xs text-gray-500">
              Subtotal: ₹{order.subtotal.toFixed(2)}
            </p>
            {order.cgstAmount > 0 && (
              <p className="text-xs text-gray-500">
                CGST: ₹{order.cgstAmount.toFixed(2)}
              </p>
            )}
            {order.sgstAmount > 0 && (
              <p className="text-xs text-gray-500">
                SGST: ₹{order.sgstAmount.toFixed(2)}
              </p>
            )}
            {order.serviceChargeAmount > 0 && (
              <p className="text-xs text-gray-500">
                Service Charge: ₹{order.serviceChargeAmount.toFixed(2)}
              </p>
            )}
            <p className="text-lg font-bold text-gray-800">
              Total: ₹{order.total.toFixed(2)}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onViewDetails}
              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
              title="View Details"
            >
              <Eye className="w-5 h-5" />
            </button>
            <button
              onClick={onKOT}
              className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
              title="Print KOT"
            >
              <Printer className="w-5 h-5" />
            </button>
            {order.paymentStatus === "paid" && order.status !== "completed" && (
              <button
                onClick={async () => {
                  await verifyPayment(order.id);
                  onUpdateStatus("completed");
                }}
                className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
              >
                Verify Payment ✅
              </button>
            )}
            <div className="relative">
              <select
                value={order.status}
                onChange={(e) => onUpdateStatus(e.target.value as OrderStatus)}
                className="appearance-none pl-3 pr-8 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 bg-white cursor-pointer"
              >
                <option value={order.status}>
                  {statusLabels[order.status]}
                </option>
                {getNextStatuses(order.status).map((status) => {
                  if (order.status === "paid" && status !== "completed")
                    return null;
                  return (
                    <option key={status} value={status}>
                      Mark as {statusLabels[status]}
                    </option>
                  );
                })}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
            {order.paymentStatus === "paid" && order.status !== "completed" && (
              <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-700 rounded-full">
                Awaiting Verification ⏳
              </span>
            )}
            {order.paymentMethod && (
              <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full">
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
  const handlePrint = () => {
    printInvoice("order-detail-print", order.invoiceNumber);
  };
  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
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
            order={{ ...order, table: String(order.table) }}
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
  order,
  onClose,
  restaurantName = "Your Restaurant",
}: {
  order: Order;
  onClose: () => void;
  restaurantName?: string;
}) {
  const handlePrint = () => {
    printInvoice("kot-print", `KOT-${order.orderNumber}`);
  };
  console.log(order);

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl max-w-md w-full"
        onClick={(e) => e.stopPropagation()}
      >
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

        <div id="kot-print" className="p-6 space-y-4">
          <div className="text-center">
            <h2 className="font-bold text-xl">{restaurantName}</h2>
            <p className="text-sm text-gray-500 font-mono">
              KOT #{order.orderNumber.slice(-3)}
            </p>
            <p className="text-sm text-gray-500">
              {new Date(order.createdAt).toLocaleString()}
            </p>
            <p className="text-sm font-medium mt-1">Table: {order.table}</p>
          </div>
          <div className="border-t border-b border-dashed py-3 space-y-2">
            {order.items.map((item, idx) => (
              <div key={idx} className="flex justify-between text-sm">
                <span className="font-medium">
                  {item.quantity} × {item.name}
                </span>
                {item.specialInstructions && (
                  <span className="text-xs text-gray-500 italic ml-2">
                    ({item.specialInstructions})
                  </span>
                )}
              </div>
            ))}
          </div>
          {order.specialInstructions && (
            <div className="text-sm border-t border-dashed pt-3">
              <span className="font-medium">Special Note: </span>
              <span className="italic">{order.specialInstructions}</span>
            </div>
          )}
        </div>
        <div className="border-t p-4 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
          >
            Close
          </button>
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
          >
            <Printer className="w-4 h-4" /> Print KOT
          </button>
        </div>
      </div>
    </div>
  );
}
