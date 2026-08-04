"use client";

import { useState, useEffect } from "react";
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
} from "lucide-react";
import toast from "react-hot-toast";
import { useAuthStore } from "@/store/useAuthStore";
import {
  useStaff,
  useCreateStaff,
  useUpdateStaff,
  useDeleteStaff,
  type Staff,
  type StaffPermissions,
} from "@/hooks/useStaff";

// ==================== Types ====================
interface StaffFormData {
  name: string;
  email: string;
  phone: string;
  role: string;
  shift: string;
  status: string;
  joinDate: string;
  permissions: StaffPermissions;
  password: string;
  confirmPassword: string;
  restaurantId: string;
}

// ==================== Constants ====================
const PERMISSIONS = [
  { label: "Create Orders", value: "canCreateOrder" },
  { label: "Update Order Status", value: "canUpdateOrder" },
  { label: "View Customers", value: "canViewCustomers" },
  { label: "Manage Menu", value: "canManageMenu" },
  { label: "Manage Staff", value: "canManageStaff" },
  { label: "View Analytics", value: "canViewAnalytics" },
];

const defaultPermissions: StaffPermissions = {
  canCreateOrder: true,
  canUpdateOrder: true,
  canViewCustomers: true,
  canManageMenu: false,
  canManageStaff: false,
  canViewAnalytics: false,
};

const ROLE_PERMISSIONS: Record<string, StaffPermissions> = {
  Admin: {
    canCreateOrder: true,
    canUpdateOrder: true,
    canViewCustomers: true,
    canManageMenu: true,
    canManageStaff: true,
    canViewAnalytics: true,
  },
  Manager: {
    canCreateOrder: true,
    canUpdateOrder: true,
    canViewCustomers: true,
    canManageMenu: true,
    canManageStaff: false,
    canViewAnalytics: true,
  },
  Chef: {
    canCreateOrder: false,
    canUpdateOrder: true,
    canViewCustomers: false,
    canManageMenu: false,
    canManageStaff: false,
    canViewAnalytics: false,
  },
  Waiter: {
    canCreateOrder: true,
    canUpdateOrder: false,
    canViewCustomers: true,
    canManageMenu: false,
    canManageStaff: false,
    canViewAnalytics: false,
  },
};

const ROLES = ["All", "Chef", "Waiter", "Manager", "Admin"];
const SHIFTS = ["morning", "evening", "general", "night"];

const initialFormData: StaffFormData = {
  name: "",
  email: "",
  phone: "",
  role: "Waiter",
  shift: "morning",
  status: "active",
  joinDate: new Date().toISOString().split("T")[0],
  permissions: defaultPermissions,
  password: "",
  confirmPassword: "",
  restaurantId: "",
};

