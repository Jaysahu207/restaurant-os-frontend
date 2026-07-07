"use client";

import { createContext, useContext, useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { useAuthStore } from "@/store/useAuthStore";
import toast from "react-hot-toast";
import { useNotificationStore } from "@/store/useNotificationStore";

import {
  requestPermission,
  showBrowserNotification,
} from "@/utils/browserNotification";

const SocketContext = createContext<Socket | null>(null);

export const useSocket = () => useContext(SocketContext);

export default function SocketProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const socketRef = useRef<Socket | null>(null);

  const { restaurant } = useAuthStore();

  const { addNotification, incrementOrders } = useNotificationStore();
  useEffect(() => {
    requestPermission();
  }, []);
  useEffect(() => {
    if (!restaurant?._id) return;

    const socket = io(process.env.NEXT_PUBLIC_API_URL!, {
      transports: ["websocket"],
      withCredentials: true,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      // console.log("🟢 Connected");

      socket.emit("joinRestaurant", restaurant._id);
    });

    socket.on("NEW_ORDER", (order) => {
      playNotification();

      incrementOrders();

      addNotification({
        type: "new_order",
        title: "New Order",
        message: `Table ${order.orderNumber}`,
        createdAt: new Date(),
      });
      toast.success(`New Order Table ${order.orderNumber.slice(3)}`);

      showBrowserNotification(
        "New Order Received",
        `Table ${order.orderNumber.slice(3)}`,
      );
    });

    socket.on("ORDER_UPDATED", (order) => {
      playNotification();
      incrementOrders();

      addNotification({
        type: "order_updated",
        title: "Order Updated",
        message: `Table ${order.orderNumber}`,
        createdAt: new Date(),
      });
      toast.success(`Order Updated ${order.orderNumber.slice(3)}`);
    });

    return () => {
      socket.disconnect();
    };
  }, [restaurant?._id]);

  return (
    <SocketContext.Provider value={socketRef.current}>
      {children}
    </SocketContext.Provider>
  );
}

function playNotification() {
  const audio = new Audio("/sounds/order-placed.mp3");
  audio.load();
  audio.play().catch(() => {});
}
