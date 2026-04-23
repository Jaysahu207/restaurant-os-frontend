import { create } from "zustand";
import { persist } from "zustand/middleware";

interface CartItem {
    _id: string;
    name: string;
    price: number;
    quantity: number;
    variant?: string;
    addons?: { name: string; price: number }[];
}

interface CartStore {
    items: CartItem[];
    restaurantId: string | null;
    table: string | null;

    addItem: (item: CartItem, restaurantId: string, table: string) => void;
    removeItem: (id: string) => void;
    increaseQty: (id: string) => void;
    decreaseQty: (id: string) => void;
    clearCart: () => void;

    getTotal: () => number;
}

export const useCartStore = create<CartStore>()(
    persist(
        (set, get) => ({
            items: [],
            restaurantId: null,
            table: null,

            addItem: (item, restaurantId, table) => {
                const existing = get().items.find((i) => i._id === item._id);

                if (get().restaurantId && get().restaurantId !== restaurantId) {
                    return alert("You can't order from multiple restaurants");
                }

                if (existing) {
                    set({
                        items: get().items.map((i) =>
                            i._id === item._id
                                ? { ...i, quantity: i.quantity + 1 }
                                : i
                        ),
                    });
                } else {
                    set({
                        items: [...get().items, item],
                        restaurantId,
                        table,
                    });
                }
            },

            removeItem: (id) => {
                set({
                    items: get().items.filter((i) => i._id !== id),
                });
            },

            increaseQty: (id) => {
                set({
                    items: get().items.map((i) =>
                        i._id === id ? { ...i, quantity: i.quantity + 1 } : i
                    ),
                });
            },
            getItemCount: () => {
                return get().items.reduce((count, item) => count + item.quantity, 0);
            },

            decreaseQty: (id) => {
                set({
                    items: get().items
                        .map((i) =>
                            i._id === id
                                ? { ...i, quantity: i.quantity - 1 }
                                : i
                        )
                        .filter((i) => i.quantity > 0),
                });
            },

            clearCart: () => {
                set({
                    items: [],
                    restaurantId: null,
                    table: null,
                });
            },

            getTotal: () => {
                return get().items.reduce(
                    (total, item) => total + item.price * item.quantity,
                    0
                );
            },

        }),
        {
            name: "cart-storage",
        }
    )
);