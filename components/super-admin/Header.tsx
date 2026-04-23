"use client";

import {
  Bell,
  Search,
  ChevronDown,
  LogOut,
  Settings as SettingsIcon,
} from "lucide-react";
import { useState } from "react";

export default function Header({ collapsed, setCollapsed }: any) {
  const [showDropdown, setShowDropdown] = useState(false);

  return (
    <header className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm">
      <div className="px-4 md:px-6 py-3 flex items-center justify-between">
        {/* Search */}
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search restaurants..."
            className="pl-9 pr-4 py-2 rounded-lg bg-gray-100 border border-gray-200 text-gray-800 placeholder:text-gray-400 text-sm w-80 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-3">
          {/* Notification */}
          <button className="relative p-2 rounded-full hover:bg-gray-100 transition">
            <Bell size={20} className="text-gray-600" />
            <span className="absolute top-1 right-1 h-2 w-2 bg-amber-400 rounded-full"></span>
          </button>

          {/* Profile */}
          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-gray-100 transition"
            >
              <div className="h-8 w-8 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold">
                SA
              </div>
              <span className="text-sm font-medium text-gray-700">
                Super Admin
              </span>
              <ChevronDown size={16} className="text-gray-500" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
