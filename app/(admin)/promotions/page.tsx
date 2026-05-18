"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Tag,
  Calendar,
  Percent,
  X,
  Filter,
  Eye,
  Mail,
  Check,
  Users,
  IndianRupee,
} from "lucide-react";
import API from "@/config/axios";
import toast from "react-hot-toast";
import { useAuthStore } from "@/store/useAuthStore";
import { getCustomers } from "@/services/customerDetail";
import {
  createPromotion,
  deletePromotion,
  getPromotions,
  updatePromotion,
  sendMarketingEmail,
} from "@/services/promotionService";

// Types
interface Promotion {
  _id: string;
  code: string;
  description: string;
  type: "percentage" | "fixed";
  value: number;
  minOrder: number;
  startDate: string;
  endDate: string;
  applicableTo: "all" | "category" | "specific";
  applicableValue: string | null;
  usageLimit: number;
  usedCount: number;
  status: "active" | "inactive" | "expired" | "scheduled";
}

interface Customer {
  _id: string;
  name: string;
  email: string;
  phone: string;
}

const statusOptions = ["All", "active", "expired", "scheduled"];
const typeOptions = ["All", "percentage", "fixed"];

export default function PromotionsPage() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPromo, setEditingPromo] = useState<Promotion | null>(null);
  const [viewingPromo, setViewingPromo] = useState<Promotion | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [promoToDelete, setPromoToDelete] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);

  // Customer states
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [customerSearch, setCustomerSearch] = useState("");
  const [selectedCustomers, setSelectedCustomers] = useState<Customer[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);

  // Email states
  const [selectedPromotionId, setSelectedPromotionId] = useState<string>("");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailMessage, setEmailMessage] = useState("");

  const { restaurant } = useAuthStore();

  // --- Promotions API Calls ---
  const fetchPromotions = useCallback(async () => {
    if (!restaurant?._id) return;
    setLoading(true);
    try {
      const promos = await getPromotions(restaurant._id);

      // Compute dynamic status based on dates
      const today = new Date().toISOString().split("T")[0];
      promos.map((p: Promotion) => {
        if (p.status === "active") {
          if (p.endDate < today) return { ...p, status: "expired" };
          if (p.startDate > today) return { ...p, status: "scheduled" };
        }
        return p;
      });
      setPromotions(promos);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load promotions");
    } finally {
      setLoading(false);
    }
  }, [restaurant?._id]);

  const handleCreatePromotion = async (data: any, restaurant: any) => {
    restaurant?._id && console.log(restaurant._id);

    await createPromotion(data);
    toast.success("Promotion created");
    await fetchPromotions();
    setIsModalOpen(false);
  };

  const handleUpdatePromotion = async (id: string, data: any) => {
    try {
      await updatePromotion(id, data);
      toast.success("Promotion updated");
      await fetchPromotions();
    } catch (err) {
      toast.error("Update failed");
      throw err;
    }
  };

  const handleDeletePromotion = async (id: string) => {
    try {
      await deletePromotion(id);
      toast.success("Promotion deleted");
      await fetchPromotions();
    } catch (err) {
      toast.error("Delete failed");
      throw err;
    }
  };

  // --- Customers loading & filtering ---
  const loadCustomers = useCallback(async () => {
    if (!restaurant?._id) return;
    setLoadingCustomers(true);
    try {
      const data = await getCustomers(restaurant._id, "", 1, 1000);
      setCustomers(data);
      setFilteredCustomers(data);
    } catch (err) {
      console.error(err);
      toast.error("Could not load customers");
    } finally {
      setLoadingCustomers(false);
    }
  }, [restaurant?._id]);

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  useEffect(() => {
    if (customerSearch.trim() === "") {
      setFilteredCustomers(customers);
    } else {
      const lower = customerSearch.toLowerCase();
      setFilteredCustomers(
        customers.filter(
          (c) =>
            c.name.toLowerCase().includes(lower) ||
            c.email.toLowerCase().includes(lower) ||
            c.phone.includes(lower),
        ),
      );
    }
  }, [customerSearch, customers]);

  // Select All / Clear All
  const handleSelectAll = () => {
    if (selectedCustomers.length === filteredCustomers.length) {
      setSelectedCustomers([]);
    } else {
      setSelectedCustomers([...filteredCustomers]);
    }
  };

  const toggleCustomer = (customer: Customer) => {
    if (selectedCustomers.find((c) => c._id === customer._id)) {
      setSelectedCustomers(
        selectedCustomers.filter((c) => c._id !== customer._id),
      );
    } else {
      setSelectedCustomers([...selectedCustomers, customer]);
    }
  };

  // --- Email sending with selected promotion & customers ---
  const handleSendPromotionEmail = async () => {
    if (!selectedPromotionId) {
      toast.error("Please select a promotion to send");
      return;
    }
    if (selectedCustomers.length === 0) {
      toast.error("Please select at least one customer");
      return;
    }
    if (!emailSubject.trim() || !emailMessage.trim()) {
      toast.error("Please fill in email subject and message");
      return;
    }

    const promo = promotions.find((p) => p._id === selectedPromotionId);
    if (!promo) {
      toast.error("Selected promotion not found");
      return;
    }

    setSendingEmail(true);
    try {
      await sendMarketingEmail({
        promotionId: promo._id,
        customerIds: selectedCustomers.map((c) => c._id),
        subject: emailSubject,
        message: emailMessage,
        restaurantId: restaurant?._id,
      });
      toast.success(
        `Promotion email sent to ${selectedCustomers.length} customer(s)!`,
      );
      // Optional: clear selection after send
      // setSelectedCustomers([]);
      // setEmailSubject("");
      // setEmailMessage("");
    } catch (err) {
      console.error(err);
      toast.error("Failed to send emails");
    } finally {
      setSendingEmail(false);
    }
  };

  // --- Promotion filter (local) ---
  const filteredPromotions = promotions.filter((promo) => {
    const matchesSearch =
      promo.code.toLowerCase().includes(search.toLowerCase()) ||
      promo.description.toLowerCase().includes(search.toLowerCase());
    const matchesStatus =
      statusFilter === "All" || promo.status === statusFilter;
    const matchesType = typeFilter === "All" || promo.type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  // --- Modal handlers ---
  const openAddModal = () => {
    setEditingPromo(null);
    setIsModalOpen(true);
  };

  const openEditModal = (promo: Promotion) => {
    setEditingPromo(promo);
    setIsModalOpen(true);
  };

  const handleDeleteClick = (id: string) => {
    setPromoToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (promoToDelete) {
      await deletePromotion(promoToDelete);
      setPromoToDelete(null);
      setDeleteConfirmOpen(false);
    }
  };

  const openViewModal = (promo: Promotion) => {
    setViewingPromo(promo);
    setIsViewModalOpen(true);
  };

  // Load promotions on mount
  useEffect(() => {
    fetchPromotions();
  }, [fetchPromotions]);

  // --- Helper: get discount display ---
  const getDiscountDisplay = (promo: Promotion) => {
    if (promo.type === "percentage") {
      return (
        <span className="flex items-center gap-1">
          {/* <Percent className="w-3 h-3" /> */}
          {promo.value}%
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1">
        <IndianRupee className="w-3 h-3" />₹{promo.value}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-2xl font-bold text-gray-800">
          Promotions & Offers
        </h2>
        <button
          onClick={openAddModal}
          className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2 rounded-lg hover:shadow-md transition"
        >
          <Plus className="w-5 h-5" />
          Add Promotion
        </button>
      </div>

      {/* Promotions Filters & Table */}
      <div className="bg-white p-4 rounded-xl shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by code or description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="sm:w-40 px-4 py-2 border border-gray-300 rounded-lg bg-white"
          >
            {statusOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt.charAt(0).toUpperCase() + opt.slice(1)}
              </option>
            ))}
          </select>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="sm:w-40 px-4 py-2 border border-gray-300 rounded-lg bg-white"
          >
            {typeOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt === "All"
                  ? "All Types"
                  : opt === "percentage"
                    ? "Percentage"
                    : "Fixed Amount"}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 📧 Send Promotion Section */}
      <div className="bg-white p-5 rounded-xl shadow-sm space-y-4 border border-gray-100">
        <div className="flex items-center gap-2 border-b pb-2">
          <Mail className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-800">
            Send Promotion to Customers
          </h3>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {/* Promotion Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select Promotion *
            </label>
            <select
              value={selectedPromotionId}
              onChange={(e) => setSelectedPromotionId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">-- Choose a promotion --</option>
              {promotions
                .filter((p) => p.status === "active")
                .map((promo) => (
                  <option key={promo._id} value={promo._id}>
                    {promo.code} - {promo.description} (
                    {promo.type === "percentage"
                      ? `${promo.value}%`
                      : `₹${promo.value}`}
                    )
                  </option>
                ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Subject *
            </label>
            <input
              type="text"
              placeholder="e.g. 🎉 Exclusive Offer Just for You!"
              value={emailSubject}
              onChange={(e) => setEmailSubject(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email Message *
          </label>
          <textarea
            placeholder="Write your promotion message... (You can use {code}, {discount}, {expiry} as placeholders)"
            value={emailMessage}
            onChange={(e) => setEmailMessage(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          />
          <p className="text-xs text-gray-400 mt-1">
            Tip: Use {"{code}"}, {"{discount}"}, {"{expiry}"} to auto‑insert
            promotion details.
          </p>
        </div>

        {/* Customer Selection with Search */}
        <div className="border rounded-lg p-4">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-gray-500" />
              <span className="font-medium">Select Customers</span>
              <span className="text-xs bg-gray-100 px-2 py-1 rounded-full">
                {selectedCustomers.length} selected
              </span>
            </div>
            <button
              type="button"
              onClick={handleSelectAll}
              className="text-sm text-blue-600 hover:underline flex items-center gap-1"
            >
              <Check className="w-3 h-3" />
              {selectedCustomers.length === filteredCustomers.length
                ? "Clear All"
                : "Select All"}
            </button>
          </div>

          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search by name, email or phone..."
              value={customerSearch}
              onChange={(e) => setCustomerSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 border border-gray-200 rounded-lg text-sm"
            />
          </div>

          {loadingCustomers ? (
            <div className="text-center py-4 text-gray-500">
              Loading customers...
            </div>
          ) : (
            <div className="max-h-48 overflow-y-auto border rounded-md divide-y">
              {filteredCustomers.length === 0 ? (
                <div className="p-3 text-center text-gray-400 text-sm">
                  No customers found
                </div>
              ) : (
                filteredCustomers.map((c) => (
                  <label
                    key={c._id}
                    className="flex items-center gap-2 p-2 hover:bg-gray-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={
                        !!selectedCustomers.find((sc) => sc._id === c._id)
                      }
                      onChange={() => toggleCustomer(c)}
                      className="rounded border-gray-300"
                    />
                    <div className="text-sm">
                      <p className="font-medium">{c.name}</p>
                      <p className="text-xs text-gray-500">
                        {c.email} | {c.phone}
                      </p>
                    </div>
                  </label>
                ))
              )}
            </div>
          )}
        </div>

        <button
          onClick={handleSendPromotionEmail}
          disabled={
            sendingEmail ||
            !selectedPromotionId ||
            selectedCustomers.length === 0
          }
          className="w-full bg-green-600 text-white py-2.5 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
        >
          {sendingEmail ? (
            <>Sending...</>
          ) : (
            <>
              <Mail className="w-4 h-4" /> Send to {selectedCustomers.length}{" "}
              Customer(s) 🚀
            </>
          )}
        </button>
      </div>

      {/* Promotions Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="px-4 py-3 text-left">Code</th>
                <th className="px-4 py-3 text-left">Description</th>
                <th className="px-4 py-3 text-left">Discount</th>
                <th className="px-4 py-3 text-left">Min Order</th>
                <th className="px-4 py-3 text-left">Valid From</th>
                <th className="px-4 py-3 text-left">Valid To</th>
                <th className="px-4 py-3 text-left">Usage</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td
                    colSpan={9}
                    className="px-4 py-8 text-center text-gray-500"
                  >
                    Loading promotions...
                  </td>
                </tr>
              ) : filteredPromotions.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    className="px-4 py-8 text-center text-gray-500"
                  >
                    No promotions found.
                  </td>
                </tr>
              ) : (
                filteredPromotions.map((promo) => {
                  const statusColor =
                    promo.status === "active"
                      ? "bg-green-100 text-green-700"
                      : promo.status === "scheduled"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-gray-100 text-gray-700";
                  return (
                    <tr key={promo._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-800">
                        {promo.code}
                      </td>
                      <td className="px-4 py-3 text-gray-600 max-w-xs truncate">
                        {promo.description}
                      </td>
                      <td className="px-4 py-3">{getDiscountDisplay(promo)}</td>
                      <td className="px-4 py-3">₹{promo.minOrder}</td>
                      <td className="px-4 py-3">{promo.startDate}</td>
                      <td className="px-4 py-3">{promo.endDate}</td>
                      <td className="px-4 py-3">
                        {promo.usedCount}/{promo.usageLimit}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${statusColor}`}
                        >
                          {promo.status.charAt(0).toUpperCase() +
                            promo.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openViewModal(promo)}
                            className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                            title="View"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openEditModal(promo)}
                            className="p-1 text-indigo-600 hover:bg-indigo-50 rounded"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(promo._id)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals (Form, View, Delete) - pass real handlers */}
      {isModalOpen && (
        <PromoFormModal
          editingPromo={editingPromo}
          onClose={() => setIsModalOpen(false)}
          onSubmit={async (formData: any) => {
            if (editingPromo) {
              await handleUpdatePromotion(editingPromo._id, formData);
            } else {
              await handleCreatePromotion(formData , restaurant);
            }
            setIsModalOpen(false);
          }}
        />
      )}

      {isViewModalOpen && viewingPromo && (
        <PromoViewModal
          promo={viewingPromo}
          onClose={() => setIsViewModalOpen(false)}
        />
      )}

      {deleteConfirmOpen && (
        <DeleteConfirmationModal
          onConfirm={confirmDelete}
          onCancel={() => setDeleteConfirmOpen(false)}
        />
      )}
    </div>
  );
}

