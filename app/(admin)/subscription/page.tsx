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
import SubscriptionSkeleton from "@/components/skeleton/SubscriptionSkeleton";
import {
  usePlans,
  useMySubscription,
  useUsageStats,
  useInvoices,
  usePaymentMethods,
  useCreateOrder,
  useVerifyPayment,
  useCancelSubscription,
} from "@/hooks/useSubscription";

declare global {
  interface Window {
    Razorpay: any;
  }
}

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
      className={`fixed bottom-5 right-5 z-50 px-4 py-3 rounded-lg shadow-lg text-white ${type === "success" ? "bg-emerald-600" : "bg-rose-600"
        }`}
    >
      {message}
    </div>
  );
};

export default function SubscriptionPage() {
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [billingCycle, setBillingCycle] = useState("monthly");
  const [paymentLoading, setPaymentLoading] = useState(false);

  const { data: plans = [], isLoading: plansLoading } = usePlans();
  const { data: subscription, isLoading: subscriptionLoading } = useMySubscription();
  const { data: usageStats, isLoading: usageLoading } = useUsageStats();
  const { data: invoices = [], isLoading: invoicesLoading } = useInvoices();
  const { data: paymentMethods = [], isLoading: paymentMethodsLoading } = usePaymentMethods();

  const createOrderMutation = useCreateOrder();
  const verifyPaymentMutation = useVerifyPayment();
  const cancelSubscriptionMutation = useCancelSubscription();

  const isLoading =
    plansLoading || subscriptionLoading || usageLoading || invoicesLoading || paymentMethodsLoading;

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
  }, []);

  const handleBuyPlan = async (planCode: string, billingCycleArg: string) => {
    try {
      setPaymentLoading(true);
      const res = await createOrderMutation.mutateAsync({ planCode, billingCycle: billingCycleArg });
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
            await verifyPaymentMutation.mutateAsync({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              planCode,
            });
            setToast({ message: "🎉 Subscription activated successfully!", type: "success" });
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

  const handleCancelSubscription = () => {
    const confirmCancel = confirm(
      "Are you sure you want to cancel your subscription? You will lose access to premium features at the end of your billing cycle.",
    );
    if (!confirmCancel) return;

    cancelSubscriptionMutation.mutate(undefined, {
      onSuccess: () => setToast({ message: "Subscription cancelled successfully", type: "success" }),
      onError: (error) => {
        console.error(error);
        setToast({ message: "Failed to cancel subscription", type: "error" });
      },
    });
  };

  if (isLoading) {
    return <SubscriptionSkeleton />;
  }

  const isActiveSubscription = subscription && subscription.status === "active";

  return (
    <div className="space-y-4 p-4 sm:p-6  mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Subscription</h1>
          <p className="text-sm text-slate-500">Manage your plan and billing</p>
        </div>
      </div>

      {/* Current Subscription Card */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-indigo-600" />
            <h2 className="font-semibold text-slate-800 text-sm sm:text-base">Current Plan</h2>
          </div>
        </div>
        <div className="p-4 sm:p-5">
          {subscription ? (
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs sm:text-sm">
                  <div className="flex items-center gap-1">
                    <span className="text-slate-500">Plan:</span>
                    <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 capitalize">
                      {subscription.plan}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-slate-500">Status:</span>
                    <span
                      className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${subscription.status === "active"
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
                    <div className="flex items-center gap-1 text-slate-600 text-xs sm:text-sm">
                      <Calendar className="h-3.5 w-3.5 text-slate-400" />
                      <span>
                        {subscription.status === "trial" ? "Trial ends:" : "Renews:"}
                        {new Date(subscription.expiryDate).toLocaleDateString(undefined, {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                  )}
                </div>
                {subscription.status === "trial" && (
                  <div className="flex items-start gap-2 p-2.5 bg-amber-50 rounded-lg text-amber-800 text-xs sm:text-sm">
                    <Info className="h-4 w-4 mt-0.5 shrink-0" />
                    <p>
                      Your free trial ends on{" "}
                      <strong>{new Date(subscription.expiryDate).toLocaleDateString()}</strong>. Choose a
                      plan to continue.
                    </p>
                  </div>
                )}
                {subscription.status === "cancelled" && (
                  <div className="flex items-start gap-2 p-2.5 bg-rose-50 rounded-lg text-rose-800 text-xs sm:text-sm">
                    <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                    <p>
                      Cancelled – access ends on{" "}
                      <strong>{new Date(subscription.expiryDate).toLocaleDateString()}</strong>.
                    </p>
                  </div>
                )}
              </div>
              {isActiveSubscription && (
                <button
                  onClick={handleCancelSubscription}
                  disabled={cancelSubscriptionMutation.isPending}
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs sm:text-sm font-medium transition shadow-sm disabled:opacity-50 self-start md:self-auto"
                >
                  {cancelSubscriptionMutation.isPending ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    "Cancel"
                  )}
                </button>
              )}
            </div>
          ) : (
            <div className="text-center py-2 text-slate-500 text-sm">No active subscription.</div>
          )}
        </div>
      </div>

      {/* Free Trial Banner */}
      {(!subscription || subscription.status === "expired") && (
        <div className="bg-linear-to-r from-indigo-600 to-indigo-800 rounded-xl shadow-sm overflow-hidden">
          <div className="px-4 py-4 sm:px-6 sm:py-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-sm px-2.5 py-1 rounded-full text-xs text-white">
                  <Zap className="h-3.5 w-3.5" />
                  <span>14 Days Free</span>
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-white">Start Your Digital Journey 🚀</h2>
                <p className="text-indigo-100 text-xs sm:text-sm max-w-2xl">
                  No setup fees. Experience full features – QR ordering, analytics, inventory and more.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Usage Summary */}
      {usageStats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white rounded-xl border border-slate-200 p-3 sm:p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 text-xs sm:text-sm">Orders</span>
              <TrendingUp className="h-4 w-4 text-indigo-500" />
            </div>
            <div className="text-xl sm:text-2xl font-bold text-slate-800 mt-0.5">
              {usageStats.ordersThisMonth}
            </div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-3 sm:p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 text-xs sm:text-sm">Staff</span>
              <Users className="h-4 w-4 text-indigo-500" />
            </div>
            <div className="text-xl sm:text-2xl font-bold text-slate-800 mt-0.5">
              {usageStats.totalStaff}
            </div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-3 sm:p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 text-xs sm:text-sm">Turnover</span>
              <Utensils className="h-4 w-4 text-indigo-500" />
            </div>
            <div className="text-xl sm:text-2xl font-bold text-slate-800 mt-0.5">
              {usageStats.tableTurnover}%
            </div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-3 sm:p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 text-xs sm:text-sm">Active Tables</span>
              <span className="text-xl">🍽️</span>
            </div>
            <div className="text-xl sm:text-2xl font-bold text-slate-800 mt-0.5">
              {usageStats.activeTables}
            </div>
          </div>
        </div>
      )}

      {/* Plans */}
      <div className="space-y-3">
        <div>
          <h2 className="text-lg sm:text-xl font-semibold text-slate-800">Choose Your Plan</h2>
          <p className="text-xs sm:text-sm text-slate-500">Flexible plans for your restaurant</p>
        </div>
        <div className="flex justify-center mb-4">
          <div className="inline-flex rounded-lg bg-slate-100 p-1">
            <button
              onClick={() => setBillingCycle("monthly")}
              className={`px-3 sm:px-5 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition ${billingCycle === "monthly"
                  ? "bg-white shadow text-slate-900"
                  : "text-slate-500"
                }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle("yearly")}
              className={`px-3 sm:px-5 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition ${billingCycle === "yearly"
                  ? "bg-white shadow text-slate-900"
                  : "text-slate-500"
                }`}
            >
              Yearly
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {plans.map((plan: any) => {
            const pricing = plan.pricing[billingCycle];
            const isPopular = plan.isPopular;
            const isCurrentPlan = subscription && subscription.plan === plan.code;

            return (
              <div
                key={plan.code}
                className={`relative bg-white rounded-xl border shadow-sm transition-all hover:shadow-md ${isPopular ? "border-indigo-300 ring-2 ring-indigo-100" : "border-slate-200"
                  } ${isCurrentPlan ? "ring-2 ring-emerald-500" : ""}`}
              >
                {isPopular && (
                  <div className="absolute -top-2 left-4 bg-indigo-600 text-white text-[10px] sm:text-xs font-semibold px-2.5 py-0.5 rounded-full shadow-sm">
                    Popular
                  </div>
                )}
                {isCurrentPlan && (
                  <div className="absolute -top-2 right-4 bg-emerald-600 text-white text-[10px] sm:text-xs font-semibold px-2.5 py-0.5 rounded-full shadow-sm">
                    Current
                  </div>
                )}
                <div className="p-4 sm:p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-lg sm:text-xl font-bold text-slate-800">{plan.name}</h3>
                      <p className="text-slate-500 text-xs mt-0.5">
                        {plan.description ||
                          (isPopular ? "Unlock all premium features" : "Essential features")}
                      </p>
                    </div>
                    <div className="bg-indigo-50 p-1.5 rounded-lg">
                      <Crown className={`h-4 w-4 ${isPopular ? "text-indigo-600" : "text-indigo-400"}`} />
                    </div>
                  </div>

                  <div className="mb-3">
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl sm:text-3xl font-bold text-slate-900">₹{pricing.amount}</span>
                      <span className="text-slate-500 text-xs sm:text-sm">/{pricing.label.toLowerCase()}</span>
                    </div>
                  </div>

                  <div className="space-y-1.5 mb-4">
                    {Object.entries(plan.features).map(([feature, enabled]: any) => (
                      <div key={feature} className="flex items-center gap-2 text-xs sm:text-sm">
                        <Check className={`h-3.5 w-3.5 ${enabled ? "text-emerald-500" : "text-slate-300"}`} />
                        <span
                          className={`capitalize ${enabled ? "text-slate-700" : "text-slate-400 line-through"
                            }`}
                        >
                          {feature.replace(/([A-Z])/g, " $1")}
                        </span>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => handleBuyPlan(plan.code, billingCycle)}
                    disabled={paymentLoading || isCurrentPlan}
                    className={`w-full py-2 rounded-lg font-medium transition flex items-center justify-center gap-1.5 text-xs sm:text-sm ${isCurrentPlan
                        ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                        : paymentLoading
                          ? "bg-indigo-600 hover:bg-indigo-700 text-white"
                          : "bg-slate-800 hover:bg-slate-900 text-white"
                      }`}
                  >
                    {paymentLoading ? (
                      <>
                        <Loader2 className="animate-spin h-3.5 w-3.5" />
                        Processing...
                      </>
                    ) : isCurrentPlan ? (
                      "Current Plan"
                    ) : (
                      <>
                        <CreditCard className="h-3.5 w-3.5" />
                        {subscription ? "Switch" : "Start Free Trial"}
                      </>
                    )}
                  </button>
                  {!isCurrentPlan && (
                    <div className="text-center text-[10px] sm:text-xs text-slate-400 mt-2">
                      14‑day free trial • Cancel anytime
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Invoice & Payment */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50">
            <h3 className="font-semibold text-slate-800 text-sm sm:text-base">Invoice History</h3>
          </div>
          <div className="divide-y divide-slate-100">
            {invoices.length === 0 ? (
              <div className="p-4 text-center text-slate-500 text-sm">No invoices found</div>
            ) : (
              invoices.map((inv) => (
                <div key={inv.id} className="flex items-center justify-between p-3 sm:p-4">
                  <div>
                    <div className="font-medium text-slate-800 text-sm sm:text-base">{inv.id}</div>
                    <div className="text-xs text-slate-500">{new Date(inv.date).toLocaleDateString()}</div>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="text-sm font-medium text-slate-800">{inv.amount}</div>
                    <span className="inline-flex px-2 py-0.5 rounded-full text-xs bg-emerald-100 text-emerald-800">
                      {inv.status}
                    </span>
                    <button className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500">
                      <Download className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="px-4 py-2 border-t border-slate-100 bg-slate-50/30 text-right">
            <button className="text-indigo-600 text-xs sm:text-sm font-medium hover:underline flex items-center gap-1 ml-auto">
              View All <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
            <h3 className="font-semibold text-slate-800 text-sm sm:text-base">Payment Methods</h3>
            <button className="text-indigo-600 text-xs sm:text-sm font-medium flex items-center gap-1 hover:underline">
              <Plus className="h-3.5 w-3.5" /> Add
            </button>
          </div>
          <div className="divide-y divide-slate-100">
            {paymentMethods.length === 0 ? (
              <div className="p-4 text-center text-slate-500 text-sm">No saved methods</div>
            ) : (
              paymentMethods.map((method) => (
                <div key={method.id} className="flex items-center justify-between p-3 sm:p-4">
                  <div className="flex items-center gap-3">
                    <Wallet className="h-4 w-4 text-slate-400" />
                    <div>
                      <div className="font-medium text-slate-800 text-sm sm:text-base">{method.type}</div>
                      <div className="text-xs text-slate-500">{method.details}</div>
                    </div>
                  </div>
                  {method.isDefault && (
                    <span className="text-[10px] sm:text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
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
      <div className="bg-white rounded-xl border border-slate-200 p-3 sm:p-4 text-center text-xs sm:text-sm text-slate-500">
        Need help?{" "}
        <a href="mailto:support@qrasoi.com" className="text-indigo-600 hover:underline">
          support@qrasoi.com
        </a>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}