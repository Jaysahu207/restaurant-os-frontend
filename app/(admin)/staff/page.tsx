"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  Phone,
  Mail,
  Clock,
  User,
  X,
  RefreshCw,
  Shield,
  Calendar,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  getStaffList,
  deleteStaff,
  createStaff,
  updateStaff, //
} from "@/services/staffService";
import { useAuthStore } from "@/store/useAuthStore";

// ==================== Types ====================
interface Staff {
  _id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  shift?: string;
  status?: string;
  permissions: string[];
  isActive: boolean;
  password?: string;
  restaurantId?: string;
  createdAt?: string;
  joinDate?: string;
}

interface StaffFormData {
  name: string;
  email: string;
  phone: string;
  role: string;
  shift: string;
  status: string;
  joinDate: string;
  permissions: string[];
  password: string;
  confirmPassword: string;
  restaurantId: string;
}

// ==================== Constants ====================
const PERMISSIONS = [
  { label: "View Orders", value: "view_orders" },
  { label: "Create Orders", value: "create_orders" },
  { label: "Update Order Status", value: "update_order_status" },
  { label: "Manage Menu", value: "manage_menu" },
  { label: "View Customers", value: "view_customers" },
  { label: "Manage Customers", value: "manage_customers" },
  { label: "Manage Staff", value: "manage_staff" },
  { label: "View Reports", value: "view_reports" },
];

const ROLE_PERMISSIONS: Record<string, string[]> = {
  Admin: [
    "view_orders",
    "create_orders",
    "update_order_status",
    "manage_menu",
    "view_customers",
    "manage_customers",
    "manage_staff",
    "view_reports",
  ],
  Manager: [
    "view_orders",
    "update_order_status",
    "manage_menu",
    "view_customers",
    "view_reports",
  ],
  Chef: ["view_orders", "update_order_status"],
  Waiter: ["view_orders", "create_orders"],
};

const ROLES = ["All", "Chef", "Waiter", "Manager", "Admin"];
const SHIFTS = ["morning ", "evening ", "general ", "night "];

const initialFormData: StaffFormData = {
  name: "",
  email: "",
  phone: "",
  role: "Waiter",
  shift: "morning",
  status: "active",
  joinDate: new Date().toISOString().split("T")[0],
  permissions: [],
  password: "",
  confirmPassword: "",
  restaurantId: "",
};

