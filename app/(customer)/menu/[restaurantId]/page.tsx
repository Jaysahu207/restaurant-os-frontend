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
} from "lucide-react";
import { useCartStore } from "@/store/useCartStore";
import { fetchCustomerMenu } from "@/services/customerMenu";
import { useParams, useSearchParams } from "next/navigation";
import axios from "axios";
import {
  placeOrder,
  completePayment,
  getOrderById,
} from "@/services/orderService";
import { io, Socket } from "socket.io-client";
import toast from "react-hot-toast";
import { button } from "framer-motion/m";
import API from "@/config/axios";
import QRCode from "react-qr-code";

// Types
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
  upiId: string;
}

interface SelectedVariant {
  name: string;
  price: number;
}

interface SelectedAddon {
  name: string;
  price: number;
}

interface Order {
  _id: string;
  id?: string;
  status: "pending" | "preparing" | "ready" | "served" | "paid" | "completed";
  totalAmount: number;
  items: any[];
  createdAt: string;
  isPaid?: boolean;
  specialInstructions?: string;
  paymentMethod?: "cash" | "upi";
}

const statusFlow = [
  "pending",
  "preparing",
  "ready",
  "served",
  "paid",
  "completed",
];

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
  // console.log("Line No 94 Restaurant Id", restaurantId);

  // State
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState(["All"]);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [debugMsg] = useState("");
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [selectedVariant, setSelectedVariant] =
    useState<SelectedVariant | null>(null);
  const [selectedAddons, setSelectedAddons] = useState<SelectedAddon[]>([]);
  const [modalQuantity, setModalQuantity] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [paymentStarted, setPaymentStarted] = useState(false);
  const [paymentTimeLeft, setpaymentTimeLeft] = useState(120);

  const socketRef = useRef<any>(null);

  const {
    items,
    addItem,
    increaseQty,
    decreaseQty,
    removeItem,
    clearCart,
    getTotal,
  } = useCartStore();
  const cartItems = items;
  const cartTotal = getTotal();
  const cartCount = cartItems.reduce((sum, i) => sum + i.quantity, 0);
  const [timeLeft, setTimeLeft] = useState({ minutes: 0, seconds: 0 });
  const currentOrderRef = useRef<any>(null);

  // Fetch menu
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
        const uniqueCategories = [
          "All",
          ...Array.from(
            new Set(
              menuItems
                .map((item: any) => item.category?.trim())
                .filter(Boolean),
            ),
          ),
        ] as string[];
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

  // Real-time socket for order updates
  useEffect(() => {
    if (!restaurantId) return;

    const socket = io(process.env.NEXT_PUBLIC_API_URL, {
      transports: ["websocket", "pooling"],
      withCredentials: true,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("🟢 Connected:", socket.id);

      socket.emit("joinRestaurant", restaurantId);
      console.log("📌 Joined restaurant room:", restaurantId);
    });
    socket.on("connect_error", (err) => {
      console.log("❌ CONNECT ERROR:", err.message);
    });
    // ✅ ORDER UPDATE
    socket.on("ORDER_UPDATED", (updatedOrder) => {
      console.log("📩 ORDER UPDATED RECEIVED:", updatedOrder);

      setCurrentOrder((prev) => {
        if (!prev) return prev;

        if (String(prev._id) === String(updatedOrder._id)) {
          console.log("✅ UI UPDATED");
          setOrderPlaced(true);
          return updatedOrder;
        }

        return prev;
      });
    });
    socket.on("ORDER_READY", (order) => {
      console.log("🟢 ORDER_READY EVENT:", order);
    });
    socket.on("ORDER_READY", (order: any) => {
      if (String(order._id) === String(currentOrder?._id)) {
        console.log("🔥 ORDER READY RECEIVED");

        playSound();

        setCurrentOrder(order); // ✅ update UI

        toast.success("🍽️ Your order is ready!");
      }
    });
    socket.on("ORDER_COMPLETED", (order: any) => {
      if (String(order._id) === String(currentOrder?._id)) {
        console.log("🔥 Order Completed");

        playSound();

        setCurrentOrder(order); // ✅ update UI

        toast.success("✅ Your order is completed! Thanks for dining with us.");
        console.log("🟢 ORDER_COMPLETED EVENT");
      }
    });
    return () => {
      socket.disconnect();
    };
  }, [restaurantId, table, currentOrder?._id]);

  useEffect(() => {
    if (!currentOrder?._id) return;

    const fetchLatest = async () => {
      const data = await getOrderById(currentOrder._id);
      setCurrentOrder(data);
    };

    fetchLatest();
  }, []);
  useEffect(() => {
    console.log("🟡 CURRENT ORDER:", currentOrder);
  }, [currentOrder]);

  useEffect(() => {
    if (currentOrder) {
      localStorage.setItem("currentOrder", JSON.stringify(currentOrder));
    }
  }, [currentOrder]);

  useEffect(() => {
    const saved = localStorage.getItem("currentOrder");
    if (saved) {
      setCurrentOrder(JSON.parse(saved));
      setOrderPlaced(true);
    }
  }, []);

  useEffect(() => {
    if (!paymentStarted) return;

    const timer = setInterval(() => {
      setpaymentTimeLeft((prev) => {
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

  const filteredItems = useMemo(() => {
    if (selectedCategory === "All") return menu;
    return menu.filter((item) => item.category === selectedCategory);
  }, [menu, selectedCategory]);

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
  useEffect(() => {
    if (!currentOrder?.createdAt) return;

    const interval = setInterval(() => {
      const remaining = getRemainingTimeDetailed(currentOrder.createdAt);
      setTimeLeft(remaining);
    }, 1000);

    return () => clearInterval(interval);
  }, [currentOrder]);
  const handlePlaceOrder = async () => {
    if (!customerName.trim() || !customerPhone.trim()) {
      toast.error("Please enter your name and phone number");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        restaurantId,
        tableNumber: table ? parseInt(table, 10) : 0,
        customer: { name: customerName, phone: customerPhone },
        items: cartItems.map((item) => ({
          menuItemId: item._id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
        })),
        specialInstructions,
      };
      if (currentOrder) {
        // 🔥 EXISTING ORDER → ADD ITEMS
        const res = await axios.put(
          `${process.env.NEXT_PUBLIC_API_URL}/api/orders/${currentOrder._id}/add-items`,
          {
            items: cartItems.map((item) => ({
              menuItemId: item._id,
              name: item.name,
              price: item.price,
              quantity: item.quantity,
            })),
          },
        );

        setCurrentOrder(res.data);

        setOrderPlaced(true);
        toast.success("Items added to existing order!");
      } else {
        // 🆕 NEW ORDER
        const res = await placeOrder(payload);

        setCurrentOrder(res);
        setOrderPlaced(true);
      }
      clearCart();
      setIsCheckingOut(false);
      setIsCartOpen(false); // ✅ important
      playSound();
      toast.success("Order placed successfully!");
    } catch (err) {
      console.error(err);
      toast.error("Order failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };
  // 🔥 UPI LINKS (dynamic)

  const handlePayment = async (method: "cash" | "upi") => {
    if (!currentOrder) return;

    try {
      if (method === "cash") {
        await API.put(`/api/orders/${currentOrder._id}/pay`);

        setCurrentOrder((prev) =>
          prev ? { ...prev, isPaid: true, status: "paid" } : null,
        );

        toast.success("Cash payment done!");
        setShowPayment(false);
        return;
      }

      if (method === "upi") {
        if (!restaurant?.upiId) {
          toast.error("UPI not configured");
          return;
        }

        await API.put(`/api/orders/${currentOrder._id}/initiate-payment`, {
          method: "upi",
        });

        const upiLink = generateUPILink(
          currentOrder.totalAmount,
          restaurant.upiId,
          restaurant.name,
        );

        const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

        if (isMobile) {
          // ✅ Open UPI app
          window.location.href = upiLink;
        } else {
          // 💻 Desktop fallback
          toast.success("Scan QR code to pay using UPI");
        }

        setShowPayment(false);
      }
    } catch (err) {
      toast.error("Payment failed");
    }
  };
  const generateUPILink = (amount: number, upiId: string, name: string) => {
    return `upi://pay?pa=${upiId}&pn=${encodeURIComponent(name)}&am=${amount}&cu=INR`;
  };

  const handleUPIPayment = async () => {
    if (!currentOrder || !restaurant?.upiId) {
      toast.error("UPI not configured");
      return;
    }

    try {
      // 🔥 prevent multiple clicks
      if (loading) return;

      // 🔥 mark payment initiated
      await API.put(`/api/orders/${currentOrder._id}/initiate-payment`, {
        method: "upi",
      });
      setPaymentStarted(true);
      setpaymentTimeLeft(120);
      const upiLink = `upi://pay?pa=${restaurant.upiId}&pn=${encodeURIComponent(
        restaurant.name,
      )}&am=${currentOrder.totalAmount}&cu=INR`;

      // 🔥 THIS IS THE REAL FIX
      window.location.href = upiLink;
    } catch (err) {
      toast.error("Failed to open UPI");
    }
  };
  const baseUPI = `upi://pay?pa=${restaurant?.upiId}&pn=${restaurant?.name}&am=${currentOrder?.totalAmount}&cu=INR`;
  const confirmPayment = async () => {
    if (!currentOrder) return;

    await API.put(`/api/orders/${currentOrder._id}/pay`);

    setCurrentOrder((prev) =>
      prev ? { ...prev, isPaid: true, status: "paid" } : null,
    );

    toast.success("Payment submitted for verification!");
    setShowPayment(false);
  };
  const getRemainingTimeDetailed = (createdAt: string, prepMinutes = 15) => {
    const end = new Date(createdAt).getTime() + prepMinutes * 60000;
    const diff = Math.max(0, end - Date.now());

    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);

    return { minutes, seconds };
  };
  const resetCustomerSession = () => {
    // Clear Zustand cart
    clearCart();

    // Reset states
    setCurrentOrder(null);
    setOrderPlaced(false);
    setIsCartOpen(false);
    setIsCheckingOut(false);
    setShowPayment(false);

    // Clear inputs
    setCustomerName("");
    setCustomerPhone("");
    setSpecialInstructions("");

    // 🔥 Clear localStorage (if used)
    localStorage.removeItem("cart-storage"); // zustand persist key (change if different)
    localStorage.removeItem("currentOrder"); // if you saved order

    // Optional: reload menu clean
    // window.location.reload(); ❌ not needed usually
  };

  // sounds
  useEffect(() => {
    const unlockAudio = () => {
      if (audioRef.current) {
        audioRef.current
          .play()
          .then(() => {
            if (audioRef.current) {
              audioRef.current.pause();
              audioRef.current.currentTime = 0;
            }
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
    audioRef.current = new Audio("/sounds/order-placed.mp3");
    // Preload audio
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

  // Guards
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

 
  // Main UI (menu & cart)

  if (orderPlaced && currentOrder) {
    const currentStepIndex = statusFlow.indexOf(currentOrder.status);

    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-indigo-50/30 p-4 flex items-center justify-center">
        <div className="max-w-md w-full mx-auto space-y-5 animate-fadeInUp">
          {/* Main Order Card */}
          <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl p-6 border border-white/20 transition-all duration-300 hover:shadow-xl">
            {/* Header with Order ID & Table */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <ChefHat className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-800 tracking-tight">
                    Order #{currentOrder._id.slice(-8)}
                  </h2>
                  <p className="text-xs text-gray-500 flex items-center gap-1">
                    <span className="inline-block w-1.5 h-1.5 bg-gray-400 rounded-full"></span>
                    Table {table}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs font-medium px-2 py-1 bg-orange-50 text-orange-600 rounded-full">
                  {currentOrder.status.toUpperCase()}
                </div>
              </div>
            </div>

            {/* Modern Status Timeline */}
            <div className="my-6">
              <div className="relative flex justify-between">
                {statusFlow.map((step, idx) => {
                  const isActive = idx <= currentStepIndex;
                  const isCurrent = idx === currentStepIndex;
                  return (
                    <div
                      key={step}
                      className="flex flex-col items-center flex-1"
                    >
                      <div
                        className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                          isActive
                            ? "bg-gradient-to-r from-orange-500 to-orange-600 shadow-md scale-105"
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
                        className={`text-[11px] font-medium mt-2 text-center ${
                          isActive ? "text-orange-600" : "text-gray-400"
                        }`}
                      >
                        {step.charAt(0).toUpperCase() + step.slice(1)}
                      </span>
                      {idx < statusFlow.length - 1 && (
                        <div
                          className={`absolute top-4 left-1/2 w-full h-0.5 -translate-y-1/2 ${
                            idx < currentStepIndex
                              ? "bg-orange-500"
                              : "bg-gray-200"
                          }`}
                          style={{
                            left: `${idx * (100 / (statusFlow.length - 1)) + 50 / (statusFlow.length - 1)}%`,
                            width: `${100 / (statusFlow.length - 1)}%`,
                          }}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ETA (only for active orders) */}
            {currentOrder.status !== "completed" &&
              currentOrder.status !== "served" && (
                <div className="bg-gradient-to-r from-gray-100 to-gray-50 rounded-2xl p-3 flex items-center justify-center gap-2 shadow-inner">
                  {timeLeft.minutes > 0 || timeLeft.seconds > 0 ? (
                    <>
                      <Clock className="w-4 h-4 text-orange-500 animate-pulse" />
                      <span className="text-sm text-gray-600">
                        Estimated arrival:{" "}
                        <span className="font-mono font-bold text-gray-800">
                          {timeLeft.minutes}m {timeLeft.seconds}s
                        </span>
                      </span>
                    </>
                  ) : (
                    <>
                      <Clock className="w-4 h-4 text-red-500 animate-bounce" />
                      <span className="text-sm text-red-600 font-semibold">
                        Running late ⏳ — your order will arrive soon
                      </span>
                    </>
                  )}
                </div>
              )}

            {/* Order Items List */}
            <div className="mt-4 space-y-3">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Your Order
              </h3>
              <div className="divide-y divide-gray-100">
                {currentOrder.items.map((item, idx) => (
                  <div
                    key={idx}
                    className="py-2 flex justify-between items-center"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-gray-500 w-6">
                        {item.quantity}×
                      </span>
                      <span className="text-gray-700">{item.name}</span>
                    </div>
                    <span className="font-medium text-gray-800">
                      ₹{item.price * item.quantity}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Total */}
            <div className="mt-4 pt-3 border-t border-dashed border-gray-200 flex justify-between items-center bg-gradient-to-r from-orange-50/50 to-transparent -mx-2 px-2 py-3 rounded-xl">
              <span className="text-base font-bold text-gray-800">Total</span>
              <span className="text-xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-orange-800">
                ₹{currentOrder.totalAmount || 0}
              </span>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3 mt-6">
                {currentOrder.status !== "completed" &&
                  currentOrder.status !== "paid" && (
                    <button
                      onClick={() => {
                        setOrderPlaced(false);
                        setIsCartOpen(true);
                      }}
                      className="w-full py-3 rounded-xl font-semibold transition-all duration-200 bg-white border border-gray-200 text-gray-700 hover:border-orange-300 hover:shadow-md flex items-center justify-center gap-2"
                    >
                      <span>+</span> Add More Items
                    </button>
                  )}

              {currentOrder.status === "served" && !currentOrder.isPaid && (
                <button
                  onClick={() => setShowPayment(true)}
                  className="w-full py-3 rounded-xl font-semibold bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-[1.02]"
                >
                  💳 Proceed to Pay
                </button>
              )}

              {currentOrder.status === "served" &&
                currentOrder.paymentMethod === "upi" &&
                !currentOrder.isPaid && (
                  <button
                    onClick={confirmPayment}
                    className="w-full py-3 rounded-xl font-semibold bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-md hover:shadow-lg transition-all"
                  >
                    ✅ I Have Paid
                  </button>
                )}

              {currentOrder.status === "paid" && (
                <div className="text-center space-y-2 py-4">
                  <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-full text-sm font-semibold">
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
                    onClick={resetCustomerSession}
                    className="w-full py-3 rounded-xl font-semibold bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow-md hover:shadow-lg transition-all"
                  >
                    Back to Menu
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Payment Modal - Modern Overlay */}
          {showPayment && currentOrder && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fadeIn">
              <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden transform transition-all duration-300 scale-100">
                <div className="p-6 space-y-5">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <CreditCard className="w-7 h-7 text-green-600" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-800">
                      Complete Payment
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Total Amount:{" "}
                      <span className="font-bold text-gray-800">
                        ₹{currentOrder.totalAmount}
                      </span>
                    </p>
                  </div>

                  <div className="space-y-3">
                    <button
                      onClick={() => handlePayment("cash")}
                      className="w-full py-3 rounded-xl bg-gray-50 text-gray-800 font-medium hover:bg-gray-100 transition flex items-center justify-center gap-2 border border-gray-200"
                    >
                      💵 Pay with Cash
                    </button>

                    {restaurant?.upiId && (
                      <div className="space-y-3">
                        <button
                          onClick={handleUPIPayment}
                          disabled={paymentStarted}
                          className={`w-full py-3 rounded-xl font-semibold transition flex items-center justify-center gap-2 ${
                            paymentStarted
                              ? "bg-gray-300 cursor-not-allowed"
                              : "bg-gradient-to-r from-green-500 to-teal-600 text-white shadow-md hover:shadow-lg"
                          }`}
                        >
                          {paymentStarted ? "⏳ Starting..." : "📱 Pay via UPI"}
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
                                navigator.clipboard.writeText(restaurant.upiId)
                              }
                              className="text-blue-500 hover:text-blue-700"
                            >
                              📋
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {!restaurant?.upiId && (
                      <p className="text-xs text-red-500 text-center">
                        UPI not available for this restaurant
                      </p>
                    )}

                    {paymentStarted && !currentOrder?.isPaid && (
                      <div className="mt-4 space-y-3 p-3 bg-red-50 rounded-xl">
                        <p className="text-center text-red-600 font-semibold animate-pulse">
                          ⏱️ Complete payment within {paymentTimeLeft}s
                        </p>
                        <button
                          onClick={confirmPayment}
                          className="w-full py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition"
                        >
                          ✅ I Have Paid
                        </button>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => setShowPayment(false)}
                    className="w-full py-2 text-red-500 border border-red-200 rounded-xl hover:bg-red-50 transition text-sm font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }
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
          <button
            onClick={() => setIsCartOpen(true)}
            className="relative p-2 bg-orange-50 text-orange-500 rounded-full hover:bg-orange-100 transition"
          >
            <ShoppingCart className="w-6 h-6" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-orange-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Category Tabs */}
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
            className="w-full bg-orange-500 text-white rounded-2xl py-4 px-5 flex items-center justify-between shadow-xl hover:bg-orange-600 transition"
          >
            <span className="bg-orange-600 px-2 py-1 rounded-lg text-xs font-bold">
              {cartCount} items
            </span>
            <span className="font-semibold">View Cart</span>
            <span className="font-bold">₹{cartTotal.toFixed(2)}</span>
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
                    key={item._id}
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
                <div className="flex justify-between font-bold">
                  <span>Total</span>
                  <span>₹{cartTotal.toFixed(2)}</span>
                </div>
                {!isCheckingOut ? (
                  <button
                    onClick={() => setIsCheckingOut(true)}
                    className="w-full py-3 bg-orange-500 text-white rounded-xl font-semibold hover:bg-orange-600"
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
                      className="w-full px-3 py-2.5 border rounded-xl text-sm focus:ring-2 focus:ring-orange-300"
                    />
                    <input
                      type="tel"
                      placeholder="Phone Number *"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="w-full px-3 py-2.5 border rounded-xl text-sm focus:ring-2 focus:ring-orange-300"
                    />
                    <textarea
                      placeholder="Special instructions (optional)"
                      value={specialInstructions}
                      onChange={(e) => setSpecialInstructions(e.target.value)}
                      rows={2}
                      className="w-full px-3 py-2.5 border rounded-xl text-sm resize-none focus:ring-2 focus:ring-orange-300"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => setIsCheckingOut(false)}
                        className="flex-1 py-2.5 border rounded-xl text-sm font-medium"
                      >
                        Back
                      </button>
                      <button
                        onClick={handlePlaceOrder}
                        disabled={submitting}
                        className="flex-1 py-2.5 bg-green-500 text-white rounded-xl text-sm font-semibold disabled:opacity-50"
                      >
                        {submitting ? "Placing..." : "Place Order"}
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
                        {variant.name} (+₹{variant.price - selectedItem.price})
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
                className="w-full mt-4 bg-orange-500 text-white py-3 rounded-xl font-semibold hover:bg-orange-600"
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
