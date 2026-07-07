import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface Notification {
    id: string;
    type: string;
    title: string;
    message: string;
    createdAt: Date;
    read: boolean;
}

interface State {
    unreadOrders: number;
    notifications: Notification[];

    incrementOrders: () => void;

    clearOrders: () => void;

    addNotification: (
        notification: Omit<
            Notification,
            "id" | "read"
        >
    ) => void;

    markAllAsRead: () => void;
}

export const useNotificationStore =
    create<State>()(
        persist(
            (set) => ({
                unreadOrders: 0,

                notifications: [],

                incrementOrders: () =>
                    set((state) => ({
                        unreadOrders:
                            state.unreadOrders + 1,
                    })),

                clearOrders: () =>
                    set({
                        unreadOrders: 0,
                    }),

                addNotification: (
                    notification
                ) =>
                    set((state) => ({
                        notifications: [
                            {
                                ...notification,
                                id: Date.now().toString(),
                                read: false,
                            },
                            ...state.notifications,
                        ],
                    })),

                markAllAsRead: () =>
                    set((state) => ({
                        notifications:
                            state.notifications.map(
                                (n) => ({
                                    ...n,
                                    read: true,
                                }),
                            ),
                        unreadOrders: 0,
                    })),
            }),
            {
                name: "qrasoi-notifications",
            },
        ),
    );