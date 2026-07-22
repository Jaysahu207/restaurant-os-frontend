"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { useAuthStore } from "@/store/useAuthStore";
import {
  getOrders,
  updateOrderStatus,
  placeOrder,
} from "@/services/orderService";
import {
  getMenuItems,
} from "@/services/menuService";
import {
  Plus,
  Search,
  X,
  RefreshCw,
  CheckCircle2,
  Clock,
  ChefHat,
  User,
  Phone,
  Mail,
  ShoppingCart,
  Minus,
  Plus as PlusIcon,
  AlertCircle,
  Volume2,
  VolumeX,
  UtensilsCrossed,
  Eye,
  LogOut,
  XCircle,
  Utensils,
} from "lucide-react";
import toast from "react-hot-toast";
import TableManagement from "@/components/super-admin/TableManagement";

// ==================== Types ====================
interface MenuVariant {
  _id: string;
  name: string;
  price: number;
}

interface MenuAddon {
  _id: string;
  name: string;
  price: number;
}

interface MenuItem {
  _id: string;
  name: string;
  description?: string;
  price: number;
  image?: string;
  category?: string;
  type?: string;
  variants?: MenuVariant[];
  addons?: MenuAddon[];
  isAvailable?: boolean;
}

interface OrderItem {
  _id?: string;
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  specialInstructions?: string;
  kotBatch: number;        // ✅ Added
  kotPrinted: boolean;     // ✅ Added
  addedAt?: string;
}

type SelectedItem = {
  _id: string;
  name: string;
  quantity: number;
  price: number;
  selectedVariant?: {
    _id: string;
    name: string;
    price: number;
  };
  selectedAddons?: {
    _id: string;
    name: string;
    price: number;
  }[];
  specialInstructions?: string;
};

interface Order {
  _id: string;
  tableNumber: number;
  orderType: "dine_in" | "takeaway" | "delivery";
  items: OrderItem[];
  orderNumber: string;
  status:
  | "pending"
  | "preparing"
  | "ready"
  | "served"
  | "completed"
  | "cancelled"
  | "out_for_delivery"
  | "delivered"
  | "paid";
  totalAmount: number;
  finalAmount: number;
  customerName?: string;
  currentKotBatch: number;  // ✅ Added
  updatedAt?: string;
  cgstRate: number;
  sgstRate: number;
  cgstAmount: number;
  sgstAmount: number;
  revision?: number;
  hasNewItems?: boolean;
  pendingKOT?: boolean;
  createdAt: string;
  customerId?: Customer;
  specialInstructions?: string;
}

interface Customer {
  _id: string;
  name: string;
  phone?: string;
  email?: string;
}

