export const PLANS = {
    starter: {
        name: "Starter",

        price: 599,

        gstPercentage: 18,

        finalPrice: 707,

        trialDays: 14,

        features: {
            qrOrdering: true,
            billing: true,
            inventory: false,
            crm: false,
            analytics: false,
            marketing: false,
        },

        limits: {
            maxTables: 20,
            maxStaff: 5,
            maxMenuItems: 100,
        },
    },

    pro: {
        name: "Pro",

        price: 999,

        gstPercentage: 18,

        finalPrice: 1179,

        trialDays: 14,

        features: {
            qrOrdering: true,
            billing: true,
            inventory: true,
            crm: true,
            analytics: true,
            marketing: true,
        },

        limits: {
            maxTables: 100,
            maxStaff: 25,
            maxMenuItems: 1000,
        },
    },
};