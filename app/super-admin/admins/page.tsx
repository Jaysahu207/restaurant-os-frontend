// app/super-admin/admins/page.tsx
"use client";

import { useState } from "react";
import {
  Users,
  Shield,
  MoreVertical,
  Edit,
  Trash2,
  UserPlus,
  Mail,
  Phone,
  X,
  CheckCircle,
  XCircle,
  UserCog,
  Calendar,
} from "lucide-react";

// Mock admin data
const initialAdmins = [
  {
    id: 1,
    name: "John Smith",
    email: "john.smith@admin.com",
    phone: "+1 (555) 123-4567",
    role: "super_admin",
    status: "active",
    lastActive: "2024-01-15",
    avatar: "JS",
  },
  {
    id: 2,
    name: "Sarah Johnson",
    email: "sarah.j@admin.com",
    phone: "+1 (555) 234-5678",
    role: "admin",
    status: "active",
    lastActive: "2024-01-14",
    avatar: "SJ",
  },
  {
    id: 3,
    name: "Michael Chen",
    email: "michael.chen@admin.com",
    phone: "+1 (555) 345-6789",
    role: "support",
    status: "active",
    lastActive: "2024-01-13",
    avatar: "MC",
  },
  {
    id: 4,
    name: "Emily Davis",
    email: "emily.d@admin.com",
    phone: "+1 (555) 456-7890",
    role: "viewer",
    status: "inactive",
    lastActive: "2024-01-10",
    avatar: "ED",
  },
];

const roleColors = {
  super_admin: "bg-purple-100 text-purple-700 border-purple-200",
  admin: "bg-indigo-100 text-indigo-700 border-indigo-200",
  support: "bg-emerald-100 text-emerald-700 border-emerald-200",
  viewer: "bg-slate-100 text-slate-600 border-slate-200",
};

const roleLabels = {
  super_admin: "Super Admin",
  admin: "Admin",
  support: "Support",
  viewer: "Viewer",
};

const stats = [
  {
    title: "Total Admins",
    value: "24",
    icon: Users,
    change: "+3",
    color: "indigo",
  },
  {
    title: "Active Now",
    value: "8",
    icon: CheckCircle,
    change: "+2",
    color: "emerald",
  },
  {
    title: "Roles",
    value: "4",
    icon: Shield,
    change: "0",
    color: "purple",
  },
  {
    title: "Invitations Pending",
    value: "5",
    icon: Mail,
    change: "+1",
    color: "amber",
  },
];

