"use client";

import { useState } from "react";
import {
    Plus,
    Search,
    Edit,
    Trash2,
    Tag,
    Calendar,
    Percent,
    DollarSign,
    X,
    Filter,
    Eye,
} from "lucide-react";

// Mock promotions data (replace with API)
const initialPromotions = [
    {
        id: 1,
        code: "WELCOME10",
        description: "10% off on first order",
        type: "percentage", // percentage or fixed
        value: 10,
        minOrder: 100,
        startDate: "2025-03-01",
        endDate: "2025-04-30",
        applicableTo: "all", // all, category, specific items
        applicableValue: null, // category name or item IDs if specific
        usageLimit: 100,
        usedCount: 45,
        status: "active",
    },
    {
        id: 2,
        code: "FLAT50",
        description: "Flat ₹50 off on orders above ₹300",
        type: "fixed",
        value: 50,
        minOrder: 300,
        startDate: "2025-03-15",
        endDate: "2025-05-15",
        applicableTo: "all",
        applicableValue: null,
        usageLimit: 200,
        usedCount: 78,
        status: "active",
    },
    {
        id: 3,
        code: "SUMMER25",
        description: "25% off on all drinks",
        type: "percentage",
        value: 25,
        minOrder: 0,
        startDate: "2025-04-01",
        endDate: "2025-06-30",
        applicableTo: "category",
        applicableValue: "Drinks",
        usageLimit: 500,
        usedCount: 120,
        status: "active",
    },
    {
        id: 4,
        code: "FREEPIZZA",
        description: "Free pizza on orders above ₹500",
        type: "fixed",
        value: 0, // Special: free item? We'll keep simple for now
        minOrder: 500,
        startDate: "2025-03-10",
        endDate: "2025-03-25",
        applicableTo: "specific",
        applicableValue: "Margherita Pizza",
        usageLimit: 50,
        usedCount: 50,
        status: "expired",
    },
];

// Filter options
const statusOptions = ["All", "active", "expired", "scheduled"];
const typeOptions = ["All", "percentage", "fixed"];

