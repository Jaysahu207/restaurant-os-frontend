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
  orderType: "dine_in" | "takeaway";
  status: "pending" | "preparing" | "ready" | "served" | "completed";
  createdAt: string;
  customerId?: Customer;
  specialInstructions?: string;
  customerName?: string;
  orderNumber: string;
  currentKotBatch: number;
  hasNewItems: boolean;
  updatedAt?: string; // added for completed modal sorting
}
interface Customer {
  _id: string;
  name: string;
  phone?: string;
  email?: string;
}

type OrderStatus = "pending" | "preparing" | "ready" | "served" | "completed";

// ==================== Main Component ====================
export default function KitchenPage() {
  const { restaurant, user } = useAuthStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [completedModalOpen, setCompletedModalOpen] = useState(false); // NEW
  const [socketConnected, setSocketConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const unlockAudio = () => {
      const audio = audioRef.current;
      if (audio) {
        audio
          .play()
          .then(() => {
            audio.pause();
            audio.currentTime = 0;
          })
          .catch(() => {});
      }
      window.removeEventListener("click", unlockAudio);
    };
    window.addEventListener("click", unlockAudio);
    return () => window.removeEventListener("click", unlockAudio);
  }, []);

  // Initialize audio on client side
  useEffect(() => {
    audioRef.current = new Audio("/sounds/new-order.mp3");
    audioRef.current.load();
  }, []);

  // Play sound with user interaction handling
  const playSound = useCallback(() => {
    if (!soundEnabled || !audioRef.current) return;
    try {
      audioRef.current.currentTime = 0;
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          console.warn("Audio play failed:", err);
        });
      }
    } catch (err) {
      console.error("Unexpected audio error:", err);
    }
  }, [soundEnabled]);

  // Load initial orders
  const loadOrders = useCallback(async () => {
    if (!restaurant?._id) return;
    try {
      setLoading(true);
      const today = new Date().toISOString().split("T")[0];
      const data = await getOrders(restaurant._id, today);
      const ordersArray = Array.isArray(data) ? data : data.orders || [];
      const kitchenOrders = ordersArray.filter((o: Order) =>
        ["pending", "preparing", "ready", "served", "completed"].includes(
          o.status,
        ),
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

  // Manual refresh
  const handleRefresh = () => {
    setRefreshing(true);
    loadOrders();
  };

  // Socket connection
  useEffect(() => {
    if (!restaurant?._id) return;

    const socket = io(process.env.NEXT_PUBLIC_API_URL, {
      transports: ["websocket", "polling"],
      withCredentials: true,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      // console.log("🔌 Kitchen socket connected");
      setSocketConnected(true);
      socket.emit("joinRestaurant", restaurant._id);
    });

    socket.on("disconnect", () => {
      console.log("🔌 Kitchen socket disconnected");
      setSocketConnected(false);
    });
    socket.on("NEW_ORDER", (newOrder: Order) => {
      setOrders((prev) => {
        if (prev.some((o) => o._id === newOrder._id)) {
          return prev;
        }

        playSound();

        toast.success(`New Order - Table ${newOrder.tableNumber}`, {
          icon: "🍽️",
        });

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
        toast.success(`New items added on Table ${updatedOrder.tableNumber}`, {
          icon: "🍽️",
        });
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [restaurant?._id, playSound]);

  // Update order status with optimistic UI
  const updateStatus = async (orderId: string, newStatus: string) => {
    setOrders((prev) =>
      prev.map((o) =>
        o._id === orderId ? { ...o, status: newStatus as OrderStatus } : o,
      ),
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

  // Group orders by status
  const pendingOrders = orders.filter((o) => o.status === "pending");
  const preparingOrders = orders.filter((o) => o.status === "preparing");
  const readyOrders = orders.filter((o) => o.status === "ready");

  // Loading skeleton
  if (loading && !refreshing) {
    return <KitchenSkeleton />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 py-4 md:px-6 md:py-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-orange-600 to-orange-800 bg-clip-text text-transparent truncate">
              {restaurant?.name || "The Grand Kitchen"}
            </h1>
            <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
              <span className="flex items-center gap-1">
                <ChefHat size={12} />
                Chef: {user?.name || "Gordon"}
              </span>
              <span className="flex items-center gap-1">
                <span
                  className={`w-1.5 h-1.5 rounded-full ${socketConnected ? "bg-green-500 animate-pulse" : "bg-red-500"}`}
                />
                {socketConnected ? "Live" : "Offline"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Sound Toggle */}
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-2 rounded-full transition-all ${
                soundEnabled
                  ? "bg-orange-100 text-orange-600"
                  : "bg-gray-200 text-gray-500"
              }`}
              title={soundEnabled ? "Sound On" : "Sound Off"}
            >
              {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
            </button>

            {/* Refresh */}
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-2 rounded-full bg-white shadow-sm text-gray-600 active:scale-95 transition"
            >
              <RefreshCw
                size={18}
                className={refreshing ? "animate-spin" : ""}
              />
            </button>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="p-2 rounded-full bg-red-50 text-red-600 active:scale-95 transition"
              title="Logout"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>

        {/* Stats Overview - Responsive Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
          <StatCard
            label="Pending"
            value={pendingOrders.length}
            color="bg-amber-500"
            icon={Clock}
          />
          <StatCard
            label="Preparing"
            value={preparingOrders.length}
            color="bg-blue-500"
            icon={ChefHat}
          />
          <StatCard
            label="Ready"
            value={readyOrders.length}
            color="bg-emerald-500"
            icon={CheckCircle2}
          />
          <StatCard
            label="Served"
            value={orders.filter((o) => o.status === "served").length}
            color="bg-purple-500"
            icon={CheckCircle}
          />
          {/* Completed Stat Card - now clickable */}
          <div
            onClick={() => setCompletedModalOpen(true)}
            className="cursor-pointer"
          >
            <StatCard
              label="Completed"
              value={orders.filter((o) => o.status === "completed").length}
              color="bg-gray-500"
              icon={CheckCircle}
            />
          </div>
        </div>

        {/* Kanban Columns */}
        <div className="flex overflow-x-auto lg:overflow-visible lg:grid lg:grid-cols-3 gap-5 pb-4 -mx-4 px-4 lg:mx-0 lg:px-0">
          {/* Pending Column */}
          <div className="min-w-[280px] lg:min-w-0 flex-1">
            <Column
              title="Pending"
              subtitle="New orders waiting"
              orders={pendingOrders}
              onUpdate={updateStatus}
              onViewDetail={openDetail}
              nextStatus="preparing"
              statusColor="border-amber-400"
              buttonColor="bg-blue-600 hover:bg-blue-700"
            />
          </div>

          {/* Preparing Column */}
          <div className="min-w-[280px] lg:min-w-0 flex-1">
            <Column
              title="Preparing"
              subtitle="Currently cooking"
              orders={preparingOrders}
              onUpdate={updateStatus}
              onViewDetail={openDetail}
              nextStatus="ready"
              statusColor="border-blue-400"
              buttonColor="bg-emerald-600 hover:bg-emerald-700"
            />
          </div>

          {/* Ready Column */}
          <div className="min-w-[280px] lg:min-w-0 flex-1">
            <Column
              title="Ready"
              subtitle="Ready for serving"
              orders={readyOrders}
              onUpdate={updateStatus}
              onViewDetail={openDetail}
              nextStatus="served"
              statusColor="border-emerald-400"
              buttonColor="bg-purple-600 hover:bg-purple-700"
            />
          </div>
        </div>

        {/* Empty State */}
        {orders.length === 0 && !loading && (
          <div className="mt-12 text-center py-12 bg-white/60 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100">
            <Utensils className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-gray-800">
              No active orders
            </h3>
            <p className="text-gray-500 text-sm">
              New orders will appear here automatically
            </p>
          </div>
        )}

        {/* Order Detail Modal */}
        {detailModalOpen && selectedOrder && (
          <OrderDetailModal order={selectedOrder} onClose={closeDetail} />
        )}

        {/* Completed Orders Modal */}
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
  return (
    <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className="text-2xl font-bold text-gray-800">{value}</p>
        </div>
        <div className={`p-2 rounded-full ${color} text-white`}>
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
  statusColor,
  buttonColor,
}: {
  title: string;
  subtitle: string;
  orders: Order[];
  onUpdate: (id: string, status: string) => void;
  onViewDetail: (order: Order) => void;
  nextStatus: string;
  statusColor: string;
  buttonColor: string;
}) {
  const sortedOrders = [...orders].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );

  return (
    <div className={`bg-white rounded-xl shadow-sm border-t-4 ${statusColor}`}>
      <div className="p-4 border-b">
        <h2 className="font-semibold text-gray-800 text-lg">{title}</h2>
        <p className="text-sm text-gray-500">{subtitle}</p>
        <p className="text-xs text-gray-400 mt-1">{orders.length} orders</p>
      </div>

      <div className="p-4 space-y-3 max-h-[calc(100vh-300px)] overflow-y-auto">
        {sortedOrders.length === 0 ? (
          <div className="text-center py-8 text-gray-400 text-sm">
            No orders in this column
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
  const sortedItems = [...order.items].sort((a, b) => {
    if (a.kotPrinted !== b.kotPrinted) {
      return a.kotPrinted ? 1 : -1;
    }
    return b.kotBatch - a.kotBatch;
  });

  return (
    <div className="border rounded-lg bg-gray-50 hover:shadow-md transition">
      {order.hasNewItems && (
        <div className="mb-3 rounded-lg bg-red-100 text-red-700 px-3 py-2 text-sm font-semibold animate-pulse">
          🔔 New Items Added
        </div>
      )}
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-800">
                {order.orderType === "dine_in"
                  ? `🍽️ Table ${order.tableNumber}`
                  : "🥡 Takeaway"}
              </span>
              <span className="text-xs bg-gray-200 px-2 py-0.5 rounded-full">
                #{order.orderNumber.slice(-3)}
              </span>
            </div>
            {order.customerName && (
              <p className="text-sm text-gray-600">{order.customerName}</p>
            )}
          </div>
          <button
            onClick={() => onViewDetail(order)}
            className="p-1.5 text-gray-500 hover:bg-gray-200 rounded-lg transition"
            title="View details"
          >
            <Eye className="w-4 h-4" />
          </button>
        </div>

        {/* Items Summary */}
        <div className="text-sm text-gray-700 mb-2">
          <p className="font-medium">{totalItems} items:</p>
          <ul className="mt-1 space-y-0.5">
            {sortedItems.slice(0, 3).map((item) => (
              <li key={item._id} className="flex justify-between items-center">
                <span className="truncate">
                  {item.quantity} × {item.name}
                </span>
                {!item.kotPrinted && (
                  <span className="ml-2 px-2 py-0.5 rounded bg-red-500 text-white text-[10px]">
                    NEW
                  </span>
                )}
              </li>
            ))}
            {order.items.length > 3 && (
              <li className="text-gray-500 text-xs">
                +{sortedItems.length - 4} more items
              </li>
            )}
          </ul>
        </div>

        {/* Special instructions indicator */}
        {order.specialInstructions && (
          <div className="mb-2 text-xs text-orange-600 bg-orange-50 p-1.5 rounded flex items-start gap-1">
            <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
            <span className="line-clamp-2">{order.specialInstructions}</span>
          </div>
        )}

        {/* Footer with timer and action */}
        <div className="flex items-center justify-between mt-3 pt-2 border-t">
          <span className="text-xs text-gray-500 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {getElapsedTime()}
          </span>
          <button
            onClick={() => onUpdate(order._id, nextStatus)}
            className={`px-3 py-1.5 text-white text-sm rounded-lg transition ${buttonColor}`}
          >
            Mark {nextStatus}
          </button>
        </div>
      </div>
    </div>
  );
}

// ==================== Order Detail Modal ====================
function OrderDetailModal({
  order,
  onClose,
}: {
  order: Order;
  onClose: () => void;
}) {
  const batches = order.items.reduce(
    (acc, item) => {
      if (!acc[item.kotBatch]) {
        acc[item.kotBatch] = { items: [], hasNew: false };
      }
      acc[item.kotBatch].items.push(item);
      if (!item.kotPrinted) acc[item.kotBatch].hasNew = true;
      return acc;
    },
    {} as Record<number, { items: OrderItem[]; hasNew: boolean }>,
  );

  const sortedBatchEntries = Object.entries(batches).sort(
    ([batchA, dataA], [batchB, dataB]) => {
      if (dataA.hasNew && !dataB.hasNew) return -1;
      if (!dataA.hasNew && dataB.hasNew) return 1;
      return Number(batchB) - Number(batchA);
    },
  );

  const totalItems = order.items.reduce((sum, item) => sum + item.quantity, 0);
  const newItemsCount = order.items.filter((i) => !i.kotPrinted).length;

  const statusColor = {
    pending: "bg-yellow-100 text-yellow-800",
    preparing: "bg-blue-100 text-blue-800",
    ready: "bg-green-100 text-green-800",
    served: "bg-purple-100 text-purple-800",
    completed: "bg-gray-200 text-gray-700",
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-gray-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center rounded-t-2xl">
          <div>
            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <span>Order No : </span>
              <span className="text-gray-700 font-mono">
                {order.orderNumber.slice(-3)}
              </span>
              <span className="text-sm font-normal text-gray-700 ml-2">
                · Table {order.tableNumber}
              </span>
            </h3>
            <p className="text-sm text-gray-500 mt-0.5">
              <p>
                {order.customerId?.name ||
                  order.customerName ||
                  "Walk-in Customer"}
              </p>{" "}
              · {totalItems} item
              {totalItems > 1 ? "s" : ""}
              {newItemsCount > 0 && (
                <span className="ml-2 text-red-500 font-semibold">
                  ({newItemsCount} new)
                </span>
              )}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <XCircle className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          <div className="flex flex-wrap items-center gap-4">
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${
                statusColor[order.status]
              }`}
            >
              {order.status}
            </span>
            {order.specialInstructions && (
              <span className="inline-flex items-center text-sm text-amber-700 bg-amber-50 px-3 py-1 rounded-full">
                ⚠️ Special instructions
              </span>
            )}
          </div>

          <div>
            <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Kitchen Order Tickets
            </h4>
            <div className="space-y-4">
              {sortedBatchEntries.map(([batch, { items, hasNew }]) => (
                <div
                  key={batch}
                  className={`rounded-xl border ${
                    hasNew
                      ? "border-red-200 bg-red-50/40"
                      : "border-gray-200 bg-white"
                  } shadow-sm overflow-hidden transition-all`}
                >
                  <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50/80 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-800">
                        KOT #{batch}
                      </span>
                      {hasNew && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500 text-white animate-pulse">
                          NEW
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-gray-500">
                      {items.length} item{items.length > 1 ? "s" : ""}
                    </span>
                  </div>
                  <div className="divide-y divide-gray-100">
                    {items.map((item) => (
                      <div
                        key={item._id}
                        className={`px-4 py-3 flex justify-between items-center ${
                          !item.kotPrinted ? "bg-red-50/20" : ""
                        }`}
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-gray-800">
                              {item.quantity}× {item.name}
                            </span>
                            {!item.kotPrinted && (
                              <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500 text-white">
                                NEW
                              </span>
                            )}
                          </div>
                          {item.specialInstructions && (
                            <p className="text-xs text-orange-600 mt-1 flex items-start gap-1">
                              <span>📌</span> {item.specialInstructions}
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
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mt-2">
              <p className="text-xs font-semibold text-amber-800 uppercase tracking-wider">
                Order Instructions
              </p>
              <p className="text-sm text-amber-700 mt-0.5">
                {order.specialInstructions}
              </p>
            </div>
          )}
        </div>

        <div className="border-t border-gray-100 px-6 py-4 flex justify-end bg-gray-50/80 rounded-b-2xl">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium rounded-lg transition-colors text-sm"
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
  onViewOrder: (order: Order) => void; // to open detail modal
}

function CompletedOrdersModal({
  orders,
  onClose,
  onViewOrder,
}: CompletedOrdersModalProps) {
  // Filter completed/served orders and sort by latest update
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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col border border-gray-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sticky Header */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center rounded-t-2xl">
          <div>
            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-3">
              <span>✅ Completed Orders</span>
              <span className="bg-green-100 text-green-700 text-sm font-semibold px-3 py-0.5 rounded-full">
                {completedOrders.length}
              </span>
            </h3>
            <p className="text-sm text-gray-500 mt-0.5">
              All finished orders – newest first. Click any order to view
              details.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <XCircle className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {completedOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <div className="bg-gray-50 rounded-full p-6 mb-4">
                <Clock className="w-10 h-10" strokeWidth={1.5} />
              </div>
              <p className="text-lg font-medium text-gray-500">
                No completed orders yet
              </p>
              <p className="text-sm text-gray-400">
                Completed orders will appear here for review.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {completedOrders.map((order) => (
                <div
                  key={order._id}
                  onClick={() => {
                    onViewOrder(order);
                    onClose(); // close completed modal after opening detail
                  }}
                  className="bg-gray-50/70 hover:bg-gray-100 border border-gray-200 rounded-xl p-4 transition-all cursor-pointer flex items-center justify-between"
                >
                  {/* Order Info Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 flex-1">
                    <div>
                      <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">
                        Order #
                      </p>
                      <p className="font-bold text-gray-800">
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
                      <p className="font-semibold text-gray-800">
                        <p>
                          {order.customerId?.name ||
                            order.customerName ||
                            "Walk-in "}
                        </p>
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

                  {/* Right side: time + status icon */}
                  <div className="flex items-center gap-4 ml-4 flex-shrink-0">
                    <div className="text-right">
                      <p className="text-xs text-gray-400">Completed</p>
                      <p className="text-sm font-medium text-gray-700 whitespace-nowrap">
                        {formatTime(order.updatedAt)}
                      </p>
                    </div>
                    <CheckCircle2 className="w-6 h-6 text-green-500 flex-shrink-0" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-100 px-6 py-4 flex justify-end bg-gray-50/80 rounded-b-2xl">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium rounded-lg transition-colors text-sm"
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
    <div className="min-h-screen bg-gray-100 p-4 md:p-6 animate-pulse">
      <div className="max-w-[1600px] mx-auto">
        <div className="flex justify-between mb-6">
          <div className="h-8 w-48 bg-gray-200 rounded" />
          <div className="h-10 w-24 bg-gray-200 rounded" />
        </div>
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white p-4 rounded-xl">
              <div className="flex justify-between">
                <div className="space-y-2">
                  <div className="h-4 w-16 bg-gray-200 rounded" />
                  <div className="h-6 w-8 bg-gray-200 rounded" />
                </div>
                <div className="h-10 w-10 bg-gray-200 rounded-full" />
              </div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl p-4">
              <div className="h-6 w-24 bg-gray-200 rounded mb-4" />
              <div className="space-y-3">
                {[...Array(2)].map((_, j) => (
                  <div key={j} className="border rounded-lg p-4">
                    <div className="h-4 w-3/4 bg-gray-200 rounded mb-2" />
                    <div className="h-4 w-1/2 bg-gray-200 rounded mb-3" />
                    <div className="h-8 w-full bg-gray-200 rounded" />
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
