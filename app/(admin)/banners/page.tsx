"use client";

import { useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  Image as ImageIcon,
  X,
  Upload,
  CheckCircle,
} from "lucide-react";
import toast from "react-hot-toast";
import { useAuthStore } from "@/store/useAuthStore";
import {
  useBanners,
  useCreateBanner,
  useUpdateBanner,
  useDeleteBanner,
  useToggleBannerStatus,
  type Banner,
} from "@/hooks/useBanners";

// ----------------------------------------------------------------------
// Banner Modal Component (Create / Edit) — unchanged local form state,
// only the submit handler now goes through mutations
// ----------------------------------------------------------------------
function BannerModal({
  banner,
  onClose,
  restaurantId,
}: {
  banner?: Banner | null;
  onClose: () => void;
  restaurantId: string;
}) {
  const [formData, setFormData] = useState({
    title: banner?.title || "",
    subtitle: banner?.subtitle || "",
    description: banner?.description || "",
    type: banner?.type || "offer",
    actionType: banner?.actionType || "none",
    actionTarget: banner?.actionTarget || "",
    buttonText: banner?.buttonText || "",
    priority: banner?.priority ?? 0,
    startDate: banner?.startDate ? banner.startDate.slice(0, 10) : "",
    endDate: banner?.endDate ? banner.endDate.slice(0, 10) : "",
    isActive: banner?.isActive ?? true,
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>(banner?.image || "");

  const createBannerMutation = useCreateBanner(restaurantId);
  const updateBannerMutation = useUpdateBanner(restaurantId);
  const isSaving = createBannerMutation.isPending || updateBannerMutation.isPending;

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image");
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast.error("Title is required");
      return;
    }
    if (!banner && !imageFile) {
      toast.error("Please upload an image");
      return;
    }

    const payload = { ...formData, restaurantId, image: imageFile };

    try {
      if (banner?._id) {
        await updateBannerMutation.mutateAsync({ bannerId: banner._id, payload });
        toast.success("Banner updated successfully");
      } else {
        await createBannerMutation.mutateAsync(payload);
        toast.success("Banner created successfully");
      }
      onClose();
    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data?.message || "Operation failed");
    }
  };

  // --- RENDER with compact design ---
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-3 sm:p-4">
      <div className="w-full max-w-lg max-h-[95vh] overflow-y-auto rounded-xl bg-white shadow-xl border border-gray-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
          <h3 className="text-base font-bold text-gray-800">
            {banner ? "Edit Banner" : "Create New Banner"}
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 transition"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-3">
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Summer Sale"
              className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
              required
            />
          </div>

          {/* Subtitle */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Subtitle
            </label>
            <input
              type="text"
              name="subtitle"
              value={formData.subtitle}
              onChange={handleChange}
              placeholder="Get 20% off on all orders"
              className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Description
            </label>
            <textarea
              rows={2}
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Describe your offer..."
              className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 resize-none"
            />
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Banner Image <span className="text-red-500">*</span>
            </label>
            <div className="flex flex-wrap items-center gap-3">
              <label className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50 transition">
                <Upload size={14} />
                Upload
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
              <span className="text-xs text-gray-400">
                Recommended: 1200×600px (2:1)
              </span>
            </div>
            {imagePreview && (
              <div className="mt-2">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="h-24 w-full rounded-lg object-cover border border-gray-200"
                />
              </div>
            )}
          </div>

          {/* Type */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Banner Type
            </label>
            <select
              name="type"
              value={formData.type}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm outline-none focus:border-orange-400"
            >
              <option value="offer">Offer</option>
              <option value="combo">Combo</option>
              <option value="festival">Festival</option>
              <option value="announcement">Announcement</option>
              <option value="special">Special</option>
              <option value="new_item">New Item</option>
            </select>
          </div>

          {/* Schedule (optional) */}
          <div className="border-t border-gray-100 pt-3">
            <h4 className="text-xs font-semibold text-gray-700 mb-2">Schedule (optional)</h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-0.5">Start Date</label>
                <input
                  type="date"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm outline-none focus:border-orange-400"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-0.5">End Date</label>
                <input
                  type="date"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm outline-none focus:border-orange-400"
                />
              </div>
            </div>
          </div>

          {/* Active toggle */}
          <div className="flex items-center justify-between rounded-lg border border-gray-200 p-3">
            <div>
              <h4 className="text-sm font-medium text-gray-800">Active</h4>
              <p className="text-xs text-gray-500">Visible to customers</p>
            </div>
            <label className="relative inline-flex cursor-pointer items-center">
              <input
                type="checkbox"
                name="isActive"
                checked={formData.isActive}
                onChange={handleChange}
                className="peer sr-only"
              />
              <div className="h-5 w-10 rounded-full bg-gray-300 peer-checked:bg-orange-500 transition"></div>
              <div className="absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white transition peer-checked:translate-x-5"></div>
            </label>
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-300 bg-white px-4 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="rounded-lg bg-linear-to-r from-orange-600 to-amber-600 px-4 py-1.5 text-sm font-medium text-white shadow-sm hover:from-orange-700 hover:to-amber-700 disabled:opacity-50 transition"
            >
              {isSaving ? "Saving..." : banner ? "Update" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------
// Main Component
// ----------------------------------------------------------------------
export default function BannerManagement() {
  const { restaurant } = useAuthStore();
  const restaurantId = restaurant?._id;

  const [showModal, setShowModal] = useState(false);
  const [selectedBanner, setSelectedBanner] = useState<Banner | null>(null);

  const { data: banners = [], isLoading } = useBanners(restaurantId);
  const deleteBannerMutation = useDeleteBanner(restaurantId);
  const toggleStatusMutation = useToggleBannerStatus(restaurantId);

  const handleDelete = (bannerId: string) => {
    if (!confirm("Are you sure you want to delete this banner?")) return;
    deleteBannerMutation.mutate(bannerId, {
      onSuccess: () => toast.success("Banner deleted"),
      onError: () => toast.error("Delete failed"),
    });
  };

  const handleToggleStatus = (bannerId: string) => {
    toggleStatusMutation.mutate(bannerId, {
      onSuccess: () => toast.success("Status updated"),
      onError: () => toast.error("Failed to update status"),
    });
  };

  const totalViews = banners.reduce((acc, b) => acc + (b.views || 0), 0);
  const totalClicks = banners.reduce((acc, b) => acc + (b.clicks || 0), 0);

  return (
    <div className="space-y-4 p-3 sm:p-4">
      {/* Header - compact */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-gray-800">
            Offers & Banners
          </h1>
          <p className="text-xs text-gray-500">
            Manage promotional banners shown to customers
          </p>
        </div>
        <button
          onClick={() => {
            setSelectedBanner(null);
            setShowModal(true);
          }}
          className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-orange-600 to-amber-600 px-3 py-1.5 text-sm font-semibold text-white shadow-sm hover:from-orange-700 hover:to-amber-700 transition"
        >
          <Plus size={16} />
          Create Banner
        </button>
      </div>

      {/* Stats - compact cards */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500">Total Banners</p>
            <h3 className="text-lg font-bold text-gray-800">{banners.length}</h3>
          </div>
          <div className="rounded-lg bg-orange-100 p-2">
            <ImageIcon className="h-4 w-4 text-orange-600" />
          </div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500">Total Views</p>
            <h3 className="text-lg font-bold text-gray-800">{totalViews}</h3>
          </div>
          <div className="rounded-lg bg-blue-100 p-2">
            <Eye className="h-4 w-4 text-blue-600" />
          </div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm flex items-center justify-between col-span-2 md:col-span-1">
          <div>
            <p className="text-xs text-gray-500">Total Clicks</p>
            <h3 className="text-lg font-bold text-gray-800">{totalClicks}</h3>
          </div>
          <div className="rounded-lg bg-emerald-100 p-2">
            <CheckCircle className="h-4 w-4 text-emerald-600" />
          </div>
        </div>
      </div>

      {/* Table - compact */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm ">
        <div className="overflow-x-auto [-ms-overflow-style:none]
    [scrollbar-width:none]
    [&::-webkit-scrollbar]:hidden">
          <table className="w-full min-w-[640px] text-xs">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left font-semibold text-gray-600">
                  Banner
                </th>
                <th className="px-3 py-2 text-left font-semibold text-gray-600">
                  Type
                </th>
                <th className="px-3 py-2 text-left font-semibold text-gray-600">
                  Status
                </th>
                <th className="px-3 py-2 text-left font-semibold text-gray-600">
                  Views
                </th>
                <th className="px-3 py-2 text-left font-semibold text-gray-600">
                  Clicks
                </th>
                <th className="px-3 py-2 text-right font-semibold text-gray-600">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 ">
              {isLoading ? (
                [...Array(3)].map((_, i) => (
                  <tr key={i}>
                    <td colSpan={6} className="px-3 py-3">
                      <div className="h-10 animate-pulse rounded bg-gray-100" />
                    </td>
                  </tr>
                ))
              ) : banners.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-3 py-10 text-center text-gray-400">
                    No banners found. Click "Create Banner" to add one.
                  </td>
                </tr>
              ) : (
                banners.map((banner) => (
                  <tr key={banner._id} className="hover:bg-gray-50 transition ">
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2 ">
                        <img
                          src={banner.image}
                          alt={banner.title}
                          className="h-10 w-16 rounded-lg object-cover border border-gray-200"
                        />
                        <div>
                          <p className="font-medium text-gray-800 text-xs sm:text-sm">
                            {banner.title}
                          </p>
                          <p className="text-xs text-gray-500 truncate max-w-[120px] sm:max-w-[200px]">
                            {banner.subtitle}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2 capitalize text-gray-700 text-xs">
                      {banner.type}
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${banner.isActive
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-red-100 text-red-700"
                          }`}
                      >
                        {banner.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-gray-700 text-xs">
                      {banner.views || 0}
                    </td>
                    <td className="px-3 py-2 text-gray-700 text-xs">
                      {banner.clicks || 0}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleToggleStatus(banner._id)}
                          className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 transition"
                          title="Toggle status"
                        >
                          {banner.isActive ? (
                            <EyeOff size={14} />
                          ) : (
                            <Eye size={14} />
                          )}
                        </button>
                        <button
                          onClick={() => {
                            setSelectedBanner(banner);
                            setShowModal(true);
                          }}
                          className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 transition"
                          title="Edit"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(banner._id)}
                          className="rounded-lg p-1.5 text-red-500 hover:bg-red-50 transition"
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && restaurantId && (
        <BannerModal
          banner={selectedBanner}
          onClose={() => setShowModal(false)}
          restaurantId={restaurantId}
        />
      )}
    </div>

  );
}