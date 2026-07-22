"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { useAuthStore } from "@/store/useAuthStore";
import { getOrders, updateOrderStatus } from "@/services/orderService";

import {
  Clock,
  ChefHat,
  CheckCircle2,
  XCircle,
  CheckCircle,
  Eye,
  RefreshCw,
  Volume2,
  VolumeX,
  Utensils,
  AlertCircle,
  LogOut,
  X,
} from "lucide-react";
import toast from "react-hot-toast";

// ==================== Types ====================
interface OrderItem {
  _id: string;
  name: string;
  quantity: number;
  price: number;
  specialInstructions?: string;
  kotBatch: number;
  kotPrinted: boolean;
}

interface Order {
  _id: string;
  tableNumber: number;
  items: OrderItem[];
  orderType: "dine_in" | "takeaway" | "delivery";
  status: "pending" | "preparing" | "ready" | "served" | "completed" | "out_for_delivery" | "delivered" | "paid" | "cancelled";
  createdAt: string;
  customerId?: Customer;
  delivery?: Delivery;
  specialInstructions?: string;
  customerName?: string;
  finalAmount?: number;
  orderNumber: string;
  currentKotBatch: number;
  hasNewItems: boolean;
  updatedAt?: string;
}

interface Delivery {
  address?: DeliveryAddress;
}

interface DeliveryAddress {
  house?: string;
  street?: string;
  area?: string;
  city?: string;
  pincode?: string;
  landmark?: string;
}

interface Customer {
  _id: string;
  name: string;
  phone?: string;
  email?: string;
}

type OrderStatus =
  | "pending"
  | "preparing"
  | "ready"
  | "served"
  | "paid"
  | "out_for_delivery"
  | "delivered"
  | "completed"
  | "cancelled";

