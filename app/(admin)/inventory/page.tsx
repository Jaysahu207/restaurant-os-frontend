"use client";

import { useState } from "react";
import {
    Plus,
    Search,
    Edit,
    Trash2,
    AlertTriangle,
    Package,
    TrendingUp,
    TrendingDown,
    X,
    Filter,
} from "lucide-react";

// Mock inventory data (replace with API)
const initialInventory = [
    {
        id: 1,
        name: "Tomatoes",
        category: "Vegetables",
        quantity: 25,
        unit: "kg",
        reorderLevel: 10,
        costPerUnit: 2.5,
        supplier: "Fresh Farms",
    },
    {
        id: 2,
        name: "Chicken Breast",
        category: "Meat",
        quantity: 15,
        unit: "kg",
        reorderLevel: 8,
        costPerUnit: 8.0,
        supplier: "Meat Co.",
    },
    {
        id: 3,
        name: "Olive Oil",
        category: "Condiments",
        quantity: 5,
        unit: "liters",
        reorderLevel: 3,
        costPerUnit: 12.0,
        supplier: "Oil Suppliers",
    },
    {
        id: 4,
        name: "Flour",
        category: "Bakery",
        quantity: 50,
        unit: "kg",
        reorderLevel: 20,
        costPerUnit: 1.2,
        supplier: "Flour Mill",
    },
    {
        id: 5,
        name: "Cheese",
        category: "Dairy",
        quantity: 8,
        unit: "kg",
        reorderLevel: 5,
        costPerUnit: 10.0,
        supplier: "Dairy Fresh",
    },
    {
        id: 6,
        name: "Lettuce",
        category: "Vegetables",
        quantity: 3,
        unit: "pieces",
        reorderLevel: 5,
        costPerUnit: 1.0,
        supplier: "Fresh Farms",
    },
];

// Categories for filter
const categories = ["All", "Vegetables", "Meat", "Dairy", "Bakery", "Condiments", "Beverages", "Other"];