export default function PromotionsPage() {
    const [promotions, setPromotions] = useState(initialPromotions);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");
    const [typeFilter, setTypeFilter] = useState("All");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPromo, setEditingPromo] = useState<any>(null);
    const [viewingPromo, setViewingPromo] = useState<any>(null);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [promoToDelete, setPromoToDelete] = useState<number | null>(null);

    // Form state for add/edit
    const [formData, setFormData] = useState({
        code: "",
        description: "",
        type: "percentage",
        value: "",
        minOrder: "",
        startDate: "",
        endDate: "",
        applicableTo: "all",
        applicableValue: "",
        usageLimit: "",
        status: "active",
    });

    // Filter promotions
    const filteredPromotions = promotions.filter((promo) => {
        const matchesSearch =
            promo.code.toLowerCase().includes(search.toLowerCase()) ||
            promo.description.toLowerCase().includes(search.toLowerCase());
        const matchesStatus =
            statusFilter === "All" || promo.status === statusFilter;
        const matchesType = typeFilter === "All" || promo.type === typeFilter;
        return matchesSearch && matchesStatus && matchesType;
    });

    // Modal handlers
    const openAddModal = () => {
        setEditingPromo(null);
        setFormData({
            code: "",
            description: "",
            type: "percentage",
            value: "",
            minOrder: "",
            startDate: "",
            endDate: "",
            applicableTo: "all",
            applicableValue: "",
            usageLimit: "",
            status: "active",
        });
        setIsModalOpen(true);
    };

    const openEditModal = (promo: any) => {
        setEditingPromo(promo);
        setFormData({
            code: promo.code,
            description: promo.description,
            type: promo.type,
            value: promo.value.toString(),
            minOrder: promo.minOrder.toString(),
            startDate: promo.startDate,
            endDate: promo.endDate,
            applicableTo: promo.applicableTo,
            applicableValue: promo.applicableValue || "",
            usageLimit: promo.usageLimit.toString(),
            status: promo.status,
        });
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingPromo(null);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const newPromo = {
            id: editingPromo ? editingPromo.id : Math.max(...promotions.map((p) => p.id)) + 1,
            code: formData.code,
            description: formData.description,
            type: formData.type,
            value: parseFloat(formData.value),
            minOrder: parseFloat(formData.minOrder) || 0,
            startDate: formData.startDate,
            endDate: formData.endDate,
            applicableTo: formData.applicableTo,
            applicableValue: formData.applicableValue || null,
            usageLimit: parseInt(formData.usageLimit) || 0,
            usedCount: editingPromo ? editingPromo.usedCount : 0,
            status: formData.status,
        };
        if (editingPromo) {
            setPromotions(promotions.map((p) => (p.id === editingPromo.id ? newPromo : p)));
        } else {
            setPromotions([...promotions, newPromo]);
        }
        closeModal();
    };

    const handleDeleteClick = (id: number) => {
        setPromoToDelete(id);
        setDeleteConfirmOpen(true);
    };

    const confirmDelete = () => {
        if (promoToDelete) {
            setPromotions(promotions.filter((p) => p.id !== promoToDelete));
            setPromoToDelete(null);
            setDeleteConfirmOpen(false);
        }
    };

    const cancelDelete = () => {
        setPromoToDelete(null);
        setDeleteConfirmOpen(false);
    };

    const openViewModal = (promo: any) => {
        setViewingPromo(promo);
        setIsViewModalOpen(true);
    };

    const closeViewModal = () => {
        setIsViewModalOpen(false);
        setViewingPromo(null);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <h2 className="text-2xl font-bold text-gray-800">Promotions & Offers</h2>
                <button
                    onClick={openAddModal}
                    className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2 rounded-lg hover:shadow-md transition"
                >
                    <Plus className="w-5 h-5" />
                    Add Promotion
                </button>
            </div>

            {/* Filters and search */}
            <div className="bg-white p-4 rounded-xl shadow-sm space-y-4">
                <div className="flex flex-col md:flex-row gap-4">
                    {/* Search */}
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Search by code or description..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    {/* Status filter */}
                    <div className="sm:w-40">
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                        >
                            {statusOptions.map((opt) => (
                                <option key={opt} value={opt}>
                                    {opt.charAt(0).toUpperCase() + opt.slice(1)}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Type filter */}
                    <div className="sm:w-40">
                        <select
                            value={typeFilter}
                            onChange={(e) => setTypeFilter(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                        >
                            {typeOptions.map((opt) => (
                                <option key={opt} value={opt}>
                                    {opt === "All" ? "All Types" : opt === "percentage" ? "Percentage" : "Fixed Amount"}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Promotions table */}
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
                            {filteredPromotions.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className="px-4 py-8 text-center text-gray-500">
                                        No promotions found.
                                    </td>
                                </tr>
                            ) : (
                                filteredPromotions.map((promo) => {
                                    const today = new Date().toISOString().split("T")[0];
                                    let statusDisplay = promo.status;
                                    if (promo.status === "active") {
                                        if (promo.endDate < today) statusDisplay = "expired";
                                        else if (promo.startDate > today) statusDisplay = "scheduled";
                                    }
                                    const statusColor =
                                        statusDisplay === "active"
                                            ? "bg-green-100 text-green-700"
                                            : statusDisplay === "scheduled"
                                                ? "bg-blue-100 text-blue-700"
                                                : "bg-gray-100 text-gray-700";

                                    return (
                                        <tr key={promo.id} className="hover:bg-gray-50">
                                            <td className="px-4 py-3 font-medium text-gray-800">
                                                {promo.code}
                                            </td>
                                            <td className="px-4 py-3 text-gray-600 max-w-xs truncate">
                                                {promo.description}
                                            </td>
                                            <td className="px-4 py-3">
                                                {promo.type === "percentage" ? (
                                                    <span className="flex items-center gap-1">
                                                        <Percent className="w-3 h-3" />
                                                        {promo.value}%
                                                    </span>
                                                ) : (
                                                    <span className="flex items-center gap-1">
                                                        <DollarSign className="w-3 h-3" />
                                                        ₹{promo.value}
                                                    </span>
                                                )}
                                            </td>
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
                                                    {statusDisplay.charAt(0).toUpperCase() + statusDisplay.slice(1)}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => openViewModal(promo)}
                                                        className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                                                        title="View Details"
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
                                                        onClick={() => handleDeleteClick(promo.id)}
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

            {/* Add/Edit Modal */}
            {isModalOpen && (
                <PromoFormModal
                    formData={formData}
                    setFormData={setFormData}
                    editingPromo={editingPromo}
                    onClose={closeModal}
                    onSubmit={handleSubmit}
                />
            )}

            {/* View Details Modal */}
            {isViewModalOpen && viewingPromo && (
                <PromoViewModal
                    promo={viewingPromo}
                    onClose={closeViewModal}
                />
            )}

            {/* Delete Confirmation Modal */}
            {deleteConfirmOpen && (
                <DeleteConfirmationModal
                    onConfirm={confirmDelete}
                    onCancel={cancelDelete}
                />
            )}
        </div>
    );
}

// Form Modal Component
function PromoFormModal({
    formData,
    setFormData,
    editingPromo,
    onClose,
    onSubmit,
}: any) {
    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
    ) => {
        const { name, value } = e.target;
        setFormData((prev: any) => ({ ...prev, [name]: value }));
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white">
                    <h3 className="text-lg font-semibold text-gray-800">
                        {editingPromo ? "Edit Promotion" : "Add New Promotion"}
                    </h3>
                    <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>
                <form onSubmit={onSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Promo Code *
                        </label>
                        <input
                            type="text"
                            name="code"
                            value={formData.code}
                            onChange={handleChange}
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="e.g. SUMMER20"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Description
                        </label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            rows={2}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Brief description of the offer"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Discount Type *
                            </label>
                            <select
                                name="type"
                                value={formData.type}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                            >
                                <option value="percentage">Percentage (%)</option>
                                <option value="fixed">Fixed Amount (₹)</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Value *
                            </label>
                            <input
                                type="number"
                                name="value"
                                value={formData.value}
                                onChange={handleChange}
                                required
                                min="0"
                                step="0.01"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Minimum Order Value (₹)
                        </label>
                        <input
                            type="number"
                            name="minOrder"
                            value={formData.minOrder}
                            onChange={handleChange}
                            min="0"
                            step="0.01"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="0 for no minimum"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Start Date *
                            </label>
                            <input
                                type="date"
                                name="startDate"
                                value={formData.startDate}
                                onChange={handleChange}
                                required
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                End Date *
                            </label>
                            <input
                                type="date"
                                name="endDate"
                                value={formData.endDate}
                                onChange={handleChange}
                                required
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Applicable To
                        </label>
                        <select
                            name="applicableTo"
                            value={formData.applicableTo}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                        >
                            <option value="all">All Items</option>
                            <option value="category">Specific Category</option>
                            <option value="specific">Specific Item</option>
                        </select>
                    </div>
                    {formData.applicableTo !== "all" && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                {formData.applicableTo === "category" ? "Category Name" : "Item Name"}
                            </label>
                            <input
                                type="text"
                                name="applicableValue"
                                value={formData.applicableValue}
                                onChange={handleChange}
                                required={formData.applicableTo !== "all"}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder={formData.applicableTo === "category" ? "e.g. Drinks" : "e.g. Margherita Pizza"}
                            />
                        </div>
                    )}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Usage Limit (total redemptions)
                        </label>
                        <input
                            type="number"
                            name="usageLimit"
                            value={formData.usageLimit}
                            onChange={handleChange}
                            min="0"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="0 for unlimited"
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
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                        >
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                        </select>
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:shadow-md"
                        >
                            {editingPromo ? "Update" : "Add"} Promotion
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// View Details Modal
function PromoViewModal({ promo, onClose }: any) {
    // Determine computed status
    const today = new Date().toISOString().split("T")[0];
    let statusDisplay = promo.status;
    if (promo.status === "active") {
        if (promo.endDate < today) statusDisplay = "expired";
        else if (promo.startDate > today) statusDisplay = "scheduled";
    }
    const statusColor =
        statusDisplay === "active"
            ? "bg-green-100 text-green-700"
            : statusDisplay === "scheduled"
                ? "bg-blue-100 text-blue-700"
                : "bg-gray-100 text-gray-700";

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl max-w-lg w-full">
                <div className="flex items-center justify-between p-6 border-b">
                    <h3 className="text-lg font-semibold text-gray-800">Promotion Details</h3>
                    <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>
                <div className="p-6 space-y-4">
                    <div className="flex justify-between items-center">
                        <div>
                            <p className="text-sm text-gray-500">Promo Code</p>
                            <p className="text-2xl font-bold text-gray-800">{promo.code}</p>
                        </div>
                        <span className={`px-3 py-1 text-sm font-medium rounded-full ${statusColor}`}>
                            {statusDisplay.charAt(0).toUpperCase() + statusDisplay.slice(1)}
                        </span>
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">Description</p>
                        <p className="text-gray-700">{promo.description || "—"}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-sm text-gray-500">Discount</p>
                            <p className="font-medium">
                                {promo.type === "percentage"
                                    ? `${promo.value}%`
                                    : `₹${promo.value}`}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Min. Order</p>
                            <p className="font-medium">₹{promo.minOrder}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Valid From</p>
                            <p className="font-medium">{promo.startDate}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Valid To</p>
                            <p className="font-medium">{promo.endDate}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Applicable To</p>
                            <p className="font-medium">
                                {promo.applicableTo === "all"
                                    ? "All items"
                                    : promo.applicableTo === "category"
                                        ? `Category: ${promo.applicableValue}`
                                        : `Specific: ${promo.applicableValue}`}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Usage</p>
                            <p className="font-medium">
                                {promo.usedCount} / {promo.usageLimit || "∞"}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="border-t p-6 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}

// Delete Confirmation Modal
function DeleteConfirmationModal({ onConfirm, onCancel }: any) {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl max-w-sm w-full p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Confirm Delete</h3>
                <p className="text-gray-600 mb-6">
                    Are you sure you want to delete this promotion? This action cannot be undone.
                </p>
                <div className="flex justify-end gap-3">
                    <button
                        onClick={onCancel}
                        className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                    >
                        Delete
                    </button>
                </div>
            </div>
        </div>
    );
}