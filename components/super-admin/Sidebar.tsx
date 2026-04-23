"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Store,
  CreditCard,
  BarChart3,
  Settings,
  LifeBuoy,
  Users,
  Menu,
  ChevronLeft,
  Crown,
} from "lucide-react";
// optional, you can implement simple div on hover

const menuItems = [
  { name: "Dashboard", icon: LayoutDashboard, href: "/super-admin/dashboard" },
  { name: "Restaurants", icon: Store, href: "/super-admin/restaurants" },
  {
    name: "Subscriptions",
    icon: CreditCard,
    href: "/super-admin/subscriptions",
  },
  { name: "Analytics", icon: BarChart3, href: "/super-admin/analytics" },
  { name: "Support Tickets", icon: LifeBuoy, href: "/super-admin/support" },
  { name: "Admin Users", icon: Users, href: "/super-admin/admins" },
  { name: "Settings", icon: Settings, href: "/super-admin/settings" },
];

export default function Sidebar({ collapsed, setCollapsed }: any) {
  const pathname = usePathname();

  return (
    <aside
      className={`bg-white border-r border-slate-200 shadow-sm transition-all duration-300 flex flex-col ${
        collapsed ? "w-20" : "w-64"
      }`}
    >
      {/* Logo Area */}
      <div className="flex items-center justify-between p-4 border-b border-slate-100 h-16">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <Crown className="h-6 w-6 text-indigo-600" />
            <span className="font-bold text-xl bg-gradient-to-r from-indigo-600 to-indigo-800 bg-clip-text text-transparent">
              SuperAdmin
            </span>
          </div>
        )}
        {collapsed && <Crown className="h-6 w-6 text-indigo-600 mx-auto" />}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-lg hover:bg-slate-100 transition text-slate-500"
        >
          {collapsed ? <Menu size={20} /> : <ChevronLeft size={20} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto">
        {menuItems.map((item) => {
          const isActive =
            pathname === item.href || pathname?.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group ${
                isActive
                  ? "bg-indigo-50 text-indigo-700 shadow-sm"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              } ${collapsed ? "justify-center" : ""}`}
            >
              <item.icon size={20} className="shrink-0" />
              {!collapsed && (
                <span className="font-medium text-sm">{item.name}</span>
              )}
              {collapsed && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none transition whitespace-nowrap z-50">
                  {item.name}
                </div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer (optional) */}
      <div className="p-3 border-t border-slate-100 text-xs text-slate-400 text-center">
        {!collapsed ? "v2.0 · Secure Admin" : "v2"}
      </div>
    </aside>
  );
}
