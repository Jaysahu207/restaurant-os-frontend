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
  getMenuItems, // Assuming this service exists
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
} from "lucide-react";
import toast from "react-hot-toast";

// ==================== Types ====================
interface MenuItem {
  _id: string;
  name: string;
  price: number;
  category?: string;
  description?: string;
  isAvailable?: boolean;
}

interface OrderItem {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  specialInstructions?: string;
}

interface Order {
  _id: string;
  tableNumber: number;
  items: OrderItem[];
  status: "pending" | "preparing" | "ready" | "served" | "completed";
  totalAmount: number;
  createdAt: string;
  customerName?: string;
  customerPhone?: string;
  specialInstructions?: string;
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
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize audio
  useEffect(() => {
    audioRef.current = new Audio("/sounds/order-placed.mp3");
    audioRef.current.load();
  }, []);

  const playSound = useCallback(() => {
    if (!soundEnabled || !audioRef.current) return;
    audioRef.current.currentTime = 0;
    audioRef.current.play().catch(() => {});
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
      console.log(menuData);
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
      console.log("🟢 Waiter socket connected");
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

    socket.on("ORDER_UPDATED", (updatedOrder: Order) => {
      setOrders((prev) =>
        prev.map((o) => (o._id === updatedOrder._id ? updatedOrder : o)),
      );
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
    // Optimistic update
    setOrders((prev) =>
      prev.map((o) =>
        o._id === orderId ? { ...o, status: newStatus as Order["status"] } : o,
      ),
    );
    try {
      await updateOrderStatus(orderId, newStatus);
      toast.success(`Order marked as ${newStatus}`);
    } catch (error) {
      toast.error("Failed to update status");
      loadData(); // Revert on error
    }
  };
  const handleLogout = () => {
    // Clear auth state and redirect to login
    localStorage.removeItem("authToken");
    useAuthStore.setState({ user: null, token: null });
    window.location.href = "/";
  };
  // Create new order
  const handleCreateOrder = async (orderData: {
    tableNumber: number;
    items: OrderItem[];
    customerName?: string;
    customerPhone?: string;
    specialInstructions?: string;
  }) => {
    try {
      const payload = {
        restaurantId: restaurant._id,
        ...orderData,
      };
      await placeOrder(payload);
      toast.success("Order created successfully");
      setCreateModalOpen(false);
      loadData(); // Refresh orders
    } catch (error) {
      toast.error("Failed to create order");
      throw error;
    }
  };

  const openDetail = (order: Order) => {
    setSelectedOrder(order);
    setDetailModalOpen(true);
  };

  // Filter orders for waiter view
  const readyOrders = orders.filter((o) => o.status === "ready");
  const servedOrders = orders.filter((o) => o.status === "served");
  const preparingOrders = orders.filter((o) => o.status === "preparing");
  const pendingOrders = orders.filter((o) => o.status === "pending");

  // Loading skeleton
  if (loading && !refreshing) {
    return <WaiterSkeleton />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 py-4 md:px-6 md:py-6">
        {/* Header with Restaurant, Waiter & Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-orange-600 to-orange-800 bg-clip-text text-transparent truncate">
              {restaurant?.name || "Restaurant"}
            </h1>
            <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
              <User className="w-3 h-3" />
              <span>Waiter: {user?.name || "John Doe"}</span>
            </p>
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
              onClick={handleLogout} // ❗ Implement your logout logic
              className="p-2 rounded-full bg-red-50 text-red-600 active:scale-95 transition"
              title="Logout"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>

        {/* Live Connection Status */}
        <div className="mb-5 text-right text-xs">
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

        {/* Stats Cards (2x2 grid on mobile, 4 columns on larger) */}
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
            color="bg-gray-500"
            icon={CheckCircle2}
          />
        </div>

        {/* Ready to Serve Section (most prominent) */}
        <section className="mb-10">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              Ready to Serve
              {readyOrders.length > 0 && (
                <span className="bg-emerald-100 text-emerald-700 text-xs px-2 py-0.5 rounded-full">
                  {readyOrders.length}
                </span>
              )}
            </h2>
          </div>
          {readyOrders.length === 0 ? (
            <EmptyState message="No orders ready" />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {readyOrders.map((order) => (
                <OrderCard
                  key={order._id}
                  order={order}
                  onServe={(id) => updateStatus(id, "served")}
                  onViewDetail={openDetail}
                  highlight
                />
              ))}
            </div>
          )}
        </section>

        {/* Other Status Sections */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatusColumn
            title="Preparing"
            icon={ChefHat}
            orders={preparingOrders}
            statusColor="border-blue-400"
            onViewDetail={openDetail}
          />
          <StatusColumn
            title="Pending"
            icon={Clock}
            orders={pendingOrders}
            statusColor="border-amber-400"
            onViewDetail={openDetail}
          />
          <StatusColumn
            title="Recently Served"
            icon={CheckCircle2}
            orders={servedOrders.slice(0, 5)}
            statusColor="border-gray-400"
            onViewDetail={openDetail}
          />
        </div>

        {/* Floating Action Button for New Order */}
        <button
          onClick={() => setCreateModalOpen(true)}
          className="fixed bottom-6 right-6 bg-orange-600 text-white p-4 rounded-full shadow-lg hover:bg-orange-700 active:scale-95 transition-all z-20 flex items-center justify-center"
        >
          <Plus size={24} />
        </button>

        {/* Modals (unchanged) */}
        {createModalOpen && (
          <CreateOrderModal
            menuItems={menuItems}
            onClose={() => setCreateModalOpen(false)}
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
      className={`bg-white rounded-xl shadow-sm p-4 border ${
        highlight ? "border-green-300 ring-1 ring-green-200" : "border-gray-100"
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
    <div className={`bg-white rounded-xl shadow-sm border-t-4 ${statusColor}`}>
      <div className="p-4 border-b">
        <h3 className="font-semibold text-gray-800 flex items-center gap-2">
          <Icon className="w-5 h-5" />
          {title}
          <span className="ml-auto text-sm text-gray-500">{orders.length}</span>
        </h3>
      </div>
      <div className="p-4 space-y-3 max-h-[400px] overflow-y-auto">
        {orders.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">No orders</p>
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
  return (
    <div className="border rounded-lg p-3 bg-gray-50 hover:shadow-sm transition">
      <div className="flex justify-between items-start">
        <div>
          <p className="font-medium">Table {order.tableNumber}</p>
          <p className="text-xs text-gray-500">
            {new Date(order.createdAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>
        <button
          onClick={onViewDetail}
          className="p-1 text-gray-500 hover:bg-gray-200 rounded"
        >
          <Eye className="w-4 h-4" />
        </button>
      </div>
      <p className="text-sm mt-1 truncate">
        {order.items.length} item{order.items.length !== 1 ? "s" : ""}
      </p>
    </div>
  );
}

// ==================== Full Order Card (for Ready section) ====================
function OrderCard({
  order,
  onServe,
  onViewDetail,
  highlight = false,
}: {
  order: Order;
  onServe: (id: string) => void;
  onViewDetail: (order: Order) => void;
  highlight?: boolean;
}) {
  const totalItems = order.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div
      className={`bg-white rounded-xl shadow-sm border ${
        highlight ? "border-green-300 ring-1 ring-green-200" : "border-gray-200"
      } p-4 hover:shadow-md transition`}
    >
      <div className="flex justify-between items-start mb-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-800 text-lg">
              Table {order.tableNumber}
            </span>
            <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full">
              #{order._id.slice(-6)}
            </span>
          </div>
          {order.customerName && (
            <p className="text-sm text-gray-600 flex items-center gap-1">
              <User className="w-3 h-3" />
              {order.customerName}
            </p>
          )}
        </div>
        <button
          onClick={() => onViewDetail(order)}
          className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg transition"
        >
          <Eye className="w-4 h-4" />
        </button>
      </div>

      <div className="mt-2 space-y-1">
        {order.items.slice(0, 3).map((item, idx) => (
          <div key={idx} className="flex justify-between text-sm">
            <span>
              {item.quantity}× {item.name}
            </span>
          </div>
        ))}
        {order.items.length > 3 && (
          <p className="text-xs text-gray-500">
            +{order.items.length - 3} more items
          </p>
        )}
      </div>

      {order.specialInstructions && (
        <div className="mt-2 text-xs text-orange-600 bg-orange-50 p-1.5 rounded">
          Note: {order.specialInstructions}
        </div>
      )}

      <div className="mt-3 flex items-center justify-between">
        <span className="text-sm font-semibold">
          ₹{order.totalAmount.toFixed(2)}
        </span>
        <button
          onClick={() => onServe(order._id)}
          className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg transition flex items-center gap-1"
        >
          <CheckCircle2 className="w-4 h-4" />
          Mark Served
        </button>
      </div>
    </div>
  );
}

// ==================== Create Order Modal ====================
function CreateOrderModal({
  menuItems,
  onClose,
  onSubmit,
  restaurantId,
}: {
  menuItems: MenuItem[];
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  restaurantId: string;
}) {
  const [tableNumber, setTableNumber] = useState<number>(1);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [selectedItems, setSelectedItems] = useState<
    (MenuItem & { quantity: number; specialInstructions?: string })[]
  >([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const filteredMenu = menuItems.filter(
    (item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      item.isAvailable !== false,
  );

  const addItem = (item: MenuItem) => {
    const existing = selectedItems.find((i) => i._id === item._id);
    if (existing) {
      setSelectedItems(
        selectedItems.map((i) =>
          i._id === item._id ? { ...i, quantity: i.quantity + 1 } : i,
        ),
      );
    } else {
      setSelectedItems([...selectedItems, { ...item, quantity: 1 }]);
    }
  };

  const updateQuantity = (id: string, delta: number) => {
    setSelectedItems(
      selectedItems
        .map((item) =>
          item._id === id
            ? { ...item, quantity: Math.max(0, item.quantity + delta) }
            : item,
        )
        .filter((item) => item.quantity > 0),
    );
  };

  const calculateTotal = () =>
    selectedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

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
          specialInstructions: item.specialInstructions,
        })),
        customerName: customerName || undefined,
        customerPhone: customerPhone || undefined,
        specialInstructions: specialInstructions || undefined,
      });
    } catch (error) {
      // Error already handled in parent
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Header with gradient */}
        <div className="bg-gradient-to-r from-orange-500 to-pink-500 px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-xl">
              <UtensilsCrossed className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-xl font-bold text-white">Create New Order</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-full transition text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-gradient-to-b from-gray-50 to-white">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Table & Customer Info Card */}
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
              <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                <div className="w-1 h-5 bg-gradient-to-b from-orange-500 to-pink-500 rounded-full" />
                Customer & Table Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wider">
                    Table Number *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-orange-500">
                      🪑
                    </span>
                    <input
                      type="number"
                      min="1"
                      value={tableNumber}
                      onChange={(e) => setTableNumber(parseInt(e.target.value))}
                      className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-gray-50"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wider">
                    Customer Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-500 w-4 h-4" />
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
                      placeholder="Optional"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wider">
                    Customer Phone
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-green-500 w-4 h-4" />
                    <input
                      type="tel"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-gray-50"
                      placeholder="Optional"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Menu Item Selection Card */}
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
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
                />
              </div>
              <div className="max-h-56 overflow-y-auto border border-gray-200 rounded-lg divide-y divide-gray-100">
                {filteredMenu.length === 0 ? (
                  <div className="p-6 text-center text-gray-400">
                    <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    No items found
                  </div>
                ) : (
                  filteredMenu.map((item) => (
                    <div
                      key={item._id}
                      className="flex items-center justify-between p-3 hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 cursor-pointer transition-all group"
                      onClick={() => addItem(item)}
                    >
                      <div className="flex-1">
                        <p className="font-medium text-gray-800 group-hover:text-green-700 transition">
                          {item.name}
                        </p>
                        <p className="text-sm text-gray-500">
                          ₹{item.price.toFixed(2)}
                        </p>
                      </div>
                      <div className="bg-green-100 group-hover:bg-green-200 rounded-full p-1.5 transition">
                        <PlusIcon className="w-4 h-4 text-green-700" />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Selected Items Card */}
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
                        <p className="text-sm text-purple-600">
                          ₹{item.price.toFixed(2)} each
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
                  <span className="text-gray-600 font-medium">
                    Total Amount
                  </span>
                  <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                    ₹{calculateTotal().toFixed(2)}
                  </span>
                </div>
              </div>
            )}

            {/* Special Instructions Card */}
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
              <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                <div className="w-1 h-5 bg-gradient-to-b from-amber-500 to-orange-500 rounded-full" />
                Special Instructions
                <span className="text-xs text-gray-400 font-normal">
                  (Optional)
                </span>
              </h3>
              <textarea
                value={specialInstructions}
                onChange={(e) => setSpecialInstructions(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-gray-50 resize-none"
                rows={2}
                placeholder="Any special requests, allergies, or preferences..."
              />
            </div>
          </form>
        </div>

        {/* Footer with gradient */}
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 border-t border-gray-200 px-6 py-5 flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={submitting}
            className="px-5 py-2.5 border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-white hover:shadow-md transition disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || selectedItems.length === 0}
            className="px-6 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-medium hover:shadow-lg hover:scale-[1.02] transition-all disabled:opacity-50 disabled:hover:scale-100 flex items-center gap-2"
          >
            {submitting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Creating Order...
              </>
            ) : (
              <>
                <ShoppingCart className="w-5 h-5" />
                Place Order • ₹{calculateTotal().toFixed(0)}
              </>
            )}
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
  onUpdateStatus,
}: {
  order: Order;
  onClose: () => void;
  onUpdateStatus: (status: string) => void;
}) {
  const getStatusColor = (status: string) => {
    const colors: Record<string, { bg: string; text: string; border: string }> =
      {
        pending: {
          bg: "bg-yellow-100",
          text: "text-yellow-700",
          border: "border-yellow-300",
        },
        preparing: {
          bg: "bg-blue-100",
          text: "text-blue-700",
          border: "border-blue-300",
        },
        ready: {
          bg: "bg-green-100",
          text: "text-green-700",
          border: "border-green-300",
        },
        served: {
          bg: "bg-purple-100",
          text: "text-purple-700",
          border: "border-purple-300",
        },
        completed: {
          bg: "bg-gray-100",
          text: "text-gray-700",
          border: "border-gray-300",
        },
      };
    return colors[status] || colors.pending;
  };

  const statusStyle = getStatusColor(order.status);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with gradient */}
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-xl">
              <UtensilsCrossed className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">
                Order #{order._id.slice(-6)}
              </h3>
              <p className="text-white/80 text-sm flex items-center gap-1">
                <Clock className="w-3 h-3" />
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

        <div className="flex-1 overflow-y-auto p-6 bg-gradient-to-b from-gray-50 to-white space-y-5">
          {/* Order Info Card */}
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
            <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
              <div className="w-1 h-5 bg-gradient-to-b from-blue-500 to-indigo-600 rounded-full" />
              Order Information
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider">
                  Table
                </p>
                <p className="text-lg font-semibold text-gray-800 flex items-center gap-1">
                  <span className="text-2xl">🪑</span> {order.tableNumber}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider">
                  Status
                </p>
                <span
                  className={`inline-flex items-center px-2.5 py-1 mt-1 rounded-full text-sm font-medium border ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}
                >
                  {order.status === "ready" && (
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                  )}
                  {order.status === "preparing" && (
                    <ChefHat className="w-3.5 h-3.5 mr-1" />
                  )}
                  {order.status === "pending" && (
                    <Clock className="w-3.5 h-3.5 mr-1" />
                  )}
                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                </span>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider">
                  Total Items
                </p>
                <p className="text-lg font-semibold text-gray-800">
                  {order.items.reduce((sum, item) => sum + item.quantity, 0)}
                </p>
              </div>
            </div>
          </div>

          {/* Customer Info Card (if exists) */}
          {order.customerName && (
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
              <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                <div className="w-1 h-5 bg-gradient-to-b from-emerald-500 to-teal-500 rounded-full" />
                Customer Details
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider">
                    Name
                  </p>
                  <p className="font-medium text-gray-800 flex items-center gap-1">
                    <User className="w-4 h-4 text-emerald-500" />
                    {order.customerName}
                  </p>
                </div>
                {order.customerPhone && (
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider">
                      Phone
                    </p>
                    <p className="font-medium text-gray-800 flex items-center gap-1">
                      <Phone className="w-4 h-4 text-emerald-500" />
                      {order.customerPhone}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Items Card */}
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
            <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
              <div className="w-1 h-5 bg-gradient-to-b from-amber-500 to-orange-500 rounded-full" />
              Order Items
            </h3>
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
                    <tr
                      key={idx}
                      className="hover:bg-orange-50/50 transition-colors"
                    >
                      <td className="px-4 py-3 font-medium text-gray-800">
                        {item.name}
                        {item.specialInstructions && (
                          <p className="text-xs text-amber-600 mt-0.5 italic">
                            ↳ {item.specialInstructions}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center text-gray-600">
                        {item.quantity}
                      </td>
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
            <div className="mt-4 pt-3 border-t border-gray-200 flex justify-between items-center">
              <span className="text-gray-600 font-medium">Total Amount</span>
              <span className="text-2xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                ₹{order.totalAmount.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Special Instructions Card */}
          {order.specialInstructions && (
            <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl p-5 shadow-sm border border-orange-200">
              <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-orange-600" />
                Special Instructions
              </h3>
              <p className="text-gray-700 italic">
                "{order.specialInstructions}"
              </p>
            </div>
          )}
        </div>

        {/* Footer with actions */}
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 border-t border-gray-200 px-6 py-5 flex justify-between items-center">
          <div className="flex gap-3">
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
      <div className="max-w-[1600px] mx-auto">
        <div className="flex justify-between mb-6">
          <div className="h-8 w-48 bg-gray-200 rounded" />
          <div className="h-10 w-32 bg-gray-200 rounded" />
        </div>
        <div className="grid grid-cols-4 gap-4 mb-6">
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
        <div className="h-64 bg-gray-200 rounded-xl" />
      </div>
    </div>
  );
}
