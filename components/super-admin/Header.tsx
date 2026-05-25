"use client";

import {
  Bell,
  ChevronDown,
  LogOut,
  Settings as SettingsIcon,
} from "lucide-react";
import { useState } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { useRouter } from "next/navigation";
interface HeaderProps {
  collapsed: boolean;
  setCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
}
export default function Header({
  collapsed,
  setCollapsed,
}: HeaderProps) {
  const router = useRouter();

  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const [showDropdown, setShowDropdown] = useState(false);

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  const initial = user?.name?.charAt(0)?.toUpperCase() || "A";

  return (
    <header className="sticky top-0 z-20 bg-white border-b border-gray-200 shadow-sm">
      <div className="px-4 md:px-6 py-3 flex items-center justify-end">

        {/* RIGHT SIDE ACTIONS */}
        <div className="flex items-center gap-3">

          {/* Notifications */}
          <button className="relative p-2 rounded-full hover:bg-gray-100 transition">
            <Bell size={20} className="text-gray-600" />
            <span className="absolute top-1 right-1 h-2 w-2 bg-amber-400 rounded-full"></span>
          </button>

          {/* Profile Dropdown */}
          <div className="relative">

            {/* Trigger */}
            <button
              onClick={() => setShowDropdown((prev) => !prev)}
              className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-100 transition"
            >
              <div className="h-8 w-8 rounded-full bg-indigo-600 flex items-center justify-center text-white font-semibold">
                {initial}
              </div>

              <span className="text-sm font-medium text-gray-700 hidden sm:block">
                {user?.name || "User"}
              </span>

              <ChevronDown size={16} className="text-gray-500" />
            </button>

            {/* Dropdown */}
            {showDropdown && (
              <>
                {/* overlay */}
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowDropdown(false)}
                />

                <div className="absolute right-0 mt-2 w-52 bg-white border border-gray-200 rounded-xl shadow-lg z-20 overflow-hidden">

                  {/* User Info */}
                  <div className="px-4 py-3 border-b bg-gray-50">
                    <p className="text-sm font-semibold text-gray-800">
                      {user?.name}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {user?.email}
                    </p>
                  </div>

                  {/* Settings */}
                  <button
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => {
                      setShowDropdown(false);
                      router.push("/super-admin/settings");
                    }}
                  >
                    <SettingsIcon size={16} />
                    Settings
                  </button>

                  {/* Logout */}
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    <LogOut size={16} />
                    Logout
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}