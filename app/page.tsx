"use client";

import { useState } from "react";
import {
  Eye,
  EyeOff,
  QrCode,
  ArrowRight,
  UtensilsCrossed,
  Shield,
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

  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
  });

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

  // =========================================
  // LOGIN
  // =========================================
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (loading) return;

    const { email, password } = loginData;

    if (!email || !password) {
      return toast.error("Email and password are required");
    }

    try {
      setLoading(true);

      const payload = {
        email: email.trim().toLowerCase(),
        password,
      };

      const response = await API.post("/api/auth/login", payload);

      const data = response?.data;

      if (!data || !data.token) {
        throw new Error("Invalid response from server");
      }

      setAuth({
        user: data.user,
        restaurant: data.restaurant,
        token: data.token,
      });
      console.log("Login successful, user data:", data.user, "restaurant data:", data.restaurant);
      const role = data?.user?.role?.toUpperCase();

      toast.success(`Welcome back ${data?.user?.name || ""}`);

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
    } catch (error: any) {
      console.error(error);

      let message = "Login failed";

      if (error.response) {
        message = error.response?.data?.message || message;
      } else if (error.request) {
        message = "Unable to connect to server";
      } else {
        message = error.message;
      }

      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  // =========================================
  // REGISTER
  // =========================================
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
    ) {
      return toast.error("Please fill all required fields");
    }

    if (password !== confirmPassword) {
      return toast.error("Passwords do not match");
    }

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

      const data = response?.data;

      if (!data) {
        throw new Error("No response from server");
      }

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
      console.error(error);

      let message = "Registration failed";

      if (error.response) {
        message = error.response?.data?.message || message;
      } else if (error.request) {
        message = "Unable to connect to server";
      } else {
        message = error.message;
      }

      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="container mx-auto px-4 py-8 lg:py-12">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center max-w-7xl mx-auto">
          {/* ========================================= */}
          {/* LEFT SIDE - Branding & Features */}
          {/* ========================================= */}
          <div className="hidden lg:block space-y-8">
            {/* Logo */}
            <Image
              src="/final.png"
              alt="QRasoi Logo"
              width={120}
              height={60}
              className="mb-6"
            />

            {/* Hero Section */}
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 bg-orange-100 border border-orange-200 px-4 py-2 rounded-full text-orange-700 text-sm font-medium">
                <QrCode className="w-4 h-4" />
                Modern QR Ordering Platform
              </div>

              <h1 className="text-5xl lg:text-6xl font-bold leading-tight text-gray-900">
                Run Your Restaurant
                <span className="block bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
                  Smarter & Faster
                </span>
              </h1>

              <p className="text-gray-600 text-lg leading-relaxed">
                Accept QR orders, manage tables, kitchen operations, billing,
                staff, analytics, and customer experience from one powerful
                dashboard.
              </p>
            </div>

            {/* Feature Grid */}
            <div className="grid grid-cols-2 gap-5">
              {[
                {
                  icon: <QrCode className="w-5 h-5 text-orange-600" />,
                  title: "QR Ordering",
                  desc: "Contactless & fast",
                },
                {
                  icon: <BarChart3 className="w-5 h-5 text-orange-600" />,
                  title: "Analytics",
                  desc: "Real-time insights",
                },
                {
                  icon: <Zap className="w-5 h-5 text-orange-600" />,
                  title: "Live Orders",
                  desc: "Instant updates",
                },
                {
                  icon: <Shield className="w-5 h-5 text-orange-600" />,
                  title: "Secure System",
                  desc: "Data protected",
                },
              ].map((item, index) => (
                <div
                  key={index}
                  className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
                >
                  <div className="mb-3">{item.icon}</div>
                  <h3 className="font-semibold text-gray-800">{item.title}</h3>
                  <p className="text-sm text-gray-500 mt-1">{item.desc}</p>
                </div>
              ))}
            </div>

            {/* Trust Badges */}
            <div className="flex flex-wrap items-center gap-6 text-sm text-gray-600 pt-4 border-t border-gray-200">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                No setup fee
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                14-day free trial
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                Cloud hosted
              </div>
            </div>
          </div>

          {/* ========================================= */}
          {/* RIGHT SIDE - Auth Forms */}
          {/* ========================================= */}
          <div className="flex items-center justify-center">
            <div className="w-full max-w-md">
              {/* Mobile Logo */}
              <div className="lg:hidden flex justify-center mb-8">
                <Image
                  src="/final.png"
                  alt="QRasoi Logo"
                  width={120}
                  height={120}
                />
              </div>

              {/* Card */}
              <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-6 md:p-8">
                {/* Tabs */}
                <div className="flex bg-gray-100 rounded-2xl p-1 mb-8">
                  <button
                    onClick={() => setActiveTab("login")}
                    className={`flex-1 py-3 rounded-xl font-semibold transition-all duration-300 ${activeTab === "login"
                      ? "bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-md"
                      : "text-gray-600 hover:text-gray-900"
                      }`}
                  >
                    Login
                  </button>
                  <button
                    onClick={() => setActiveTab("register")}
                    className={`flex-1 py-3 rounded-xl font-semibold transition-all duration-300 ${activeTab === "register"
                      ? "bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-md"
                      : "text-gray-600 hover:text-gray-900"
                      }`}
                  >
                    Register
                  </button>
                </div>

                {/* LOGIN FORM */}
                {activeTab === "login" ? (
                  <form onSubmit={handleLogin} className="space-y-5">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={loginData.email}
                        onChange={(e) =>
                          setLoginData({ ...loginData, email: e.target.value })
                        }
                        placeholder="you@example.com"
                        className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
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
                          className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 pr-12 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setShowLoginPassword(!showLoginPassword)
                          }
                          className="absolute top-1/2 right-4 -translate-y-1/2 text-gray-400 hover:text-orange-600"
                        >
                          {showLoginPassword ? (
                            <EyeOff className="w-5 h-5" />
                          ) : (
                            <Eye className="w-5 h-5" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <button
                        type="button"
                        className="text-sm text-orange-600 hover:text-orange-700 font-medium"
                      >
                        Forgot Password?
                      </button>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white py-3 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed shadow-md"
                    >
                      {loading ? "Signing In..." : "Sign In"}
                      {!loading && <ArrowRight className="w-5 h-5" />}
                    </button>
                  </form>
                ) : (
                  /* REGISTER FORM */
                  <form onSubmit={handleRegister} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
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
                        className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
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
                        className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
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
                        className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
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
                        className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
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
                          className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 pr-12 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setShowRegisterPassword(!showRegisterPassword)
                          }
                          className="absolute top-1/2 right-4 -translate-y-1/2 text-gray-400 hover:text-orange-600"
                        >
                          {showRegisterPassword ? (
                            <EyeOff className="w-5 h-5" />
                          ) : (
                            <Eye className="w-5 h-5" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
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
                          className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 pr-12 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setShowConfirmPassword(!showConfirmPassword)
                          }
                          className="absolute top-1/2 right-4 -translate-y-1/2 text-gray-400 hover:text-orange-600"
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="w-5 h-5" />
                          ) : (
                            <Eye className="w-5 h-5" />
                          )}
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white py-3 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed shadow-md"
                    >
                      {loading ? "Creating Account..." : "Create Account"}
                      {!loading && <ArrowRight className="w-5 h-5" />}
                    </button>
                  </form>
                )}
              </div>

              {/* Additional info for mobile */}
              <div className="lg:hidden mt-8 text-center text-sm text-gray-500">
                <div className="flex justify-center gap-4 flex-wrap">
                  <span className="flex items-center gap-1">
                    ✓ No setup fee
                  </span>
                  <span className="flex items-center gap-1">✓ Free trial</span>
                  <span className="flex items-center gap-1">
                    ✓ Cloud hosted
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
