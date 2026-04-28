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

      toast.success("Account created successfully");

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
    <div className="min-h-screen bg-[#0B0F19] text-white overflow-hidden">
      {/* Background Effects */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-100px] left-[-100px] w-[350px] h-[350px] bg-orange-500/20 blur-3xl rounded-full" />
        <div className="absolute bottom-[-120px] right-[-100px] w-[350px] h-[350px] bg-amber-500/20 blur-3xl rounded-full" />
      </div>

      <div className="relative z-10 grid lg:grid-cols-2 min-h-screen">
        {/* ========================================= */}
        {/* LEFT SIDE */}
        {/* ========================================= */}
        <div className="hidden lg:flex flex-col justify-between p-12 border-r border-white/10">
          {/* Logo */}
          <div>
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-r from-orange-500 to-amber-500 p-3 rounded-2xl shadow-lg">
                <UtensilsCrossed className="w-7 h-7 text-white" />
              </div>

              <div>
                <h1 className="text-3xl font-bold">QREats</h1>
                <p className="text-gray-400 text-sm">
                  Smart Restaurant Operating System
                </p>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 px-4 py-2 rounded-full text-orange-300 text-sm mb-8">
              <QrCode className="w-4 h-4" />
              Modern QR Ordering Platform
            </div>

            <h2 className="text-5xl font-bold leading-tight">
              Run Your Restaurant
              <span className="block bg-gradient-to-r from-orange-400 to-amber-300 bg-clip-text text-transparent">
                Smarter & Faster
              </span>
            </h2>

            <p className="text-gray-400 text-lg mt-6 leading-relaxed">
              Accept QR orders, manage tables, kitchen operations, billing,
              staff, analytics, and customer experience from one powerful
              dashboard.
            </p>

            {/* Features */}
            <div className="mt-10 grid grid-cols-2 gap-5">
              {[
                {
                  icon: <QrCode className="w-5 h-5" />,
                  title: "QR Ordering",
                },
                {
                  icon: <BarChart3 className="w-5 h-5" />,
                  title: "Analytics",
                },
                {
                  icon: <Zap className="w-5 h-5" />,
                  title: "Live Orders",
                },
                {
                  icon: <Shield className="w-5 h-5" />,
                  title: "Secure System",
                },
              ].map((item, index) => (
                <div
                  key={index}
                  className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-xl"
                >
                  <div className="text-orange-400 mb-3">{item.icon}</div>

                  <h3 className="font-semibold">{item.title}</h3>

                  <p className="text-sm text-gray-400 mt-1">
                    Powerful tools for modern restaurants.
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom */}
          <div className="flex items-center gap-6 text-sm text-gray-400">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-400" />
              No setup fee
            </div>

            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-400" />
              Free trial
            </div>

            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-400" />
              Cloud hosted
            </div>
          </div>
        </div>

        {/* ========================================= */}
        {/* RIGHT SIDE */}
        {/* ========================================= */}
        <div className="flex items-center justify-center p-6 md:p-10">
          <div className="w-full max-w-md">
            {/* Mobile Logo */}
            <div className="lg:hidden flex items-center justify-center gap-3 mb-10">
              <div className="bg-gradient-to-r from-orange-500 to-amber-500 p-3 rounded-2xl">
                <UtensilsCrossed className="w-6 h-6 text-white" />
              </div>

              <div>
                <h1 className="text-2xl font-bold">QREats</h1>
              </div>
            </div>

            {/* Card */}
            <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 shadow-2xl">
              {/* Tabs */}
              <div className="flex bg-white/5 rounded-2xl p-1 mb-8">
                <button
                  onClick={() => setActiveTab("login")}
                  className={`flex-1 py-3 rounded-xl font-medium transition-all duration-300 ${
                    activeTab === "login"
                      ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  Login
                </button>

                <button
                  onClick={() => setActiveTab("register")}
                  className={`flex-1 py-3 rounded-xl font-medium transition-all duration-300 ${
                    activeTab === "register"
                      ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  Register
                </button>
              </div>

              {/* LOGIN */}
              {activeTab === "login" ? (
                <form onSubmit={handleLogin} className="space-y-5">
                  <div>
                    <label className="block text-sm text-gray-300 mb-2">
                      Email Address
                    </label>

                    <input
                      type="email"
                      value={loginData.email}
                      onChange={(e) =>
                        setLoginData({
                          ...loginData,
                          email: e.target.value,
                        })
                      }
                      placeholder="you@example.com"
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-300 mb-2">
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
                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 pr-12 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
                      />

                      <button
                        type="button"
                        onClick={() => setShowLoginPassword(!showLoginPassword)}
                        className="absolute top-1/2 right-4 -translate-y-1/2 text-gray-400 hover:text-orange-400"
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
                      className="text-sm text-orange-400 hover:text-orange-300"
                    >
                      Forgot Password?
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white py-3 rounded-2xl font-semibold transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-70"
                  >
                    {loading ? "Signing In..." : "Sign In"}
                    {!loading && <ArrowRight className="w-5 h-5" />}
                  </button>
                </form>
              ) : (
                /* REGISTER */
                <form onSubmit={handleRegister} className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-300 mb-2">
                      Restaurant Name
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
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-300 mb-2">
                      Owner Name
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
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-300 mb-2">
                      Phone Number
                    </label>

                    <input
                      type="text"
                      value={registerData.phone}
                      onChange={(e) =>
                        setRegisterData({
                          ...registerData,
                          phone: e.target.value,
                        })
                      }
                      placeholder="+91 9876543210"
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-300 mb-2">
                      Email Address
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
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-300 mb-2">
                      Password
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
                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 pr-12 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
                      />

                      <button
                        type="button"
                        onClick={() =>
                          setShowRegisterPassword(!showRegisterPassword)
                        }
                        className="absolute top-1/2 right-4 -translate-y-1/2 text-gray-400 hover:text-orange-400"
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
                    <label className="block text-sm text-gray-300 mb-2">
                      Confirm Password
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
                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 pr-12 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
                      />

                      <button
                        type="button"
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                        className="absolute top-1/2 right-4 -translate-y-1/2 text-gray-400 hover:text-orange-400"
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
                    className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white py-3 rounded-2xl font-semibold transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-70"
                  >
                    {loading ? "Creating Account..." : "Create Account"}
                    {!loading && <ArrowRight className="w-5 h-5" />}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
