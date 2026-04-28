// ==============================================
// SUBSCRIPTION SERVICE
// ==============================================

import API from "@/config/axios";


// ==================================================
// GET ALL AVAILABLE PLANS
// ==================================================
export const getPlans = async () => {
    const res = await API.get("/api/subscriptions/plans");
    // console.log(res.data);

    return res.data;
}

// ==================================================
// GET CURRENT RESTAURANT SUBSCRIPTION
// ==================================================
export const getMySubscription = async () => {
    const res = await API.get("/api/subscriptions/my-subscription");

    return res.data;
};

// ==================================================
// CREATE RAZORPAY ORDER
// ==================================================
export const createOrder = async (data: {
    planCode: string;
    billingCycle?: "monthly" | "yearly";
}) => {
    const res = await API.post(
        "/api/subscriptions/create-order",
        data,
    );
    

    return res.data;
};

// ==================================================
// VERIFY PAYMENT
// ==================================================
export const verifyPayment = async (data: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
    planCode: string;
    billingCycle?: string;
}) => {
    const res = await API.post(
        "/api/subscriptions/verify-payment",
        data,
    );

    return res.data;
};

// ==================================================
// CANCEL SUBSCRIPTION
// ==================================================
export const cancelSubscription = async () => {
    const res = await API.post(
        "/api/subscriptions/cancel",
    );

    return res.data;
};
// ==================================================
// UPGRADE SUBSCRIPTION
// ==================================================
export const upgradeSubscription = async (data: {
    planCode: string;
    billingCycle?: "monthly" | "yearly";
}) => {
    const res = await API.post(
        "/api/subscriptions/upgrade",
        data,
    );

    return res.data;
};

// ==================================================
// GET BILLING HISTORY
// ==================================================
export const getBillingHistory = async () => {
    const res = await API.get(
        "/api/subscriptions/billing-history",
    );

    return res.data;
};

// ==================================================
// DOWNLOAD INVOICE
// ==================================================
export const downloadInvoice = async (invoiceId: string) => {
    const res = await API.get(
        `/api/subscriptions/invoice/${invoiceId}`,
        {
            responseType: "blob",
        },
    );

    return res.data;
};

// ==================================================
// CHECK SUBSCRIPTION STATUS
// ==================================================
export const checkSubscriptionStatus = async () => {
    const res = await API.get(
        "/api/subscriptions/status",
    );

    return res.data;
};

// ==================================================
// ENABLE AUTO RENEW
// ==================================================
export const enableAutoRenew = async () => {
    const res = await API.patch(
        "/api/subscriptions/auto-renew",
        {
            autoRenew: true,
        },
    );

    return res.data;
};

// ==================================================
// DISABLE AUTO RENEW
// ==================================================
export const disableAutoRenew = async () => {
    const res = await API.patch(
        "/api/subscriptions/auto-renew",
        {
            autoRenew: false,
        },
    );

    return res.data;
};

// ==================================================
// GET PAYMENT METHODS
// ==================================================
export const getPaymentMethods = async () => {
    const res = await API.get(
        "/api/subscriptions/payment-methods",
    );

    return res.data;
};

// ==================================================
// APPLY COUPON CODE
// ==================================================
export const applyCoupon = async (couponCode: string) => {
    const res = await API.post(
        "/api/subscriptions/apply-coupon",
        {
            couponCode,
        },
    );

    return res.data;
};

// ==================================================
// START FREE TRIAL
// ==================================================
export const startFreeTrial = async (planCode: string) => {
    const res = await API.post(
        "/api/subscriptions/start-trial",
        {
            planCode,
        },
    );

    return res.data;
};

// ==================================================
// GET FEATURE ACCESS
// ==================================================
export const getFeatureAccess = async () => {
    const res = await API.get(
        "/api/subscriptions/features",
    );

    return res.data;
};

// ==================================================
// GET SUBSCRIPTION ANALYTICS
// ==================================================
export const getSubscriptionAnalytics = async () => {
    const res = await API.get(
        "/api/subscriptions/analytics",
    );

    return res.data;
}
