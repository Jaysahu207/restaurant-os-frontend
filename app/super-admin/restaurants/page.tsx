"use client";

import { useState } from "react";
import { Plus, Search, Edit2, Trash2, MoreVertical } from "lucide-react";

const initialRestaurants = [
  {
    id: 1,
    name: "Pizza Paradise",
    owner: "John Doe",
    email: "john@paradise.com",
    plan: "Pro Annual",
    status: "active",
    joined: "2024-01-15",
  },
  {
    id: 2,
    name: "Sushi Master",
    owner: "Emma Lee",
    email: "emma@sushi.com",
    plan: "Enterprise",
    status: "active",
    joined: "2023-11-20",
  },
  {
    id: 3,
    name: "Burger House",
    owner: "Mike Ross",
    email: "mike@burger.com",
    plan: "Basic",
    status: "pending",
    joined: "2024-02-10",
  },
  {
    id: 4,
    name: "Vegan Delight",
    owner: "Sarah Kim",
    email: "sarah@vegan.com",
    plan: "Pro Monthly",
    status: "expired",
    joined: "2023-09-05",
  },
];

export default function RestaurantsPage() {
  const [restaurants, setRestaurants] = useState(initialRestaurants);
  const [search, setSearch] = useState("");

  const filtered = restaurants.filter(
    (r) =>
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.owner.toLowerCase().includes(search.toLowerCase()),
  );

  const getStatusBadge = (status: string) => {
    const styles = {
      active: "bg-emerald-100 text-emerald-700",
      pending: "bg-amber-100 text-amber-700",
      expired: "bg-rose-100 text-rose-700",
    };
    return `px-2 py-1 rounded-full text-xs font-medium ${styles[status as keyof typeof styles] || "bg-gray-100 text-gray-700"}`;
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Restaurants</h1>
          <p className="text-slate-500 text-sm">
            Manage all partner restaurants
          </p>
        </div>
        <button className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm transition text-sm font-medium">
          <Plus size={16} /> Add Restaurant
        </button>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name or owner..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg w-64 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>
        <div className="flex gap-2">
          <select className="border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white">
            <option>All Plans</option>
            <option>Basic</option>
            <option>Pro Monthly</option>
            <option>Pro Annual</option>
            <option>Enterprise</option>
          </select>
          <select className="border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white">
            <option>All Status</option>
            <option>Active</option>
            <option>Pending</option>
            <option>Expired</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-5 py-3 text-left text-slate-600 font-semibold">
                  Restaurant
                </th>
                <th className="px-5 py-3 text-left text-slate-600 font-semibold">
                  Owner / Email
                </th>
                <th className="px-5 py-3 text-left text-slate-600 font-semibold">
                  Plan
                </th>
                <th className="px-5 py-3 text-left text-slate-600 font-semibold">
                  Joined
                </th>
                <th className="px-5 py-3 text-left text-slate-600 font-semibold">
                  Status
                </th>
                <th className="px-5 py-3 text-right text-slate-600 font-semibold">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((restaurant) => (
                <tr
                  key={restaurant.id}
                  className="hover:bg-slate-50 transition"
                >
                  <td className="px-5 py-3 font-medium text-slate-800">
                    {restaurant.name}
                  </td>
                  <td className="px-5 py-3">
                    <div>{restaurant.owner}</div>
                    <div className="text-xs text-slate-400">
                      {restaurant.email}
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <span className="inline-flex items-center px-2 py-1 rounded-md bg-indigo-50 text-indigo-700 text-xs font-medium">
                      {restaurant.plan}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-slate-600">
                    {restaurant.joined}
                  </td>
                  <td className="px-5 py-3">
                    <span className={getStatusBadge(restaurant.status)}>
                      {restaurant.status.charAt(0).toUpperCase() +
                        restaurant.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500">
                        <Edit2 size={15} />
                      </button>
                      <button className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-500">
                        <Trash2 size={15} />
                      </button>
                      <button className="p-1.5 rounded-lg hover:bg-slate-100">
                        <MoreVertical size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="text-center py-12 text-slate-400">
            No restaurants found
          </div>
        )}
      </div>
    </div>
  );
}