export default function InventoryPage() {
    const [inventory, setInventory] = useState(initialInventory);
    const [search, setSearch] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("All");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<any>(null);
    const [stockModalOpen, setStockModalOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<any>(null);
    const [stockAction, setStockAction] = useState<"add" | "remove">("add");
    const [stockQuantity, setStockQuantity] = useState(0);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<number | null>(null);

    // Form state for add/edit
    const [formData, setFormData] = useState({
        name: "",
        category: "Vegetables",
        quantity: 0,
        unit: "kg",
        reorderLevel: 0,
        costPerUnit: 0,
        supplier: "",
    });

    // Filter inventory
    const filteredInventory = inventory.filter((item) => {
        const matchesSearch =
            item.name.toLowerCase().includes(search.toLowerCase()) ||
            item.supplier.toLowerCase().includes(search.toLowerCase());
        const matchesCategory = categoryFilter === "All" || item.category === categoryFilter;
        return matchesSearch && matchesCategory;
    });

    // Low stock items
    const lowStockItems = inventory.filter((item) => item.quantity <= item.reorderLevel);

    // Modal handlers
    const openAddModal = () => {
        setEditingItem(null);
        setFormData({
            name: "",
            category: "Vegetables",
            quantity: 0,
            unit: "kg",
            reorderLevel: 0,
            costPerUnit: 0,
            supplier: "",
        });
        setIsModalOpen(true);
    };

    const openEditModal = (item: any) => {
        setEditingItem(item);
        setFormData({
            name: item.name,
            category: item.category,
            quantity: item.quantity,
            unit: item.unit,
            reorderLevel: item.reorderLevel,
            costPerUnit: item.costPerUnit,
            supplier: item.supplier,
        });
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingItem(null);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingItem) {
            // Update
            setInventory(
                inventory.map((item) =>
                    item.id === editingItem.id ? { ...item, ...formData } : item
                )
            );
        } else {
            // Add new
            const newItem = {
                id: Math.max(...inventory.map((i) => i.id)) + 1,
                ...formData,
            };
            setInventory([...inventory, newItem]);
        }
        closeModal();
    };

    // Stock adjustment
    const openStockModal = (item: any, action: "add" | "remove") => {
        setSelectedItem(item);
        setStockAction(action);
        setStockQuantity(0);
        setStockModalOpen(true);
    };

    const handleStockAdjust = () => {
        if (!selectedItem) return;
        const newQuantity =
            stockAction === "add"
                ? selectedItem.quantity + stockQuantity
                : selectedItem.quantity - stockQuantity;
        setInventory(
            inventory.map((item) =>
                item.id === selectedItem.id ? { ...item, quantity: newQuantity } : item
            )
        );
        setStockModalOpen(false);
        setSelectedItem(null);
    };

    // Delete
    const handleDeleteClick = (id: number) => {
        setItemToDelete(id);
        setDeleteConfirmOpen(true);
    };

    const confirmDelete = () => {
        if (itemToDelete) {
            setInventory(inventory.filter((item) => item.id !== itemToDelete));
            setItemToDelete(null);
            setDeleteConfirmOpen(false);
        }
    };

    const cancelDelete = () => {
        setItemToDelete(null);
        setDeleteConfirmOpen(false);
    };

    // Calculate total value
    const totalValue = inventory.reduce(
        (sum, item) => sum + item.quantity * item.costPerUnit,
        0
    );

    return (
        <div className="space-y-6">
            {/* Header with stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    label="Total Items"
                    value={inventory.length}
                    icon={Package}
                    color="bg-blue-500"
                />
                <StatCard
                    label="Low Stock Items"
                    value={lowStockItems.length}
                    icon={AlertTriangle}
                    color="bg-yellow-500"
                />
                <StatCard
                    label="Total Value"
                    value={`$${totalValue.toFixed(2)}`}
                    icon={TrendingUp}
                    color="bg-green-500"
                />
                <StatCard
                    label="Categories"
                    value={new Set(inventory.map((i) => i.category)).size}
                    icon={Filter}
                    color="bg-purple-500"
                />
            </div>

            {/* Header actions */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <h2 className="text-2xl font-bold text-gray-800">Inventory Management</h2>
                <button
                    onClick={openAddModal}
                    className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2 rounded-lg hover:shadow-md transition"
                >
                    <Plus className="w-5 h-5" />
                    Add Item
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
                            placeholder="Search items or supplier..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    {/* Category filter */}
                    <div className="sm:w-48">
                        <select
                            value={categoryFilter}
                            onChange={(e) => setCategoryFilter(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                        >
                            {categories.map((cat) => (
                                <option key={cat} value={cat}>
                                    {cat}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Inventory table */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 text-gray-600">
                            <tr>
                                <th className="px-4 py-3 text-left">Name</th>
                                <th className="px-4 py-3 text-left">Category</th>
                                <th className="px-4 py-3 text-left">Quantity</th>
                                <th className="px-4 py-3 text-left">Unit</th>
                                <th className="px-4 py-3 text-left">Reorder Level</th>
                                <th className="px-4 py-3 text-left">Cost/Unit</th>
                                <th className="px-4 py-3 text-left">Total Value</th>
                                <th className="px-4 py-3 text-left">Supplier</th>
                                <th className="px-4 py-3 text-left">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {filteredInventory.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className="px-4 py-8 text-center text-gray-500">
                                        No inventory items found.
                                    </td>
                                </tr>
                            ) : (
                                filteredInventory.map((item) => {
                                    const isLowStock = item.quantity <= item.reorderLevel;
                                    return (
                                        <tr
                                            key={item.id}
                                            className={`hover:bg-gray-50 ${isLowStock ? "bg-red-50" : ""
                                                }`}
                                        >
                                            <td className="px-4 py-3 font-medium text-gray-800">
                                                {item.name}
                                                {isLowStock && (
                                                    <span className="ml-2 inline-flex items-center gap-1 text-xs text-red-600">
                                                        <AlertTriangle className="w-3 h-3" />
                                                        Low Stock
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-gray-600">{item.category}</td>
                                            <td className="px-4 py-3 font-medium">{item.quantity}</td>
                                            <td className="px-4 py-3 text-gray-600">{item.unit}</td>
                                            <td className="px-4 py-3">{item.reorderLevel}</td>
                                            <td className="px-4 py-3">${item.costPerUnit.toFixed(2)}</td>
                                            <td className="px-4 py-3 font-medium">
                                                ${(item.quantity * item.costPerUnit).toFixed(2)}
                                            </td>
                                            <td className="px-4 py-3 text-gray-600">{item.supplier}</td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => openStockModal(item, "add")}
                                                        className="p-1 text-green-600 hover:bg-green-50 rounded"
                                                        title="Add Stock"
                                                    >
                                                        <TrendingUp className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => openStockModal(item, "remove")}
                                                        className="p-1 text-orange-600 hover:bg-orange-50 rounded"
                                                        title="Remove Stock"
                                                    >
                                                        <TrendingDown className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => openEditModal(item)}
                                                        className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                                                        title="Edit"
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteClick(item.id)}
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
                <InventoryFormModal
                    formData={formData}
                    setFormData={setFormData}
                    editingItem={editingItem}
                    onClose={closeModal}
                    onSubmit={handleSubmit}
                    categories={categories.filter((c) => c !== "All")}
                />
            )}

            {/* Stock Adjustment Modal */}
            {stockModalOpen && selectedItem && (
                <StockAdjustModal
                    item={selectedItem}
                    action={stockAction}
                    quantity={stockQuantity}
                    setQuantity={setStockQuantity}
                    onConfirm={handleStockAdjust}
                    onClose={() => setStockModalOpen(false)}
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

// Stat Card Component (reused)
function StatCard({ label, value, icon: Icon, color }: any) {
    return (
        <div className="bg-white p-5 rounded-2xl shadow-sm hover:shadow-md transition">
            <div className="flex justify-between items-center">
                <div>
                    <p className="text-sm text-gray-500">{label}</p>
                    <p className="text-2xl font-bold text-gray-800">{value}</p>
                </div>
                <div className={`p-3 rounded-full ${color} text-white`}>
                    <Icon className="w-5 h-5" />
                </div>
            </div>
        </div>
    );
}

// Inventory Form Modal
function InventoryFormModal({
    formData,
    setFormData,
    editingItem,
    onClose,
    onSubmit,
    categories,
}: any) {
    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
        const { name, value } = e.target;
        setFormData((prev: any) => ({ ...prev, [name]: value }));
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white">
                    <h3 className="text-lg font-semibold text-gray-800">
                        {editingItem ? "Edit Inventory Item" : "Add Inventory Item"}
                    </h3>
                    <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>
                <form onSubmit={onSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Item Name *
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
                            Category *
                        </label>
                        <select
                            name="category"
                            value={formData.category}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                        >
                            {categories.map((cat: string) => (
                                <option key={cat} value={cat}>
                                    {cat}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Quantity *
                            </label>
                            <input
                                type="number"
                                name="quantity"
                                value={formData.quantity}
                                onChange={handleChange}
                                required
                                min="0"
                                step="0.01"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Unit *
                            </label>
                            <input
                                type="text"
                                name="unit"
                                value={formData.unit}
                                onChange={handleChange}
                                required
                                placeholder="kg, liters, pieces"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Reorder Level *
                            </label>
                            <input
                                type="number"
                                name="reorderLevel"
                                value={formData.reorderLevel}
                                onChange={handleChange}
                                required
                                min="0"
                                step="0.01"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Cost per Unit ($) *
                            </label>
                            <input
                                type="number"
                                name="costPerUnit"
                                value={formData.costPerUnit}
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
                            Supplier
                        </label>
                        <input
                            type="text"
                            name="supplier"
                            value={formData.supplier}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
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
                            {editingItem ? "Update" : "Add"} Item
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// Stock Adjustment Modal
function StockAdjustModal({
    item,
    action,
    quantity,
    setQuantity,
    onConfirm,
    onClose,
}: any) {
    const isAdd = action === "add";
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl max-w-sm w-full">
                <div className="flex items-center justify-between p-6 border-b">
                    <h3 className="text-lg font-semibold text-gray-800">
                        {isAdd ? "Add Stock" : "Remove Stock"}
                    </h3>
                    <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>
                <div className="p-6 space-y-4">
                    <p className="text-sm text-gray-600">
                        Current quantity of <span className="font-medium">{item.name}</span>:{" "}
                        {item.quantity} {item.unit}
                    </p>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Quantity to {isAdd ? "add" : "remove"}
                        </label>
                        <input
                            type="number"
                            value={quantity}
                            onChange={(e) => setQuantity(parseFloat(e.target.value) || 0)}
                            min="0"
                            step="0.01"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                    {!isAdd && quantity > item.quantity && (
                        <p className="text-sm text-red-600">
                            Cannot remove more than available quantity.
                        </p>
                    )}
                </div>
                <div className="border-t p-6 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={!isAdd && quantity > item.quantity}
                        className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Confirm
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
                    Are you sure you want to delete this item? This action cannot be undone.
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