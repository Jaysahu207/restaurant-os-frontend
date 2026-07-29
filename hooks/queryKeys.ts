// src/lib/queryKeys.ts
export const queryKeys = {
    orders: (restaurantId: string, filters?: Record<string, unknown>) =>
        filters ? (["orders", restaurantId, filters] as const) : (["orders", restaurantId] as const),
    dashboard: (restaurantId: string) => ["dashboard", restaurantId] as const,
    kitchen: (restaurantId: string) => ["kitchen", restaurantId] as const,
};