"use client";

import { ReactNode, useEffect, useState } from "react";
import Sidebar from "@/components/layout/Sidebar";
import { useAuthStore } from "@/store/useAuthStore";

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { user } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  const [isMobileOrTablet, setIsMobileOrTablet] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  useEffect(() => {
    const check = () => {
      const width = window.innerWidth;
      setIsMobileOrTablet(width < 1024);
    };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  // 🔥 prevent render before hydration
  if (!mounted) return null;

  const role = user?.role?.toLowerCase();

  const showSidebar = role === "owner" || role === "manager";
  const showTopBar = isMobileOrTablet;
  // console.log("ROLE:", role, "SHOW SIDEBAR:", showSidebar);

  return (
    <div className="flex min-h-screen bg-gray-100">
      {showSidebar && <Sidebar />}

      <div className="flex-1 overflow-hidden">
        <main className={`transition-all ${showTopBar ? "pt-16" : "pt-0"} m-2`}>
          {children}
        </main>
      </div>
    </div>
  );
}
