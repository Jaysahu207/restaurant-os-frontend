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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-5">
          <h3 className="text-xl font-bold text-gray-800">
            {banner ? "Edit Banner" : "Create New Banner"}
          </h3>
          <button onClick={onClose} className="rounded-xl p-2 text-gray-500 transition hover:bg-gray-100">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="mb-1 block text-sm font-semibold text-gray-700">Title *</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Summer Sale"
              className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-gray-700">Subtitle (optional)</label>
            <input
              type="text"
              name="subtitle"
              value={formData.subtitle}
              onChange={handleChange}
              placeholder="Get 20% off on all orders"
              className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-gray-700">Description</label>
            <textarea
              rows={3}
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Describe your offer..."
              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 resize-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-gray-700">Banner Image *</label>
            <div className="flex items-center gap-4">
              <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm text-gray-600 transition hover:bg-gray-50">
                <Upload size={16} />
                Upload Image
                <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
              </label>
              <p className="text-xs text-gray-500 mt-1">Recommended size: 1200 × 600 px (2:1 ratio)</p>
            </div>
            {imagePreview && (
              <div className="mt-3">
                <img src={imagePreview} alt="Preview" className="h-32 w-full rounded-xl object-cover border border-gray-200" />
              </div>
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-gray-700">Banner Type</label>
            <select
              name="type"
              value={formData.type}
              onChange={handleChange}
              className="w-full rounded-xl border border-gray-300 px-4 py-2.5"
            >
              <option value="offer">Offer</option>
              <option value="combo">Combo</option>
              <option value="festival">Festival</option>
              <option value="announcement">Announcement</option>
              <option value="special">Special</option>
              <option value="new_item">New Item</option>
            </select>
          </div>

          <div className="border-t pt-5">
            <h4 className="font-semibold text-gray-800 mb-4">Schedule</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block mb-1 text-sm font-semibold">Start Date</label>
                <input
                  type="date"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-gray-300 px-4 py-2.5"
                />
              </div>
              <div>
                <label className="block mb-1 text-sm font-semibold">End Date</label>
                <input
                  type="date"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-gray-300 px-4 py-2.5"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-xl border p-4">
            <div>
              <h4 className="font-medium">Active Banner</h4>
              <p className="text-sm text-gray-500">Visible to customers</p>
            </div>
            <label className="relative inline-flex cursor-pointer items-center">
              <input
                type="checkbox"
                name="isActive"
                checked={formData.isActive}
                onChange={handleChange}
                className="peer sr-only"
              />
              <div className="h-6 w-11 rounded-full bg-gray-300 peer-checked:bg-orange-500 transition"></div>
              <div className="absolute left-1 top-1 h-4 w-4 rounded-full bg-white transition peer-checked:translate-x-5"></div>
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-gray-300 bg-white px-5 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="rounded-xl bg-linear-to-r from-orange-600 to-amber-600 px-5 py-2 text-sm font-medium text-white shadow-md transition hover:from-orange-700 hover:to-amber-700 disabled:opacity-50"
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
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Offers & Banners</h1>
          <p className="text-sm text-gray-500">Manage promotional banners shown to customers</p>
        </div>
        <button
          onClick={() => {
            setSelectedBanner(null);
            setShowModal(true);
          }}
          className="inline-flex items-center gap-2 rounded-xl bg-linear-to-r from-orange-600 to-amber-600 px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:from-orange-700 hover:to-amber-700"
        >
          <Plus size={18} />
          Create Banner
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Banners</p>
              <h3 className="text-2xl font-bold text-gray-800">{banners.length}</h3>
            </div>
            <div className="rounded-xl bg-orange-100 p-3">
              <ImageIcon className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Views</p>
              <h3 className="text-2xl font-bold text-gray-800">{totalViews}</h3>
            </div>
            <div className="rounded-xl bg-blue-100 p-3">
              <Eye className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Clicks</p>
              <h3 className="text-2xl font-bold text-gray-800">{totalClicks}</h3>
            </div>
            <div className="rounded-xl bg-emerald-100 p-3">
              <CheckCircle className="h-6 w-6 text-emerald-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-175 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-5 py-4 text-left font-semibold text-gray-600">Banner</th>
                <th className="px-5 py-4 text-left font-semibold text-gray-600">Type</th>
                <th className="px-5 py-4 text-left font-semibold text-gray-600">Status</th>
                <th className="px-5 py-4 text-left font-semibold text-gray-600">Views</th>
                <th className="px-5 py-4 text-left font-semibold text-gray-600">Clicks</th>
                <th className="px-5 py-4 text-right font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                [...Array(3)].map((_, i) => (
                  <tr key={i}>
                    <td colSpan={6} className="px-5 py-4">
                      <div className="h-12 animate-pulse rounded bg-gray-100" />
                    </td>
                  </tr>
                ))
              ) : banners.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-gray-400">
                    No banners found. Click "Create Banner" to add one.
                  </td>
                </tr>
              ) : (
                banners.map((banner) => (
                  <tr key={banner._id} className="hover:bg-gray-50 transition">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={banner.image}
                          alt={banner.title}
                          className="h-12 w-20 rounded-lg object-cover border border-gray-200"
                        />
                        <div>
                          <p className="font-medium text-gray-800">{banner.title}</p>
                          <p className="text-xs text-gray-500 truncate max-w-45">{banner.subtitle}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 capitalize text-gray-700">{banner.type}</td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${banner.isActive ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
                          }`}
                      >
                        {banner.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-gray-700">{banner.views || 0}</td>
                    <td className="px-5 py-4 text-gray-700">{banner.clicks || 0}</td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleToggleStatus(banner._id)}
                          className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
                          title="Toggle status"
                        >
                          {banner.isActive ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                        <button
                          onClick={() => {
                            setSelectedBanner(banner);
                            setShowModal(true);
                          }}
                          className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
                          title="Edit"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(banner._id)}
                          className="rounded-lg p-2 text-red-500 hover:bg-red-50"
                          title="Delete"
                        >
                          <Trash2 size={16} />
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