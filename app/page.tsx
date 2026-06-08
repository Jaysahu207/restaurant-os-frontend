"use client";

import { useState } from "react";
import {
  Eye,
  EyeOff,
  QrCode,
  ArrowRight,
  UtensilsCrossed,
  Shield,
  Mail,
  Database,
  Lock,
  Zap,
  BarChart3,
  CheckCircle2,
} from "lucide-react";

import API from "../config/axios";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import Image from "next/image";

export default function AuthPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [registerData, setRegisterData] = useState({
    restaurantName: "",
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const setAuth = useAuthStore((state) => state.setAuth);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    const { email, password } = loginData;
    if (!email || !password)
      return toast.error("Email and password are required");
    try {
      setLoading(true);
      const payload = { email: email.trim().toLowerCase(), password };
      const response = await API.post("/api/auth/login", payload);
      const data = response?.data;
      if (!data || !data.token) throw new Error("Invalid response");
      setAuth({
        user: data.user,
        restaurant: data.restaurant,
        token: data.token,
      });
      const role = data?.user?.role?.toUpperCase();
      toast.success(`Welcome back ${data?.user?.name || ""}`);
      if (role === "SUPER_ADMIN") router.push("/super-admin/dashboard");
      else if (role === "OWNER" || role === "MANAGER")
        router.push("/dashboard");
      else if (role === "CHEF") router.push("/kitchen");
      else if (role === "WAITER") router.push("/waiter");
      else router.push("/");
    } catch (error: any) {
      let message = "Login failed";
      if (error.response) message = error.response?.data?.message || message;
      else if (error.request) message = "Unable to connect to server";
      else message = error.message;
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    const { restaurantName, name, email, phone, password, confirmPassword } =
      registerData;
    if (
      !restaurantName ||
      !name ||
      !email ||
      !phone ||
      !password ||
      !confirmPassword
    )
      return toast.error("Please fill all required fields");
    if (password !== confirmPassword)
      return toast.error("Passwords do not match");
    try {
      setLoading(true);
      const payload = {
        restaurantName: restaurantName.trim(),
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        password,
      };
      const response = await API.post("/api/auth/register", payload);
      if (!response?.data) throw new Error("No response");
      toast.success("Account created successfully! Please login.");
      setRegisterData({
        restaurantName: "",
        name: "",
        email: "",
        phone: "",
        password: "",
        confirmPassword: "",
      });
      setActiveTab("login");
    } catch (error: any) {
      let message = "Registration failed";
      if (error.response) message = error.response?.data?.message || message;
      else if (error.request) message = "Unable to connect to server";
      else message = error.message;
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-white to-orange-50 overflow-x-hidden">
      <div className="max-w-9xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16 xl:py-20">
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 xl:gap-16">
          {/* ---------- LEFT COLUMN: AUTH FORM ---------- */}
          <div className="flex-1 flex items-center gap-4 justify-center">
            <div className="w-full max-w-2xl mx-auto lg:mx-0">
              {/* Logo & Brand Section */}
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 mb-8 sm:mb-10">
                <div className="flex-shrink-0 bg-white rounded-2xl p-2 shadow-md">
                  <Image
                    src="/final.png"
                    alt="QRasoi Logo"
                    width={80}
                    height={80}
                    priority
                    className="w-16 h-16 sm:w-20 sm:h-20 object-contain"
                  />
                </div>
                <div className="text-center sm:text-left">
                  <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-100 text-orange-700 text-xs sm:text-sm font-medium">
                    <QrCode className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    Trusted Restaurant Platform
                  </span>
                  <h1 className="mt-3 sm:mt-4 text-3xl sm:text-4xl lg:text-5xl font-black leading-tight text-gray-900">
                    Manage Orders,
                    <span className="block text-orange-600">
                      Billing & Kitchen
                    </span>
                    From One Dashboard
                  </h1>
                  <p className="mt-3 sm:mt-4 text-sm sm:text-base text-gray-600 max-w-xl">
                    QR Ordering, Billing, KOT, Inventory, Loyalty Programs,
                    CRM and Analytics for modern restaurants.
                  </p>
                </div>
              </div>

              {/* Form Card */}
              <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-orange-100/50 p-5 sm:p-6 md:p-8 transition-all duration-300 hover:shadow-2xl">
                {/* Tabs */}
                <div className="flex bg-gray-100/80 rounded-2xl p-1 mb-6 sm:mb-8">
                  <button
                    onClick={() => setActiveTab("login")}
                    className={`flex-1 py-2.5 sm:py-3 rounded-xl font-semibold transition-all duration-300 text-sm sm:text-base ${activeTab === "login"
                      ? "bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-md transform scale-[1.02]"
                      : "text-gray-600 hover:text-gray-900 hover:bg-white/50"
                      }`}
                  >
                    Login
                  </button>
                  <button
                    onClick={() => setActiveTab("register")}
                    className={`flex-1 py-2.5 sm:py-3 rounded-xl font-semibold transition-all duration-300 text-sm sm:text-base ${activeTab === "register"
                      ? "bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-md transform scale-[1.02]"
                      : "text-gray-600 hover:text-gray-900 hover:bg-white/50"
                      }`}
                  >
                    Register
                  </button>
                </div>

                {activeTab === "login" ? (
                  <form onSubmit={handleLogin} className="space-y-4 sm:space-y-5">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={loginData.email}
                        onChange={(e) =>
                          setLoginData({ ...loginData, email: e.target.value })
                        }
                        placeholder="you@example.com"
                        className="w-full bg-white border border-gray-300 rounded-xl px-4 py-2.5 sm:py-3 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all duration-200"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                        Password
                      </label>
                      <div className="relative">
                        <input
                          type={showLoginPassword ? "text" : "password"}
                          value={loginData.password}
                          onChange={(e) =>
                            setLoginData({
                              ...loginData,
                              password: e.target.value,
                            })
                          }
                          placeholder="Enter password"
                          className="w-full bg-white border border-gray-300 rounded-xl px-4 py-2.5 sm:py-3 pr-12 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all duration-200"
                          required
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setShowLoginPassword(!showLoginPassword)
                          }
                          className="absolute top-1/2 right-4 -translate-y-1/2 text-gray-400 hover:text-orange-600 transition-colors duration-200"
                        >
                          {showLoginPassword ? (
                            <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" />
                          ) : (
                            <Eye className="w-4 h-4 sm:w-5 sm:h-5" />
                          )}
                        </button>
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <button
                        type="button"
                        className="text-xs sm:text-sm text-orange-600 hover:text-orange-700 font-medium transition-colors duration-200 hover:underline"
                      >
                        Forgot Password?
                      </button>
                    </div>
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white py-2.5 sm:py-3 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed shadow-md hover:shadow-lg transform hover:scale-[1.02] active:scale-100"
                    >
                      {loading ? (
                        <>
                          <svg className="animate-spin h-4 w-4 sm:h-5 sm:w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Signing In...
                        </>
                      ) : (
                        <>
                          Sign In
                          <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
                        </>
                      )}
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleRegister} className="space-y-3 sm:space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                        Restaurant Name *
                      </label>
                      <input
                        type="text"
                        value={registerData.restaurantName}
                        onChange={(e) =>
                          setRegisterData({
                            ...registerData,
                            restaurantName: e.target.value,
                          })
                        }
                        placeholder="Cafe Delight"
                        className="w-full bg-white border border-gray-300 rounded-xl px-4 py-2.5 sm:py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all duration-200"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                        Owner Name *
                      </label>
                      <input
                        type="text"
                        value={registerData.name}
                        onChange={(e) =>
                          setRegisterData({
                            ...registerData,
                            name: e.target.value,
                          })
                        }
                        placeholder="John Doe"
                        className="w-full bg-white border border-gray-300 rounded-xl px-4 py-2.5 sm:py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all duration-200"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                        Phone Number *
                      </label>
                      <input
                        type="tel"
                        value={registerData.phone}
                        onChange={(e) =>
                          setRegisterData({
                            ...registerData,
                            phone: e.target.value,
                          })
                        }
                        placeholder="+91 9876543210"
                        className="w-full bg-white border border-gray-300 rounded-xl px-4 py-2.5 sm:py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all duration-200"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        value={registerData.email}
                        onChange={(e) =>
                          setRegisterData({
                            ...registerData,
                            email: e.target.value,
                          })
                        }
                        placeholder="restaurant@example.com"
                        className="w-full bg-white border border-gray-300 rounded-xl px-4 py-2.5 sm:py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all duration-200"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                        Password *
                      </label>
                      <div className="relative">
                        <input
                          type={showRegisterPassword ? "text" : "password"}
                          value={registerData.password}
                          onChange={(e) =>
                            setRegisterData({
                              ...registerData,
                              password: e.target.value,
                            })
                          }
                          placeholder="Create password"
                          className="w-full bg-white border border-gray-300 rounded-xl px-4 py-2.5 sm:py-3 pr-12 text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all duration-200"
                          required
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setShowRegisterPassword(!showRegisterPassword)
                          }
                          className="absolute top-1/2 right-4 -translate-y-1/2 text-gray-400 hover:text-orange-600 transition-colors duration-200"
                        >
                          {showRegisterPassword ? (
                            <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" />
                          ) : (
                            <Eye className="w-4 h-4 sm:w-5 sm:h-5" />
                          )}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                        Confirm Password *
                      </label>
                      <div className="relative">
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          value={registerData.confirmPassword}
                          onChange={(e) =>
                            setRegisterData({
                              ...registerData,
                              confirmPassword: e.target.value,
                            })
                          }
                          placeholder="Confirm password"
                          className="w-full bg-white border border-gray-300 rounded-xl px-4 py-2.5 sm:py-3 pr-12 text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all duration-200"
                          required
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setShowConfirmPassword(!showConfirmPassword)
                          }
                          className="absolute top-1/2 right-4 -translate-y-1/2 text-gray-400 hover:text-orange-600 transition-colors duration-200"
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" />
                          ) : (
                            <Eye className="w-4 h-4 sm:w-5 sm:h-5" />
                          )}
                        </button>
                      </div>
                    </div>
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white py-2.5 sm:py-3 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed shadow-md hover:shadow-lg transform hover:scale-[1.02] active:scale-100"
                    >
                      {loading ? (
                        <>
                          <svg className="animate-spin h-4 w-4 sm:h-5 sm:w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Creating Account...
                        </>
                      ) : (
                        <>
                          Create Account
                          <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
                        </>
                      )}
                    </button>
                  </form>
                )}
                <div className="mt-6 text-center text-xs text-gray-500">
                  By continuing, you agree to our{" "}
                  <a
                    href="https://qrasoi.in/terms-of-service"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-orange-600 underline"
                  >
                    Terms of Service
                  </a>
                  {" "}and{" "}
                  <a
                    href="https://qrasoi.in/privacy-policy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-orange-600 underline"
                  >
                    Privacy Policy
                  </a>.
                </div>
              </div>
            </div>
          </div>

          {/* ---------- RIGHT COLUMN: BRANDING & FEATURES ---------- */}
          <div className="flex-1 space-y-6 sm:space-y-8">
            {/* About QRasoi */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-orange-100/50 p-5 sm:p-6 shadow-md hover:shadow-xl transition-all duration-300">
              <div className="flex items-center gap-3 mb-3 sm:mb-4">
                <div className="p-2 bg-orange-100 rounded-xl">
                  <UtensilsCrossed className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600" />
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                  About QRasoi
                </h2>
              </div>
              <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                QRasoi is a cloud‑based Restaurant Operating System designed for
                restaurants, cafes, hotels, food courts, and cloud kitchens. It
                helps businesses manage QR ordering, billing, kitchen
                operations, customer engagement, loyalty programs, marketing,
                and analytics from a single dashboard.
              </p>
            </div>

            {/* Gmail Integration */}
            <div className="bg-blue-50/80 backdrop-blur-sm border border-blue-200 rounded-2xl p-5 sm:p-6 shadow-md hover:shadow-xl transition-all duration-300">
              <div className="flex items-center gap-3 mb-3 sm:mb-4">
                <div className="p-2 bg-blue-100 rounded-xl">
                  <Mail className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                  Gmail Integration (Optional)
                </h2>
              </div>
              <p className="text-sm sm:text-base text-gray-700 mb-4">
                Connect your Gmail account to send invoices, loyalty updates,
                promotions, and customer communications directly from your own
                email address.
              </p>
              <div className="space-y-3 text-sm">
                <div className="flex gap-3">
                  <Database className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <span className="text-xs sm:text-sm text-gray-700">
                    Only requests <strong>gmail.send</strong> permission – no
                    read, modify, or delete access.
                  </span>
                </div>
                <div className="flex gap-3">
                  <Lock className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <span className="text-xs sm:text-sm text-gray-700">
                    QRasoi never reads, stores, or shares your Gmail messages.
                  </span>
                </div>
                <div className="flex gap-3">
                  <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <span className="text-xs sm:text-sm text-gray-700">
                    User data is never sold, shared with advertisers, or used
                    for AI training.
                  </span>
                </div>
              </div>
              <div className="mt-4 text-xs text-gray-600 bg-white/60 backdrop-blur-sm p-3 rounded-xl border border-blue-100">
                💡 <strong>Why we need this permission:</strong> To let you send
                professional emails (invoices, promotions) from your own Gmail
                address. We only send emails you initiate.
              </div>
            </div>

            {/* Feature Icons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { icon: QrCode, title: "QR Ordering", description: "Contactless ordering experience" },
                { icon: BarChart3, title: "Analytics", description: "Real-time business insights" },
                { icon: Zap, title: "Live Orders", description: "Instant order notifications" },
                { icon: Shield, title: "Secure System", description: "Enterprise-grade security" },
              ].map((item, idx) => {
                const Icon = item.icon;
                return (
                  <div
                    key={idx}
                    className="group bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-lg transition-all duration-300 hover:border-orange-200 hover:bg-white"
                  >
                    <div className="p-2 bg-orange-50 rounded-lg w-fit group-hover:bg-orange-100 transition-colors duration-300">
                      <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600" />
                    </div>
                    <h3 className="font-semibold mt-3 text-gray-800 text-sm sm:text-base">
                      {item.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-500 mt-1">
                      {item.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
      {/* Footer - Required For Google Verification */}
      <footer className="border-t border-gray-200 bg-white mt-12">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 text-sm">

            <a
              href="https://qrasoi.in/privacy-policy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-orange-600 hover:text-orange-700 underline font-medium"
            >
              Privacy Policy
            </a>

            <a
              href="https://qrasoi.in/terms-of-service"
              target="_blank"
              rel="noopener noreferrer"
              className="text-orange-600 hover:text-orange-700 underline font-medium"
            >
              Terms of Service
            </a>

            <a
              href="mailto:support@qrasoi.in"
              className="text-orange-600 hover:text-orange-700 underline font-medium"
            >
              Contact Support
            </a>

          </div>

          <p className="text-center text-gray-500 text-xs mt-6">
            © {new Date().getFullYear()} QRasoi. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}