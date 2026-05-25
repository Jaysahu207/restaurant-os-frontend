"use client";

import { useEffect, useState } from "react";
import {
  Crown,
  Check,
  Calendar,
  CreditCard,
  Zap,
  ShieldCheck,
  Loader2,
  Info,
  AlertTriangle,
  Download,
  TrendingUp,
  Users,
  Utensils,
  Wallet,
  Plus,
  ChevronRight,
} from "lucide-react";

import {
  getPlans,
  getMySubscription,
  createOrder,
  verifyPayment,
  cancelSubscription,
} from "@/services/subscriptionService";

declare global {
  interface Window {
    Razorpay: any;
  }
}

// Mock data for additional features (replace with real API calls)
const fetchUsageStats = async () => ({
  ordersThisMonth: 342,
  totalStaff: 12,
  tableTurnover: 86,
  activeTables: 4,
});

const fetchInvoices = async () => [
  {
    id: "INV-001",
    date: "2025-04-01",
    amount: "₹1,499",
    status: "paid",
    downloadUrl: "#",
  },
  {
    id: "INV-002",
    date: "2025-03-01",
    amount: "₹1,499",
    status: "paid",
    downloadUrl: "#",
  },
  {
    id: "INV-003",
    date: "2025-02-01",
    amount: "₹1,499",
    status: "paid",
    downloadUrl: "#",
  },
];

const fetchPaymentMethods = async () => [
  { id: 1, type: "UPI", details: "owner@okhdfcbank", isDefault: true },
  { id: 2, type: "Card", details: "VISA **** 4242", isDefault: false },
];

// Toast component (simple, replace with your existing toast library if any)
const Toast = ({
  message,
  type,
  onClose,
}: {
  message: string;
  type: "success" | "error";
  onClose: () => void;
}) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);
  return (
    <div
      className={`fixed bottom-5 right-5 z-50 px-4 py-3 rounded-lg shadow-lg text-white ${type === "success" ? "bg-emerald-600" : "bg-rose-600"}`}
    >
      {message}
    </div>
  );
};

