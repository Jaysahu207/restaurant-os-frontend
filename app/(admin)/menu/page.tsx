"use client";

import { useState } from "react";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  X,
  Upload,
  Loader2,
  Sparkles,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { useAuthStore } from "@/store/useAuthStore";
import {
  useMenu,
  useCreateMenuItem,
  useUpdateMenuItem,
  useDeleteMenuItem,
  type MenuItem,
} from "@/hooks/useMenu";
import CategoryCombobox from "@/components/menu/Categorycombobox ";
import { generateMenuDescription } from "@/services/menuService";

// All possible categories (for filter dropdown) — unchanged
const allCategories = [
  "--Select Category--",
  "Breakfast",
  "Brunch",
  "Lunch",
  "Dinner",
  "Main Course",
  "Executive Meals",
  "Thali",
  "Mini Meals",
  "Family Packs",
  "Combo Meals",
  "Starters",
  "Appetizers",
  "Finger Food",
  "Snacks",
  "Street Food",
  "Chaat",
  "Veg",
  "Non-Veg",
  "Jain Food",
  "North Indian",
  "South Indian",
  "Punjabi",
  "Gujarati",
  "Rajasthani",
  "Maharashtrian",
  "Bengali",
  "Hyderabadi",
  "Kashmiri",
  "Chinese",
  "Indo-Chinese",
  "Thai",
  "Japanese",
  "Korean",
  "Asian",
  "Italian",
  "Mexican",
  "Continental",
  "Mediterranean",
  "American",
  "Rice",
  "Biryani",
  "Fried Rice",
  "Pulao",
  "Noodles",
  "Pasta",
  "Curries",
  "Gravy",
  "Dal",
  "Breads",
  "Naan",
  "Roti",
  "Paratha",
  "Kulcha",
  "Burgers",
  "Sandwiches",
  "Wraps",
  "Rolls",
  "Hot Dogs",
  "Fries",
  "Pizzas",
  "Garlic Bread",
  "Coffee",
  "Tea",
  "Hot Beverages",
  "Cold Beverages",
  "Milkshakes",
  "Smoothies",
  "Mocktails",
  "Juices",
  "Soft Drinks",
  "Desserts",
  "Ice Cream",
  "Cakes",
  "Pastries",
  "Cookies",
  "Brownies",
  "Mithai",
  "Bakery",
  "Fresh Bakes",
  "Salads",
  "Soups",
  "Healthy Food",
  "Protein Meals",
  "Tandoori",
  "Barbecue",
  "Grill",
  "Kebabs",
  "Seafood",
  "Kids Menu",
  "Side Dishes",
  "Accompaniments",
  "Dips",
  "Sauces",
  "Pickles",
  "Extras",
  "Toppings",
  "Seasonal Specials",
  "Chef Specials",
  "Today's Special",
  "Festival Specials",
  "Quick Bites",
  "Dhaba Specials",
  "Beverages",
  "Drinks",
  "Others",
];