// ==================== Main Component ====================
export default function WaiterPage() {
  const { restaurant, user } = useAuthStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [socketConnected, setSocketConnected] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const [completedModalOpen, setCompletedModalOpen] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [selectedTable, setSelectedTable] = useState<any>(null);

  // Initialize audio
  useEffect(() => {
    audioRef.current = new Audio("/sounds/order-placed.mp3");
    audioRef.current.load();
  }, []);

  const playSound = useCallback(() => {
    if (!soundEnabled || !audioRef.current) return;
    audioRef.current.currentTime = 0;
    audioRef.current.play().catch(() => { });
  }, [soundEnabled]);

  // Load orders and menu
  const loadData = useCallback(async () => {
    if (!restaurant?._id) return;
    try {
      setLoading(true);
      const menuData = await getMenuItems(restaurant._id);
      const today = new Date().toISOString().split("T")[0];
      const data = await getOrders(restaurant._id, today);
      setOrders(data);
      setMenuItems(menuData);
    } catch (error) {
      console.error("Failed to load data:", error);
      toast.error("Could not load orders or menu");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [restaurant?._id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
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
      setSocketConnected(true);
      socket.emit("joinRestaurant", restaurant._id);
    });

    socket.on("disconnect", () => {
      setSocketConnected(false);
    });

    socket.on("ORDER_READY", (order: Order) => {
      setOrders((prev) => {
        const exists = prev.find((o) => o._id === order._id);
        if (exists) {
          return prev.map((o) => (o._id === order._id ? order : o));
        }
        return [order, ...prev];
      });
      playSound();
      toast.success(`🍽️ Table ${order.tableNumber} order is READY!`, {
        icon: "🔔",
        duration: 5000,
      });
    });

    socket.on("ORDER_UPDATED", (updatedOrder) => {
      setOrders((prev) => {
        const exists = prev.some((o) => o._id === updatedOrder._id);
        if (!exists) {
          return [updatedOrder, ...prev];
        }
        return prev.map((o) => (o._id === updatedOrder._id ? updatedOrder : o));
      });
    });

    socket.on("NEW_ORDER", (newOrder: Order) => {
      setOrders((prev) => {
        if (prev.find((o) => o._id === newOrder._id)) return prev;
        return [newOrder, ...prev];
      });
    });

    return () => {
      socket.disconnect();
    };
  }, [restaurant?._id, playSound]);

  // Update order status
  const updateStatus = async (orderId: string, newStatus: string) => {
    setOrders((prev) =>
      prev.map((o) =>
        o._id === orderId ? { ...o, status: newStatus as Order["status"] } : o
      )
    );
    try {
      await updateOrderStatus(orderId, newStatus);
      toast.success(`Order marked as ${newStatus}`);
    } catch (error) {
      toast.error("Failed to update status");
      loadData();
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    useAuthStore.setState({ user: null, token: null });
    window.location.href = "/";
  };

  // Create new order
  const handleCreateOrder = async (orderData: {
    tableNumber: number;
    items: OrderItem[];
    customer?: {
      name?: string;
      phone?: string;
      email?: string;
    };
    specialInstructions?: string;
    orderType?: "dine_in" | "takeaway";
  }) => {
    try {
      const payload = {
        restaurantId: restaurant._id,
        orderType: orderData.orderType ?? "dine_in",
        tableNumber: orderData.tableNumber,
        items: orderData.items,
        specialInstructions: orderData.specialInstructions,
        customer: orderData.customer
          ? {
            name: orderData.customer.name ?? "",
            phone: orderData.customer.phone ?? "",
            email: orderData.customer.email ?? "",
          }
          : undefined,
      };
      await placeOrder(payload);
      toast.success("Order created successfully");
      setCreateModalOpen(false);
      loadData();
    } catch (error) {
      toast.error("Failed to create order");
      throw error;
    }
  };

  const openDetail = (order: Order) => {
    setSelectedOrder(order);
    setDetailModalOpen(true);
  };

  const servedOrders = orders.filter((o) => o.status === "served");
  const completedOrders = orders.filter((o) => o.status === "completed");
  const cancelledOrders = orders.filter((o) => o.status === "cancelled");

  const sortByTime = (orders: Order[]) =>
    [...orders].sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

  const pendingOrders = sortByTime(orders.filter((o) => o.status === "pending"));
  const preparingOrders = sortByTime(orders.filter((o) => o.status === "preparing"));
  const readyOrders = sortByTime(orders.filter((o) => o.status === "ready"));

  if (loading && !refreshing) {
    return <WaiterSkeleton />;
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100/80  border-amber-600 border">

      <div className="max-w-7xl mx-auto px-4 py-4 md:px-6 md:py-2 lg:px-8">

        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl md:text-2xl font-bold bg-linear-to-r from-orange-600 to-orange-800 bg-clip-text text-transparent truncate">
              {restaurant?.name || "Restaurant"}
            </h1>
            <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
              <User className="w-3 h-3" />
              <span>Captain: {user?.name || "John Doe"}</span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Live Connection Status */}
            <div className=" text-right text-xs">
              {socketConnected ? (
                <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 px-2 py-1 rounded-full">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                  Live
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-700 px-2 py-1 rounded-full">
                  <AlertCircle size={12} />
                  Reconnecting...
                </span>
              )}
            </div>
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-2 rounded-full transition-all ${soundEnabled
                ? "bg-orange-100 text-orange-600"
                : "bg-gray-200 text-gray-500"
                }`}
              title={soundEnabled ? "Sound On" : "Sound Off"}
            >
              {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
            </button>

            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-2 rounded-full bg-white shadow-sm text-gray-600 active:scale-95 transition"
            >
              <RefreshCw size={18} className={refreshing ? "animate-spin" : ""} />
            </button>

            <button
              onClick={handleLogout}
              className="p-2 rounded-full bg-red-50 text-red-600 active:scale-95 transition"
              title="Logout"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>



        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          <StatCard
            label="Ready to Serve"
            value={readyOrders.length}
            color="bg-emerald-500"
            icon={CheckCircle2}
            highlight={readyOrders.length > 0}
          />
          <StatCard
            label="Preparing"
            value={preparingOrders.length}
            color="bg-blue-500"
            icon={ChefHat}
          />
          <StatCard
            label="Pending"
            value={pendingOrders.length}
            color="bg-amber-500"
            icon={Clock}
          />
          <StatCard
            label="Served Today"
            value={servedOrders.length}
            color="bg-purple-500"
            icon={CheckCircle2}
          />
          <div
            onClick={() => setCompletedModalOpen(true)}
            className="cursor-pointer"
          >
            <StatCard
              label="Completed"
              value={completedOrders.length}
              color="bg-gray-500"
              icon={CheckCircle2}
            />
          </div>
          <StatCard
            label="Cancelled"
            value={cancelledOrders.length}
            color="bg-rose-500"
            icon={XCircle}
          />
        </div>

        {/* Order Status Columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          <StatusColumn
            title="Pending"
            icon={Clock}
            orders={pendingOrders}
            statusColor="border-l-amber-400"
            onViewDetail={openDetail}
          />

          <StatusColumn
            title="Preparing"
            icon={ChefHat}
            orders={preparingOrders}
            statusColor="border-l-blue-400"
            onViewDetail={openDetail}
          />

          <StatusColumn
            title="Ready to Serve"
            icon={CheckCircle2}
            orders={readyOrders}
            statusColor="border-l-emerald-400"
            onViewDetail={openDetail}
          />

          <StatusColumn
            title="Recently Served"
            icon={CheckCircle2}
            orders={servedOrders.slice(0, 10)}
            statusColor="border-l-gray-400"
            onViewDetail={openDetail}
          />
        </div>

        {/* Floating Action Button */}
        <button
          onClick={() => setCreateModalOpen(true)}
          className="fixed bottom-6 right-6 bg-orange-600 text-white p-4 rounded-full shadow-lg hover:bg-orange-700 active:scale-95 transition-all z-20 flex items-center justify-center"
        >
          <Plus size={24} />
        </button>

        {/* Modals */}
        {createModalOpen && (
          <CreateOrderModal
            menuItems={menuItems}
            selectedTable={selectedTable}
            onClose={() => {
              setCreateModalOpen(false);
              setSelectedTable(null);
            }}
            onSubmit={handleCreateOrder}
            restaurantId={restaurant?._id}
          />
        )}
        {detailModalOpen && selectedOrder && (
          <OrderDetailModal
            order={selectedOrder}
            onClose={() => setDetailModalOpen(false)}
            onUpdateStatus={(status) => updateStatus(selectedOrder._id, status)}
          />
        )}

        <div className="mt-12">
          <TableManagement
            onTableClick={(table) => {
              if (table.status !== "available") return;
              setSelectedTable(table);
              setCreateModalOpen(true);
            }}
            restaurantId={restaurant?._id}
          />
        </div>
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
  highlight = false,
}: {
  label: string;
  value: number;
  color: string;
  icon: any;
  highlight?: boolean;
}) {
  return (
    <div
      className={`bg-white rounded-xl shadow-sm p-4 border ${highlight ? "border-green-300 ring-1 ring-green-200" : "border-gray-100"
        }`}
    >
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

// ==================== Status Column ====================
function StatusColumn({
  title,
  icon: Icon,
  orders,
  statusColor,
  onViewDetail,
}: {
  title: string;
  icon: any;
  orders: Order[];
  statusColor: string;
  onViewDetail: (order: Order) => void;
}) {
  return (
    <div
      className={`bg-white rounded-xl shadow-sm border border-gray-200/80 ${statusColor} overflow-hidden flex flex-col max-h-[500px]`}
    >
      <div className="px-4 py-3.5 border-b border-gray-200/80 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon className="w-5 h-5 text-gray-600" />
            <h3 className="font-semibold text-gray-800 text-lg">{title}</h3>
          </div>
          <span className="text-xs font-medium bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">
            {orders.length}
          </span>
        </div>
      </div>

      <div className="p-4 space-y-3 overflow-y-auto flex-1 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
        {orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-gray-400">
            <Utensils className="w-8 h-8 mb-2" strokeWidth={1.5} />
            <p className="text-sm font-medium">No orders</p>
            <p className="text-xs text-gray-400">All caught up!</p>
          </div>
        ) : (
          orders.map((order) => (
            <CompactOrderCard
              key={order._id}
              order={order}
              onViewDetail={() => onViewDetail(order)}
            />
          ))
        )}
      </div>
    </div>
  );
}

// ==================== Compact Order Card ====================
function CompactOrderCard({
  order,
  onViewDetail,
}: {
  order: Order;
  onViewDetail: () => void;
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
    return (b.kotBatch || 0) - (a.kotBatch || 0);
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

  const customerName = order.customerId?.name || order.customerName || "";

  return (
    <div className="bg-white rounded-xl border border-gray-200/80 shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden">
      {order.hasNewItems && (
        <div className="bg-red-50 border-b border-red-200/80 px-3 py-1.5 flex items-center gap-2 text-xs text-red-700">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
          <span className="font-semibold">New items</span>
        </div>
      )}

      <div className="p-3 space-y-2">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center flex-wrap gap-1.5">
              <span className="font-semibold text-gray-800 text-sm flex items-center gap-1">
                {order.orderType === "dine_in" && <>🍽️ Table {order.tableNumber}</>}
                {order.orderType === "takeaway" && <>🥡 Takeaway</>}
                {order.orderType === "delivery" && (
                  <span className="text-blue-600">🚚 Delivery</span>
                )}
              </span>
              <span className="text-xs font-mono bg-gray-100 px-1.5 py-0.5 rounded-full text-gray-600">
                #{order.orderNumber.slice(-3)}
              </span>
              {customerName && (
                <span className="text-xs text-gray-500 truncate max-w-[100px]">
                  · {customerName}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-500">
              <span>{totalItems} item{totalItems > 1 ? "s" : ""}</span>
              {totalPrice > 0 && (
                <>
                  <span className="text-gray-300">|</span>
                  <span className="font-medium text-gray-700">₹{totalPrice.toFixed(2)}</span>
                </>
              )}
            </div>
          </div>

          <button
            onClick={onViewDetail}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors shrink-0"
            aria-label="View details"
          >
            <Eye className="w-4 h-4" />
          </button>
        </div>

        {/* Items Summary */}
        <div className="bg-gray-50/70 rounded-lg px-2.5 py-1.5 border border-gray-200/60">
          <ul className="space-y-0.5 text-xs">
            {sortedItems.slice(0, 2).map((item) => (
              <li key={item._id || item.menuItemId} className="flex justify-between items-center gap-2">
                <span className="text-gray-700 truncate flex-1">
                  {item.quantity}× {item.name}
                </span>
                {!item.kotPrinted && (
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-red-500 text-white shrink-0">
                    NEW
                  </span>
                )}
              </li>
            ))}
            {order.items.length > 2 && (
              <li className="text-gray-400 text-[10px] pt-0.5 border-t border-gray-200/50">
                +{order.items.length - 2} more
              </li>
            )}
          </ul>
        </div>

        {/* Special instructions */}
        {order.specialInstructions && (
          <div className="flex items-start gap-1.5 text-[10px] bg-amber-50/70 border border-amber-200/70 rounded-lg px-2.5 py-1.5 text-amber-700">
            <AlertCircle className="w-3 h-3 mt-0.5 shrink-0 text-amber-500" />
            <span className="line-clamp-1 leading-relaxed">{order.specialInstructions}</span>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-1.5 border-t border-gray-200/60">
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${statusColorMap[order.status] || "bg-gray-100 text-gray-700 border-gray-200"
                }`}
            >
              {order.status.replaceAll("_", " ").toUpperCase()}
            </span>
            <span className="text-[10px] text-gray-400 flex items-center gap-1">
              <Clock className="w-2.5 h-2.5" />
              {getElapsedTime()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==================== Variant Selection Modal (extracted) ====================
function VariantSelectionModal({
  item,
  onClose,
  onAddToCart,
}: {
  item: MenuItem;
  onClose: () => void;
  onAddToCart: (customized: SelectedItem) => void;
}) {
  const [selectedVariant, setSelectedVariant] = useState<MenuVariant | undefined>(undefined);
  const [selectedAddons, setSelectedAddons] = useState<MenuAddon[]>([]);

  const toggleAddon = (addon: MenuAddon) => {
    setSelectedAddons((prev) =>
      prev.some((a) => a._id === addon._id)
        ? prev.filter((a) => a._id !== addon._id)
        : [...prev, addon]
    );
  };

  const handleAdd = () => {
    onAddToCart({
      _id: item._id,
      name: item.name,
      quantity: 1,
      selectedVariant,
      selectedAddons,
      specialInstructions: "",
      price: selectedVariant?.price ?? item.price,
    });
    onClose();
  };

  const totalPrice = (selectedVariant?.price ?? item.price) +
    selectedAddons.reduce((sum, addon) => sum + addon.price, 0);

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center">
      <div className="w-full sm:max-w-xl bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[90vh] flex flex-col animate-in slide-in-from-bottom duration-300">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 px-5 py-4 flex items-center justify-between rounded-t-3xl z-10">
          <div>
            <h3 className="text-xl font-bold text-gray-900">{item.name}</h3>
            <p className="text-sm text-gray-500">Customize your order</p>
          </div>
          <button
            onClick={onClose}
            className="h-10 w-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {/* Variants */}
          {item.variants && item.variants.length > 0 && (
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-gray-900 mb-3">Choose Size / Variant</h4>
              <div className="space-y-3">
                {item.variants.map((variant) => (
                  <label
                    key={variant._id}
                    className={`flex items-center justify-between p-4 rounded-2xl border cursor-pointer transition-all duration-200 ${selectedVariant?._id === variant._id
                      ? "border-orange-500 bg-orange-50 shadow-sm"
                      : "border-gray-200 hover:border-orange-300"
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="variant"
                        checked={selectedVariant?._id === variant._id}
                        onChange={() => setSelectedVariant(variant)}
                        className="accent-orange-500"
                      />
                      <div>
                        <p className="font-medium text-gray-900">{variant.name}</p>
                        <p className="text-xs text-gray-500">Upgrade option</p>
                      </div>
                    </div>
                    <span className="font-semibold text-orange-600">+₹{variant.price}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Addons */}
          {item.addons && item.addons.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-3">Add Extras</h4>
              <div className="space-y-3">
                {item.addons.map((addon) => {
                  const selected = selectedAddons.some((a) => a._id === addon._id);
                  return (
                    <label
                      key={addon._id}
                      className={`flex items-center justify-between p-4 rounded-2xl border cursor-pointer transition-all duration-200 ${selected
                        ? "border-green-500 bg-green-50 shadow-sm"
                        : "border-gray-200 hover:border-green-300"
                        }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={() => toggleAddon(addon)}
                          className="accent-green-600"
                        />
                        <div>
                          <p className="font-medium text-gray-900">{addon.name}</p>
                          <p className="text-xs text-gray-500">Optional addon</p>
                        </div>
                      </div>
                      <span className="font-semibold text-green-600">+₹{addon.price}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-gray-100 p-4 rounded-b-3xl">
          <div className="flex items-center justify-between mb-3">
            <span className="text-gray-500 text-sm">Total Price</span>
            <span className="text-xl font-bold text-gray-900">₹{totalPrice}</span>
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-12 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleAdd}
              className="flex-1 h-12 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-semibold shadow-lg transition"
            >
              Add to Order
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==================== Create Order Modal ====================
function CreateOrderModal({
  menuItems,
  selectedTable,
  onClose,
  onSubmit,
  restaurantId,
}: {
  menuItems: MenuItem[];
  selectedTable?: any;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  restaurantId: string;
}) {
  const [tableNumber, setTableNumber] = useState<number>(selectedTable?.tableNumber || 1);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [variantModalOpen, setVariantModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);

  const categories: string[] = [
    "All",
    ...Array.from(
      new Set(
        menuItems
          .filter((item): item is MenuItem & { category: string } =>
            Boolean(item.category)
          )
          .map((item) => item.category)
      )
    ),
  ];

  useEffect(() => {
    if (selectedTable) {
      setTableNumber(selectedTable.tableNumber);
    }
  }, [selectedTable]);

  const [selectedCategory, setSelectedCategory] = useState("All");

  const filteredMenu = menuItems.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "All" || item.category === selectedCategory;
    return matchesSearch && matchesCategory && item.isAvailable !== false;
  });

  const calculateItemTotal = (item: SelectedItem) => {
    const variantPrice = item.selectedVariant?.price ?? item.price;
    const addonsPrice = item.selectedAddons?.reduce((sum, a) => sum + a.price, 0) ?? 0;
    return (variantPrice + addonsPrice) * item.quantity;
  };

  const updateQuantity = (id: string, delta: number) => {
    setSelectedItems(
      selectedItems
        .map((item) =>
          item._id === id
            ? { ...item, quantity: Math.max(0, item.quantity + delta) }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const calculateTotal = () => {
    return selectedItems.reduce((sum, item) => sum + calculateItemTotal(item), 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedItems.length === 0) {
      toast.error("Please add at least one item");
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit({
        tableNumber,
        items: selectedItems.map((item) => ({
          menuItemId: item._id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          specialInstructions: item.specialInstructions || "",
          kotBatch: 1,
          kotPrinted: false,
        })),
        customer: {
          name: customerName,
          phone: customerPhone,
          email: customerEmail,
        },
        specialInstructions,
      });
    } catch (error) {
      // Error already handled in parent
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-100 bg-white">
      <div className="w-full h-screen flex flex-col bg-white">
        {/* Header */}
        <div className="relative bg-linear-to-r from-orange-500 via-orange-600 to-red-500 px-3 py-3 flex items-center justify-between">

          {/* Background Decoration */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-white"></div>
            <div className="absolute -bottom-12 -left-12 w-40 h-40 rounded-full bg-white"></div>
          </div>

          {/* Left Section */}
          <div className="relative flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg">
              <UtensilsCrossed className="w-7 h-7 text-white" />
            </div>

            <div>
              <h2 className="text-xl font-bold text-white">
                Create New Order
              </h2>

              <p className="text-sm text-orange-100 mt-0.5">
                Select table, add items and place the order.
              </p>
            </div>
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="relative w-10 h-10 rounded-xl bg-white/15 hover:bg-white/25 transition-all duration-200 flex items-center justify-center"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto overflow-x-hidden bg-gradient-to-b from-gray-50 to-white p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Customer Details */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-1 h-5 bg-gradient-to-b from-orange-500 to-pink-500 rounded-full" />
                <h3 className="font-semibold text-gray-800">Customer Details</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* Table */}
                <div className="bg-orange-50 border border-orange-200 rounded-2xl p-3 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500">Table</p>
                    <p className="font-bold text-lg">#{selectedTable?.tableNumber || tableNumber}</p>
                  </div>
                  <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-medium">
                    Available
                  </span>
                </div>

                {/* Name */}
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-500" />
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Customer Name"
                    className="w-full h-12 pl-10 pr-3 rounded-xl border border-gray-200 bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                {/* Phone */}
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500" />
                  <input
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="Phone Number"
                    className="w-full h-12 pl-10 pr-3 rounded-xl border border-gray-200 bg-gray-50 focus:ring-2 focus:ring-green-500 outline-none"
                  />
                </div>

                {/* Email */}
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-500" />
                  <input
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="Email"
                    className="w-full h-12 pl-10 pr-3 rounded-xl border border-gray-200 bg-gray-50 focus:ring-2 focus:ring-purple-500 outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Menu Items */}
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
              <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                <div className="w-1 h-5 bg-gradient-to-b from-green-500 to-emerald-500 rounded-full" />
                Add Menu Items *
              </h3>

              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="🔍 Search for dishes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white outline-none"
                />
              </div>

              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {categories.map((category) => (
                  <button
                    key={category}
                    type="button"
                    onClick={() => setSelectedCategory(category)}
                    className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-all ${selectedCategory === category
                      ? "bg-orange-500 text-white shadow-lg"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                  >
                    {category}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
                {filteredMenu.length === 0 ? (
                  <div className="col-span-full p-6 text-center text-gray-400">
                    <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    No items found
                  </div>
                ) : (
                  filteredMenu.map((item) => (
                    <div
                      key={item._id}
                      onClick={() => {
                        setEditingItem(item);
                        setVariantModalOpen(true);
                      }}
                      className="bg-white rounded-2xl border border-gray-200 overflow-hidden cursor-pointer hover:shadow-lg transition-all group"
                    >
                      <div className="aspect-square bg-gray-100">
                        {item.image ? (
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <UtensilsCrossed className="w-8 h-8" />
                          </div>
                        )}
                      </div>
                      <div className="p-3">
                        <h4 className="font-semibold text-sm line-clamp-1">{item.name}</h4>
                        <p className="text-xs text-gray-500">
                          {item.isAvailable ? "Available" : "Not Available"}
                        </p>
                        <div className="flex justify-between items-center mt-2">
                          <span className="font-bold text-orange-600">₹{item.price}</span>
                          <button
                            type="button"
                            className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center hover:bg-green-600 transition"
                          >
                            <PlusIcon size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Selected Items */}
            {selectedItems.length > 0 && (
              <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
                <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                  <div className="w-1 h-5 bg-gradient-to-b from-purple-500 to-indigo-500 rounded-full" />
                  Current Order Items
                </h3>
                <div className="space-y-3">
                  {selectedItems.map((item) => (
                    <div
                      key={item._id}
                      className="flex items-center justify-between p-3 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl border border-purple-100"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-gray-800">{item.name}</p>
                        <p className="text-xs text-gray-500">
                          {item.selectedVariant ? `Variant: ${item.selectedVariant.name}` : ""}
                          {item.selectedAddons && item.selectedAddons.length > 0
                            ? ` | Add‑ons: ${item.selectedAddons.map((a) => a.name).join(", ")}`
                            : ""}
                        </p>
                        <p className="text-sm font-medium text-gray-700">
                          ₹{calculateItemTotal(item).toFixed(2)}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item._id, -1)}
                          className="p-1.5 hover:bg-white rounded-lg transition shadow-sm bg-white/80 text-purple-600"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-8 text-center font-semibold text-gray-800">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item._id, 1)}
                          className="p-1.5 hover:bg-white rounded-lg transition shadow-sm bg-white/80 text-purple-600"
                        >
                          <PlusIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-3 border-t border-gray-200 flex justify-between items-center">
                  <span className="text-gray-600 font-medium">Total Amount</span>
                  <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                    ₹{calculateTotal().toFixed(2)}
                  </span>
                </div>
              </div>
            )}

            {/* Special Instructions */}
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
              <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                <div className="w-1 h-5 bg-gradient-to-b from-amber-500 to-orange-500 rounded-full" />
                Special Instructions
                <span className="text-xs text-gray-400 font-normal">(Optional)</span>
              </h3>
              <textarea
                value={specialInstructions}
                onChange={(e) => setSpecialInstructions(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-gray-50 resize-none outline-none"
                rows={2}
                placeholder="Any special requests, allergies, or preferences..."
              />
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="h-12 md:h-14 rounded-2xl border border-gray-300 bg-white font-semibold text-gray-700 hover:bg-gray-50 transition-all disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                type="button"
                disabled={submitting || selectedItems.length === 0}
                className="h-12 md:h-14 rounded-2xl bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold shadow-lg hover:shadow-xl active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <ShoppingCart className="w-5 h-5" />
                    Place Order
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {variantModalOpen && editingItem && (
        <VariantSelectionModal
          item={editingItem}
          onClose={() => {
            setVariantModalOpen(false);
            setEditingItem(null);
          }}
          onAddToCart={(customizedItem) => {
            setSelectedItems((prev) => {
              const existing = prev.find((i) => i._id === customizedItem._id);
              if (existing) {
                return prev.map((i) =>
                  i._id === customizedItem._id
                    ? { ...i, quantity: i.quantity + 1 }
                    : i
                );
              }
              return [...prev, customizedItem];
            });
            setVariantModalOpen(false);
            setEditingItem(null);
          }}
        />
      )}
    </div>
  );
}

// ==================== Order Detail Modal ====================
function OrderDetailModal({
  order,
  onClose,
  onUpdateStatus,
}: {
  order: Order;
  onClose: () => void;
  onUpdateStatus: (status: string) => void;
}) {
  const getStatusColor = (status: string) => {
    const colors: Record<string, { bg: string; text: string; border: string }> = {
      pending: { bg: "bg-amber-100", text: "text-amber-700", border: "border-amber-300" },
      preparing: { bg: "bg-blue-100", text: "text-blue-700", border: "border-blue-300" },
      ready: { bg: "bg-emerald-100", text: "text-emerald-700", border: "border-emerald-300" },
      served: { bg: "bg-purple-100", text: "text-purple-700", border: "border-purple-300" },
      completed: { bg: "bg-gray-100", text: "text-gray-700", border: "border-gray-300" },
      out_for_delivery: { bg: "bg-indigo-100", text: "text-indigo-700", border: "border-indigo-300" },
      delivered: { bg: "bg-teal-100", text: "text-teal-700", border: "border-teal-300" },
      paid: { bg: "bg-green-100", text: "text-green-700", border: "border-green-300" },
      cancelled: { bg: "bg-rose-100", text: "text-rose-700", border: "border-rose-300" },
    };
    return colors[status] || colors.pending;
  };

  const statusStyle = getStatusColor(order.status);

  const currentBatch = order.currentKotBatch || 0;
  const latestItems = order.items.filter(
    (item) => (item.kotBatch || 0) === currentBatch && currentBatch > 1
  );

  const subtotal = order.totalAmount || order.items.reduce((s, i) => s + i.price * i.quantity, 0);
  const cgst = order.cgstAmount || 0;
  const sgst = order.sgstAmount || 0;
  const finalAmount = order.finalAmount || subtotal + cgst + sgst;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-6 py-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <div className="bg-white/20 p-2.5 rounded-xl">
              <UtensilsCrossed className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white flex items-center gap-3">
                Order #{order.orderNumber.slice(-3)}
                <span className="text-sm font-normal text-white/80">
                  {order.orderType === "dine_in" && <>🍽️ Table {order.tableNumber}</>}
                  {order.orderType === "takeaway" && <>🥡 Takeaway</>}
                  {order.orderType === "delivery" && <>🚚 Delivery</>}
                </span>
              </h3>
              <p className="text-white/80 text-sm flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {new Date(order.createdAt).toLocaleString()}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-full transition text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50/50 space-y-5">
          {/* Order Info */}
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
            <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
              <div className="w-1 h-5 bg-gradient-to-b from-blue-500 to-indigo-600 rounded-full" />
              Order Information
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider">Table</p>
                <p className="text-lg font-semibold text-gray-800">#{order.tableNumber}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider">Status</p>
                <span
                  className={`inline-flex items-center px-2.5 py-1 mt-1 rounded-full text-sm font-medium border ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}
                >
                  {order.status === "ready" && <CheckCircle2 className="w-3.5 h-3.5 mr-1" />}
                  {order.status === "preparing" && <ChefHat className="w-3.5 h-3.5 mr-1" />}
                  {order.status === "pending" && <Clock className="w-3.5 h-3.5 mr-1" />}
                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                </span>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider">Total Items</p>
                <p className="text-lg font-semibold text-gray-800">
                  {order.items.reduce((sum, item) => sum + item.quantity, 0)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider">Total Amount</p>
                <p className="text-lg font-semibold text-gray-800">₹{finalAmount.toFixed(2)}</p>
              </div>
            </div>
          </div>

          {/* Customer Info */}
          {(order.customerId?.name || order.customerName) && (
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
              <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                <div className="w-1 h-5 bg-gradient-to-b from-emerald-500 to-teal-500 rounded-full" />
                Customer Details
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider">Name</p>
                  <p className="font-medium text-gray-800 flex items-center gap-1">
                    <User className="w-4 h-4 text-emerald-500" />
                    {order.customerId?.name || order.customerName}
                  </p>
                </div>
                {order.customerId?.phone && (
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider">Phone</p>
                    <p className="font-medium text-gray-800 flex items-center gap-1">
                      <Phone className="w-4 h-4 text-emerald-500" />
                      {order.customerId.phone}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Items */}
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
            <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
              <div className="w-1 h-5 bg-gradient-to-b from-amber-500 to-orange-500 rounded-full" />
              Order Items
            </h3>

            {/* Newly Added Items */}
            {currentBatch > 1 && latestItems.length > 0 && (
              <div className="mb-5 rounded-xl border-2 border-orange-300 bg-orange-50 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <ChefHat className="w-5 h-5 text-orange-600" />
                  <h4 className="font-bold text-orange-700">
                    Newly Added Items (KOT #{currentBatch})
                  </h4>
                </div>
                <div className="space-y-2">
                  {latestItems.map((item, index) => (
                    <div
                      key={index}
                      className="flex justify-between rounded-lg bg-white p-3 border"
                    >
                      <div>
                        <p className="font-semibold">
                          {item.quantity} × {item.name}
                        </p>
                        {item.specialInstructions && (
                          <p className="text-xs text-red-500 mt-1">{item.specialInstructions}</p>
                        )}
                      </div>
                      <span className="font-semibold text-orange-600">NEW</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Item Table */}
            <div className="overflow-hidden rounded-lg border border-gray-200">
              <table className="w-full text-sm">
                <thead className="bg-gradient-to-r from-amber-50 to-orange-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Item
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Qty
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Price
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {order.items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-orange-50/50 transition-colors">
                      <td className="px-4 py-3 font-medium text-gray-800">
                        {item.name}
                        {item.specialInstructions && (
                          <p className="text-xs text-amber-600 mt-0.5 italic">
                            ↳ {item.specialInstructions}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center text-gray-600">{item.quantity}</td>
                      <td className="px-4 py-3 text-right text-gray-600">
                        ₹{item.price.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-gray-800">
                        ₹{(item.quantity * item.price).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Bill Summary */}
            <div className="mt-5 rounded-xl border border-gray-200 bg-gray-50 p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium">₹{subtotal.toFixed(2)}</span>
              </div>
              {order.cgstRate > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">CGST ({order.cgstRate}%)</span>
                  <span>₹{cgst.toFixed(2)}</span>
                </div>
              )}
              {order.sgstRate > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">SGST ({order.sgstRate}%)</span>
                  <span>₹{sgst.toFixed(2)}</span>
                </div>
              )}
              <div className="border-t border-dashed border-gray-300 pt-3 flex justify-between items-center">
                <span className="text-lg font-bold text-gray-800">Final Amount</span>
                <span className="text-2xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                  ₹{finalAmount.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Special Instructions */}
          {order.specialInstructions && (
            <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl p-5 shadow-sm border border-orange-200">
              <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-orange-600" />
                Special Instructions
              </h3>
              <p className="text-gray-700 italic">"{order.specialInstructions}"</p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 border-t border-gray-200 px-6 py-4 flex flex-wrap justify-between items-center gap-3 shrink-0">
          <div className="flex flex-wrap gap-3">
            {order.status === "ready" && (
              <button
                onClick={() => {
                  onUpdateStatus("served");
                  onClose();
                }}
                className="px-5 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-medium hover:shadow-lg hover:scale-[1.02] transition-all flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                Mark as Served
              </button>
            )}
            {order.status === "pending" && (
              <button
                onClick={() => {
                  onUpdateStatus("preparing");
                  onClose();
                }}
                className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-medium hover:shadow-lg hover:scale-[1.02] transition-all flex items-center gap-2"
              >
                <ChefHat className="w-4 h-4" />
                Start Preparing
              </button>
            )}
            {order.status === "preparing" && (
              <button
                onClick={() => {
                  onUpdateStatus("ready");
                  onClose();
                }}
                className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-medium hover:shadow-lg hover:scale-[1.02] transition-all flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                Mark Ready
              </button>
            )}
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2.5 border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-white hover:shadow-md transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ==================== Empty State ====================
function EmptyState({ message }: { message: string }) {
  return (
    <div className="bg-white rounded-xl p-8 text-center border border-dashed border-gray-300">
      <ShoppingCart className="w-10 h-10 text-gray-300 mx-auto mb-2" />
      <p className="text-gray-500">{message}</p>
    </div>
  );
}

// ==================== Loading Skeleton ====================
function WaiterSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 p-6 animate-pulse">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between mb-6">
          <div className="h-8 w-48 bg-gray-200 rounded" />
          <div className="h-10 w-32 bg-gray-200 rounded" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[...Array(4)].map((_, i) => (
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
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
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

// ==================== Completed Orders Modal ====================
interface CompletedOrdersModalProps {
  orders: Order[];
  onClose: () => void;
  onViewOrder: (order: Order) => void;
}

function CompletedOrdersModal({
  orders,
  onClose,
  onViewOrder,
}: CompletedOrdersModalProps) {
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
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center rounded-t-2xl">
          <div>
            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-3">
              <span>✅ Completed Orders</span>
              <span className="bg-green-100 text-green-700 text-sm font-semibold px-3 py-0.5 rounded-full">
                {completedOrders.length}
              </span>
            </h3>
            <p className="text-sm text-gray-500 mt-0.5">
              All finished orders – newest first. Click any order to view details.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <XCircle className="w-5 h-5 text-gray-400" />
          </button>
        </div>

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
                  className="bg-gray-50/70 hover:bg-gray-100 border border-gray-200 rounded-xl p-4 transition-all cursor-pointer flex items-center justify-between flex-wrap gap-4"
                >
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 flex-1 min-w-[200px]">
                    <div>
                      <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">
                        Order No
                      </p>
                      <p className="font-bold text-gray-800">#{order.orderNumber.slice(-3)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">
                        Table
                      </p>
                      <p className="font-semibold text-gray-800">{order.tableNumber}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">
                        Customer
                      </p>
                      <p className="font-semibold text-gray-800 truncate">
                        {order.customerId?.name || "Walk-in"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">
                        Items
                      </p>
                      <p className="font-semibold text-gray-800">{totalItems(order)}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 ml-4 shrink-0">
                    <div className="text-right">
                      <p className="text-xs text-gray-400">Completed</p>
                      <p className="text-sm font-medium text-gray-700 whitespace-nowrap">
                        {formatTime(order.updatedAt)}
                      </p>
                    </div>
                    <CheckCircle2 className="w-6 h-6 text-green-500 shrink-0" />
                  </div>
                </div>
              ))}
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