// ==================== Main Component ====================
export default function KitchenPage() {
  const { restaurant, user } = useAuthStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [completedModalOpen, setCompletedModalOpen] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // ─── Audio Setup ──────────────────────────────────────────
  useEffect(() => {
    const unlockAudio = () => {
      const audio = audioRef.current;
      if (audio) {
        audio.play().then(() => {
          audio.pause();
          audio.currentTime = 0;
        }).catch(() => { });
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
    try {
      audioRef.current.currentTime = 0;
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => { });
      }
    } catch {
      // Silently fail
    }
  }, [soundEnabled]);

  // ─── Data Loading ─────────────────────────────────────────
  const loadOrders = useCallback(async () => {
    if (!restaurant?._id) return;
    try {
      setLoading(true);
      const today = new Date().toISOString().split("T")[0];
      const data = await getOrders(restaurant._id, today);
      const ordersArray = Array.isArray(data) ? data : data.orders || [];
      const kitchenOrders = ordersArray.filter((o: Order) =>
        ["pending", "preparing", "ready", "served", "completed", "out_for_delivery", "delivered", "paid"].includes(o.status)
      );
      setOrders(kitchenOrders);
    } catch (error) {
      console.error("Failed to load orders:", error);
      toast.error("Could not load orders");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [restaurant?._id]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadOrders();
  };

  // ─── Socket ──────────────────────────────────────────────
  useEffect(() => {
    if (!restaurant?._id) return;

    const socket = io(process.env.NEXT_PUBLIC_API_URL, {
      transports: ["websocket", "polling"],
      withCredentials: true,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      setSocketConnected(true);
      socket.emit("joinRestaurant", restaurant._id);
    });

    socket.on("disconnect", () => {
      setSocketConnected(false);
    });

    socket.on("NEW_ORDER", (newOrder: Order) => {
      setOrders((prev) => {
        if (prev.some((o) => o._id === newOrder._id)) return prev;
        playSound();
        toast.success(`New Order - Table ${newOrder.tableNumber}`, { icon: "🍽️" });
        return [newOrder, ...prev];
      });
    });

    socket.on("ORDER_UPDATED", (updatedOrder: Order) => {
      setOrders((prev) => {
        const index = prev.findIndex((o) => o._id === updatedOrder._id);
        if (index !== -1) {
          const copy = [...prev];
          copy[index] = updatedOrder;
          return copy;
        }
        return [updatedOrder, ...prev];
      });

      if (updatedOrder.hasNewItems) {
        playSound();
        toast.success(`New items added on Table ${updatedOrder.tableNumber}`, { icon: "🍽️" });
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [restaurant?._id, playSound]);

  // ─── Handlers ─────────────────────────────────────────────
  const updateStatus = async (orderId: string, newStatus: string) => {
    setOrders((prev) =>
      prev.map((o) =>
        o._id === orderId ? { ...o, status: newStatus as OrderStatus } : o
      )
    );
    try {
      await updateOrderStatus(orderId, newStatus);
      toast.success(`Order marked as ${newStatus}`);
    } catch (error) {
      console.error("Status update failed:", error);
      toast.error("Failed to update status");
      loadOrders();
    }
  };

  const openDetail = (order: Order) => {
    setSelectedOrder(order);
    setDetailModalOpen(true);
  };

  const closeDetail = () => {
    setDetailModalOpen(false);
    setSelectedOrder(null);
  };

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    useAuthStore.setState({ user: null, token: null });
    window.location.href = "/";
  };

  // ─── Derived Data ────────────────────────────────────────
  const pendingOrders = orders.filter((o) => o.status === "pending");
  const preparingOrders = orders.filter((o) => o.status === "preparing");
  const readyOrders = orders.filter((o) => o.status === "ready");
  const servedOrders = orders.filter((o) => o.status === "served");
  const completedOrders = orders.filter((o) => o.status === "completed");

  if (loading && !refreshing) {
    return <KitchenSkeleton />;
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100/80">
      <div className="max-w-7xl mx-auto px-4 py-4 md:px-6 md:py-6">
        {/* ─── Header ───────────────────────────────────────── */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl md:text-3xl font-bold bg-linear-to-r from-orange-600 to-orange-800 bg-clip-text text-transparent truncate">
              {restaurant?.name || "The Grand Kitchen"}
            </h1>
            <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
              <span className="flex items-center gap-1.5">
                <ChefHat size={14} className="text-orange-500" />
                <span>Chef: {user?.name || "Gordon"}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span
                  className={`w-2 h-2 rounded-full ${socketConnected ? "bg-emerald-500 animate-pulse" : "bg-red-400"}`}
                />
                <span className="font-medium">
                  {socketConnected ? "Live" : "Offline"}
                </span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-2.5 rounded-xl transition-all ${soundEnabled
                ? "bg-orange-100 text-orange-600 hover:bg-orange-200"
                : "bg-gray-200 text-gray-500 hover:bg-gray-300"
                }`}
              title={soundEnabled ? "Sound On" : "Sound Off"}
            >
              {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
            </button>

            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-2.5 rounded-xl bg-white shadow-sm text-gray-600 hover:bg-gray-50 active:scale-95 transition-all disabled:opacity-50"
            >
              <RefreshCw size={18} className={refreshing ? "animate-spin" : ""} />
            </button>

            <button
              onClick={handleLogout}
              className="p-2.5 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 active:scale-95 transition-all"
              title="Logout"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>

        {/* ─── Stats ────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4 mb-8">
          <StatCard label="Pending" value={pendingOrders.length} color="amber" icon={Clock} />
          <StatCard label="Preparing" value={preparingOrders.length} color="blue" icon={ChefHat} />
          <StatCard label="Ready" value={readyOrders.length} color="emerald" icon={CheckCircle2} />
          <StatCard label="Served" value={servedOrders.length} color="purple" icon={CheckCircle} />
          <div
            onClick={() => setCompletedModalOpen(true)}
            className="cursor-pointer transition-transform hover:scale-[1.02] active:scale-95"
          >
            <StatCard
              label="Completed"
              value={completedOrders.length}
              color="gray"
              icon={CheckCircle}
            />
          </div>
        </div>

        {/* ─── Kanban Columns ───────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <Column
            title="Pending"
            subtitle="New orders waiting"
            orders={pendingOrders}
            onUpdate={updateStatus}
            onViewDetail={openDetail}
            nextStatus="preparing"
            accentColor="border-l-amber-400"
            buttonColor="bg-blue-600 hover:bg-blue-700"
          />
          <Column
            title="Preparing"
            subtitle="Currently cooking"
            orders={preparingOrders}
            onUpdate={updateStatus}
            onViewDetail={openDetail}
            nextStatus="ready"
            accentColor="border-l-blue-400"
            buttonColor="bg-emerald-600 hover:bg-emerald-700"
          />
          <Column
            title="Ready"
            subtitle="Ready for serving"
            orders={readyOrders}
            onUpdate={updateStatus}
            onViewDetail={openDetail}
            nextStatus="served"
            accentColor="border-l-emerald-400"
            buttonColor="bg-purple-600 hover:bg-purple-700"
          />
        </div>

        {/* ─── Empty State ──────────────────────────────────── */}
        {orders.length === 0 && !loading && (
          <div className="mt-12 text-center py-16 px-4 bg-white/60 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-200/60">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Utensils className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-800">No active orders</h3>
            <p className="text-gray-500 text-sm mt-1 max-w-sm mx-auto">
              New orders will appear here automatically as they come in.
            </p>
          </div>
        )}

        {/* ─── Modals ────────────────────────────────────────── */}
        {detailModalOpen && selectedOrder && (
          <OrderDetailModal order={selectedOrder} onClose={closeDetail} />
        )}

        {completedModalOpen && (
          <CompletedOrdersModal
            orders={orders}
            onClose={() => setCompletedModalOpen(false)}
            onViewOrder={openDetail}
          />
        )}
      </div>
    </div>
  );
}

// ==================== Stat Card ====================
function StatCard({
  label,
  value,
  color,
  icon: Icon,
}: {
  label: string;
  value: number;
  color: string;
  icon: any;
}) {
  const colorMap: Record<string, string> = {
    amber: "bg-amber-100 text-amber-600",
    blue: "bg-blue-100 text-blue-600",
    emerald: "bg-emerald-100 text-emerald-600",
    purple: "bg-purple-100 text-purple-600",
    gray: "bg-gray-100 text-gray-600",
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200/80 p-4 hover:shadow-md transition-shadow duration-200">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
            {label}
          </p>
          <p className="text-2xl font-bold text-gray-800 mt-0.5">{value}</p>
        </div>
        <div className={`p-2.5 rounded-xl ${colorMap[color] || "bg-gray-100 text-gray-600"}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}

// ==================== Column Component ====================
function Column({
  title,
  subtitle,
  orders,
  onUpdate,
  onViewDetail,
  nextStatus,
  accentColor,
  buttonColor,
}: {
  title: string;
  subtitle: string;
  orders: Order[];
  onUpdate: (id: string, status: string) => void;
  onViewDetail: (order: Order) => void;
  nextStatus: string;
  accentColor: string;
  buttonColor: string;
}) {
  const sortedOrders = [...orders].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-200/80 border-l-4 ${accentColor} overflow-hidden flex flex-col max-h-[calc(100vh-320px)]`}>
      <div className="px-4 py-3.5 border-b border-gray-200/80 shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-gray-800 text-lg leading-tight">
              {title}
            </h2>
            <p className="text-sm text-gray-500">{subtitle}</p>
          </div>
          <span className="text-xs font-medium bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">
            {orders.length}
          </span>
        </div>
      </div>

      <div className="p-4 space-y-3 overflow-y-auto flex-1 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
        {sortedOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-gray-400">
            <div className="bg-gray-50 rounded-full p-4 mb-3">
              <Utensils className="w-6 h-6" strokeWidth={1.5} />
            </div>
            <p className="text-sm font-medium">No orders</p>
            <p className="text-xs text-gray-400">All caught up!</p>
          </div>
        ) : (
          sortedOrders.map((order) => (
            <OrderCard
              key={order._id}
              order={order}
              onUpdate={onUpdate}
              onViewDetail={onViewDetail}
              nextStatus={nextStatus}
              buttonColor={buttonColor}
            />
          ))
        )}
      </div>
    </div>
  );
}

// ==================== Order Card ====================
function OrderCard({
  order,
  onUpdate,
  onViewDetail,
  nextStatus,
  buttonColor,
}: {
  order: Order;
  onUpdate: (id: string, status: string) => void;
  onViewDetail: (order: Order) => void;
  nextStatus: string;
  buttonColor: string;
}) {
  const getElapsedTime = () => {
    const created = new Date(order.createdAt);
    const now = new Date();
    const diffMs = now.getTime() - created.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return `${hours}h ${mins}m ago`;
  };

  const totalItems = order.items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = order.finalAmount || order.items.reduce((s, i) => s + i.price * i.quantity, 0);

  const sortedItems = [...order.items].sort((a, b) => {
    if (a.kotPrinted !== b.kotPrinted) return a.kotPrinted ? 1 : -1;
    return b.kotBatch - a.kotBatch;
  });

  const statusColorMap: Record<string, string> = {
    pending: "bg-amber-100 text-amber-800 border-amber-200",
    preparing: "bg-blue-100 text-blue-800 border-blue-200",
    ready: "bg-emerald-100 text-emerald-800 border-emerald-200",
    served: "bg-purple-100 text-purple-800 border-purple-200",
    out_for_delivery: "bg-indigo-100 text-indigo-800 border-indigo-200",
    delivered: "bg-teal-100 text-teal-800 border-teal-200",
    paid: "bg-green-100 text-green-800 border-green-200",
    completed: "bg-gray-100 text-gray-700 border-gray-200",
    cancelled: "bg-rose-100 text-rose-700 border-rose-200",
  };

  const getActionLabel = (orderType: string, nextStatus: string) => {
    if (orderType === "delivery") {
      switch (nextStatus) {
        case "preparing": return "Start Preparing";
        case "out_for_delivery": return "Dispatch";
        case "delivered": return "Mark Delivered";
        case "completed": return "Complete";
        default: return "Update";
      }
    }
    if (orderType === "takeaway") {
      switch (nextStatus) {
        case "preparing": return "Start Preparing";
        case "ready": return "Ready for Pickup";
        case "completed": return "Complete";
        default: return "Update";
      }
    }
    switch (nextStatus) {
      case "preparing": return "Start Preparing";
      case "ready": return "Ready to Serve";
      case "served": return "Mark Served";
      case "paid": return "Payment Received";
      case "completed": return "Complete";
      default: return "Update";
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200/80 shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden">
      {order.hasNewItems && (
        <div className="bg-red-50 border-b border-red-200/80 px-4 py-2.5 flex items-center gap-2.5 text-sm text-red-700">
          <span className="inline-block w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span className="font-semibold">New items added</span>
          <span className="text-xs text-red-600 font-medium">· check KOT</span>
        </div>
      )}

      <div className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center flex-wrap gap-2">
              <span className="font-semibold text-gray-800 text-sm flex items-center gap-1.5">
                {order.orderType === "dine_in" && <>🍽️ Table {order.tableNumber}</>}
                {order.orderType === "takeaway" && <>🥡 Takeaway</>}
                {order.orderType === "delivery" && (
                  <span className="text-blue-600">🚚 Delivery</span>
                )}
              </span>
              <span className="text-xs font-mono bg-gray-100 px-2 py-0.5 rounded-full text-gray-600">
                #{order.orderNumber.slice(-4)}
              </span>
              {(order.customerId?.name || order.customerName) && (
                <span className="text-xs text-gray-500 truncate max-w-30">
                  · {order.customerId?.name || order.customerName}
                </span>
              )}
            </div>

            <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
              <span>{totalItems} item{totalItems > 1 ? "s" : ""}</span>
              {totalPrice > 0 && (
                <>
                  <span className="text-gray-300">|</span>
                  <span className="font-medium text-gray-700">
                    ₹{totalPrice.toFixed(2)}
                  </span>
                </>
              )}
            </div>
          </div>

          <button
            onClick={() => onViewDetail(order)}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors shrink-0"
            aria-label="View order details"
          >
            <Eye className="w-4 h-4" />
          </button>
        </div>

        {/* Items Summary */}
        <div className="bg-gray-50/70 rounded-lg px-3 py-2.5 border border-gray-200/60">
          <ul className="space-y-1 text-sm">
            {sortedItems.slice(0, 4).map((item) => (
              <li key={item._id} className="flex justify-between items-center gap-3">
                <span className="text-gray-700 truncate flex-1">
                  {item.quantity}× {item.name}
                </span>
                {!item.kotPrinted && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500 text-white shrink-0">
                    NEW
                  </span>
                )}
              </li>
            ))}
            {order.items.length > 4 && (
              <li className="text-xs text-gray-400 pt-0.5 border-t border-gray-200/50">
                +{order.items.length - 4} more item{order.items.length - 4 > 1 ? "s" : ""}
              </li>
            )}
          </ul>
        </div>

        {/* Special instructions */}
        {order.specialInstructions && (
          <div className="flex items-start gap-2 text-xs bg-amber-50/70 border border-amber-200/70 rounded-lg px-3 py-2 text-amber-700">
            <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0 text-amber-500" />
            <span className="line-clamp-2 leading-relaxed">{order.specialInstructions}</span>
          </div>
        )}

        {/* Footer */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-gray-200/60">
          <div className="flex items-center gap-3">
            <span
              className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${statusColorMap[order.status] || "bg-gray-100 text-gray-700 border-gray-200"
                }`}
            >
              {order.status.replaceAll("_", " ").toUpperCase()}
            </span>
            <span className="text-xs text-gray-400 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {getElapsedTime()}
            </span>
          </div>

          <button
            onClick={() => onUpdate(order._id, nextStatus)}
            className={`px-4 py-1.5 text-white text-xs font-medium rounded-lg transition-colors hover:brightness-110 focus:ring-2 focus:ring-offset-2 focus:ring-${buttonColor.replace('bg-', '').replace(/\s.*$/, '')} ${buttonColor}`}
          >
            {getActionLabel(order.orderType, nextStatus)}
          </button>
        </div>
      </div>
    </div>
  );
}

// ==================== Order Detail Modal ====================
function OrderDetailModal({ order, onClose }: { order: Order; onClose: () => void }) {
  const batches = order.items.reduce(
    (acc, item) => {
      if (!acc[item.kotBatch]) {
        acc[item.kotBatch] = { items: [], hasNew: false };
      }
      acc[item.kotBatch].items.push(item);
      if (!item.kotPrinted) acc[item.kotBatch].hasNew = true;
      return acc;
    },
    {} as Record<number, { items: OrderItem[]; hasNew: boolean }>
  );

  const sortedBatchEntries = Object.entries(batches).sort(
    ([batchA, dataA], [batchB, dataB]) => {
      if (dataA.hasNew && !dataB.hasNew) return -1;
      if (!dataA.hasNew && dataB.hasNew) return 1;
      return Number(batchB) - Number(batchA);
    }
  );

  const totalItems = order.items.reduce((sum, item) => sum + item.quantity, 0);
  const newItemsCount = order.items.filter((i) => !i.kotPrinted).length;
  const totalAmount = order.finalAmount || order.items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  const statusColor: Record<string, string> = {
    pending: "bg-amber-100 text-amber-800 border-amber-200",
    preparing: "bg-blue-100 text-blue-800 border-blue-200",
    ready: "bg-emerald-100 text-emerald-800 border-emerald-200",
    served: "bg-purple-100 text-purple-800 border-purple-200",
    completed: "bg-gray-100 text-gray-700 border-gray-200",
  };

  const formatDate = (date: string | Date) =>
    new Date(date).toLocaleString([], {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });

  const customerName = order.customerId?.name || order.customerName || "Walk-in Customer";
  const address = order.delivery?.address;
  const fullAddress = address
    ? [address.house, address.street, address.area, address.city, address.pincode]
      .filter(Boolean)
      .join(", ")
    : "";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-gray-200/50"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b border-gray-200/80 px-6 py-5 rounded-t-2xl">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center flex-wrap gap-x-3 gap-y-1">
                <h3 className="text-xl font-bold text-gray-900">
                  Order <span className="font-mono">#{order.orderNumber.slice(-3)}</span>
                </h3>
                <span className="text-sm font-medium text-gray-600 flex items-center gap-1.5">
                  {order.orderType === "dine_in" && <>🍽️ Table {order.tableNumber}</>}
                  {order.orderType === "takeaway" && <>🥡 Takeaway</>}
                  {order.orderType === "delivery" && (
                    <span className="text-blue-600">🚚 Delivery</span>
                  )}
                </span>
                <span className="text-xs text-gray-400 flex items-center gap-1">
                  🕒 {formatDate(order.createdAt)}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                <span className="text-gray-700 font-medium">{customerName}</span>
                <span className="text-gray-300">·</span>
                <span className="text-gray-600">
                  {totalItems} item{totalItems > 1 ? "s" : ""}
                </span>
                {newItemsCount > 0 && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700">
                    {newItemsCount} new
                  </span>
                )}
                {totalAmount > 0 && (
                  <>
                    <span className="text-gray-300">·</span>
                    <span className="font-semibold text-gray-800">
                      ₹{totalAmount.toFixed(2)}
                    </span>
                  </>
                )}
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors -mr-2 shrink-0"
              aria-label="Close modal"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-3">
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider border ${statusColor[order.status] || "bg-gray-100 text-gray-700 border-gray-200"
                }`}
            >
              {order.status}
            </span>
            {order.specialInstructions && (
              <span className="inline-flex items-center text-sm text-amber-700 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
                ⚠️ Special instructions
              </span>
            )}
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {order.orderType === "delivery" && address && (
            <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-5 space-y-2">
              <h4 className="font-semibold text-blue-800 flex items-center gap-2 text-sm">
                <span className="text-lg">🚚</span> Delivery Details
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 text-sm">
                <p>
                  <span className="font-medium text-gray-600">Customer:</span>{" "}
                  {order.customerId?.name || customerName}
                </p>
                <p>
                  <span className="font-medium text-gray-600">Phone:</span>{" "}
                  {order.customerId?.phone || "—"}
                </p>
                <p className="sm:col-span-2">
                  <span className="font-medium text-gray-600">Address:</span>{" "}
                  <span className="text-gray-700">{fullAddress}</span>
                </p>
                {address.landmark && (
                  <p className="sm:col-span-2">
                    <span className="font-medium text-gray-600">Landmark:</span>{" "}
                    <span className="text-gray-700">{address.landmark}</span>
                  </p>
                )}
              </div>
            </div>
          )}

          <div>
            <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
              <span>Kitchen Order Tickets</span>
              <span className="h-px flex-1 bg-gray-200" />
            </h4>
            <div className="space-y-4">
              {sortedBatchEntries.map(([batch, { items, hasNew }]) => (
                <div
                  key={batch}
                  className={`rounded-xl border shadow-sm overflow-hidden transition-all ${hasNew ? "border-red-200 bg-red-50/30" : "border-gray-200 bg-white"
                    }`}
                >
                  <div className="flex items-center justify-between px-4 py-3 bg-gray-50/80 border-b border-gray-200/60">
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold text-gray-800 text-sm">
                        KOT #{batch}
                      </span>
                      {hasNew && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-500 text-white animate-pulse">
                          NEW
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-gray-500">
                      {items.length} item{items.length > 1 ? "s" : ""}
                    </span>
                  </div>

                  <div className="divide-y divide-gray-200/60">
                    {items.map((item) => (
                      <div
                        key={item._id}
                        className={`px-4 py-3 flex items-start gap-3 ${!item.kotPrinted ? "bg-red-50/40" : ""
                          }`}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center flex-wrap gap-x-3 gap-y-0.5">
                            <span className="font-medium text-gray-800">
                              {item.quantity}× {item.name}
                            </span>
                            {!item.kotPrinted && (
                              <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500 text-white">
                                NEW
                              </span>
                            )}
                            {item.price > 0 && (
                              <span className="text-xs text-gray-400 ml-auto">
                                ₹{item.price.toFixed(2)}
                              </span>
                            )}
                          </div>
                          {item.specialInstructions && (
                            <p className="text-xs text-amber-600 mt-1 flex items-start gap-1.5">
                              <span>📌</span>
                              <span>{item.specialInstructions}</span>
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {order.specialInstructions && (
            <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4 space-y-1">
              <p className="text-xs font-semibold text-amber-800 uppercase tracking-wider flex items-center gap-2">
                <span>📋</span> Order Instructions
              </p>
              <p className="text-sm text-amber-700">{order.specialInstructions}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200/60 px-6 py-4 flex justify-end bg-gray-50/80 rounded-b-2xl">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium rounded-lg transition-colors text-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ==================== Completed Orders Modal ====================
interface CompletedOrdersModalProps {
  orders: Order[];
  onClose: () => void;
  onViewOrder: (order: Order) => void;
}

function CompletedOrdersModal({ orders, onClose, onViewOrder }: CompletedOrdersModalProps) {
  const completedOrders = orders
    .filter((o) => o.status === "completed" || o.status === "served")
    .sort((a, b) => {
      const dateA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
      const dateB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
      return dateB - dateA;
    });

  const totalItems = (order: Order) =>
    order.items.reduce((sum, item) => sum + item.quantity, 0);

  const formatTime = (date?: string) => {
    if (!date) return "—";
    return new Date(date).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col border border-gray-200/50"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b border-gray-200/80 px-6 py-5 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-3">
                <span>✅ Completed Orders</span>
                <span className="bg-emerald-100 text-emerald-700 text-sm font-semibold px-3 py-0.5 rounded-full">
                  {completedOrders.length}
                </span>
              </h3>
              <p className="text-sm text-gray-500 mt-0.5">
                All finished orders – newest first. Click any order to view details.
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors -mr-2"
            >
              <XCircle className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {completedOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <div className="bg-gray-50 rounded-full p-6 mb-4">
                <Clock className="w-10 h-10" strokeWidth={1.5} />
              </div>
              <p className="text-lg font-medium text-gray-500">No completed orders yet</p>
              <p className="text-sm text-gray-400">Completed orders will appear here for review.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {completedOrders.map((order) => (
                <div
                  key={order._id}
                  onClick={() => {
                    onViewOrder(order);
                    onClose();
                  }}
                  className="bg-gray-50/70 hover:bg-gray-100/80 border border-gray-200/80 rounded-xl p-4 transition-all cursor-pointer flex flex-wrap items-center justify-between gap-4"
                >
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 flex-1 min-w-50">
                    <div>
                      <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">
                        Order #
                      </p>
                      <p className="font-bold text-gray-800 font-mono">
                        #{order.orderNumber.slice(-4)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">
                        Table
                      </p>
                      <p className="font-semibold text-gray-800">
                        {order.tableNumber}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">
                        Customer
                      </p>
                      <p className="font-semibold text-gray-800 truncate">
                        {order.customerId?.name || order.customerName || "Walk-in"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">
                        Items
                      </p>
                      <p className="font-semibold text-gray-800">
                        {totalItems(order)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0 ml-auto">
                    <div className="text-right">
                      <p className="text-xs text-gray-400">Completed</p>
                      <p className="text-sm font-medium text-gray-700 whitespace-nowrap">
                        {formatTime(order.updatedAt)}
                      </p>
                    </div>
                    <CheckCircle2 className="w-6 h-6 text-emerald-500 shrink-0" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200/60 px-6 py-4 flex justify-end bg-gray-50/80 rounded-b-2xl">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium rounded-lg transition-colors text-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ==================== Loading Skeleton ====================
function KitchenSkeleton() {
  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100/80 p-4 md:p-6 animate-pulse">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-start mb-8">
          <div className="space-y-2">
            <div className="h-8 w-56 bg-gray-200 rounded-lg" />
            <div className="h-4 w-40 bg-gray-200 rounded" />
          </div>
          <div className="flex gap-2">
            <div className="h-10 w-10 bg-gray-200 rounded-xl" />
            <div className="h-10 w-10 bg-gray-200 rounded-xl" />
            <div className="h-10 w-10 bg-gray-200 rounded-xl" />
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4 mb-8">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl p-4 border border-gray-200/80">
              <div className="flex justify-between items-center">
                <div className="space-y-2">
                  <div className="h-3 w-16 bg-gray-200 rounded" />
                  <div className="h-7 w-8 bg-gray-200 rounded" />
                </div>
                <div className="h-10 w-10 bg-gray-200 rounded-xl" />
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200/80 p-4">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <div className="h-5 w-24 bg-gray-200 rounded" />
                  <div className="h-3 w-20 bg-gray-200 rounded mt-1" />
                </div>
                <div className="h-6 w-8 bg-gray-200 rounded-full" />
              </div>
              <div className="space-y-3">
                {[...Array(2)].map((_, j) => (
                  <div key={j} className="bg-gray-50/70 rounded-xl p-4 border border-gray-200/60">
                    <div className="space-y-2">
                      <div className="h-4 w-3/4 bg-gray-200 rounded" />
                      <div className="h-3 w-1/2 bg-gray-200 rounded" />
                      <div className="h-8 w-full bg-gray-200 rounded-lg" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}