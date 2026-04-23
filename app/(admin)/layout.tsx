"use client";

import { ReactNode, useEffect, useState } from "react";
import Sidebar from "@/components/layout/Sidebar";
import { useAuthStore } from "@/store/useAuthStore";

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { user } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // 🔥 prevent render before hydration
  if (!mounted) return null;

  const role = user?.role?.toLowerCase();

  const showSidebar = role === "owner" || role === "manager";

  console.log("ROLE:", role, "SHOW SIDEBAR:", showSidebar);

  return (
    <div className="flex h-screen bg-gray-100">
      {showSidebar && <Sidebar />}

      <div className="flex-1 flex flex-col">
        <main className="p-4 flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
