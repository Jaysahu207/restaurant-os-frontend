"use client";

import { useEffect } from "react";
import {
  LayoutDashboard,
  Utensils,
  ClipboardList,
  Settings,
  QrCode,
  Users,
  UserCog,
  Package,
  Percent,
  Star,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Menu,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { useUIStore } from "@/store/useUIStore";

const menuSections = [
  {
    title: "Main",
    items: [
      { name: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
      { name: "Orders", icon: ClipboardList, path: "/orders" },
      { name: "Menu", icon: Utensils, path: "/menu" },
    ],
  },
  {
    title: "Management",
    items: [
      { name: "Tables & QR", icon: QrCode, path: "/tables" },
      { name: "Customers", icon: Users, path: "/customers" },
      { name: "Staff", icon: UserCog, path: "/staff" },
      { name: "Inventory", icon: Package, path: "/inventory" },
    ],
  },
  {
    title: "Marketing",
    items: [
      { name: "Promotions", icon: Percent, path: "/promotions" },
      { name: "Reviews", icon: Star, path: "/reviews" },
    ],
  },
  {
    title: "System",
    items: [
      { name: "Reports", icon: BarChart3, path: "/reports" },
      { name: "Settings", icon: Settings, path: "/settings" },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { restaurant, user } = useAuthStore();
  const {
    sidebarCollapsed,
    sidebarMobileOpen,
    toggleSidebarCollapse,
    setSidebarCollapsed,
    setSidebarMobileOpen,
  } = useUIStore();

  // Auto-collapse on mobile/tablet screens
  useEffect(() => {
    const handleResize = () => {
      const isMobile = window.innerWidth < 1024;
      if (isMobile) {
        setSidebarCollapsed(true);
        // Don't auto-open on resize, keep mobile open state as is
      } else {
        setSidebarMobileOpen(false); // Close mobile overlay on desktop
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [setSidebarCollapsed, setSidebarMobileOpen]);

  const isMobile = typeof window !== "undefined" && window.innerWidth < 1024;
  const sidebarWidth = sidebarCollapsed ? "w-20" : "w-64";

  // Close mobile sidebar when navigating
  const handleLinkClick = () => {
    if (isMobile) {
      setSidebarMobileOpen(false);
    }
  };
  const handleLogout = () => {
    // Clear auth state and redirect to login
    localStorage.removeItem("authToken");
    useAuthStore.setState({ user: null, token: null });
    window.location.href = "/";
  };

  return (
    <>
      {/* Mobile hamburger button - visible only when sidebar is collapsed on mobile */}
      {isMobile && sidebarCollapsed && !sidebarMobileOpen && (
        <button
          onClick={() => setSidebarMobileOpen(true)}
          className="fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-lg border border-gray-200 lg:hidden"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5 text-gray-700" />
        </button>
      )}

      {/* Sidebar */}
      <aside
        className={`${sidebarWidth} bg-white shadow-lg border-r flex flex-col h-screen transition-all duration-300 ease-in-out
          ${isMobile ? "fixed z-40" : "sticky top-0"}
          ${isMobile && !sidebarMobileOpen ? "-translate-x-full" : "translate-x-0"}
        `}
      >
        {/* Header with logo and toggle */}
        <div
          className={`p-4 flex items-center ${
            sidebarCollapsed ? "justify-center" : "justify-between"
          }`}
        >
          {!sidebarCollapsed ? (
            <>
              <div className="text-xl font-bold  bg-gradient-to-br from-orange-400 to-amber-400 bg-clip-text text-transparent truncate">
                🍽️ {restaurant?.name || "RestroOS"}
              </div>
              <button
                onClick={toggleSidebarCollapse}
                className="p-1.5 rounded-lg hover:bg-gray-100 transition"
                title="Collapse sidebar"
              >
                <ChevronLeft className="w-5 h-5 text-gray-500" />
              </button>
            </>
          ) : (
            <button
              onClick={toggleSidebarCollapse}
              className="p-2 rounded-lg hover:bg-gray-100 transition"
              title="Expand sidebar"
            >
              <ChevronRight className="w-5 h-5 text-gray-500" />
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-2 pb-6 space-y-6">
          {menuSections.map((section) => (
            <div key={section.title}>
              {!sidebarCollapsed && (
                <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2 px-3">
                  {section.title}
                </h4>
              )}
              <div className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const active = pathname === item.path;

                  return (
                    <Link
                      key={item.name}
                      href={item.path}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition relative group
                        ${
                          active
                            ? " bg-gradient-to-br from-orange-400 to-amber-400 text-white shadow-md"
                            : "text-gray-600 hover:bg-gray-100"
                        }
                        ${sidebarCollapsed ? "justify-center" : ""}
                      `}
                      onClick={handleLinkClick}
                    >
                      <Icon size={20} />
                      {!sidebarCollapsed && (
                        <span className="text-sm font-medium truncate">
                          {item.name}
                        </span>
                      )}
                      {sidebarCollapsed && (
                        <div className="absolute left-full ml-2 px-2 py-1 bg-gray-200 text-white text-xs rounded-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50">
                          {item.name}
                        </div>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* User info at bottom */}
        {!sidebarCollapsed && user && (
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-amber-400 flex items-center justify-center text-white text-sm font-medium">
                {user.name?.charAt(0) || "U"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-700 truncate">
                  {user.name}
                </p>
                <p className="text-xs text-gray-500 truncate">{user.email}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="mt-4 w-full bg-gradient-to-br from-orange-400 to-amber-400 text-white py-2 px-4 rounded-lg transition"
            >
              Logout
            </button>
          </div>
        )}

        {/* Mobile overlay backdrop */}
        {isMobile && sidebarMobileOpen && (
          <div
            className="fixed inset-0  z-30 lg:hidden"
            onClick={() => setSidebarMobileOpen(false)}
          />
        )}
      </aside>
    </>
  );
}