export default function MenuPage() {
  const { restaurant } = useAuthStore();
  const restaurantId = restaurant?._id;

  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [availabilityFilter, setAvailabilityFilter] = useState("All");
  const [sortField, setSortField] = useState("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [dateFilter, setDateFilter] = useState("All");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  const { data: menuItems = [], isLoading } = useMenu(restaurantId);
  const createMenuItemMutation = useCreateMenuItem(restaurantId);
  const updateMenuItemMutation = useUpdateMenuItem(restaurantId);
  const deleteMenuItemMutation = useDeleteMenuItem(restaurantId);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const filteredItems = menuItems
    .filter((item: any) => {
      const matchesSearch =
        (item.name?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
        (item.description?.toLowerCase() || "").includes(
          searchTerm.toLowerCase(),
        );

      const matchesCategory =
        categoryFilter === "All" || item.category === categoryFilter;

      const matchesAvailability =
        availabilityFilter === "All" ||
        (availabilityFilter === "Available" && item.isAvailable) ||
        (availabilityFilter === "Unavailable" && !item.isAvailable);

      let matchesDate = true;
      if (dateFilter !== "All") {
        const createdAt = new Date(item.createdAt);
        const updatedAt = new Date(item.updatedAt);
        const today = new Date();

        switch (dateFilter) {
          case "Added Today":
            matchesDate = createdAt.toDateString() === today.toDateString();
            break;
          case "Added Yesterday": {
            const yesterday = new Date();
            yesterday.setDate(today.getDate() - 1);
            matchesDate = createdAt.toDateString() === yesterday.toDateString();
            break;
          }
          case "Added This Week": {
            const weekAgo = new Date();
            weekAgo.setDate(today.getDate() - 7);
            matchesDate = createdAt >= weekAgo;
            break;
          }
          case "Added This Month":
            matchesDate =
              createdAt.getMonth() === today.getMonth() &&
              createdAt.getFullYear() === today.getFullYear();
            break;
          case "Updated Today":
            matchesDate = updatedAt.toDateString() === today.toDateString();
            break;
          case "Updated This Week": {
            const weekAgo = new Date();
            weekAgo.setDate(today.getDate() - 7);
            matchesDate = updatedAt >= weekAgo;
            break;
          }
          case "Updated This Month":
            matchesDate =
              updatedAt.getMonth() === today.getMonth() &&
              updatedAt.getFullYear() === today.getFullYear();
            break;
          default:
            matchesDate = true;
        }
      }

      return (
        matchesSearch && matchesCategory && matchesAvailability && matchesDate
      );
    })
    .sort((a: any, b: any) => {
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

  const openAddModal = () => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const openEditModal = (item: MenuItem) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
  };

  const handleSaveItem = async (formData: FormData) => {
    try {
      if (editingItem) {
        await updateMenuItemMutation.mutateAsync({
          itemId: editingItem._id,
          formData,
        });
        toast.success("Item updated");
      } else {
        await createMenuItemMutation.mutateAsync(formData);
        toast.success("Item Added Successfully");
      }
      closeModal();
    } catch (error) {
      console.error(error);
      toast.error("Something went wrong");
    }
  };

  const openDeleteModal = (id: string) => {
    setItemToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (!itemToDelete) return;
    deleteMenuItemMutation.mutate(itemToDelete, {
      onSuccess: () => toast.success("Item deleted successfully"),
      onError: () => toast.error("Failed to delete item"),
      onSettled: () => {
        setItemToDelete(null);
        setIsDeleteModalOpen(false);
      },
    });
  };

  const cancelDelete = () => {
    if (deleteMenuItemMutation.isPending) return;
    setItemToDelete(null);
    setIsDeleteModalOpen(false);
  };

  const totalItems = menuItems.length;
  const availableItems = menuItems.filter(
    (item: any) => item.isAvailable,
  ).length;
  const unavailableItems = totalItems - availableItems;
  const totalCategories = allCategories.length;

  if (isLoading) {
    return <MenuSkeleton />;
  }

  return (
    <div className="space-y-4 p-4 md:p-6">
      {/* Header */}
      <div className="mb-5 flex flex-col gap-3 sm:mb-6 sm:gap-4 md:flex-row md:items-center md:justify-between">
        {/* Title Section */}
        <div className="min-w-0">
          <h1 className="text-xl font-bold tracking-tight text-gray-900 sm:text-2xl lg:text-3xl">
            Menu Management
          </h1>

          <p className="mt-1 max-w-xl text-xs text-gray-500 sm:text-sm">
            Manage your restaurant's menu, pricing, variants and addons.
          </p>
        </div>

        {/* Add Button */}
        <button
          onClick={openAddModal}
          className="
      inline-flex 
      h-10 
      w-full
      items-center 
      justify-center 
      gap-2 
      rounded-xl 
      bg-linear-to-r 
      from-orange-500 
      to-amber-500 
      px-4 
      text-sm 
      font-semibold 
      text-white 
      shadow-md 
      shadow-orange-200
      transition-all
      hover:-translate-y-0.5
      hover:shadow-lg
      active:scale-95

      sm:w-auto
      sm:h-11
      sm:px-5
    "
        >
          <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
          Add Menu Item
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        <div className="rounded-lg border bg-white px-3 py-2 shadow-sm">
          <p className="text-[10px] text-gray-500 leading-none">Total Items</p>
          <h2 className="mt-1 text-lg sm:text-xl lg:text-3xl font-bold text-gray-900 leading-none">
            {totalItems}
          </h2>
        </div>

        <div className="rounded-lg border bg-white px-3 py-2 shadow-sm">
          <p className="text-[10px] text-gray-500 leading-none">Available</p>
          <h2 className="mt-1 text-lg sm:text-xl lg:text-3xl font-bold text-green-600 leading-none">
            {availableItems}
          </h2>
        </div>

        <div className="rounded-lg border bg-white px-3 py-2 shadow-sm">
          <p className="text-[10px] text-gray-500 leading-none">Unavailable</p>
          <h2 className="mt-1 text-lg sm:text-xl lg:text-3xl font-bold text-red-500 leading-none">
            {unavailableItems}
          </h2>
        </div>

        <div className="rounded-lg border bg-white px-3 py-2 shadow-sm">
          <p className="text-[10px] text-gray-500 leading-none">Categories</p>
          <h2 className="mt-1 text-lg sm:text-xl lg:text-3xl font-bold text-indigo-600 leading-none">
            {totalCategories}
          </h2>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search menu..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-10 w-full rounded-lg border border-gray-300 bg-gray-50 pl-9 pr-3 text-sm text-gray-700 placeholder:text-gray-400 focus:border-orange-500 focus:bg-white focus:ring-2 focus:ring-orange-100"
          />
        </div>

        {/* Filters */}
        <div className="mt-3 grid grid-cols-2 gap-2 lg:grid-cols-4">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="h-9 rounded-lg border border-gray-300 px-2 text-xs text-gray-700 focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
          >
            <option value="All">Category</option>
            {allCategories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          <select
            value={availabilityFilter}
            onChange={(e) => setAvailabilityFilter(e.target.value)}
            className="h-9 rounded-lg border border-gray-300 px-2 text-xs text-gray-700 focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
          >
            <option value="All">Status</option>
            <option value="Available">Available</option>
            <option value="Unavailable">Unavailable</option>
          </select>

          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="h-9 rounded-lg border border-gray-300 px-2 text-xs text-gray-700 focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
          >
            <option value="All">Recent</option>
            <option value="Added Today">Today</option>
            <option value="Added Yesterday">Yesterday</option>
            <option value="Added This Week">Week</option>
            <option value="Added This Month">Month</option>
            <option value="Updated Today">Updated Today</option>
            <option value="Updated This Week">Updated Week</option>
          </select>

          <button
            onClick={() => {
              setSearchTerm("");
              setCategoryFilter("All");
              setAvailabilityFilter("All");
              setDateFilter("All");
            }}
            className="h-9 rounded-lg border border-gray-300 text-xs font-medium text-gray-600 transition hover:bg-gray-50"
          >
            Reset
          </button>
        </div>

        {/* Bottom Row */}
        <div className="mt-3 flex flex-col gap-2 border-t border-gray-100 pt-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-1.5">
            {[
              { key: "name", label: "Name" },
              { key: "category", label: "Category" },
              { key: "price", label: "Price" },
            ].map((sort) => (
              <button
                key={sort.key}
                onClick={() => handleSort(sort.key)}
                className={`rounded-full px-3 py-1 text-[11px] font-medium transition ${
                  sortField === sort.key
                    ? "bg-orange-500 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-orange-100"
                }`}
              >
                {sort.label}
                {sortField === sort.key &&
                  (sortDirection === "asc" ? " ↑" : " ↓")}
              </button>
            ))}
          </div>

          <p className="text-xs text-gray-500">
            <span className="font-semibold text-orange-600">
              {filteredItems.length}
            </span>
            {" / "}
            <span className="font-semibold">{menuItems.length}</span> items
          </p>
        </div>
      </div>

      {/* Menu items grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filteredItems.map((item: any) => (
          <div
            key={item._id}
            className="group overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
          >
            {/* Image */}
            <div className="relative h-40 sm:h-44 lg:h-48 overflow-hidden">
              <img
                src={item.image}
                alt={item.name}
                className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
              />

              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />

              {/* Food Type */}
              <div className="absolute left-2 top-2">
                <span
                  className={`rounded-full px-2 py-1 text-[10px] font-semibold ${
                    item.type === "veg"
                      ? "bg-green-600 text-white"
                      : item.type === "non-veg"
                        ? "bg-red-600 text-white"
                        : "bg-yellow-500 text-white"
                  }`}
                >
                  {item.type.toUpperCase()}
                </span>
              </div>

              {/* Actions */}
              <div className="absolute right-2 top-2 flex gap-1">
                <button
                  onClick={() => openEditModal(item)}
                  className="rounded-lg bg-white p-1.5 shadow hover:bg-blue-50"
                >
                  <Edit className="h-3.5 w-3.5 text-blue-600" />
                </button>

                <button
                  onClick={() => openDeleteModal(item._id)}
                  className="rounded-lg bg-white p-1.5 shadow hover:bg-red-50"
                >
                  <Trash2 className="h-3.5 w-3.5 text-red-600" />
                </button>
              </div>

              {/* Availability */}
              <div className="absolute bottom-2 left-2">
                <span
                  className={`rounded-full px-2 py-1 text-[10px] font-semibold ${
                    item.isAvailable
                      ? "bg-green-500 text-white"
                      : "bg-red-500 text-white"
                  }`}
                >
                  {item.isAvailable ? "Available" : "Unavailable"}
                </span>
              </div>
            </div>

            {/* Content */}
            <div className="space-y-3 p-3 sm:p-4">
              {/* Name + Price */}
              <div className="flex justify-between gap-2">
                <div className="min-w-0">
                  <h2 className="truncate text-sm sm:text-base font-bold text-gray-900">
                    {item.name}
                  </h2>

                  <p className="mt-1 line-clamp-2 text-xs sm:text-sm text-gray-500">
                    {item.description}
                  </p>
                </div>

                <span className="whitespace-nowrap text-base sm:text-lg font-bold text-orange-600">
                  ₹{item.price}
                </span>
              </div>

              {/* Category */}
              <div>
                <span className="rounded-full bg-orange-50 px-2.5 py-1 text-xs font-medium text-orange-600">
                  {item.category}
                </span>
              </div>

              {/* Variants */}
              {item.variants?.length > 0 && (
                <div>
                  <p className="mb-1 text-[10px] font-semibold uppercase text-gray-400">
                    Variants
                  </p>

                  <div className="flex flex-wrap gap-1">
                    {item.variants.map((variant: any, index: number) => (
                      <span
                        key={index}
                        className="rounded-full bg-green-100 px-2 py-1 text-[10px] font-semibold text-green-700"
                      >
                        {variant.name} ₹{variant.price}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Addons */}
              {item.addons?.length > 0 && (
                <div>
                  <p className="mb-1 text-[10px] font-semibold uppercase text-gray-400">
                    Addons
                  </p>

                  <div className="space-y-1">
                    {item.addons
                      .slice(0, 2)
                      .map((addon: any, index: number) => (
                        <div
                          key={index}
                          className="flex justify-between rounded-lg bg-gray-50 px-2 py-1 text-xs"
                        >
                          <span className="text-gray-700">{addon.name}</span>

                          <span className="font-semibold text-indigo-600">
                            ₹{addon.price}
                          </span>
                        </div>
                      ))}

                    {item.addons.length > 2 && (
                      <p className="text-[11px] text-gray-400">
                        +{item.addons.length - 2} more addons
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Footer */}
              <div className="border-t pt-2 text-[10px] text-gray-400">
                Updated {new Date(item.updatedAt).toLocaleDateString("en-GB")}
              </div>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <MenuFormModal
          item={editingItem}
          onSave={handleSaveItem}
          onClose={closeModal}
          categories={allCategories}
        />
      )}

      {isDeleteModalOpen && (
        <DeleteConfirmationModal
          onConfirm={confirmDelete}
          onCancel={cancelDelete}
          isDeleting={deleteMenuItemMutation.isPending}
        />
      )}
    </div>
  );
}

// Modal component for adding/editing menu items — unchanged (local form state only)
function MenuFormModal({ item, onSave, onClose, categories }: any) {
  const [isSaving, setIsSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [formData, setFormData] = useState({
    name: item?.name || "",
    description: item?.description || "",
    price: item?.price || "",
    category: item?.category || "",
    image: item?.image || null,
    isAvailable: item?.isAvailable ?? true,
    type: item?.type || "veg",
    isPopular: item?.isPopular ?? false,
    variants: item?.variants || [],
    prepTime: item?.prepTime || 10,
    addons: item?.addons || [],
  });
  const [preview, setPreview] = useState<string | null>(
    item?.image ? (typeof item.image === "string" ? item.image : null) : null,
  );

  const handleChange = (e: any) => {
    const { name, value, type, checked } = e.target;
    setFormData({ ...formData, [name]: type === "checkbox" ? checked : value });
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
  const handleGenerateDescription = async () => {
    if (!formData.name.trim()) {
      toast.error("Please enter the item name first.");
      return;
    }

    try {
      setGenerating(true);

      const res = await generateMenuDescription({
        name: formData.name,
        category: formData.category,
        type: formData.type,
      });

      setFormData((prev) => ({
        ...prev,
        description: res.description,
      }));

      toast.success("Description generated successfully!");
    } catch (error) {
      toast.error("Failed to generate description.");
    } finally {
      setGenerating(false);
    }
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;
    try {
      setIsSaving(true);
      const form = new FormData();
      form.append("name", formData.name);
      form.append("description", formData.description);
      form.append("price", String(Number(formData.price)));
      form.append("category", formData.category);
      form.append("type", formData.type);
      form.append("variants", JSON.stringify(formData.variants || []));
      form.append("prepTime", String(Number(formData.prepTime)));
      form.append("isPopular", String(formData.isPopular));
      form.append("isAvailable", String(formData.isAvailable));
      if (formData.image && typeof formData.image !== "string") {
        form.append("image", formData.image);
      }
      form.append("addons", JSON.stringify(formData.addons || []));
      // console.log("Form Data => ", Object.fromEntries(form));
      await onSave(form);
    } catch (error) {
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddVariant = () => {
    setFormData({
      ...formData,
      variants: [...formData.variants, { name: "", price: 0 }],
    });
  };

  const handleVariantChange = (index: number, field: string, value: any) => {
    const updated = [...formData.variants];
    updated[index][field] = value;
    setFormData({ ...formData, variants: updated });
  };

  const handleRemoveVariant = (index: number) => {
    const updated = formData.variants.filter(
      (_: any, i: number) => i !== index,
    );
    setFormData({ ...formData, variants: updated });
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl">
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category *
              </label>
              <CategoryCombobox
                name="category"
                categories={categories}
                value={formData.category}
                onChange={handleChange}
                onCreateCategory={() => {
                  /* open your create-category flow, optional */
                }}
              />
            </div>

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

              {formData.variants.length === 0 && (
                <p className="text-sm text-gray-400 italic">
                  No variants added yet.
                </p>
              )}

              <div className="space-y-3">
                {formData.variants.map((variant: any, index: number) => (
                  <div key={index} className="flex gap-3 items-start">
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

            <div className="md:col-span-2">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <label className="block text-sm font-semibold text-gray-800">
                    Description
                  </label>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Write a short description or let AI generate one for you.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleGenerateDescription}
                  disabled={generating || !formData.name.trim()}
                  className="inline-flex items-center gap-2 rounded-lg border border-violet-200 bg-violet-50 px-3 py-2 text-sm font-medium text-violet-700 transition-all hover:bg-violet-100 hover:border-violet-300 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {generating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      AI Generate
                    </>
                  )}
                </button>
              </div>

              <div className="relative">
                <textarea
                  name="description"
                  rows={5}
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Example: Soft paneer cubes cooked in a rich buttery tomato gravy with aromatic Indian spices..."
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 pr-4 text-sm text-gray-700 placeholder:text-gray-400 shadow-sm transition-all focus:border-violet-500 focus:ring-4 focus:ring-violet-100 resize-none"
                />

                <div className="absolute bottom-3 right-3 text-xs text-gray-400">
                  {formData.description.length} characters
                </div>
              </div>

              {/* <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
                <Sparkles className="h-3.5 w-3.5 text-violet-500" />
                AI generates restaurant-style descriptions suitable for Indian cafés and restaurants.
              </div> */}
            </div>
          </div>

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

          <div className="flex flex-wrap gap-6 pt-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                name="isAvailable"
                checked={formData.isAvailable}
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

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className={`px-4 py-2 border border-gray-300 rounded-lg transition ${isSaving ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "text-gray-700 hover:bg-gray-50"}`}
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSaving}
              className={`px-4 py-2 rounded-lg text-white shadow-sm transition flex items-center gap-2 ${isSaving ? "bg-orange-300 cursor-not-allowed opacity-70" : "bg-linear-to-br from-orange-400 to-amber-500 hover:opacity-90"}`}
            >
              {isSaving ? (
                <>
                  <svg
                    className="animate-spin h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                    />
                  </svg>
                  Saving...
                </>
              ) : (
                "Save Item"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function DeleteConfirmationModal({ onConfirm, onCancel, isDeleting }: any) {
  return (
    <>
      <div
        className="fixed inset-0 bg-black/20 backdrop-blur-[2px] z-40"
        onClick={() => {
          if (!isDeleting) onCancel();
        }}
      />
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
            <button
              onClick={() => {
                if (!isDeleting) onCancel();
              }}
              disabled={isDeleting}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
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

// Simple loading skeleton for the menu grid
function MenuSkeleton() {
  return (
    <div className="space-y-4 p-4 md:p-6 animate-pulse">
      <div className="h-10 w-64 bg-gray-200 rounded" />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-24 bg-gray-200 rounded-2xl" />
        ))}
      </div>
      <div className="h-24 bg-gray-200 rounded-2xl" />
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="h-96 bg-gray-200 rounded-3xl" />
        ))}
      </div>
    </div>
  );
}
