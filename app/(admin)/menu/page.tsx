"use client";

import { useEffect, useState } from "react";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  ChevronUp,
  ChevronDown,
  Filter,
  X,
  Upload,
} from "lucide-react";

import {
  getMenuItems,
  createMenuItem,
  deleteMenuItem,
  updateMenuItem,
} from "@/services/menuService";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import API from "@/config/axios";

// All possible categories (for filter dropdown)
const allCategories = [
  "Starters",
  "Lunch",
  "Breakfast",
  "Main Course",
  "Drinks",
  "Desserts",
  "Specials",
  "Side Dishes",
  "Soups",
  "Salads",
  "Breads",
  "Sandwiches",
  "Wraps",
  "Pizzas",
];

export default function MenuPage() {
  // State for menu items
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [selectedVariant, setSelectedVariant] = useState(null);
  // Search and filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [availabilityFilter, setAvailabilityFilter] = useState("All"); // "All", "Available", "Unavailable"

  // Sorting state
  const [sortField, setSortField] = useState("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  // Modal state for add/edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null); // holds item data when editing

  // Delete confirmation modal
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { user, restaurant } = useAuthStore();
  console.log("🟡 RESTAURANT ID:", restaurant._id);

  // Handle sorting
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Filter and sort items
  const filteredItems = menuItems
    .filter((item) => {
      // Search filter (name or description)

      const matchesSearch =
        (item.name?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
        (item.description?.toLowerCase() || "").includes(
          searchTerm.toLowerCase(),
        );
      // Category filter
      const matchesCategory =
        categoryFilter === "All" || item.category === categoryFilter;
      // Availability filter
      const matchesAvailability =
        availabilityFilter === "All" ||
        (availabilityFilter === "Available" && item.available) ||
        (availabilityFilter === "Unavailable" && !item.available);
      return matchesSearch && matchesCategory && matchesAvailability;
    })
    .sort((a, b) => {
      let aValue: any = a[sortField as keyof typeof a];
      let bValue: any = b[sortField as keyof typeof b];
      if (sortField === "price") {
        aValue = Number(aValue);
        bValue = Number(bValue);
      } else {
        aValue = String(aValue).toLowerCase();
        bValue = String(bValue).toLowerCase();
      }
      if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
      if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });

  // Handlers for CRUD
  const openAddModal = () => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const openEditModal = (item: any) => {
    // console.log("🟡 Editing Item:", item);

    setEditingItem(item); // full object
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
  };
  const fetchMenu = async () => {
    try {
      const data = await getMenuItems(restaurant._id as string);

      setMenuItems(data);
      console.log(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchMenu();
  }, []);
  const handleSaveItem = async (formData: FormData) => {
    try {
      if (editingItem) {
        // 🔄 UPDATE
        await updateMenuItem(editingItem._id, formData);
        toast.success("Item updated");
      } else {
        // ➕ CREATE
        await createMenuItem(formData);
        toast.success("Item created");
      }

      await fetchMenu(); // ✅ refresh from backend
      closeModal();
    } catch (error) {
      console.error(error);
      toast.error("Something went wrong");
    }
  };

  const openDeleteModal = (id: string) => {
    console.log("🟡 openDeleteModal called with ID:", id);
    setItemToDelete(id);
    setIsDeleteModalOpen(true);
  };
  const confirmDelete = async () => {
    console.log("🟢 confirmDelete triggered");

    if (!itemToDelete) {
      console.log("❌ No itemToDelete found");
      return;
    }

    console.log("🟡 Deleting item with ID:", itemToDelete);

    try {
      setIsDeleting(true);

      console.log("📡 Calling API...");
      const res = await deleteMenuItem(itemToDelete);

      console.log("✅ API Success Response:", res);

      // 🔥 CHECK THIS CAREFULLY
      setMenuItems((prev: any) => {
        console.log("📦 Previous Items:", prev);

        const updated = prev.filter((item: any) => item._id !== itemToDelete);

        console.log("🧹 Updated Items:", updated);

        return updated;
      });

      toast.success("Item deleted successfully");
    } catch (err: any) {
      console.error("❌ Delete API Error:", err?.response || err);
      toast.error("Failed to delete item");
    } finally {
      setIsDeleting(false);
      setItemToDelete(null);
      setIsDeleteModalOpen(false);
    }
  };

  const cancelDelete = () => {
    if (isDeleting) return; // prevent closing while deleting
    setItemToDelete(null);
    setIsDeleteModalOpen(false);
  };
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-2xl font-bold text-gray-800">Menu Management</h2>
        <button
          onClick={openAddModal}
          className="inline-flex items-center gap-2 bg-gradient-to-br from-orange-400 to-amber-500 text-white px-4 py-2 rounded-lg hover:shadow-md transition"
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
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-700 w-5 h-5" />
            <input
              type="text"
              placeholder="Search items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border text-gray-700 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Category filter */}
          <div className="sm:w-48">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-4 py-2 border text-gray-700 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            >
              <option value="All">All Categories</option>
              {allCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Availability filter */}
          <div className="sm:w-40">
            <select
              value={availabilityFilter}
              onChange={(e) => setAvailabilityFilter(e.target.value)}
              className="w-full px-4 py-2 border text-gray-700 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            >
              <option value="All">All Items</option>
              <option value="Available">Available</option>
              <option value="Unavailable">Unavailable</option>
            </select>
          </div>
        </div>

        {/* Sorting info (could be badges) */}
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Filter className="w-4 h-4" />
          <span>Sort by:</span>
          <button
            onClick={() => handleSort("name")}
            className={`flex items-center gap-1 px-2 py-1 rounded ${
              sortField === "name"
                ? "bg-blue-100 text-blue-700"
                : "hover:bg-gray-100"
            }`}
          >
            Name
            {sortField === "name" &&
              (sortDirection === "asc" ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              ))}
          </button>
          <button
            onClick={() => handleSort("category")}
            className={`flex items-center gap-1 px-2 py-1 rounded ${
              sortField === "category"
                ? "bg-blue-100 text-blue-700"
                : "hover:bg-gray-100"
            }`}
          >
            Category
            {sortField === "category" &&
              (sortDirection === "asc" ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              ))}
          </button>
          <button
            onClick={() => handleSort("price")}
            className={`flex items-center gap-1 px-2 py-1 rounded ${
              sortField === "price"
                ? "bg-blue-100 text-blue-700"
                : "hover:bg-gray-100"
            }`}
          >
            Price
            {sortField === "price" &&
              (sortDirection === "asc" ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              ))}
          </button>
        </div>
      </div>

      {/* Menu items table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="px-4 py-3 text-left">Image</th>
                <th className="px-4 py-3 text-left">Name</th>
                <th className="px-4 py-3 text-left">Category</th>
                <th className="px-4 py-3 text-left">Type</th>
                <th className="px-4 py-3 text-left">Variants</th>
                <th className="px-4 py-3 text-left">Price</th>
                <th className="px-4 py-3 text-left">Addons</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredItems.length > 0 ? (
                filteredItems.map((item) => (
                  <tr key={item._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-12 h-12 object-cover rounded-lg"
                      />
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-800">
                      {item.name}
                      <div className="text-xs text-gray-500 truncate max-w-xs">
                        {item.description}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{item.category}</td>

                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full
      ${
        item.type === "veg"
          ? "bg-green-50 text-green-700"
          : item.type === "non-veg"
            ? "bg-red-50 text-red-700"
            : item.type === "egg"
              ? "bg-yellow-50 text-yellow-700"
              : "bg-gray-100 text-gray-600"
      }
    `}
                      >
                        <span
                          className={`w-2 h-2 rounded-full
        ${
          item.type === "veg"
            ? "bg-green-600"
            : item.type === "non-veg"
              ? "bg-red-600"
              : item.type === "egg"
                ? "bg-yellow-500"
                : "bg-gray-500"
        }
      `}
                        ></span>
                        {item.type}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-gray-600">
                      {item.variants.length > 0 ? (
                        <div className="flex flex-col gap-1 items-start">
                          {item.variants.map((variant: any, index: number) => (
                            <span
                              key={index}
                              className="bg-green-100 text-green-700 text-xs font-medium px-2 py-1 rounded-full"
                            >
                              {variant.name} - ₹{variant.price}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-800 font-medium">
                          ₹{item.price}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-800">
                      ₹{item.price}
                    </td>
                    <td className="px-4 py-3">
                      {item.addons.length > 0 ? (
                        <div className="flex flex-col gap-2">
                          {item.addons.map((addon: any, index: number) => (
                            <div
                              key={index}
                              className="flex justify-between items-center bg-gray-50 border rounded-lg px-2 py-2 text-sm"
                            >
                              <span className="font-medium text-gray-700">
                                {addon.name}
                              </span>
                              <span className="text-indigo-600 font-semibold">
                                ₹{addon.price}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-400 text-sm">No Addons</span>
                      )}
                    </td>

                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          item.isAvailable
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {item.isAvailable ? "Available" : "Unavailable"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEditModal(item)}
                          className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openDeleteModal(item._id)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-8 text-center text-gray-500"
                  >
                    No menu items found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <MenuFormModal
          item={editingItem}
          onSave={handleSaveItem}
          onClose={closeModal}
          categories={allCategories}
        />
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <DeleteConfirmationModal
          onConfirm={confirmDelete}
          onCancel={cancelDelete}
          isDeleting={isDeleting}
        />
      )}
    </div>
  );
}

// Modal component for adding/editing menu items
function MenuFormModal({ item, onSave, onClose, categories }: any) {
  const [formData, setFormData] = useState({
    name: item?.name || "",
    description: item?.description || "",
    price: item?.price || "",
    category: item?.category || "",
    image: item?.image || null,
    available: item?.available ?? true,
    type: item?.type || "veg",
    isPopular: item?.isPopular ?? false,
    variants: item?.variants || [], // ✅ FIX
    prepTime: item?.prepTime || 10,
    addons: item?.addons || [], // ✅ FIX
  });
  const [preview, setPreview] = useState<string | null>(
    item?.image ? (typeof item.image === "string" ? item.image : null) : null,
  );

  const handleChange = (e: any) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleImageChange = (e: any) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({ ...formData, image: file });
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleAddon = () => {
    setFormData({
      ...formData,
      addons: [...formData.addons, { name: "", price: "" }],
    });
  };

  const handleAddonChange = (index: number, field: string, value: any) => {
    const updated = [...formData.addons];
    updated[index][field] = value;
    setFormData({ ...formData, addons: updated });
  };

  const handleRemoveAddon = (index: number) => {
    const updated = formData.addons.filter((_: any, i: number) => i !== index);
    setFormData({ ...formData, addons: updated });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const form = new FormData();

    form.append("name", formData.name);
    form.append("description", formData.description);
    form.append("price", String(Number(formData.price))); // ✅ number fix
    form.append("category", formData.category);

    form.append("type", formData.type);
    form.append("variants", JSON.stringify(formData.variants || [])); // ✅ handle undefined
    form.append("prepTime", String(Number(formData.prepTime))); // ✅ number fix
    form.append("isPopular", String(formData.isPopular)); // ✅ boolean fix
    form.append("available", String(formData.available)); // ✅ boolean fix

    // ✅ only send image if it's a file (not URL string)
    if (formData.image && typeof formData.image !== "string") {
      form.append("image", formData.image);
    }

    // ✅ addons safe stringify
    form.append("addons", JSON.stringify(formData.addons || []));
    console.log(form);
    onSave(form);
  };

  // Add Variant
  const handleAddVariant = () => {
    setFormData({
      ...formData,
      variants: [...formData.variants, { name: "", price: 0 }],
    });
  };

  // Change Variant
  const handleVariantChange = (index: number, field: string, value: any) => {
    const updated = [...formData.variants];
    updated[index][field] = value;

    setFormData({
      ...formData,
      variants: updated,
    });
  };

  // Remove Variant
  const handleRemoveVariant = (index: number) => {
    const updated = formData.variants.filter(
      (_: any, i: number) => i !== index,
    );

    setFormData({
      ...formData,
      variants: updated,
    });
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-white z-10 flex justify-between items-center px-6 py-4 border-b border-gray-100">
          <h2 className="text-xl font-semibold text-gray-800">
            {item ? "Edit Menu Item" : "Add New Menu Item"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* 2-column grid for basic fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Item Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-3 py-2 text-gray-700 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                required
              />
            </div>

            {/* Price */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Price ($) *
              </label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                step="0.01"
                min="0"
                className="w-full px-3 py-2 text-gray-700 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category *
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full px-3 py-2 text-gray-700 border border-gray-300 rounded-lg focus:ring-2 bg-white focus:ring-blue-500  focus:border-transparent transition"
              >
                {allCategories.map((cat: any) => (
                  <option key={cat._id || cat} value={cat._id || cat}>
                    {cat.name || cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Type (Veg/Non-veg/Egg) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Food Type
              </label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="w-full px-3 py-2 text-gray-700 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="veg">🌱 Veg</option>
                <option value="non-veg">🍗 Non-Veg</option>
                <option value="egg">🥚 Egg</option>
              </select>
            </div>

            {/* Prep Time */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Prep Time (minutes)
              </label>
              <input
                type="number"
                name="prepTime"
                value={formData.prepTime}
                onChange={handleChange}
                min="0"
                className="w-full px-3 py-2 text-gray-700 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            {/* Variants Section */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Variants (Optional)
                </label>
                <button
                  type="button"
                  onClick={handleAddVariant}
                  className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
                >
                  <Plus className="w-4 h-4" /> Add Variant
                </button>
              </div>

              {formData.variants.length == 0 && (
                <p className="text-sm text-gray-400 italic">
                  No variants added yet.
                </p>
              )}

              <div className="space-y-3">
                {formData.variants.map((variant: any, index: number) => (
                  <div key={index} className="flex gap-3 items-start">
                    {/* Variant Name */}
                    <div className="flex-1">
                      <select
                        value={variant.name}
                        onChange={(e) =>
                          handleVariantChange(index, "name", e.target.value)
                        }
                        className="w-full px-3 py-2 text-gray-700 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select Variant</option>
                        <option value="Half">Half</option>
                        <option value="Full">Full</option>
                        <option value="Large">Large</option>
                      </select>
                    </div>

                    {/* Variant Price */}
                    <div className="w-32">
                      <input
                        type="number"
                        placeholder="Price"
                        value={variant.price}
                        onChange={(e) =>
                          handleVariantChange(index, "price", e.target.value)
                        }
                        className="w-full px-3 py-2 text-gray-700 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    {/* Remove Button */}
                    <button
                      type="button"
                      onClick={() => handleRemoveVariant(index)}
                      className="text-red-500 hover:text-red-700 p-2"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
            {/* Description - spans both columns */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                name="description"
                rows={3}
                value={formData.description}
                onChange={handleChange}
                className="w-full px-3 py-2 border text-gray-700 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Brief description of the item..."
              />
            </div>
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Item Image
            </label>
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 bg-gray-50 rounded-lg border border-gray-200 flex items-center justify-center overflow-hidden">
                {preview ? (
                  <img
                    src={preview}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Upload className="w-6 h-6 text-gray-400" />
                )}
              </div>
              <label className="cursor-pointer bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition">
                Choose Image
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Addons Section */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Add-ons (Optional)
              </label>
              <button
                type="button"
                onClick={handleAddon}
                className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
              >
                <Plus className="w-4 h-4" /> Add add-on
              </button>
            </div>
            {formData.addons.length === 0 && (
              <p className="text-sm text-gray-400 italic">
                No add-ons added yet.
              </p>
            )}
            <div className="space-y-3">
              {formData.addons.map((addon: any, index: number) => (
                <div key={index} className="flex gap-3 items-start">
                  <div className="flex-1">
                    <input
                      type="text"
                      placeholder="Add-on name (e.g., Extra Cheese)"
                      value={addon.name}
                      onChange={(e) =>
                        handleAddonChange(index, "name", e.target.value)
                      }
                      className="w-full px-3 py-2 text-gray-700 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="w-32">
                    <input
                      type="number"
                      placeholder="Price"
                      value={addon.price}
                      onChange={(e) =>
                        handleAddonChange(index, "price", e.target.value)
                      }
                      className="w-full px-3 py-2 text-gray-700 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveAddon(index)}
                    className="text-red-500 hover:text-red-700 p-2"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Toggles (Available / Popular) */}
          <div className="flex flex-wrap gap-6 pt-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                name="available"
                checked={formData.available}
                onChange={handleChange}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">
                Available for ordering
              </span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                name="isPopular"
                checked={formData.isPopular}
                onChange={handleChange}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Mark as Popular</span>
            </label>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-gradient-to-br from-orange-400 to-amber-500 text-white rounded-lg hover:bg-gray-50 transition shadow-sm"
            >
              Save Item
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// export default MenuFormModal;

// Modal component for delete confirmation

function DeleteConfirmationModal({ onConfirm, onCancel, isDeleting }: any) {
  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/20 backdrop-blur-[2px] z-40"
        onClick={() => {
          console.log("Backdrop clicked → cancel delete");
          if (!isDeleting) onCancel();
        }}
      />

      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-xl max-w-sm w-full p-6 shadow-xl">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            Confirm Delete
          </h3>

          <p className="text-gray-600 mb-6">
            Are you sure you want to delete this item? This action cannot be
            undone.
          </p>

          <div className="flex justify-end gap-3">
            {/* Cancel */}
            <button
              onClick={() => {
                console.log("Cancel button clicked");
                if (!isDeleting) onCancel();
              }}
              disabled={isDeleting}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>

            {/* Delete */}
            <button
              onClick={() => {
                console.log("Confirm delete clicked");
                onConfirm();
              }}
              disabled={isDeleting}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