// ==================== Main Component ====================
export default function StaffPage() {
  const { restaurant } = useAuthStore();
  const [staff, setStaff] = useState<Staff[]>([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All"); // "All", "active", "inactive"
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [viewingStaff, setViewingStaff] = useState<Staff | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [staffToDelete, setStaffToDelete] = useState<string | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState<StaffFormData>(initialFormData);

  // Load staff
  const loadStaff = useCallback(async () => {
    if (!restaurant?._id) return;
    try {
      setLoading(true);
      const data = await getStaffList(restaurant._id);
      const normalized = data.map((s: any) => ({
        ...s,
        permissions: Array.isArray(s.permissions) ? s.permissions : [],
      }));
      setStaff(data);
    } catch (err) {
      toast.error("Failed to load staff members");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [restaurant?._id]);

  useEffect(() => {
    loadStaff();
  }, [loadStaff]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadStaff();
  };

  // Filter staff
  const filteredStaff = staff.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase()) ||
      s.phone.includes(search);
    const matchesRole = roleFilter === "All" || s.role === roleFilter;
    const matchesStatus =
      statusFilter === "All" ||
      (statusFilter === "active" && s.isActive) ||
      (statusFilter === "inactive" && !s.isActive);
    return matchesSearch && matchesRole && matchesStatus;
  });

  // Modal handlers
  const openAddModal = () => {
    setEditingStaff(null);
    setFormData({
      ...initialFormData,
      restaurantId: restaurant?._id || "",
      permissions: ROLE_PERMISSIONS["Waiter"] || [],
    });
    setIsModalOpen(true);
  };

  const openEditModal = (staffMember: Staff) => {
    setEditingStaff(staffMember);
    setFormData({
      name: staffMember.name,
      email: staffMember.email,
      phone: staffMember.phone,
      role: staffMember.role,
      shift: staffMember.shift || "morning",
      status: staffMember.isActive ? "active" : "inactive",
      joinDate: staffMember.joinDate || new Date().toISOString().split("T")[0],
      permissions: Array.isArray(staffMember.permissions)
        ? staffMember.permissions
        : [],
      password: "",
      confirmPassword: "",
      restaurantId: staffMember.restaurantId || restaurant?._id || "",
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingStaff(null);
  };

  const openViewModal = (staffMember: Staff) => {
    setViewingStaff(staffMember);
    setIsViewModalOpen(true);
  };

  const closeViewModal = () => {
    setIsViewModalOpen(false);
    setViewingStaff(null);
  };

  const handleDeleteClick = (id: string) => {
    setStaffToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!staffToDelete) return;
    try {
      await deleteStaff(staffToDelete);
      toast.success("Staff member deleted");
      loadStaff();
    } catch (err) {
      toast.error("Failed to delete staff member");
    } finally {
      setStaffToDelete(null);
      setDeleteConfirmOpen(false);
    }
  };

  const cancelDelete = () => {
    setStaffToDelete(null);
    setDeleteConfirmOpen(false);
  };

  // Form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.name || !formData.email || !formData.phone) {
      toast.error("Please fill all required fields");
      return;
    }
    if (!editingStaff && !formData.password) {
      toast.error("Password is required for new staff");
      return;
    }
    if (formData.password && formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setFormSubmitting(true);

    try {
      if (editingStaff) {
        console.log("editingStaff ->> ", editingStaff);
        // Editing existing staff
        const payload = {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          role: formData.role.toLowerCase(),
          shift: formData.shift,
          joinDate: formData.joinDate,
          status: formData.status,
          permissions: formData.permissions,
          restaurantId: formData.restaurantId,
          // Only include password if provided (for edit)
          ...(formData.password ? { password: formData.password } : {}),
        };
        console.log("Editing Staff id - >> ", editingStaff._id, payload);
        await updateStaff(editingStaff._id, payload);
        toast.success("Staff member updated successfully");
      } else {
        const payload = {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          role: formData.role.toLowerCase(),
          shift: formData.shift,
          joinDate: formData.joinDate,
          status: formData.status,
          permissions: formData.permissions,
          restaurantId: formData.restaurantId,
          password: formData.password, // Password is required for new staff
        };
        await createStaff(payload);
        console.log("Create new staff ->>", payload);
        toast.success("Staff member created successfully");
      }

      closeModal();
      loadStaff();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Operation failed");
    } finally {
      setFormSubmitting(false);
    }
  };

  // Clear filters
  const clearFilters = () => {
    setSearch("");
    setRoleFilter("All");
    setStatusFilter("All");
  };

  // Loading skeleton
  if (loading && !refreshing) {
    return <StaffSkeleton />;
  }

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Staff Management</h2>
          <p className="text-sm text-gray-500 mt-1">
            Manage your restaurant staff and their permissions
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw
              className={`w-5 h-5 ${refreshing ? "animate-spin" : ""}`}
            />
          </button>
          <button
            onClick={openAddModal}
            className="inline-flex items-center gap-2 bg-gradient-to-br from-orange-400 to-amber-500 text-white px-4 py-2 rounded-lg hover:shadow-md transition"
          >
            <Plus className="w-5 h-5" />
            Add Staff
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-800 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by name, email, or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-gray-800 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>
          <div className="sm:w-44">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg focus:ring-2 focus:ring-orange-500 bg-white"
            >
              {ROLES.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </div>
          <div className="sm:w-40">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-2.5 border text-gray-800 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 bg-white"
            >
              <option value="All">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
        {(search || roleFilter !== "All" || statusFilter !== "All") && (
          <div className="flex justify-end">
            <button
              onClick={clearFilters}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>

      {/* Staff Grid */}
      {filteredStaff.length === 0 ? (
        <div className="bg-white p-12 rounded-xl text-center shadow-sm border border-gray-100">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-800 mb-2">
              No staff members found
            </h3>
            <p className="text-gray-500">
              {search || roleFilter !== "All" || statusFilter !== "All"
                ? "Try adjusting your filters."
                : "Get started by adding your first staff member."}
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStaff.map((member) => (
            <StaffCard
              key={member._id}
              member={member}
              onView={() => openViewModal(member)}
              onEdit={() => openEditModal(member)}
              onDelete={() => handleDeleteClick(member._id)}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      {isModalOpen && (
        <StaffFormModal
          formData={formData}
          setFormData={setFormData}
          editingStaff={editingStaff}
          onClose={closeModal}
          onSubmit={handleSubmit}
          isSubmitting={formSubmitting}
        />
      )}

      {isViewModalOpen && viewingStaff && (
        <StaffViewModal staff={viewingStaff} onClose={closeViewModal} />
      )}

      {deleteConfirmOpen && (
        <DeleteConfirmationModal
          onConfirm={confirmDelete}
          onCancel={cancelDelete}
        />
      )}
    </div>
  );
}

// ==================== Staff Card Component ====================
function StaffCard({
  member,
  onView,
  onEdit,
  onDelete,
}: {
  member: Staff;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition p-5 border border-gray-100 group">
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center text-white font-semibold text-lg">
            {member.name.charAt(0).toUpperCase()}
          </div>
          <h3 className="text-lg font-semibold text-gray-800 truncate">
            {member.name}
          </h3>
        </div>
        <span
          className={`px-2 py-1 text-xs font-medium rounded-full ${
            member.isActive
              ? "bg-green-100 text-green-700"
              : "bg-gray-100 text-gray-700"
          }`}
        >
          {member.isActive ? "Active" : "Inactive"}
        </span>
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex items-center gap-2 text-gray-600">
          <Shield className="w-4 h-4 flex-shrink-0" />
          <span className="capitalize">{member.role}</span>
        </div>
        <div className="flex items-center gap-2 text-gray-600">
          <Mail className="w-4 h-4 flex-shrink-0" />
          <span className="truncate">{member.email}</span>
        </div>
        <div className="flex items-center gap-2 text-gray-600">
          <Phone className="w-4 h-4 flex-shrink-0" />
          <span>{member.phone}</span>
        </div>
        <div className="flex items-center gap-2 text-gray-600">
          <Clock className="w-4 h-4 flex-shrink-0" />
          <span className="truncate">{member.shift}</span>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t flex justify-end gap-2">
        <button
          onClick={onView}
          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
          title="View Details"
        >
          <Eye className="w-4 h-4" />
        </button>
        <button
          onClick={onEdit}
          className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
          title="Edit"
        >
          <Edit className="w-4 h-4" />
        </button>
        <button
          onClick={onDelete}
          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
          title="Delete"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ==================== Form Modal ====================
function StaffFormModal({
  formData,
  setFormData,
  editingStaff,
  onClose,
  onSubmit,
  isSubmitting,
}: {
  formData: StaffFormData;
  setFormData: React.Dispatch<React.SetStateAction<StaffFormData>>;
  editingStaff: Staff | null;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  isSubmitting: boolean;
}) {
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePermissionChange = (permission: string) => {
    setFormData((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(permission)
        ? prev.permissions.filter((p) => p !== permission)
        : [...prev.permissions, permission],
    }));
  };

  // Auto-assign permissions based on role when creating new staff
  useEffect(() => {
    if (!editingStaff && formData.role) {
      setFormData((prev) => ({
        ...prev,
        permissions: ROLE_PERMISSIONS[formData.role] || [],
      }));
    }
  }, [formData.role, editingStaff, setFormData]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="bg-white relative rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-800">
            {editingStaff ? "Edit Staff Member" : "Add New Staff"}
          </h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password {editingStaff ? "(leave blank to keep unchanged)" : "*"}
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder={editingStaff ? "••••••••" : ""}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Confirm Password
            </label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Role <span className="text-red-500">*</span>
            </label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="Chef">Chef</option>
              <option value="Waiter">Waiter</option>
              <option value="Manager">Manager</option>
              <option value="Admin">Admin</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Permissions
            </label>
            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1">
              {PERMISSIONS.map((perm) => (
                <label
                  key={perm.value}
                  className="flex items-center gap-2 text-sm text-gray-700"
                >
                  <input
                    type="checkbox"
                    checked={
                      Array.isArray(formData.permissions) &&
                      formData.permissions.includes(perm.value)
                    }
                    onChange={() => handlePermissionChange(perm.value)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  {perm.label}
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Shift <span className="text-red-500">*</span>
            </label>
            <select
              name="shift"
              value={formData.shift}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
            >
              {SHIFTS.map((shift) => (
                <option key={shift} value={shift}>
                  {shift}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Join Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              name="joinDate"
              value={formData.joinDate}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:shadow-md transition disabled:opacity-50 flex items-center gap-2"
            >
              {isSubmitting && <RefreshCw className="w-4 h-4 animate-spin" />}
              {editingStaff ? "Update" : "Add"} Staff
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ==================== View Modal ====================
function StaffViewModal({
  staff,
  onClose,
}: {
  staff: Staff;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="bg-white relative rounded-xl max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-lg font-semibold text-gray-800">Staff Details</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="flex justify-center mb-4">
            <div className="w-20 h-20 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 flex items-center justify-center text-white text-2xl font-bold">
              {staff.name.charAt(0).toUpperCase()}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Full Name</p>
              <p className="font-medium">{staff.name}</p>
            </div>
            <div>
              <p className="text-gray-500">Role</p>
              <p className="font-medium capitalize">{staff.role}</p>
            </div>
            <div>
              <p className="text-gray-500">Email</p>
              <p className="font-medium truncate">{staff.email}</p>
            </div>
            <div>
              <p className="text-gray-500">Phone</p>
              <p className="font-medium">{staff.phone}</p>
            </div>
            <div>
              <p className="text-gray-500">Shift</p>
              <p className="font-medium">{staff.shift}</p>
            </div>
            <div>
              <p className="text-gray-500">Join Date</p>
              <p className="font-medium">
                {staff.joinDate
                  ? new Date(staff.joinDate).toLocaleDateString()
                  : "—"}
              </p>
            </div>
            <div>
              <p className="text-gray-500">Status</p>
              <span
                className={`px-2 py-1 text-xs font-medium rounded-full ${
                  staff.isActive
                    ? "bg-green-100 text-green-700"
                    : "bg-gray-100 text-gray-700"
                }`}
              >
                {staff.isActive ? "Active" : "Inactive"}
              </span>
            </div>
          </div>

          {staff.permissions && staff.permissions.length > 0 && (
            <div className="border-t pt-4">
              <p className="text-sm font-medium text-gray-700 mb-2">
                Permissions
              </p>
              <div className="flex flex-wrap gap-1">
                {staff.permissions.map((perm) => (
                  <span
                    key={perm}
                    className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                  >
                    {perm.replace(/_/g, " ")}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="border-t p-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ==================== Delete Confirmation Modal ====================
function DeleteConfirmationModal({
  onConfirm,
  onCancel,
}: {
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onCancel} />
      <div className="bg-white relative rounded-xl max-w-sm w-full p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">
          Confirm Delete
        </h3>
        <p className="text-gray-600 mb-6">
          Are you sure you want to delete this staff member? This action cannot
          be undone.
        </p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// ==================== Loading Skeleton ====================
function StaffSkeleton() {
  return (
    <div className="space-y-6 p-4 md:p-6 max-w-7xl mx-auto animate-pulse">
      <div className="flex justify-between">
        <div className="h-8 w-48 bg-gray-200 rounded" />
        <div className="h-10 w-32 bg-gray-200 rounded-lg" />
      </div>
      <div className="bg-white p-4 rounded-xl shadow-sm">
        <div className="flex gap-4">
          <div className="flex-1 h-10 bg-gray-200 rounded-lg" />
          <div className="w-44 h-10 bg-gray-200 rounded-lg" />
          <div className="w-40 h-10 bg-gray-200 rounded-lg" />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white p-5 rounded-xl shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-gray-200" />
              <div className="h-5 w-32 bg-gray-200 rounded" />
            </div>
            <div className="space-y-2">
              <div className="h-4 w-full bg-gray-200 rounded" />
              <div className="h-4 w-3/4 bg-gray-200 rounded" />
              <div className="h-4 w-2/3 bg-gray-200 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