export default function SubscriptionPage() {
  const [plans, setPlans] = useState<any[]>([]);
  const [subscription, setSubscription] = useState<any>(null);
  const [usageStats, setUsageStats] = useState<any>(null);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  useEffect(() => {
    fetchData();
    loadRazorpayScript();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [plansRes, subRes, stats, invoicesRes, paymentMethodsRes] =
        await Promise.all([
          getPlans(),
          getMySubscription(),
          fetchUsageStats(),
          fetchInvoices(),
          fetchPaymentMethods(),
        ]);
      setPlans(plansRes?.plans || []);
      setSubscription(subRes?.subscription || null);
      setUsageStats(stats);
      setInvoices(invoicesRes);
      setPaymentMethods(paymentMethodsRes);
    } catch (error) {
      console.error(error);
      setToast({ message: "Failed to load subscription data", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const loadRazorpayScript = () => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
  };

  const handleBuyPlan = async (planCode: string) => {
    try {
      setPaymentLoading(true);
      const res = await createOrder({ planCode });
      const { order, plan } = res;

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: "QRasoi",
        description: `${plan.name} Subscription`,
        order_id: order.id,
        theme: { color: "#4f46e5" },
        handler: async (response: any) => {
          try {
            await verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              planCode,
            });
            setToast({
              message: "🎉 Subscription activated successfully!",
              type: "success",
            });
            fetchData();
          } catch (error) {
            console.error(error);
            setToast({ message: "Payment verification failed", type: "error" });
          }
        },
        modal: { ondismiss: () => setPaymentLoading(false) },
        prefill: {
          name: "Restaurant Owner",
          email: "owner@email.com",
          contact: "9999999999",
        },
      };

      const razor = new window.Razorpay(options);
      razor.open();
    } catch (error: any) {
      console.error(error);
      setToast({
        message: error?.response?.data?.message || "Payment failed",
        type: "error",
      });
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    const confirmCancel = confirm(
      "Are you sure you want to cancel your subscription? You will lose access to premium features at the end of your billing cycle.",
    );
    if (!confirmCancel) return;

    try {
      setCancelLoading(true);
      await cancelSubscription();
      setToast({
        message: "Subscription cancelled successfully",
        type: "success",
      });
      fetchData();
    } catch (error) {
      console.error(error);
      setToast({ message: "Failed to cancel subscription", type: "error" });
    } finally {
      setCancelLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[70vh]">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  const isActiveSubscription = subscription && subscription.status === "active";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Subscription & Billing
          </h1>
          <p className="text-slate-500 text-sm">
            Manage your plan, payments and subscription details
          </p>
        </div>
      </div>

      {/* Current Subscription Card */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-indigo-600" />
            <h2 className="font-semibold text-slate-800">Current Plan</h2>
          </div>
        </div>
        <div className="p-5">
          {subscription ? (
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
                  <div>
                    <span className="text-slate-500">Plan:</span>
                    <span className="ml-2 inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 capitalize">
                      {subscription.plan}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500">Status:</span>
                    <span
                      className={`ml-2 inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${subscription.status === "active"
                        ? "bg-emerald-100 text-emerald-800"
                        : subscription.status === "trial"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-rose-100 text-rose-800"
                        }`}
                    >
                      {subscription.status === "trial" && "Trial"}
                      {subscription.status === "active" && "Active"}
                      {subscription.status === "expired" && "Expired"}
                      {subscription.status === "cancelled" && "Cancelled"}
                    </span>
                  </div>
                  {subscription.expiryDate && (
                    <div className="flex items-center gap-1 text-slate-600">
                      <Calendar className="h-4 w-4 text-slate-400" />
                      <span>
                        {subscription.status === "trial"
                          ? "Trial ends:"
                          : "Renews on:"}
                        {new Date(subscription.expiryDate).toLocaleDateString(
                          undefined,
                          {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          },
                        )}
                      </span>
                    </div>
                  )}
                </div>
                {subscription.status === "trial" && (
                  <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-lg text-amber-800 text-sm">
                    <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <p>
                      Your free trial ends on{" "}
                      <strong>
                        {new Date(subscription.expiryDate).toLocaleDateString()}
                      </strong>
                      . Choose a plan below to continue using all features.
                    </p>
                  </div>
                )}
                {subscription.status === "cancelled" && (
                  <div className="flex items-start gap-2 p-3 bg-rose-50 rounded-lg text-rose-800 text-sm">
                    <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <p>
                      Your subscription has been cancelled. You will lose access
                      to premium features on{" "}
                      <strong>
                        {new Date(subscription.expiryDate).toLocaleDateString()}
                      </strong>
                      . Reactivate anytime.
                    </p>
                  </div>
                )}
              </div>
              {isActiveSubscription && (
                <button
                  onClick={handleCancelSubscription}
                  disabled={cancelLoading}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-sm font-medium transition shadow-sm disabled:opacity-50"
                >
                  {cancelLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Cancel Subscription"
                  )}
                </button>
              )}
            </div>
          ) : (
            <div className="text-center py-4 text-slate-500">
              No active subscription. Choose a plan to get started.
            </div>
          )}
        </div>
      </div>

      {/* Free Trial Banner (only if no subscription or trial ended) */}
      {(!subscription || subscription.status === "expired") && (
        <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-6 md:px-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-sm text-white">
                  <Zap className="h-4 w-4" />
                  <span>14 Days Free Trial</span>
                </div>
                <h2 className="text-xl md:text-2xl font-bold text-white">
                  Start Your Digital Journey 🚀
                </h2>
                <p className="text-indigo-100 text-sm max-w-2xl">
                  No setup fees, no hidden charges. Experience full features –
                  QR ordering, analytics, inventory, and more.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Usage Summary (New Feature) */}
      {usageStats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="text-slate-500 text-sm">Orders (This Month)</div>
              <TrendingUp className="h-5 w-5 text-indigo-500" />
            </div>
            <div className="text-2xl font-bold text-slate-800 mt-1">
              {usageStats.ordersThisMonth}
            </div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="text-slate-500 text-sm">Total Staff</div>
              <Users className="h-5 w-5 text-indigo-500" />
            </div>
            <div className="text-2xl font-bold text-slate-800 mt-1">
              {usageStats.totalStaff}
            </div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="text-slate-500 text-sm">Table Turnover</div>
              <Utensils className="h-5 w-5 text-indigo-500" />
            </div>
            <div className="text-2xl font-bold text-slate-800 mt-1">
              {usageStats.tableTurnover}%
            </div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="text-slate-500 text-sm">Active Tables</div>
              <div className="h-5 w-5 text-indigo-500">🍽️</div>
            </div>
            <div className="text-2xl font-bold text-slate-800 mt-1">
              {usageStats.activeTables}
            </div>
          </div>
        </div>
      )}

      {/* Plans Grid */}
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-800">
            Choose Your Plan
          </h2>
          <p className="text-slate-500 text-sm">
            Flexible plans to match your restaurant's needs
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {plans.map((plan: any) => {
            const isPro = plan.code === "pro";
            const isCurrentPlan =
              subscription && subscription.plan === plan.code;

            return (
              <div
                key={plan.code}
                className={`relative bg-white rounded-xl border shadow-sm transition-all hover:shadow-md ${isPro
                  ? "border-indigo-300 ring-2 ring-indigo-100"
                  : "border-slate-200"
                  } ${isCurrentPlan ? "ring-2 ring-emerald-500" : ""}`}
              >
                {isPro && (
                  <div className="absolute -top-3 left-6 bg-indigo-600 text-white text-xs font-semibold px-3 py-1 rounded-full shadow-sm">
                    Most Popular
                  </div>
                )}
                {isCurrentPlan && (
                  <div className="absolute -top-3 right-6 bg-emerald-600 text-white text-xs font-semibold px-3 py-1 rounded-full shadow-sm">
                    Current Plan
                  </div>
                )}
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-slate-800">
                        {plan.name}
                      </h3>
                      <p className="text-slate-500 text-xs mt-1">
                        {plan.description ||
                          (isPro
                            ? "Unlock all premium features"
                            : "Essential features for starters")}
                      </p>
                    </div>
                    <div className="bg-indigo-50 p-2 rounded-lg">
                      <Crown
                        className={`h-5 w-5 ${isPro ? "text-indigo-600" : "text-indigo-400"}`}
                      />
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold text-slate-900">
                        ₹{plan.basePrice}
                      </span>
                      <span className="text-slate-500 text-sm">/month</span>
                    </div>
                    {/* <div className="text-xs text-slate-500 mt-1">
                      + {plan.gstPercentage}% GST
                    </div>
                    <div className="text-sm font-semibold text-indigo-600 mt-1">
                      Total: ₹{plan.finalPrice}/month
                    </div> */}
                  </div>

                  <div className="space-y-2 mb-6">
                    {Object.entries(plan.features).map(
                      ([feature, enabled]: any) => (
                        <div
                          key={feature}
                          className="flex items-center gap-2 text-sm"
                        >
                          <Check
                            className={`h-4 w-4 ${enabled ? "text-emerald-500" : "text-slate-300"}`}
                          />
                          <span
                            className={`capitalize ${enabled ? "text-slate-700" : "text-slate-400 line-through"}`}
                          >
                            {feature.replace(/([A-Z])/g, " $1")}
                          </span>
                        </div>
                      ),
                    )}
                  </div>

                  <button
                    onClick={() => handleBuyPlan(plan.code)}
                    disabled={paymentLoading || isCurrentPlan}
                    className={`w-full py-2.5 rounded-lg font-medium transition flex items-center justify-center gap-2 ${isCurrentPlan
                      ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                      : isPro
                        ? "bg-indigo-600 hover:bg-indigo-700 text-white"
                        : "bg-slate-800 hover:bg-slate-900 text-white"
                      }`}
                  >
                    {paymentLoading ? (
                      <>
                        <Loader2 className="animate-spin h-4 w-4" />
                        Processing...
                      </>
                    ) : isCurrentPlan ? (
                      "Current Plan"
                    ) : (
                      <>
                        <CreditCard className="h-4 w-4" />
                        {subscription ? "Switch Plan" : "Start Free Trial"}
                      </>
                    )}
                  </button>
                  {!isCurrentPlan && (
                    <div className="text-center text-xs text-slate-400 mt-3">
                      14‑day free trial • Cancel anytime
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Invoice History & Payment Methods (New Features) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Invoices */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50">
            <h3 className="font-semibold text-slate-800">Invoice History</h3>
          </div>
          <div className="divide-y divide-slate-100">
            {invoices.length === 0 ? (
              <div className="p-6 text-center text-slate-500 text-sm">
                No invoices found
              </div>
            ) : (
              invoices.map((inv) => (
                <div
                  key={inv.id}
                  className="flex items-center justify-between p-4"
                >
                  <div>
                    <div className="font-medium text-slate-800">{inv.id}</div>
                    <div className="text-xs text-slate-500">
                      {new Date(inv.date).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-sm font-medium text-slate-800">
                      {inv.amount}
                    </div>
                    <span className="inline-flex px-2 py-0.5 rounded-full text-xs bg-emerald-100 text-emerald-800">
                      {inv.status}
                    </span>
                    <button className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500">
                      <Download className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/30 text-right">
            <button className="text-indigo-600 text-sm font-medium hover:underline flex items-center gap-1 ml-auto">
              View All <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
            <h3 className="font-semibold text-slate-800">Payment Methods</h3>
            <button className="text-indigo-600 text-sm font-medium flex items-center gap-1 hover:underline">
              <Plus className="h-4 w-4" /> Add
            </button>
          </div>
          <div className="divide-y divide-slate-100">
            {paymentMethods.length === 0 ? (
              <div className="p-6 text-center text-slate-500 text-sm">
                No saved payment methods
              </div>
            ) : (
              paymentMethods.map((method) => (
                <div
                  key={method.id}
                  className="flex items-center justify-between p-4"
                >
                  <div className="flex items-center gap-3">
                    <Wallet className="h-5 w-5 text-slate-400" />
                    <div>
                      <div className="font-medium text-slate-800">
                        {method.type}
                      </div>
                      <div className="text-xs text-slate-500">
                        {method.details}
                      </div>
                    </div>
                  </div>
                  {method.isDefault && (
                    <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                      Default
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Support Footer */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 text-center text-sm text-slate-500">
        Need help? Contact our support team at{" "}
        <a
          href="mailto:support@qrasoi.com"
          className="text-indigo-600 hover:underline"
        >
          support@qrasoi.com
        </a>
      </div>

      {/* Toast Notifications */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