// ------------------ MODAL COMPONENTS (simplified but functional) ------------------
function PromoFormModal({ editingPromo, onClose, onSubmit }: any) {
  const [formData, setFormData] = useState({
    code: editingPromo?.code || "",
    description: editingPromo?.description || "",
    type: editingPromo?.type || "percentage",
    value: editingPromo?.value || "",
    minOrder: editingPromo?.minOrder || "",
    startDate: editingPromo?.startDate || "",
    endDate: editingPromo?.endDate || "",
    applicableTo: editingPromo?.applicableTo || "all",
    applicableValue: editingPromo?.applicableValue || "",
    usageLimit: editingPromo?.usageLimit || "",
    status: editingPromo?.status || "active",
    restaurantId: editingPromo?.restaurantId || "",
  });

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      value: parseFloat(formData.value),
      minOrder: parseFloat(formData.minOrder) || 0,
      usageLimit: parseInt(formData.usageLimit) || 0,
      applicableValue:
        formData.applicableTo !== "all" ? formData.applicableValue : null,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-md bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b">
          <h3 className="text-lg font-semibold">
            {editingPromo ? "Edit Promotion" : "Add Promotion"}
          </h3>
          <button onClick={onClose}>
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Form fields same as original but simplified for brevity; keep the structure */}
          <div>
            <label>Promo Code *</label>
            <input
              name="code"
              value={formData.code}
              onChange={handleChange}
              required
              className="w-full border rounded-lg p-2"
            />
          </div>
          <div>
            <label>Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={2}
              className="w-full border rounded-lg p-2"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label>Type</label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="w-full border rounded-lg p-2"
              >
                <option value="percentage">Percentage</option>
                <option value="fixed">Fixed Amount</option>
              </select>
            </div>
            <div>
              <label>Value *</label>
              <input
                type="number"
                name="value"
                value={formData.value}
                onChange={handleChange}
                required
                className="w-full border rounded-lg p-2"
              />
            </div>
          </div>
          <div>
            <label>Min Order (₹)</label>
            <input
              type="number"
              name="minOrder"
              value={formData.minOrder}
              onChange={handleChange}
              className="w-full border rounded-lg p-2"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label>Start Date</label>
              <input
                type="date"
                name="startDate"
                value={formData.startDate}
                onChange={handleChange}
                required
                className="w-full border rounded-lg p-2"
              />
            </div>
            <div>
              <label>End Date</label>
              <input
                type="date"
                name="endDate"
                value={formData.endDate}
                onChange={handleChange}
                required
                className="w-full border rounded-lg p-2"
              />
            </div>
          </div>
          <div>
            <label>Applicable To</label>
            <select
              name="applicableTo"
              value={formData.applicableTo}
              onChange={handleChange}
              className="w-full border rounded-lg p-2"
            >
              <option value="all">All Items</option>
              <option value="category">Category</option>
              <option value="specific">Specific Item</option>
            </select>
          </div>
          {formData.applicableTo !== "all" && (
            <div>
              <label>
                {formData.applicableTo === "category"
                  ? "Category Name"
                  : "Item Name"}
              </label>
              <input
                type="text"
                name="applicableValue"
                value={formData.applicableValue}
                onChange={handleChange}
                required
                className="w-full border rounded-lg p-2"
              />
            </div>
          )}
          <div>
            <label>Usage Limit</label>
            <input
              type="number"
              name="usageLimit"
              value={formData.usageLimit}
              onChange={handleChange}
              className="w-full border rounded-lg p-2"
            />
          </div>
          <div>
            <label>Status</label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full border rounded-lg p-2"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function PromoViewModal({ promo, onClose }: any) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-lg w-full">
        <div className="flex justify-between p-6 border-b">
          <h3 className="font-semibold">Promotion Details</h3>
          <button onClick={onClose}>
            <X />
          </button>
        </div>
        <div className="p-6 space-y-3">
          <div>
            <p className="text-gray-500">Code</p>
            <p className="font-bold text-xl">{promo.code}</p>
          </div>
          <div>
            <p className="text-gray-500">Description</p>
            <p>{promo.description || "—"}</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-gray-500">Discount</p>
              <p>
                {promo.type === "percentage"
                  ? `${promo.value}%`
                  : `₹${promo.value}`}
              </p>
            </div>
            <div>
              <p className="text-gray-500">Min. Order</p>
              <p>₹{promo.minOrder}</p>
            </div>
            <div>
              <p className="text-gray-500">Valid From</p>
              <p>{promo.startDate}</p>
            </div>
            <div>
              <p className="text-gray-500">Valid To</p>
              <p>{promo.endDate}</p>
            </div>
            <div>
              <p className="text-gray-500">Applicable</p>
              <p>
                {promo.applicableTo === "all"
                  ? "All items"
                  : promo.applicableTo === "category"
                    ? `Category: ${promo.applicableValue}`
                    : `Item: ${promo.applicableValue}`}
              </p>
            </div>
            <div>
              <p className="text-gray-500">Usage</p>
              <p>
                {promo.usedCount} / {promo.usageLimit || "∞"}
              </p>
            </div>
          </div>
        </div>
        <div className="border-t p-6 flex justify-end">
          <button onClick={onClose} className="px-4 py-2 border rounded-lg">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function DeleteConfirmationModal({ onConfirm, onCancel }: any) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-sm w-full p-6">
        <h3 className="text-lg font-semibold">Confirm Delete</h3>
        <p className="text-gray-600 my-4">
          Are you sure you want to delete this promotion?
        </p>
        <div className="flex justify-end gap-3">
          <button onClick={onCancel} className="px-4 py-2 border rounded-lg">
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-red-600 text-white rounded-lg"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
