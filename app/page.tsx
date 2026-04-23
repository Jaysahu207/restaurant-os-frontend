"use client";

import { useState } from "react";
import {
  Eye,
  EyeOff,
  X,
  QrCode,
  Smartphone,
  Coffee,
  Clock,
  CreditCard,
  Users,
  BarChart,
  CheckCircle,
  ArrowRight,
  UtensilsCrossed,
  ShoppingCart,
  Zap,
  Shield,
  Globe,
  ChefHat,
  Menu,
  Receipt,
  Sparkles,
  PhoneCall,
} from "lucide-react";
import API from "../config/axios";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";

export default function Home() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  const router = useRouter();
  // Form state for both tabs
  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [registerData, setRegisterData] = useState({
    restaurantName: "",
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  // Password visibility toggles
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const setAuth = useAuthStore((state) => state.setAuth);

  // Form submission handlers (mock)
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    // 🚫 Prevent multiple clicks
    if (loading) return;

    // 🔴 1. Validation
    const { email, password } = loginData;

    if (!email || !password) {
      return toast.error("Email and password are required");
    }

    try {
      setLoading(true);

      // 🧹 2. Clean payload
      const payload = {
        email: email.trim().toLowerCase(),
        password,
      };

      // 🐛 Debug (remove in production)
      console.log("📦 Login Payload:", payload);
      console.log("🌐 API Base URL:", API.defaults.baseURL);

      // 📡 3. API call
      const response = await API.post("/api/auth/login", payload);
      const data = response?.data;

      if (!data || !data.token) {
        throw new Error("Invalid response from server");
      }

      // 🔐 4. Store auth data

      // 🔐 Save to Zustand
      setAuth({
        user: data.user,
        restaurant: data.restaurant,
        token: data.token,
      });

      // 🔁 5. Role-based redirect
      const role = data?.user?.role?.toUpperCase();
      if (role === "SUPER_ADMIN") {
        router.push("/super-admin/dashboard");
      } else if (role === "OWNER" || role === "MANAGER") {
        router.push("/dashboard");
      } else if (role === "CHEF") {
        router.push("/kitchen");
      } else if (role === "WAITER") {
        router.push("/waiter");
      } else {
        router.push("/");
      }
      toast.success("Login successful  as " + role + "! ");
    } catch (error: any) {
      console.error("❌ Login failed:", error);

      // 🧠 Better error handling
      let message = "Login failed. Please try again.";

      if (error.response) {
        // Server responded with error
        message = error.response.data?.message || message;
      } else if (error.request) {
        // Request made but no response (network issue)
        message = "Unable to connect to server. Check backend or CORS.";
      } else {
        // Other JS errors
        message = error.message;
      }

      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    // 🚫 Prevent multiple clicks
    if (loading) return;

    // 🔴 1. Basic Validation
    const { name, email, password, confirmPassword, restaurantName, phone } =
      registerData;

    if (!name || !email || !password || !restaurantName || !phone) {
      return toast.error("Please fill all required fields");
    }

    if (password !== confirmPassword) {
      return toast.error("Passwords do not match");
    }

    try {
      setLoading(true);

      // 🧹 2. Clean & Prepare Data
      const payload = {
        restaurantName: restaurantName.trim(),
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        password,
      };

      // 🐛 Debug logs (remove in production)
      console.log("📦 Payload:", payload);
      console.log("🌐 API Base URL:", API.defaults.baseURL);

      // 📡 3. API Call
      const response = await API.post("/api/auth/register", payload);
      const data = response?.data;

      if (!data) {
        throw new Error("No response from server");
      }

      // ✅ 4. Success Handling
      toast.success("Registration successful!");

      // 🔥 (Optional but recommended) Auto-login after register
      if (data.token) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
      }

      // 🧼 5. Reset Form
      setRegisterData({
        restaurantName: "",
        name: "",
        email: "",
        phone: "",
        password: "",
        confirmPassword: "",
      });

      // 🔁 6. Redirect / Switch UI
      // 👉 Option A: Switch to login
      setActiveTab("login");

      // 👉 Option B (better UX): direct dashboard
      // router.push("/dashboard");
    } catch (error: any) {
      console.error("❌ Registration failed:", error);

      // 📛 Better error extraction
      let message = "Something went wrong. Please try again.";

      if (error.response) {
        // Server responded with error
        message = error.response.data?.message || message;
      } else if (error.request) {
        // Request sent but no response (NETWORK ERROR)
        message = "Unable to connect to server. Check backend or CORS.";
      } else {
        // Other errors
        message = error.message;
      }

      toast.error(message);
    } finally {
      setLoading(false);
    }
  };
  const openModal = (tab: "login" | "register") => {
    setActiveTab(tab);
    setIsModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 flex flex-col">
      {/* Navbar */}
      <header className="sticky top-0 z-40 flex items-center justify-between px-6 md:px-12 py-4 bg-white/80 backdrop-blur-md shadow-sm border-b border-amber-100">
        <div className="flex items-center gap-2">
          <div className="bg-orange-500 p-1.5 rounded-xl shadow-md">
            <UtensilsCrossed className="w-6 h-6 text-white" />
          </div>
          <span className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
            QREats
          </span>
          <span className="hidden md:inline-block text-sm font-medium text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full ml-2">
            QR Ordering
          </span>
        </div>

        <nav className="hidden md:flex items-center gap-8 text-gray-700 font-medium">
          <a href="#features" className="hover:text-orange-500 transition">
            Features
          </a>
          <a href="#how-it-works" className="hover:text-orange-500 transition">
            How it Works
          </a>
          <a href="#benefits" className="hover:text-orange-500 transition">
            Benefits
          </a>
        </nav>

        <div className="flex gap-3">
          <button
            onClick={() => openModal("login")}
            className="px-5 py-2 text-sm font-medium rounded-full border-2 border-orange-300 text-orange-700 hover:bg-orange-50 transition-all duration-200"
          >
            Login
          </button>

          <button
            onClick={() => openModal("register")}
            className="px-5 py-2 text-sm font-medium bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-full shadow-md hover:shadow-lg hover:from-orange-600 hover:to-amber-600 transition-all duration-200"
          >
            Get Started
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="relative overflow-hidden px-6 md:px-12 py-16 md:py-24">
          {/* Decorative circles */}
          <div className="absolute top-20 left-10 w-72 h-72 bg-orange-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse"></div>
          <div className="absolute bottom-10 right-10 w-80 h-80 bg-amber-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse delay-1000"></div>

          <div className="max-w-7xl mx-auto relative z-10">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              {/* Left Hero Content */}
              <div>
                <div className="inline-flex items-center gap-2 bg-orange-100 text-orange-700 px-4 py-1.5 rounded-full text-sm font-medium mb-6">
                  <Sparkles className="w-4 h-4" />
                  Smart QR Dining Solution
                </div>
                <h1 className="text-4xl md:text-6xl font-extrabold leading-tight tracking-tight">
                  <span className="bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
                    Contactless Dining,
                  </span>
                  <br />
                  <span className="text-gray-800">Smarter Orders</span>
                </h1>
                <p className="mt-6 text-lg text-gray-600 leading-relaxed">
                  Empower your restaurant or cafe with a modern QR-based
                  ordering system. Let customers scan, order, and pay — all from
                  their phones. No app needed. Increase table turnover, reduce
                  wait times, and boost your revenue.
                </p>
                <div className="mt-8 flex flex-wrap gap-4">
                  <button
                    onClick={() => openModal("register")}
                    className="px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-full text-lg font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-2"
                  >
                    Start Free Trial <ArrowRight className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => openModal("login")}
                    className="px-6 py-3 border-2 border-orange-300 text-orange-700 rounded-full text-lg font-semibold hover:bg-orange-50 transition-all duration-200"
                  >
                    View Demo
                  </button>
                </div>
                <div className="mt-8 flex items-center gap-6 text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    <CheckCircle className="w-4 h-4 text-green-500" /> No
                    installation
                  </div>
                  <div className="flex items-center gap-1">
                    <CheckCircle className="w-4 h-4 text-green-500" /> Real-time
                    updates
                  </div>
                  <div className="flex items-center gap-1">
                    <CheckCircle className="w-4 h-4 text-green-500" /> Secure
                    payments
                  </div>
                </div>
              </div>

              {/* Right Hero - QR Mockup */}
              <div className="relative flex justify-center">
                <div className="relative bg-white rounded-3xl shadow-2xl p-6 w-72 md:w-80 border border-amber-100">
                  <div className="absolute -top-4 -right-4 bg-orange-500 rounded-full p-2 shadow-lg">
                    <QrCode className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="bg-gray-100 rounded-2xl p-4 w-full">
                      <div className="bg-white rounded-xl p-4 shadow-inner">
                        <div className="flex justify-between items-center mb-3">
                          <div className="w-8 h-8 bg-orange-200 rounded-full"></div>
                          <Coffee className="w-5 h-5 text-orange-500" />
                        </div>
                        <div className="h-32 bg-gradient-to-br from-orange-400 to-amber-400 rounded-lg flex items-center justify-center">
                          <div className="bg-white p-2 rounded-lg">
                            <QrCode className="w-16 h-16 text-orange-600" />
                          </div>
                        </div>
                        <div className="mt-3 text-center">
                          <p className="text-sm font-semibold text-gray-700">
                            Scan to Order
                          </p>
                          <p className="text-xs text-gray-400">Table #12</p>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 w-full bg-orange-50 p-3 rounded-xl text-center">
                      <p className="text-sm text-orange-700 font-medium">
                        📱 Just scan & enjoy!
                      </p>
                    </div>
                  </div>
                </div>
                {/* Floating elements */}
                <div className="absolute -bottom-8 -left-8 bg-amber-100 rounded-full p-3 shadow-md animate-bounce">
                  <Smartphone className="w-6 h-6 text-amber-600" />
                </div>
                <div className="absolute -top-8 -right-4 bg-orange-100 rounded-full p-2 shadow-md animate-pulse">
                  <ShoppingCart className="w-5 h-5 text-orange-600" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section
          id="features"
          className="px-6 md:px-12 py-20 bg-white/50 backdrop-blur-sm"
        >
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-14">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-800">
                Powerful Features for Modern{" "}
                <span className="text-orange-500">Restaurants & Cafes</span>
              </h2>
              <p className="mt-4 text-gray-600 max-w-2xl mx-auto">
                Everything you need to digitize your dining experience and
                streamline operations.
              </p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  icon: <QrCode className="w-8 h-8" />,
                  title: "Dynamic QR Codes",
                  desc: "Unique QR codes per table. Update menus instantly without reprinting.",
                },
                {
                  icon: <Menu className="w-8 h-8" />,
                  title: "Digital Menus",
                  desc: "Beautiful, customizable menus with images, categories, and modifiers.",
                },
                {
                  icon: <Zap className="w-8 h-8" />,
                  title: "Real-time Orders",
                  desc: "Orders go directly to kitchen/bar displays. Zero delays.",
                },
                {
                  icon: <BarChart className="w-8 h-8" />,
                  title: "Analytics Dashboard",
                  desc: "Track sales, popular items, and customer behavior in real-time.",
                },
                {
                  icon: <Users className="w-8 h-8" />,
                  title: "Staff Management",
                  desc: "Roles for waiters, chefs, managers with custom permissions.",
                },
                {
                  icon: <CreditCard className="w-8 h-8" />,
                  title: "Contactless Payment",
                  desc: "Integrate with Stripe, PayPal, or cash on delivery.",
                },
                {
                  icon: <Globe className="w-8 h-8" />,
                  title: "Multi-language",
                  desc: "Serve international customers with ease.",
                },
                {
                  icon: <Shield className="w-8 h-8" />,
                  title: "Secure & Reliable",
                  desc: "Cloud-hosted, automatic backups, and data encryption.",
                },
              ].map((feat, idx) => (
                <div
                  key={idx}
                  className="bg-white rounded-2xl p-6 shadow-md hover:shadow-xl transition-all duration-300 border border-amber-50 group hover:-translate-y-1"
                >
                  <div className="bg-gradient-to-br from-orange-100 to-amber-100 w-14 h-14 rounded-xl flex items-center justify-center text-orange-600 group-hover:scale-110 transition-transform">
                    {feat.icon}
                  </div>
                  <h3 className="text-xl font-semibold mt-4 text-gray-800">
                    {feat.title}
                  </h3>
                  <p className="text-gray-500 mt-2 text-sm">{feat.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section id="how-it-works" className="px-6 md:px-12 py-20">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-14">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-800">
                How <span className="text-orange-500">QR Ordering</span> Works
              </h2>
              <p className="mt-4 text-gray-600 max-w-2xl mx-auto">
                Simple, fast, and contactless — from scan to savor in minutes.
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  step: "1",
                  icon: <QrCode />,
                  title: "Scan QR Code",
                  desc: "Customer scans unique QR code at table using phone camera.",
                },
                {
                  step: "2",
                  icon: <Smartphone />,
                  title: "Browse & Order",
                  desc: "View digital menu, customize items, and add to cart.",
                },
                {
                  step: "3",
                  icon: <ChefHat />,
                  title: "Kitchen Receives",
                  desc: "Order instantly appears in kitchen/bar dashboard.",
                },
                {
                  step: "4",
                  icon: <Clock />,
                  title: "Real-time Tracking",
                  desc: "Customer gets updates: preparing, ready, served.",
                },
                {
                  step: "5",
                  icon: <CreditCard />,
                  title: "Pay Digitally",
                  desc: "Pay via card, UPI, or cash — seamless checkout.",
                },
                {
                  step: "6",
                  icon: <Receipt />,
                  title: "Review & Feedback",
                  desc: "Collect ratings and reviews to improve service.",
                },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="relative bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-md border border-orange-100 flex flex-col items-center text-center"
                >
                  <div className="absolute -top-4 left-6 bg-orange-500 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold shadow-md">
                    {item.step}
                  </div>
                  <div className="mt-4 bg-orange-100 p-3 rounded-full text-orange-600">
                    {item.icon}
                  </div>
                  <h3 className="text-xl font-semibold mt-4 text-gray-800">
                    {item.title}
                  </h3>
                  <p className="text-gray-500 mt-2 text-sm">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section
          id="benefits"
          className="px-6 md:px-12 py-20 bg-gradient-to-r from-amber-50 to-orange-50"
        >
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-14">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-800">
                Why Restaurants & Cafes{" "}
                <span className="text-orange-500">Love QREats</span>
              </h2>
              <p className="mt-4 text-gray-600 max-w-2xl mx-auto">
                Real benefits that transform your business operations and
                customer experience.
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                {
                  icon: <Clock />,
                  title: "Reduce Wait Times",
                  desc: "Customers order instantly, no waiting for staff. Table turnover increases by 30%.",
                },
                {
                  icon: <Users />,
                  title: "Lower Staff Workload",
                  desc: "Waiters focus on service, not taking orders. Efficiency skyrockets.",
                },
                {
                  icon: <BarChart />,
                  title: "Increase Average Order Value",
                  desc: "Upsell items with smart suggestions, leading to higher checks.",
                },
                {
                  icon: <ShoppingCart />,
                  title: "Zero App Download",
                  desc: "Works on any smartphone via browser. Friction-free adoption.",
                },
                {
                  icon: <Coffee />,
                  title: "Enhance Hygiene",
                  desc: "Contactless ordering reduces physical touchpoints.",
                },
                {
                  icon: <Receipt />,
                  title: "Detailed Insights",
                  desc: "Know bestsellers, peak hours, and customer preferences.",
                },
              ].map((benefit, idx) => (
                <div
                  key={idx}
                  className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition flex gap-4 items-start"
                >
                  <div className="text-orange-500 bg-orange-100 p-2 rounded-lg">
                    {benefit.icon}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800">{benefit.title}</h3>
                    <p className="text-gray-500 text-sm mt-1">{benefit.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="px-6 md:px-12 py-20">
          <div className="max-w-4xl mx-auto bg-gradient-to-r from-orange-500 to-amber-500 rounded-3xl p-8 md:p-12 text-center shadow-xl">
            <h2 className="text-3xl md:text-4xl font-bold text-white">
              Ready to Modernize Your Dining Experience?
            </h2>
            <p className="text-orange-100 mt-4 text-lg">
              Join hundreds of restaurants already using QREats to grow their
              business.
            </p>
            <button
              onClick={() => openModal("register")}
              className="mt-8 px-8 py-3 bg-white text-orange-600 rounded-full text-lg font-semibold shadow-md hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 inline-flex items-center gap-2"
            >
              Get Started Today <ArrowRight className="w-5 h-5" />
            </button>
            <p className="text-orange-100 text-sm mt-4">
              No credit card required. Free 14-day trial.
            </p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-white/80 border-t border-amber-100 py-8 px-6 md:px-12">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <UtensilsCrossed className="w-5 h-5 text-orange-500" />
            <span className="font-bold text-gray-700">QREats</span>
            <span className="text-xs text-gray-400">
              © 2026 All rights reserved
            </span>
          </div>
          <div className="flex gap-6 text-gray-500 text-sm">
            <a href="#" className="hover:text-orange-500">
              Privacy
            </a>
            <a href="#" className="hover:text-orange-500">
              Terms
            </a>
            <a href="#" className="hover:text-orange-500">
              Contact
            </a>
          </div>
          <div className="flex gap-3">
            <PhoneCall className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-500">
              Support: hello@qreats.com
            </span>
          </div>
        </div>
      </footer>

      {/* Modal - Improved with warm colors */}
      {isModalOpen && (
        <div
          className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-md shadow-2xl transition-all transform animate-in fade-in zoom-in duration-200 border border-orange-100"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex justify-between items-center p-5 border-b border-orange-100">
              <div className="flex gap-5">
                <button
                  onClick={() => setActiveTab("login")}
                  className={`text-lg font-semibold transition pb-1 ${
                    activeTab === "login"
                      ? "text-orange-600 border-b-2 border-orange-500"
                      : "text-gray-400 hover:text-gray-600"
                  }`}
                >
                  Login
                </button>
                <button
                  onClick={() => setActiveTab("register")}
                  className={`text-lg font-semibold transition pb-1 ${
                    activeTab === "register"
                      ? "text-orange-600 border-b-2 border-orange-500"
                      : "text-gray-400 hover:text-gray-600"
                  }`}
                >
                  Register
                </button>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-full hover:bg-orange-50 transition"
              >
                <X className="w-5 h-5 text-gray-400 hover:text-orange-500" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              {activeTab === "login" ? (
                <form onSubmit={handleLogin} className="space-y-5">
                  <div>
                    <label
                      htmlFor="email"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Email Address
                    </label>
                    <input
                      type="email"
                      id="email"
                      value={loginData.email}
                      onChange={(e) =>
                        setLoginData({ ...loginData, email: e.target.value })
                      }
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-300 focus:border-orange-400 outline-none transition bg-gray-50"
                      placeholder="you@example.com"
                      required
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="password"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Password
                    </label>
                    <div className="relative">
                      <input
                        type={showLoginPassword ? "text" : "password"}
                        id="password"
                        value={loginData.password}
                        onChange={(e) =>
                          setLoginData({
                            ...loginData,
                            password: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-300 focus:border-orange-400 outline-none pr-10 bg-gray-50"
                        placeholder="••••••••"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowLoginPassword(!showLoginPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-orange-500"
                      >
                        {showLoginPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <a
                      href="#"
                      className="text-sm text-orange-500 hover:underline"
                    >
                      Forgot password?
                    </a>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-orange-500 to-amber-500 text-white py-2.5 rounded-xl hover:from-orange-600 hover:to-amber-600 transition font-medium shadow-md disabled:opacity-70"
                  >
                    {loading ? "Signing in..." : "Sign In"}
                  </button>

                  <p className="text-center text-sm text-gray-500">
                    Don't have an account?{" "}
                    <button
                      type="button"
                      onClick={() => setActiveTab("register")}
                      className="text-orange-600 font-medium hover:underline"
                    >
                      Register
                    </button>
                  </p>
                </form>
              ) : (
                <form onSubmit={handleRegister} className="space-y-4">
                  <div>
                    <label
                      htmlFor="restaurantName"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Restaurant Name
                    </label>
                    <input
                      type="text"
                      id="restaurantName"
                      value={registerData.restaurantName}
                      onChange={(e) =>
                        setRegisterData({
                          ...registerData,
                          restaurantName: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-300 focus:border-orange-400 outline-none bg-gray-50"
                      placeholder="e.g., Cafe Delight"
                      required
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="name"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Owner Name
                    </label>
                    <input
                      type="text"
                      id="name"
                      value={registerData.name}
                      onChange={(e) =>
                        setRegisterData({
                          ...registerData,
                          name: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-300 focus:border-orange-400 outline-none bg-gray-50"
                      placeholder="Full name"
                      required
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="phone"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Phone Number
                    </label>
                    <input
                      type="text"
                      id="phone"
                      value={registerData.phone}
                      onChange={(e) =>
                        setRegisterData({
                          ...registerData,
                          phone: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-300 focus:border-orange-400 outline-none bg-gray-50"
                      placeholder="+1 234 567 890"
                      required
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="reg-email"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Email Address
                    </label>
                    <input
                      type="email"
                      id="reg-email"
                      value={registerData.email}
                      onChange={(e) =>
                        setRegisterData({
                          ...registerData,
                          email: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-300 focus:border-orange-400 outline-none bg-gray-50"
                      placeholder="restaurant@example.com"
                      required
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="reg-password"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Password
                    </label>
                    <div className="relative">
                      <input
                        type={showRegisterPassword ? "text" : "password"}
                        id="reg-password"
                        value={registerData.password}
                        onChange={(e) =>
                          setRegisterData({
                            ...registerData,
                            password: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-300 focus:border-orange-400 outline-none pr-10 bg-gray-50"
                        placeholder="Create a password"
                        required
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowRegisterPassword(!showRegisterPassword)
                        }
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-orange-500"
                      >
                        {showRegisterPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="confirm-password"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Confirm Password
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        id="confirm-password"
                        value={registerData.confirmPassword}
                        onChange={(e) =>
                          setRegisterData({
                            ...registerData,
                            confirmPassword: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-300 focus:border-orange-400 outline-none pr-10 bg-gray-50"
                        placeholder="Confirm password"
                        required
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-orange-500"
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-orange-500 to-amber-500 text-white py-2.5 rounded-xl hover:from-orange-600 hover:to-amber-600 transition font-medium shadow-md disabled:opacity-70"
                  >
                    {loading ? "Creating account..." : "Create Account"}
                  </button>

                  <p className="text-center text-sm text-gray-500">
                    Already have an account?{" "}
                    <button
                      type="button"
                      onClick={() => setActiveTab("login")}
                      className="text-orange-600 font-medium hover:underline"
                    >
                      Sign in
                    </button>
                  </p>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
