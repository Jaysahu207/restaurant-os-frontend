"use client";

import { useState } from "react";
import {
  Bell,
  Search,
  ChevronDown,
  LogOut,
  Settings,
  User,
  Menu,
} from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { useUIStore } from "@/store/useUIStore";
import { useRouter } from "next/navigation";

export default function Header() {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const { user, logout } = useAuthStore();
  const { setSidebarMobileOpen, sidebarCollapsed } = useUIStore();
  const router = useRouter();

  const toggleUserMenu = () => setIsUserMenuOpen(!isUserMenuOpen);

  const handleLogout = () => {
    logout();
    setIsUserMenuOpen(false);
    router.push("/");
  };

  // Check if mobile
  const isMobile = typeof window !== "undefined" && window.innerWidth < 1024;

  return (
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-sm border-b border-gray-200 shadow-sm">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left section: Logo and mobile menu button */}
          <div className="flex items-center gap-4">
            {/* Show menu button only on mobile when sidebar is collapsed (hidden) */}
            {isMobile && sidebarCollapsed && (
              <button
                onClick={() => setSidebarMobileOpen(true)}
                className="p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="Open sidebar"
              >
                <Menu className="w-5 h-5" />
              </button>
            )}
            {/* <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Dashboard
            </h1> */}
          </div>

          {/* Middle section: Search bar */}
          {/* <div className="hidden md:flex flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search orders, customers..."
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white/50 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:text-sm"
              />
            </div>
          </div> */}

          {/* Right section: Notifications and user menu */}
          <div className="flex items-center gap-3">
            {/* <button className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
            </button> */}

            <div className="relative">
              <button
                onClick={toggleUserMenu}
                className="flex items-center gap-2 p-1 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 flex items-center justify-center text-white font-medium">
                  {user?.name?.charAt(0).toUpperCase() || "A"}
                </div>
                <span className="hidden sm:inline-block text-sm font-medium text-gray-700">
                  {user?.role?.toUpperCase() || "Admin"}
                </span>
                <ChevronDown className="hidden sm:block w-4 h-4 text-gray-500" />
              </button>

              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-1 ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      router.push("/profile");
                    }}
                    className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <User className="w-4 h-4" />
                    Profile
                  </button>
                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      router.push("/settings");
                    }}
                    className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <Settings className="w-4 h-4" />
                    Settings
                  </button>
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile search bar */}
      <div className="md:hidden px-4 pb-3">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search..."
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white/50 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:text-sm"
          />
        </div>
      </div>
    </header>
  );
}
