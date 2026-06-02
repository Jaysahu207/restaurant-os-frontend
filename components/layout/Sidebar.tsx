"use client";

import { useEffect, useState } from "react";
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
  LogOut,
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
      { name: "Banners", icon: Star, path: "/banners" },
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
  {
    title: "Subscription",
    items: [{ name: "Subscription", icon: Star, path: "/subscription" }],
  },
];

export default function Sidebar() {
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [showTopBar, setShowTopBar] = useState(false);
  const pathname = usePathname();
  const { restaurant, user } = useAuthStore();
  const {
    sidebarCollapsed,
    sidebarMobileOpen,
    toggleSidebarCollapse,
    setSidebarCollapsed,
    setSidebarMobileOpen,
  } = useUIStore();

  // Handle responsive behavior
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const mobile = width < 768;
      const tablet = width >= 768 && width < 1024;
      setIsMobile(mobile);
      setIsTablet(tablet);

      if (mobile || tablet) {
        setSidebarCollapsed(false);
        setSidebarMobileOpen(false);
      } else {
        setSidebarMobileOpen(false);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [setSidebarCollapsed, setSidebarMobileOpen]);

  // Show top bar when on mobile/tablet and sidebar is closed
  useEffect(() => {
    setShowTopBar((isMobile || isTablet) && !sidebarMobileOpen);
  }, [isMobile, isTablet, sidebarMobileOpen]);

  const sidebarWidth = sidebarCollapsed ? "w-20" : "w-64";
  const isDesktop = !isMobile && !isTablet;

  const handleLinkClick = () => {
    if (isMobile || isTablet) {
      setSidebarMobileOpen(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    useAuthStore.setState({ user: null, token: null });
    window.location.href = "/";
  };

  return (
    <>
      {/* Mobile/Tablet Top Bar (appears when sidebar is closed) */}
      {showTopBar && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 shadow-sm px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => setSidebarMobileOpen(true)}
            className="p-2 rounded-xl hover:bg-gray-100 transition active:scale-95"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5 text-gray-700" />
          </button>
          <div className="flex items-center gap-2">
            {restaurant?.logo ? (
              <img
                src={restaurant.logo}
                alt="Logo"
                className="w-8 h-8 rounded-lg object-cover"
              />
            ) : (
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center text-white font-bold">
                {restaurant?.name?.charAt(0) || "R"}
              </div>
            )}
            <span className="font-semibold text-gray-800 truncate max-w-[150px]">
              {restaurant?.name || "Restaurant"}
            </span>
          </div>
          <div className="w-8" /> {/* spacer for balance */}
        </div>
      )}

      {/* Sidebar */}
      <aside
        className={`
          bg-white border-r border-gray-200 flex flex-col h-screen shadow-xl
          transition-all duration-300 ease-in-out
          ${sidebarWidth}
          ${isMobile || isTablet
            ? `
              fixed top-0 left-0 z-50
              ${sidebarMobileOpen ? "translate-x-0" : "-translate-x-full"}
            `
            : "sticky top-0"
          }
        `}
      >
        {/* Header with Logo & Toggle */}
        <div className="p-4 border-b border-gray-100">
          {sidebarCollapsed ? (
            <div className="flex flex-col items-center gap-3">
              <div
                className="w-12 h-12 rounded-2xl overflow-hidden shadow cursor-pointer transition hover:scale-105"
                onClick={toggleSidebarCollapse}
              >
                {restaurant?.logo ? (
                  <img
                    src={restaurant.logo}
                    alt={restaurant.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center text-white font-bold text-xl">
                    {restaurant?.name?.charAt(0) || "R"}
                  </div>
                )}
              </div>
              {isDesktop && (
                <button
                  onClick={toggleSidebarCollapse}
                  className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition"
                >
                  <ChevronRight size={18} />
                </button>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-12 h-12 rounded-2xl overflow-hidden shadow border flex-shrink-0">
                  {restaurant?.logo ? (
                    <img
                      src={restaurant.logo}
                      alt={restaurant.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center text-white font-bold text-lg">
                      {restaurant?.name?.charAt(0) || "R"}
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="font-bold text-gray-800 truncate">
                    {restaurant?.name || "Restaurant"}
                  </h2>
                  <p className="text-xs text-gray-500 truncate">
                    @{restaurant?.slug || "slug"}
                  </p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="text-xs text-emerald-600">Active</span>
                  </div>
                </div>
              </div>
              {isDesktop && (
                <button
                  onClick={toggleSidebarCollapse}
                  className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition"
                >
                  <ChevronLeft size={18} />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {menuSections.map((section) => (
            <div key={section.title}>
              {!sidebarCollapsed && (
                <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2 px-2">
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
                      onClick={handleLinkClick}
                      className={`
                        flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200
                        group relative
                        ${active
                          ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md"
                          : "text-gray-600 hover:bg-gray-100"
                        }
                        ${sidebarCollapsed ? "justify-center" : ""}
                      `}
                    >
                      <Icon size={20} className="flex-shrink-0" />
                      {!sidebarCollapsed && (
                        <span className="text-sm font-medium truncate">
                          {item.name}
                        </span>
                      )}
                      {/* Tooltip for collapsed mode */}
                      {sidebarCollapsed && (
                        <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-xs rounded-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50 pointer-events-none">
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

        {/* User Section & Logout */}
        <div className="border-t border-gray-100 p-4">
          {!sidebarCollapsed && user && (
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center text-white font-semibold shadow">
                {user?.name?.charAt(0) || "U"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-800 truncate">
                  {user?.name || "User"}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {user?.email || "email@example.com"}
                </p>
              </div>
            </div>
          )}

          <button
            onClick={handleLogout}
            className={`
              w-full py-2.5 rounded-xl font-medium transition-all duration-200
              flex items-center justify-center gap-2
              bg-gradient-to-r from-red-500 to-red-600 text-white hover:shadow-lg active:scale-95
              ${sidebarCollapsed ? "px-2" : "px-4"}
            `}
          >
            <LogOut size={18} />
            {!sidebarCollapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Backdrop for mobile/tablet */}
      {(isMobile || isTablet) && sidebarMobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300"
          onClick={() => setSidebarMobileOpen(false)}
        />
      )}
    </>
  );
}