export default function AdminsPage() {
  const [admins, setAdmins] = useState(initialAdmins);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    role: "admin",
    status: "active",
  });

  const filteredAdmins = admins.filter(
    (admin) =>
      admin.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      admin.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      admin.role.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this admin?")) {
      setAdmins(admins.filter((admin) => admin.id !== id));
    }
  };

  const handleToggleStatus = (id: number) => {
    setAdmins(
      admins.map((admin) =>
        admin.id === id
          ? {
              ...admin,
              status: admin.status === "active" ? "inactive" : "active",
            }
          : admin,
      ),
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingAdmin) {
      // Update existing
      setAdmins(
        admins.map((admin) =>
          admin.id === editingAdmin.id
            ? {
                ...admin,
                ...formData,
                avatar: formData.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase(),
              }
            : admin,
        ),
      );
    } else {
      // Add new
      const newAdmin = {
        id: Date.now(),
        ...formData,
        lastActive: new Date().toISOString().split("T")[0],
        avatar: formData.name
          .split(" ")
          .map((n) => n[0])
          .join("")
          .toUpperCase(),
      };
      setAdmins([newAdmin, ...admins]);
    }
    setShowModal(false);
    setEditingAdmin(null);
    setFormData({
      name: "",
      email: "",
      phone: "",
      role: "admin",
      status: "active",
    });
  };

  const openEditModal = (admin: any) => {
    setEditingAdmin(admin);
    setFormData({
      name: admin.name,
      email: admin.email,
      phone: admin.phone,
      role: admin.role,
      status: admin.status,
    });
    setShowModal(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold bg-gradient-to-r from-indigo-700 to-purple-700 bg-clip-text text-transparent">
          Admins Management
        </h1>
        <p className="text-slate-500 mt-1">
          Manage system administrators, roles, and permissions
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {stats.map((stat) => (
          <div
            key={stat.title}
            className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-all duration-200"
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-slate-500">{stat.title}</p>
                <p className="text-2xl font-bold text-slate-800 mt-1">
                  {stat.value}
                </p>
              </div>
              <div className="p-2 rounded-full bg-indigo-50">
                <stat.icon className="h-5 w-5 text-indigo-600" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                {stat.change}
              </span>
              <span className="text-xs text-slate-500 ml-2">vs last month</span>
            </div>
          </div>
        ))}
      </div>

      {/* Admins Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Table Header with Search & Add Button */}
        <div className="p-4 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white flex flex-col sm:flex-row justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <input
              type="text"
              placeholder="Search by name, email, or role..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-4 pr-4 py-2 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300"
            />
          </div>
          <button
            onClick={() => {
              setEditingAdmin(null);
              setFormData({
                name: "",
                email: "",
                phone: "",
                role: "admin",
                status: "active",
              });
              setShowModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition shadow-sm"
          >
            <UserPlus size={18} />
            Add Admin
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-700 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-left font-semibold">Admin</th>
                <th className="px-6 py-3 text-left font-semibold">Contact</th>
                <th className="px-6 py-3 text-left font-semibold">Role</th>
                <th className="px-6 py-3 text-left font-semibold">Status</th>
                <th className="px-6 py-3 text-left font-semibold">
                  Last Active
                </th>
                <th className="px-6 py-3 text-center font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAdmins.map((admin) => (
                <tr key={admin.id} className="hover:bg-slate-50 transition">
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                        {admin.avatar}
                      </div>
                      <div>
                        <p className="font-medium text-slate-800">
                          {admin.name}
                        </p>
                        <p className="text-xs text-slate-500">ID: {admin.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-3">
                    <div className="text-slate-600 text-sm">{admin.email}</div>
                    <div className="text-slate-400 text-xs flex items-center gap-1 mt-1">
                      <Phone size={12} /> {admin.phone}
                    </div>
                  </td>
                  <td className="px-6 py-3">
                    <span
                      className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold border ${
                        roleColors[admin.role as keyof typeof roleColors]
                      }`}
                    >
                      {roleLabels[admin.role as keyof typeof roleLabels]}
                    </span>
                  </td>
                  <td className="px-6 py-3">
                    <button
                      onClick={() => handleToggleStatus(admin.id)}
                      className="flex items-center gap-1"
                    >
                      {admin.status === "active" ? (
                        <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-1 rounded-full text-xs font-medium">
                          <CheckCircle size={12} /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-slate-500 bg-slate-100 px-2 py-1 rounded-full text-xs font-medium">
                          <XCircle size={12} /> Inactive
                        </span>
                      )}
                    </button>
                  </td>
                  <td className="px-6 py-3 text-slate-500 text-sm">
                    <div className="flex items-center gap-1">
                      <Calendar size={12} /> {admin.lastActive}
                    </div>
                  </td>
                  <td className="px-6 py-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => openEditModal(admin)}
                        className="p-1 rounded hover:bg-indigo-50 text-indigo-600 transition"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(admin.id)}
                        className="p-1 rounded hover:bg-rose-50 text-rose-500 transition"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredAdmins.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-8 text-center text-slate-500"
                  >
                    No admins found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Admin Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b border-slate-200 flex justify-between items-center bg-gradient-to-r from-indigo-50 to-purple-50">
              <h2 className="text-xl font-bold text-slate-800">
                {editingAdmin ? "Edit Admin" : "Add New Admin"}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 rounded-full hover:bg-slate-200 transition"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300"
                  placeholder="John Doe"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300"
                  placeholder="admin@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300"
                  placeholder="+1 (555) 000-0000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Role *
                </label>
                <select
                  value={formData.role}
                  onChange={(e) =>
                    setFormData({ ...formData, role: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option value="super_admin">Super Admin</option>
                  <option value="admin">Admin</option>
                  <option value="support">Support</option>
                  <option value="viewer">Viewer</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Status
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      value="active"
                      checked={formData.status === "active"}
                      onChange={(e) =>
                        setFormData({ ...formData, status: e.target.value })
                      }
                      className="text-indigo-600"
                    />
                    <span className="text-sm">Active</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      value="inactive"
                      checked={formData.status === "inactive"}
                      onChange={(e) =>
                        setFormData({ ...formData, status: e.target.value })
                      }
                      className="text-indigo-600"
                    />
                    <span className="text-sm">Inactive</span>
                  </label>
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                >
                  {editingAdmin ? "Update Admin" : "Add Admin"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
