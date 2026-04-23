"use client";

import { ReactNode, useState, useEffect } from "react";
import Sidebar from "@/components/super-admin/Sidebar";
import Header from "@/components/super-admin/Header";

export default function SuperAdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Load collapsed state from localStorage if needed
    const saved = localStorage.getItem("sidebar-collapsed");
    if (saved !== null) setCollapsed(saved === "true");
  }, []);

  useEffect(() => {
    if (mounted) localStorage.setItem("sidebar-collapsed", String(collapsed));
  }, [collapsed, mounted]);

  if (!mounted) return null;

  return (
    <div className="flex h-screen bg-gray-100 ">
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header collapsed={collapsed} setCollapsed={setCollapsed} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="animate-fade-in">{children}</div>
        </main>
      </div>
    </div>
  );
}