// ==================== Main Component ====================
export default function StaffPage() {
  const { restaurant } = useAuthStore();
  const restaurantId = restaurant?._id;

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [viewingStaff, setViewingStaff] = useState<Staff | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [staffToDelete, setStaffToDelete] = useState<string | null>(null);

  const [formData, setFormData] = useState<StaffFormData>(initialFormData);

  const { data: staff = [], isLoading, isFetching, refetch } = useStaff(restaurantId);
  const createStaffMutation = useCreateStaff(restaurantId);
  const updateStaffMutation = useUpdateStaff(restaurantId);
  const deleteStaffMutation = useDeleteStaff(restaurantId);

  const handleRefresh = () => {
    refetch();
  };

  const filteredStaff = staff.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase()) ||
      s.phone.includes(search);
    const matchesRole =
      roleFilter === "All" || s.role.toLowerCase() === roleFilter.toLowerCase();
    const matchesStatus =
      statusFilter === "All" ||
      (statusFilter === "active" && s.isActive) ||
      (statusFilter === "inactive" && !s.isActive);
    return matchesSearch && matchesRole && matchesStatus;
  });

  const openAddModal = () => {
    setEditingStaff(null);
    setFormData({
      ...initialFormData,
      restaurantId: restaurantId || "",
      permissions: defaultPermissions,
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
      permissions: staffMember.permissions,
      password: "",
      confirmPassword: "",
      restaurantId: staffMember.restaurantId || restaurantId || "",
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

  const confirmDelete = () => {
    if (!staffToDelete) return;
    deleteStaffMutation.mutate(staffToDelete, {
      onSuccess: () => toast.success("Staff member deleted"),
      onError: () => toast.error("Failed to delete staff member"),
      onSettled: () => {
        setStaffToDelete(null);
        setDeleteConfirmOpen(false);
      },
    });
  };

  const cancelDelete = () => {
    setStaffToDelete(null);
    setDeleteConfirmOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

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

    try {
      if (editingStaff) {
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
          ...(formData.password ? { password: formData.password } : {}),
        };
        await updateStaffMutation.mutateAsync({ staffId: editingStaff._id, payload });
        toast.success("Staff member updated successfully");
      } else {
        const payload = {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          role: formData.role,
          shift: formData.shift,
          joinDate: formData.joinDate,
          status: formData.status,
          permissions: formData.permissions,
          restaurantId: formData.restaurantId,
          password: formData.password,
        };
        await createStaffMutation.mutateAsync(payload);
        toast.success("Staff member created successfully");
      }

      closeModal();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Operation failed");
    }
  };

  const clearFilters = () => {
    setSearch("");
    setRoleFilter("All");
    setStatusFilter("All");
  };

  const formSubmitting = createStaffMutation.isPending || updateStaffMutation.isPending;

  if (isLoading) {
    return <StaffSkeleton />;
  }

  return (
    <div className="space-y-4 p-3 sm:space-y-6 sm:p-4 md:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-lg font-bold text-gray-800 sm:text-xl md:text-2xl">Staff Management</h2>
          <p className="hidden text-sm text-gray-500 mt-1 sm:block">
            Manage your restaurant staff and their permissions
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <button
            onClick={handleRefresh}
            disabled={isFetching}
            className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg transition disabled:opacity-50 sm:p-2"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 sm:w-5 sm:h-5 ${isFetching ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={openAddModal}
            className="inline-flex items-center gap-1.5 bg-gradient-to-br from-orange-400 to-amber-500 text-white px-2.5 py-1.5 text-sm rounded-lg hover:shadow-md transition sm:gap-2 sm:px-4 sm:py-2"
          >
            <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="sm:hidden">Add</span>
            <span className="hidden sm:inline">Add Staff</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 space-y-3 sm:p-4 sm:space-y-4">
        <div className="flex flex-col gap-2.5 md:flex-row md:gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-800 w-4 h-4 sm:w-5 sm:h-5" />
            <input
              type="text"
              placeholder="Search by name, email, or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm text-gray-800 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent sm:pl-10 sm:py-2.5"
            />
          </div>
          <div className="flex gap-2.5 md:contents">
            <div className="flex-1 md:w-44 md:flex-none">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg focus:ring-2 focus:ring-orange-500 bg-white sm:px-4 sm:py-2.5"
              >
                {ROLES.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1 md:w-40 md:flex-none">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 text-sm border text-gray-800 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 bg-white sm:px-4 sm:py-2.5"
              >
                <option value="All">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
        </div>
        {(search || roleFilter !== "All" || statusFilter !== "All") && (
          <div className="flex justify-end">
            <button onClick={clearFilters} className="text-xs text-blue-600 hover:text-blue-800 sm:text-sm">
              Clear filters
            </button>
          </div>
        )}
      </div>

      {/* Staff Grid */}
      {filteredStaff.length === 0 ? (
        <div className="bg-white p-6 rounded-xl text-center shadow-sm border border-gray-100 sm:p-12">
          <div className="max-w-md mx-auto">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:w-16 sm:h-16 sm:mb-4">
              <User className="w-6 h-6 text-gray-400 sm:w-8 sm:h-8" />
            </div>
            <h3 className="text-base font-medium text-gray-800 mb-1.5 sm:text-lg sm:mb-2">No staff members found</h3>
            <p className="text-sm text-gray-500">
              {search || roleFilter !== "All" || statusFilter !== "All"
                ? "Try adjusting your filters."
                : "Get started by adding your first staff member."}
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 lg:gap-6">
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
        <DeleteConfirmationModal onConfirm={confirmDelete} onCancel={cancelDelete} />
      )}
    </div>
  );
}

// ==================== Staff Card =====================
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
    <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition p-3 border border-gray-100 group sm:p-5">
      <div className="flex justify-between items-start mb-2.5 sm:mb-3">
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <div className="w-8 h-8 shrink-0 rounded-full bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center text-white font-semibold text-sm sm:w-10 sm:h-10 sm:text-lg">
            {member.name.charAt(0).toUpperCase()}
          </div>
          <h3 className="text-sm font-semibold text-gray-800 truncate sm:text-lg">
            {member.name}
          </h3>
        </div>
        <span
          className={`shrink-0 px-1.5 py-0.5 text-[10px] font-medium rounded-full sm:px-2 sm:py-1 sm:text-xs ${member.isActive
            ? "bg-green-100 text-green-700"
            : "bg-gray-100 text-gray-700"
            }`}
        >
          {member.isActive ? "Active" : "Inactive"}
        </span>
      </div>

      <div className="space-y-1.5 text-xs sm:space-y-2 sm:text-sm">
        <div className="flex items-center gap-2 text-gray-600">
          <Shield className="w-3.5 h-3.5 flex-shrink-0 sm:w-4 sm:h-4" />
          <span className="capitalize">{member.role}</span>
        </div>
        <div className="flex items-center gap-2 text-gray-600">
          <Mail className="w-3.5 h-3.5 flex-shrink-0 sm:w-4 sm:h-4" />
          <span className="truncate">{member.email}</span>
        </div>
        <div className="flex items-center gap-2 text-gray-600">
          <Phone className="w-3.5 h-3.5 flex-shrink-0 sm:w-4 sm:h-4" />
          <span>{member.phone}</span>
        </div>
        <div className="flex items-center gap-2 text-gray-600">
          <Clock className="w-3.5 h-3.5 flex-shrink-0 sm:w-4 sm:h-4" />
          <span className="truncate">{member.shift}</span>
        </div>
      </div>

      <div className="mt-3 pt-2.5 border-t flex justify-end gap-1 sm:mt-4 sm:pt-3 sm:gap-2">
        <button
          onClick={onView}
          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition sm:p-2"
          title="View Details"
        >
          <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </button>
        <button
          onClick={onEdit}
          className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition sm:p-2"
          title="Edit"
        >
          <Edit className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </button>
        <button
          onClick={onDelete}
          className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition sm:p-2"
          title="Delete"
        >
          <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
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

  const handlePermissionChange = (permission: keyof StaffPermissions) => {
    setFormData((prev) => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [permission]: !prev.permissions[permission],
      },
    }));
  };

  // Auto-assign permissions based on role when creating new staff
  useEffect(() => {
    if (!editingStaff && formData.role) {
      setFormData((prev) => ({
        ...prev,
        permissions: ROLE_PERMISSIONS[formData.role] || defaultPermissions,
      }));
    }
  }, [formData.role, editingStaff, setFormData]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="bg-white relative rounded-t-2xl sm:rounded-xl max-w-md w-full max-h-[92vh] sm:max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-4 py-3 flex items-center justify-between sm:px-6 sm:py-4">
          <h3 className="text-base font-semibold text-gray-800 sm:text-lg">
            {editingStaff ? "Edit Staff Member" : "Add New Staff"}
          </h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="p-4 space-y-3 sm:p-6 sm:space-y-4">
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
              <option value="chef">Chef</option>
              <option value="waiter">Waiter</option>
              <option value="manager">Manager</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Permissions
            </label>
            <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto p-1 sm:grid-cols-2">
              {PERMISSIONS.map((perm) => (
                <label
                  key={perm.value}
                  className="flex items-center gap-2 text-sm text-gray-700"
                >
                  <input
                    type="checkbox"
                    checked={
                      formData.permissions[perm.value as keyof StaffPermissions]
                    }
                    onChange={() =>
                      handlePermissionChange(
                        perm.value as keyof StaffPermissions,
                      )
                    }
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

          <div className="flex flex-col-reverse gap-2 pt-3 sm:flex-row sm:justify-end sm:gap-3 sm:pt-4">
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
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:shadow-md transition disabled:opacity-50 flex items-center justify-center gap-2"
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
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="bg-white relative rounded-t-2xl sm:rounded-xl max-w-md w-full max-h-[92vh] sm:max-h-none overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b sm:p-6">
          <h3 className="text-base font-semibold text-gray-800 sm:text-lg">Staff Details</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-4 space-y-3 sm:p-6 sm:space-y-4">
          <div className="flex justify-center mb-2 sm:mb-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 flex items-center justify-center text-white text-xl font-bold sm:w-20 sm:h-20 sm:text-2xl">
              {staff.name.charAt(0).toUpperCase()}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs sm:gap-4 sm:text-sm">
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
                className={`px-2 py-1 text-xs font-medium rounded-full ${staff.isActive
                  ? "bg-green-100 text-green-700"
                  : "bg-gray-100 text-gray-700"
                  }`}
              >
                {staff.isActive ? "Active" : "Inactive"}
              </span>
            </div>
          </div>

          {staff.permissions && Object.keys(staff.permissions).length > 0 && (
            <div className="border-t pt-3 sm:pt-4">
              <p className="text-sm font-medium text-gray-700 mb-2">
                Permissions
              </p>
              <div className="flex flex-wrap gap-1">
                {Object.entries(staff.permissions)
                  .filter(([_, value]) => value)
                  .map(([key]) => (
                    <span
                      key={key}
                      className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                    >
                      {key.replace(/([A-Z])/g, " $1")}
                    </span>
                  ))}
              </div>
            </div>
          )}
        </div>

        <div className="border-t p-4 flex justify-end sm:p-6">
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
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onCancel} />
      <div className="bg-white relative rounded-t-2xl sm:rounded-xl max-w-sm w-full p-5 sm:p-6">
        <h3 className="text-base font-semibold text-gray-800 mb-2 sm:text-lg">
          Confirm Delete
        </h3>
        <p className="text-sm text-gray-600 mb-5 sm:mb-6">
          Are you sure you want to delete this staff member? This action cannot
          be undone.
        </p>
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-3">
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
    <div className="space-y-4 p-3 sm:space-y-6 sm:p-4 md:p-6 max-w-7xl mx-auto animate-pulse">
      <div className="flex justify-between">
        <div className="h-7 w-40 bg-gray-200 rounded sm:h-8 sm:w-48" />
        <div className="h-9 w-28 bg-gray-200 rounded-lg sm:h-10 sm:w-32" />
      </div>
      <div className="bg-white p-3 rounded-xl shadow-sm sm:p-4">
        <div className="flex flex-col gap-2.5 md:flex-row md:gap-4">
          <div className="flex-1 h-10 bg-gray-200 rounded-lg" />
          <div className="md:w-44 h-10 bg-gray-200 rounded-lg" />
          <div className="md:w-40 h-10 bg-gray-200 rounded-lg" />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 lg:gap-6">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white p-3 rounded-xl shadow-sm sm:p-5">
            <div className="flex items-center gap-2.5 mb-2.5 sm:gap-3 sm:mb-3">
              <div className="w-8 h-8 rounded-full bg-gray-200 sm:w-10 sm:h-10" />
              <div className="h-4 w-28 bg-gray-200 rounded sm:h-5 sm:w-32" />
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