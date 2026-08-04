"use client";

import { createContext, useContext, useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/store/useAuthStore";
import { useNotificationStore } from "@/store/useNotificationStore";
import toast from "react-hot-toast";

import {
  requestPermission,
  showBrowserNotification,
} from "@/utils/browserNotification";

// Adjust these two imports to match your actual project paths —
// they must be the SAME utilities the Orders page already uses,
// so cache keys and shapes line up exactly.
import { orderKeys } from "@/hooks/useOrders";

import { mapOrder, getISTDateString, Order } from "@/hooks/useOrders";

const SocketContext = createContext<Socket | null>(null);

export const useSocket = () => useContext(SocketContext);

export default function SocketProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const socketRef = useRef<Socket | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const { restaurant } = useAuthStore();
  const restaurantId = restaurant?._id;
  const queryClient = useQueryClient();

  const { addNotification, incrementOrders } = useNotificationStore();

  // ===========================
  // Browser Notification Permission
  // ===========================
  useEffect(() => {
    requestPermission();
  }, []);

  // ===========================
  // Preload + Unlock Audio
  // ===========================
  useEffect(() => {
    audioRef.current = new Audio("/sounds/new-order.mp3");
    audioRef.current.load();
  }, []);

  useEffect(() => {
    const unlockAudio = () => {
      if (!audioRef.current) return;
      audioRef.current
        .play()
        .then(() => {
          audioRef.current?.pause();
          if (audioRef.current) audioRef.current.currentTime = 0;
        })
        .catch(() => { });
      window.removeEventListener("pointerdown", unlockAudio);
    };
    window.addEventListener("pointerdown", unlockAudio);
    return () => window.removeEventListener("pointerdown", unlockAudio);
  }, []);

  const playNotification = () => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = 0;
    audioRef.current.play().catch(() => { });
  };

  // ===========================
  // Helper: update the orders cache for whichever date the order belongs to.
  // If that date's list isn't currently cached (e.g. owner never opened
  // Orders page for that date this session), we deliberately skip setQueryData
  // and invalidate instead — this avoids seeding a partial/fake cache entry
  // that would show stale data if the owner navigates there later.
  // ===========================
  const upsertOrderInCache = (rawOrder: any) => {
    if (!restaurantId) return;

    const orderDate = getISTDateString(new Date(rawOrder.createdAt));
    const key = orderKeys.list(restaurantId, orderDate);
    const existing = queryClient.getQueryData<any[]>(key);

    if (!existing) {
      // Nothing cached for this date yet — don't fabricate an entry,
      // just let the Orders page fetch fresh when it mounts for that date.
      queryClient.invalidateQueries({ queryKey: key });
      return;
    }

    const formattedOrder = mapOrder(rawOrder);

    queryClient.setQueryData<any[]>(key, (old) => {
      if (!old) return old;
      const exists = old.find((o) => o.id === formattedOrder.id);
      if (exists) {
        return old.map((o) => (o.id === formattedOrder.id ? formattedOrder : o));
      }
      return [formattedOrder, ...old];
    });
  };

  const upsertPaymentInCache = (updatedOrder: any) => {
    if (!restaurantId) return;

    const orderDate = getISTDateString(new Date(updatedOrder.createdAt));
    const key = orderKeys.list(restaurantId, orderDate);
    const existing = queryClient.getQueryData<any[]>(key);

    if (!existing) {
      queryClient.invalidateQueries({ queryKey: key });
      return;
    }

    queryClient.setQueryData<any[]>(key, (old) =>
      old?.map((order) =>
        order.id === String(updatedOrder._id)
          ? {
            ...order,
            paymentStatus: updatedOrder.paymentStatus,
            paymentMethod: updatedOrder.paymentMethod,
          }
          : order
      ) ?? old
    );
  };

  // ===========================
  // Socket Connection — the ONLY socket in the app
  // ===========================
  useEffect(() => {
    if (!restaurantId) return;

    const socket = io(process.env.NEXT_PUBLIC_API_URL!, {
      transports: ["websocket"],
      withCredentials: true,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      // console.log("🟢 Socket Connected");
      socket.emit("joinRestaurant", restaurantId);
    });

    socket.on("disconnect", () => {
      // console.log("🔴 Socket Disconnected");
    });

    socket.on("connect_error", (err) => {
      console.error("❌ Socket connection error:", err.message);
    });

    // ===========================
    // New Order
    // ===========================
    socket.on("NEW_ORDER", (order: any) => {
      upsertOrderInCache(order);
      playNotification();
      incrementOrders();

      const shortNum = order.orderNumber?.split("-").pop();

      addNotification({
        type: "new_order",
        title: "New Order",
        message: `Order #${shortNum}`,
        createdAt: new Date(),
      });

      toast.success(`New Order #${shortNum} Received`);

      showBrowserNotification("New Order Received", `Order #${shortNum}`);

      // Dashboard/Kitchen summary widgets aren't cache-patched here since
      // their shape differs from the orders list — invalidate so they
      // refetch next time they're viewed.
      queryClient.invalidateQueries({ queryKey: ["dashboard", restaurantId] });
      queryClient.invalidateQueries({ queryKey: ["kitchen", restaurantId] });
    });

    // ===========================
    // Order Updated
    // ===========================
    socket.on("ORDER_UPDATED", (order: any) => {
      upsertOrderInCache(order);
      playNotification();
      incrementOrders();

      const shortNum = order.orderNumber?.split("-").pop();

      addNotification({
        type: "order_updated",
        title: "Order Updated",
        message: `Order #${shortNum}`,
        createdAt: new Date(),
      });

      toast.success(`Order #${shortNum} Updated`);

      queryClient.invalidateQueries({ queryKey: ["kitchen", restaurantId] });
    });

    // ===========================
    // Payment Updated
    // ===========================
    socket.on("PAYMENT_UPDATED", (order: any) => {
      upsertPaymentInCache(order);
      playNotification();

      const shortNum = (order.orderNumber ?? order._id)?.slice(-3);

      addNotification({
        type: "payment_updated",
        title: "Payment Updated",
        message: `Order #${shortNum} — ${order.paymentStatus}`,
        createdAt: new Date(),
      });

      toast.success(`Payment received for order #${shortNum}`);

      queryClient.invalidateQueries({ queryKey: ["dashboard", restaurantId] });
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [restaurantId, queryClient]);

  return (
    <SocketContext.Provider value={socketRef.current}>
      {children}
    </SocketContext.Provider>
  );
}