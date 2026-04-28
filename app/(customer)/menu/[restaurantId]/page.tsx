"use client";

import {
  useState,
  useEffect,
  Suspense,
  useMemo,
  useRef,
  useCallback,
} from "react";
import {
  ShoppingCart,
  X,
  Plus,
  Minus,
  ChefHat,
  UtensilsCrossed,
  Clock,
  CheckCircle,
  AlertCircle,
  CreditCard,
  Loader2,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useCartStore } from "@/store/useCartStore";
import { fetchCustomerMenu } from "@/services/customerMenu";
import { useParams, useSearchParams } from "next/navigation";
import {
  placeOrder,
  completePayment,
  getOrderById,
} from "@/services/orderService";
import { io, Socket } from "socket.io-client";
import toast from "react-hot-toast";
import API from "@/config/axios";
import QRCode from "react-qr-code";
import { sendInvoice } from "@/services/invoiceService";

// ------------------------------------------------------------
// Types
// ------------------------------------------------------------
interface MenuItem {
  _id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image?: string;
  isAvailable?: boolean;
  isPopular?: boolean;
  variants?: { name: string; price: number }[];
  addons?: { name: string; price: number }[];
}

interface Restaurant {
  _id?: string;
  name: string;
  slug: string;
  contactEmail?: string;
  contactPhone?: string;
  upiId?: string;
  address?: { street: string; city: string; state: string; pincode: string };
  tax: { cgst: number; sgst: number; igst?: number; serviceCharge: number };
  billing: {
    invoicePrefix: string;
    invoiceStart: number;
    enableTaxes: boolean;
    enableServiceCharge: boolean;
    roundOff: boolean;
  };
  business?: { type: string; cuisines: string[] };
  legal?: { fssaiNumber?: string; gstNumber?: string; panNumber?: string };
  operations?: {
    tableCount: number;
    dineIn: boolean;
    takeaway: boolean;
    delivery: boolean;
  };
  logo?: string;
  coverImage?: string;
  isActive?: boolean;
  currency?: string;
  timezone?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface OrderItem {
  _id?: string;
  menuItemId?: string;
  name: string;
  price: number;
  quantity: number;
}

interface Order {
  _id: string;
  status: "pending" | "preparing" | "ready" | "served" | "paid" | "completed";
  totalAmount: number;
  finalAmount: number;
  items: OrderItem[];
  createdAt: string;
  orderNumber: string;
  isPaid?: boolean;
  paymentMethod?: "cash" | "upi";
  cgstAmount?: number;
  sgstAmount?: number;
  serviceChargeAmount?: number;
}

// ------------------------------------------------------------
// Constants
// ------------------------------------------------------------
const STATUS_FLOW: Order["status"][] = [
  "pending",
  "preparing",
  "ready",
  "served",
  "paid",
  "completed",
];
const PREP_TIME_MINUTES = 15;

// ------------------------------------------------------------
// Helper: Calculate cart totals with taxes (mirrors backend)
// ------------------------------------------------------------
const calculateCartTotals = (
  subtotal: number,
  restaurant: Restaurant | null,
) => {
  if (!restaurant)
    return {
      subtotal,
      cgst: 0,
      sgst: 0,
      serviceCharge: 0,
      grandTotal: subtotal,
    };
  let cgst = 0,
    sgst = 0,
    serviceCharge = 0;
  if (restaurant.billing.enableTaxes) {
    cgst = (subtotal * restaurant.tax.cgst) / 100;
    sgst = (subtotal * restaurant.tax.sgst) / 100;
  }
  if (restaurant.billing.enableServiceCharge) {
    serviceCharge = (subtotal * restaurant.tax.serviceCharge) / 100;
  }
  const grandTotal = subtotal + cgst + sgst + serviceCharge;
  return { subtotal, cgst, sgst, serviceCharge, grandTotal };
};

// ------------------------------------------------------------
// Main Component
// ------------------------------------------------------------
export default function CustomerMenuPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <UtensilsCrossed className="w-10 h-10 text-orange-400 animate-pulse" />
        </div>
      }
    >
      <CustomerMenuContent />
    </Suspense>
  );
}

function CustomerMenuContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const restaurantId = params?.restaurantId as string;
  const table = searchParams.get("table");

  // --- State ---
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<string[]>(["All"]);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<{
    name: string;
    price: number;
  } | null>(null);
  const [selectedAddons, setSelectedAddons] = useState<
    { name: string; price: number }[]
  >([]);
  const [modalQuantity, setModalQuantity] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [paymentStarted, setPaymentStarted] = useState(false);
  const [paymentTimeLeft, setPaymentTimeLeft] = useState(120);
  const [sending, setSending] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [timeLeft, setTimeLeft] = useState({ minutes: 0, seconds: 0 });

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // --- Cart Store ---
  const {
    items: cartItems,
    addItem,
    increaseQty,
    decreaseQty,
    removeItem,
    clearCart,
    getTotal,
  } = useCartStore();
  const cartCount = cartItems.reduce((sum, i) => sum + i.quantity, 0);
  const cartSubtotal = getTotal();

  // --- Derived cart totals with taxes ---
  const cartTotals = useMemo(
    () => calculateCartTotals(cartSubtotal, restaurant),
    [cartSubtotal, restaurant],
  );

  // ------------------------------------------------------------
  // Effects
  // ------------------------------------------------------------
  // Load menu & restaurant
  useEffect(() => {
    if (!restaurantId) return;
    const loadMenu = async () => {
      try {
        setLoading(true);
        const data = await fetchCustomerMenu(restaurantId);
        const menuItems = data?.items || [];
        const restaurantData = data?.restaurant || null;
        setMenu(menuItems);
        setRestaurant(restaurantData);
        const uniqueCategories: string[] = [
          "All",
          ...(Array.from(
            new Set(
              menuItems
                .map((item: MenuItem) => item.category?.trim())
                .filter(Boolean),
            ),
          ) as string[]),
        ];
        setCategories(uniqueCategories);
      } catch (err) {
        console.error(err);
        setError("Failed to load menu. Please try again.");
        toast.error("Menu loading failed");
      } finally {
        setLoading(false);
      }
    };
    loadMenu();
  }, [restaurantId]);

  // Restore order from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("currentOrder");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setCurrentOrder(parsed);
        setOrderPlaced(true);
      } catch (e) {}
    }
  }, []);

  // Save order to localStorage when updated
  useEffect(() => {
    if (currentOrder) {
      localStorage.setItem("currentOrder", JSON.stringify(currentOrder));
    }
  }, [currentOrder]);

  // Socket connection for real-time updates
  useEffect(() => {
    if (!restaurant?._id) return;
    const socket = io(process.env.NEXT_PUBLIC_API_URL, {
      transports: ["websocket", "polling"],
      withCredentials: true,
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("Socket connected");
      socket.emit("joinRestaurant", restaurant._id);
    });

    socket.on("ORDER_UPDATED", (updatedOrder: Order) => {
      setCurrentOrder((prev) =>
        prev && prev._id === updatedOrder._id ? updatedOrder : prev,
      );
      setOrderPlaced(true);
    });

    // Single ORDER_READY handler
    socket.on("ORDER_READY", (order: Order) => {
      if (currentOrder?._id === order._id) {
        playSound();
        setCurrentOrder(order);
        toast.success("🍽️ Your order is ready!");
      }
    });

    socket.on("ORDER_COMPLETED", (order: Order) => {
      if (currentOrder?._id === order._id) {
        playSound();
        setCurrentOrder(order);
        toast.success("✅ Order completed! Thanks for dining with us.");
      }
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [restaurant?._id, currentOrder?._id]); // added dependency to avoid stale closure

  // Timer for ETA
  useEffect(() => {
    if (!currentOrder?.createdAt) return;
    const updateTimer = () => {
      const end =
        new Date(currentOrder.createdAt).getTime() + PREP_TIME_MINUTES * 60000;
      const diff = Math.max(0, end - Date.now());
      setTimeLeft({
        minutes: Math.floor(diff / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
      });
    };
    updateTimer();
    timerIntervalRef.current = setInterval(updateTimer, 1000);
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [currentOrder?.createdAt]);

  // Payment timeout
  useEffect(() => {
    if (!paymentStarted) return;
    const timer = setInterval(() => {
      setPaymentTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          toast.error("Payment timeout!");
          setPaymentStarted(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [paymentStarted]);

  // Audio setup
  useEffect(() => {
    audioRef.current = new Audio("/sounds/order-placed.mp3");
    audioRef.current.load();
    const unlockAudio = () => {
      audioRef.current
        ?.play()
        .then(() => audioRef.current?.pause())
        .catch(() => {});
      window.removeEventListener("click", unlockAudio);
    };
    window.addEventListener("click", unlockAudio);
    return () => window.removeEventListener("click", unlockAudio);
  }, []);

  // ------------------------------------------------------------
  // Handlers
  // ------------------------------------------------------------
  const playSound = useCallback(() => {
    if (!soundEnabled || !audioRef.current) return;
    audioRef.current.currentTime = 0;
    audioRef.current
      .play()
      .catch((err) => console.warn("Audio play failed:", err));
  }, [soundEnabled]);

  const openItemModal = (item: MenuItem) => {
    setSelectedItem(item);
    if (item.variants?.length) {
      setSelectedVariant({
        name: item.variants[0].name,
        price: item.variants[0].price,
      });
    } else {
      setSelectedVariant(null);
    }
    setSelectedAddons([]);
    setModalQuantity(1);
  };

  const toggleAddon = (addon: { name: string; price: number }) => {
    setSelectedAddons((prev) =>
      prev.find((a) => a.name === addon.name)
        ? prev.filter((a) => a.name !== addon.name)
        : [...prev, { name: addon.name, price: addon.price }],
    );
  };

  const getModalItemTotal = () => {
    if (!selectedItem) return 0;
    let basePrice = selectedVariant?.price ?? selectedItem.price;
    const addonsTotal = selectedAddons.reduce((sum, a) => sum + a.price, 0);
    return (basePrice + addonsTotal) * modalQuantity;
  };

  const addToCartSimple = (item: MenuItem) => {
    addItem(
      { _id: item._id, name: item.name, price: item.price, quantity: 1 },
      restaurantId,
      table || "",
    );
    toast.success(`${item.name} added to cart`);
  };

  const addCustomizedToCart = () => {
    if (!selectedItem) return;
    let finalName = selectedItem.name;
    let unitPrice = selectedItem.price;
    if (selectedVariant) {
      finalName += ` (${selectedVariant.name})`;
      unitPrice = selectedVariant.price;
    }
    if (selectedAddons.length) {
      finalName += ` + ${selectedAddons.map((a) => a.name).join(", ")}`;
      unitPrice += selectedAddons.reduce((sum, a) => sum + a.price, 0);
    }
    for (let i = 0; i < modalQuantity; i++) {
      addItem(
        {
          _id: selectedItem._id,
          name: finalName,
          price: unitPrice,
          quantity: 1,
        },
        restaurantId,
        table || "",
      );
    }
    setSelectedItem(null);
    toast.success(`${finalName} added to cart`);
  };

  const handlePlaceOrder = async () => {
    if (!customerName.trim() || !customerPhone.trim() || !cartItems.length) {
      toast.error("Please enter your name and phone number");
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        restaurantId,
        tableNumber: table ? parseInt(table, 10) : 0,
        customer: {
          name: customerName,
          phone: customerPhone,
          email: customerEmail,
        },
        items: cartItems.map((item) => ({
          menuItemId: item._id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
        })),
        specialInstructions,
      };
      let res;
      if (currentOrder) {
        // Add items to existing order
        const { data } = await API.put(
          `/api/orders/${currentOrder._id}/add-items`,
          {
            items: payload.items,
          },
        );
        res = data;
      } else {
        res = await placeOrder(payload);
      }
      setCurrentOrder(res);
      setOrderPlaced(true);
      clearCart();
      setIsCheckingOut(false);
      setIsCartOpen(false);
      playSound();
      toast.success("Order placed successfully!");
    } catch (err) {
      console.error(err);
      toast.error("Order failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const generateUPILink = (amount: number, upiId: string, name: string) => {
    return `upi://pay?pa=${upiId}&pn=${encodeURIComponent(name)}&am=${amount}&cu=INR`;
  };

  const handlePayment = async (method: "cash" | "upi") => {
    if (!currentOrder) return;
    setIsPaying(true);
    console.log(currentOrder._id);
    try {
      if (method === "cash") {
        // await API.put(`/api/orders/${currentOrder._id}/pay`);
        await completePayment(currentOrder._id, "cash"); // ✅ FIX
        // Refresh order to get updated status
        const updated = await getOrderById(currentOrder._id);
        setCurrentOrder(updated);
        toast.success("Cash payment recorded!");
        setShowPayment(false);
      } else if (method === "upi") {
        if (!restaurant?.upiId) {
          toast.error("UPI not configured");
          return;
        }
        await API.put(`/api/orders/${currentOrder._id}/initiate-payment`, {
          method: "upi",
        });
        setPaymentStarted(true);
        setPaymentTimeLeft(120);
        const upiLink = generateUPILink(
          currentOrder.finalAmount,
          restaurant.upiId,
          restaurant.name,
        );
        // Open UPI app in new tab (keeps original page)
        window.open(upiLink, "_blank");
        toast.success("Open your UPI app to complete payment");
      }
    } catch (err) {
      toast.error("Payment failed");
    } finally {
      setIsPaying(false);
    }
  };

  const confirmPayment = async () => {
    if (!currentOrder) return;
    setIsPaying(true);
    try {
      await completePayment(currentOrder._id, "upi");
      const updated = await getOrderById(currentOrder._id);
      if (updated.paymentStatus === "paid") {
        setPaymentStarted(false);
      }
      setCurrentOrder(updated);
      toast.success("Payment submitted for verification!");
      setShowPayment(false);
      setPaymentStarted(false);
    } catch (err: any) {
      console.error("PAYMENT ERROR:", err?.response?.data || err.message);
      toast.error(err?.response?.data?.message || "Payment failed");
    } finally {
      setIsPaying(false);
    }
  };

  const handleSendEmail = async () => {
    if (!currentOrder) return;
    if (sending) return;
    setSending(true);
    try {
      await sendInvoice({ orderId: currentOrder._id, email: customerEmail });
      toast.success("Invoice sent to your email!");
    } catch (err) {
      toast.error("Failed to send invoice");
    } finally {
      setSending(false);
    }
  };

  const resetCustomerSession = () => {
    clearCart();
    setCurrentOrder(null);
    setOrderPlaced(false);
    setIsCartOpen(false);
    setIsCheckingOut(false);
    setShowPayment(false);
    setCustomerName("");
    setCustomerPhone("");
    setCustomerEmail("");
    setSpecialInstructions("");
    localStorage.removeItem("cart-storage");
    localStorage.removeItem("currentOrder");
    toast.success("Session reset. You can start a new order.");
  };

  // ------------------------------------------------------------
  // Render Helpers
  // ------------------------------------------------------------
  const filteredItems = useMemo(() => {
    if (selectedCategory === "All") return menu;
    return menu.filter((item) => item.category === selectedCategory);
  }, [menu, selectedCategory]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3">
        <UtensilsCrossed className="w-10 h-10 text-orange-400 animate-pulse" />
        <p className="text-gray-500">Loading menu...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 gap-4">
        <AlertCircle className="w-12 h-12 text-red-500" />
        <p className="text-red-600 text-center">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-orange-500 text-white rounded-lg"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!table) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">Invalid QR Code</h1>
          <p className="text-gray-500 mt-2">
            Please scan a valid table QR code.
          </p>
        </div>
      </div>
    );
  }

  // --- Order Placed View ---
  if (orderPlaced && currentOrder) {
    const currentStepIndex = STATUS_FLOW.indexOf(currentOrder.status);
    const baseUPI = `upi://pay?pa=${restaurant?.upiId}&pn=${restaurant?.name}&am=${currentOrder.finalAmount}&cu=INR`;

    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-indigo-50/30 p-4 flex items-center justify-center">
        <div className="max-w-md w-full mx-auto space-y-5 animate-fadeInUp">
          <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl p-6 border border-white/20">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <ChefHat className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-800">
                    Order #{currentOrder.orderNumber.slice(-3)}
                  </h2>

                  <p className="text-xs text-gray-500">Table No. {table}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs font-medium px-2 py-1 bg-orange-50 text-orange-600 rounded-full">
                  {currentOrder.status.toUpperCase()}
                </div>
              </div>
            </div>

            {/* Status Timeline */}
            <div className="my-6">
              <div className="relative flex justify-between">
                {STATUS_FLOW.map((step, idx) => {
                  const isActive = idx <= currentStepIndex;
                  return (
                    <div
                      key={step}
                      className="flex flex-col items-center flex-1"
                    >
                      <div
                        className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                          isActive
                            ? "bg-gradient-to-r from-orange-500 to-orange-600 shadow-md"
                            : "bg-gray-200"
                        }`}
                      >
                        {isActive ? (
                          <CheckCircle className="w-4 h-4 text-white" />
                        ) : (
                          <div className="w-2 h-2 bg-gray-400 rounded-full" />
                        )}
                      </div>
                      <span
                        className={`text-[11px] font-medium mt-2 ${isActive ? "text-orange-600" : "text-gray-400"}`}
                      >
                        {step.charAt(0).toUpperCase() + step.slice(1)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ETA */}
            {currentOrder.status !== "completed" &&
              currentOrder.status !== "served" && (
                <div className="bg-gradient-to-r from-gray-100 to-gray-50 rounded-2xl p-3 flex items-center justify-center gap-2">
                  <Clock className="w-4 h-4 text-orange-500 animate-pulse" />
                  <span className="text-sm text-gray-600">
                    Estimated arrival:{" "}
                    <span className="font-mono font-bold text-gray-800">
                      {timeLeft.minutes}m {timeLeft.seconds}s
                    </span>
                  </span>
                </div>
              )}

            {/* Order Items */}
            <div className="mt-4 space-y-3">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Your Order
              </h3>
              <div className="divide-y divide-gray-100">
                {currentOrder.items.map((item, idx) => (
                  <div
                    key={item._id || idx}
                    className="py-2 flex justify-between items-center"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-gray-500 w-6">
                        {item.quantity}×
                      </span>
                      <span className="text-gray-700">{item.name}</span>
                    </div>
                    <span className="font-medium text-gray-800">
                      ₹{(item.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Totals */}
            <div className="mt-4 pt-3 border-t border-dashed border-gray-200">
              <div className="space-y-1 text-sm text-gray-600">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>₹{currentOrder.totalAmount}</span>
                </div>
                <div className="flex justify-between">
                  <span>CGST</span>
                  <span>₹{currentOrder.cgstAmount || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>SGST</span>
                  <span>₹{currentOrder.sgstAmount || 0}</span>
                </div>
                {restaurant?.billing.enableServiceCharge && (
                  <div className="flex justify-between">
                    <span>Service Charge</span>
                    <span>₹{currentOrder.serviceChargeAmount || 0}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-lg border-t pt-2 mt-2">
                  <span>Grand Total</span>
                  <span>₹{currentOrder.finalAmount}</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3 mt-6">
              {!["completed", "paid"].includes(currentOrder.status) && (
                <button
                  onClick={() => {
                    setOrderPlaced(false);
                    setIsCartOpen(true);
                  }}
                  className="w-full py-3 rounded-xl font-semibold bg-white border border-gray-200 text-gray-700 hover:border-orange-300"
                >
                  + Add More Items
                </button>
              )}

              {currentOrder.status === "served" && (
                <button
                  onClick={() => setShowPayment(true)}
                  className="w-full py-3 rounded-xl font-semibold bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-md hover:shadow-lg"
                >
                  💳 Proceed to Pay
                </button>
              )}

              {currentOrder.status === "paid" && (
                <div className="text-center py-4">
                  <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-full text-sm">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Payment Done — Waiting for confirmation
                  </div>
                </div>
              )}

              {currentOrder.status === "completed" && (
                <div className="text-center space-y-4">
                  <div className="flex items-center justify-center gap-2 text-green-600 font-semibold">
                    <CheckCircle className="w-6 h-6" />
                    Payment Verified ✅
                  </div>
                  <p className="text-gray-500 text-sm">
                    Thank you! Visit Again 👋
                  </p>
                  <button
                    onClick={handleSendEmail}
                    disabled={sending}
                    className="w-full py-3 rounded-xl font-semibold bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-md flex items-center justify-center gap-2"
                  >
                    {sending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      "📧"
                    )}{" "}
                    Get Bill on Email
                  </button>
                  <button
                    onClick={resetCustomerSession}
                    className="w-full py-3 rounded-xl font-semibold bg-gradient-to-r from-orange-500 to-amber-600 text-white"
                  >
                    Back to Menu
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Payment Modal */}
          {showPayment && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
              <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl p-6 space-y-5">
                <div className="text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <CreditCard className="w-7 h-7 text-green-600" />
                  </div>
                  <h3 className="text-xl font-bold">Complete Payment</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Total:{" "}
                    <span className="font-bold">
                      ₹{currentOrder.finalAmount || currentOrder.totalAmount}
                    </span>
                  </p>
                </div>
                <div className="space-y-3">
                  <button
                    onClick={() => handlePayment("cash")}
                    disabled={isPaying}
                    className="w-full py-3 rounded-xl bg-gray-50 text-gray-800 font-medium hover:bg-gray-100 border border-gray-200"
                  >
                    {isPaying ? "Processing..." : "💵 Pay with Cash"}
                  </button>
                  {restaurant?.upiId && (
                    <>
                      <button
                        onClick={() => handlePayment("upi")}
                        disabled={isPaying || paymentStarted}
                        className="w-full py-3 rounded-xl font-semibold bg-gradient-to-r from-green-500 to-teal-600 text-white shadow-md"
                      >
                        {isPaying ? "Processing..." : "📱 Pay via UPI"}
                      </button>
                      <div className="relative flex flex-col items-center border-t border-gray-100 pt-4 mt-2">
                        <div className="absolute -top-3 bg-white px-2 text-xs text-gray-400">
                          OR
                        </div>
                        <p className="text-sm text-gray-600 mb-2">
                          Scan QR with any UPI app
                        </p>
                        <div className="bg-white p-2 rounded-2xl shadow-md">
                          <QRCode value={baseUPI} size={140} />
                        </div>
                        <div className="mt-3 flex items-center gap-1 text-xs text-gray-400">
                          <span>UPI: {restaurant.upiId}</span>
                          <button
                            onClick={() =>
                              navigator.clipboard.writeText(restaurant.upiId!)
                            }
                            className="text-blue-500"
                          >
                            📋
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                  {paymentStarted && currentOrder.status !== "paid" && (
                    <div className="mt-4 p-3 bg-red-50 rounded-xl">
                      <p className="text-center text-red-600 font-semibold animate-pulse">
                        ⏱️ Complete payment within {paymentTimeLeft}s
                      </p>
                      <button
                        onClick={confirmPayment}
                        disabled={isPaying}
                        className="w-full mt-2 py-2 bg-blue-600 text-white rounded-lg"
                      >
                        {isPaying ? "Confirming..." : "✅ I Have Paid"}
                      </button>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => setShowPayment(false)}
                  className="w-full py-2 text-red-500 border border-red-200 rounded-xl"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // --- Menu & Cart View ---
  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-20">
        <div className="max-w-3xl mx-auto px-4 py-3 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              {restaurant?.name || "Restaurant"}
            </h1>
            <p className="text-xs text-gray-500">Table {table}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSoundEnabled((s) => !s)}
              className="p-2 text-gray-600"
            >
              {soundEnabled ? (
                <Volume2 className="w-5 h-5" />
              ) : (
                <VolumeX className="w-5 h-5" />
              )}
            </button>
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative p-2 bg-orange-50 text-orange-500 rounded-full"
            >
              <ShoppingCart className="w-6 h-6" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-orange-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Categories */}
      <div className="bg-white border-b sticky top-[57px] z-10 overflow-x-auto">
        <div className="flex gap-2 px-4 py-2 max-w-2xl mx-auto">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-1.5 rounded-full text-sm whitespace-nowrap font-medium transition ${
                selectedCategory === cat
                  ? "bg-orange-500 text-white shadow-sm"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Menu Grid */}
      <main className="max-w-2xl mx-auto px-4 py-4">
        {filteredItems.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <UtensilsCrossed className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p>No items in this category</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {filteredItems.map((item) => {
              const cartItem = cartItems.find((c) => c._id === item._id);
              const isAvailable = item.isAvailable !== false;
              return (
                <div
                  key={item._id}
                  className="bg-white rounded-2xl shadow-sm overflow-hidden cursor-pointer hover:shadow-md transition active:scale-[0.98]"
                  onClick={() => openItemModal(item)}
                >
                  <div className="h-36 bg-gray-100 relative">
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-3xl">
                        🍴
                      </div>
                    )}
                    {item.isPopular && (
                      <span className="absolute top-2 left-2 bg-orange-500 text-white text-xs px-2 py-0.5 rounded-full">
                        Popular
                      </span>
                    )}
                    {!isAvailable && (
                      <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                        <span className="text-xs text-gray-500 font-medium">
                          Not Available
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <h3 className="font-semibold text-gray-800 text-sm">
                      {item.name}
                    </h3>
                    {item.description && (
                      <p className="text-xs text-gray-400 mt-1 line-clamp-2">
                        {item.description}
                      </p>
                    )}
                    <div className="mt-3 flex items-center justify-between">
                      <span className="font-bold text-gray-800">
                        ₹{item.price.toFixed(2)}
                      </span>
                      {cartItem ? (
                        <div className="flex items-center gap-2 bg-orange-50 rounded-lg px-2 py-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              decreaseQty(item._id);
                            }}
                            className="text-orange-500"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="text-sm font-bold text-orange-600 w-4 text-center">
                            {cartItem.quantity}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              increaseQty(item._id);
                            }}
                            className="text-orange-500"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            addToCartSimple(item);
                          }}
                          disabled={!isAvailable}
                          className={`px-4 py-1.5 rounded-lg text-sm font-medium ${
                            isAvailable
                              ? "bg-orange-500 text-white hover:bg-orange-600"
                              : "bg-gray-200 text-gray-400 cursor-not-allowed"
                          }`}
                        >
                          Add
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Bottom Cart Bar */}
      {cartCount > 0 && !isCartOpen && (
        <div className="fixed bottom-4 left-4 right-4 z-30 max-w-2xl mx-auto">
          <button
            onClick={() => setIsCartOpen(true)}
            className="w-full bg-orange-500 text-white rounded-2xl py-4 px-5 flex items-center justify-between shadow-xl hover:bg-orange-600"
          >
            <span className="bg-orange-600 px-2 py-1 rounded-lg text-xs font-bold">
              {cartCount} items
            </span>
            <span className="font-semibold">View Cart</span>
            <span className="font-bold">
              ₹{cartTotals.grandTotal.toFixed(2)}
            </span>
          </button>
        </div>
      )}

      {/* Cart Drawer */}
      {isCartOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-50"
          onClick={() => setIsCartOpen(false)}
        >
          <div
            className="fixed bottom-0 left-0 right-0 max-h-[90vh] bg-white rounded-t-3xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="text-lg font-bold text-gray-800">Your Cart</h2>
              <button
                onClick={() => setIsCartOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {cartItems.length === 0 ? (
                <p className="text-center text-gray-400 py-12">
                  Your cart is empty
                </p>
              ) : (
                cartItems.map((item) => (
                  <div
                    key={`${item._id}-${item.name}`}
                    className="flex items-center gap-3 bg-gray-50 rounded-xl p-3"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-sm text-gray-800">
                        {item.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        ₹{item.price.toFixed(2)} each
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => decreaseQty(item._id)}
                        className="p-1 bg-white rounded-full shadow-sm"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-6 text-center text-sm font-bold">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => increaseQty(item._id)}
                        className="p-1 bg-white rounded-full shadow-sm"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => removeItem(item._id)}
                        className="ml-1 text-red-400"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-sm font-bold w-16 text-right">
                      ₹{(item.price * item.quantity).toFixed(2)}
                    </p>
                  </div>
                ))
              )}
            </div>
            {cartItems.length > 0 && (
              <div className="border-t p-4 space-y-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>₹{cartTotals.subtotal.toFixed(2)}</span>
                  </div>
                  {restaurant?.billing.enableTaxes && (
                    <>
                      <div className="flex justify-between">
                        <span>CGST ({restaurant.tax.cgst}%)</span>
                        <span>₹{cartTotals.cgst.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>SGST ({restaurant.tax.sgst}%)</span>
                        <span>₹{cartTotals.sgst.toFixed(2)}</span>
                      </div>
                    </>
                  )}
                  {restaurant?.billing.enableServiceCharge && (
                    <div className="flex justify-between">
                      <span>
                        Service Charge ({restaurant.tax.serviceCharge}%)
                      </span>
                      <span>₹{cartTotals.serviceCharge.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-lg border-t pt-2">
                    <span>Grand Total</span>
                    <span>₹{cartTotals.grandTotal.toFixed(2)}</span>
                  </div>
                </div>

                {!isCheckingOut ? (
                  <button
                    onClick={() => setIsCheckingOut(true)}
                    className="w-full py-3 bg-orange-500 text-white rounded-xl font-semibold"
                  >
                    Proceed to Checkout
                  </button>
                ) : (
                  <div className="space-y-3">
                    <input
                      type="text"
                      placeholder="Your Name *"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full px-3 py-2.5 border rounded-xl text-sm"
                    />
                    <input
                      type="tel"
                      placeholder="Phone Number *"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="w-full px-3 py-2.5 border rounded-xl text-sm"
                    />
                    <input
                      type="email"
                      placeholder="Email (optional)"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      className="w-full px-3 py-2.5 border rounded-xl text-sm"
                    />
                    <textarea
                      placeholder="Special instructions (optional)"
                      value={specialInstructions}
                      onChange={(e) => setSpecialInstructions(e.target.value)}
                      rows={2}
                      className="w-full px-3 py-2.5 border rounded-xl text-sm resize-none"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => setIsCheckingOut(false)}
                        className="flex-1 py-2.5 border rounded-xl text-sm"
                      >
                        Back
                      </button>
                      <button
                        onClick={handlePlaceOrder}
                        disabled={submitting}
                        className="flex-1 py-2.5 bg-green-500 text-white rounded-xl text-sm font-semibold disabled:opacity-50"
                      >
                        {submitting ? (
                          <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                        ) : (
                          "Place Order"
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Item Detail Modal */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="relative h-48 bg-gray-100">
              {selectedItem.image ? (
                <img
                  src={selectedItem.image}
                  alt={selectedItem.name}
                  className="w-full h-full object-cover rounded-t-2xl"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-6xl">
                  🍴
                </div>
              )}
              <button
                onClick={() => setSelectedItem(null)}
                className="absolute top-3 right-3 bg-white rounded-full p-1 shadow"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5">
              <h2 className="text-xl font-bold text-gray-800">
                {selectedItem.name}
              </h2>
              <p className="text-gray-500 text-sm mt-1">
                {selectedItem.description}
              </p>

              {selectedItem.variants && selectedItem.variants.length > 0 && (
                <div className="mt-4">
                  <label className="font-medium text-gray-700">
                    Choose variant
                  </label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {selectedItem.variants.map((variant) => (
                      <button
                        key={variant.name}
                        onClick={() =>
                          setSelectedVariant({
                            name: variant.name,
                            price: variant.price,
                          })
                        }
                        className={`px-4 py-2 rounded-full text-sm border ${
                          selectedVariant?.name === variant.name
                            ? "bg-orange-500 text-white border-orange-500"
                            : "bg-white text-gray-700 border-gray-300"
                        }`}
                      >
                        {variant.name} (₹{variant.price})
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {selectedItem.addons && selectedItem.addons.length > 0 && (
                <div className="mt-4">
                  <label className="font-medium text-gray-700">Add-ons</label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {selectedItem.addons.map((addon) => (
                      <button
                        key={addon.name}
                        onClick={() => toggleAddon(addon)}
                        className={`px-3 py-1.5 rounded-full text-xs border ${
                          selectedAddons.find((a) => a.name === addon.name)
                            ? "bg-orange-100 border-orange-500 text-orange-700"
                            : "bg-white border-gray-300 text-gray-600"
                        }`}
                      >
                        {addon.name} (+₹{addon.price})
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-4 flex items-center gap-3">
                <span className="font-medium">Quantity:</span>
                <div className="flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-1">
                  <button
                    onClick={() =>
                      setModalQuantity(Math.max(1, modalQuantity - 1))
                    }
                    className="text-gray-600"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-8 text-center font-bold">
                    {modalQuantity}
                  </span>
                  <button
                    onClick={() => setModalQuantity(modalQuantity + 1)}
                    className="text-gray-600"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="mt-4 flex justify-between items-center border-t pt-4">
                <span className="font-bold text-lg">Total:</span>
                <span className="font-bold text-xl text-orange-600">
                  ₹{getModalItemTotal().toFixed(2)}
                </span>
              </div>

              <button
                onClick={addCustomizedToCart}
                className="w-full mt-4 bg-orange-500 text-white py-3 rounded-xl font-semibold"
              >
                Add to Cart • ₹{getModalItemTotal().toFixed(2)}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
