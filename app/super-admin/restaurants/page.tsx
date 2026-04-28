"use client";

import { useEffect, useState } from "react";
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Eye,
  X,
  Save,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import {
  getAllRestaurants,
  createRestaurant as createRestaurantService,
  updateRestaurant as updateRestaurantService,
  deleteRestaurant as deleteRestaurantService,
  getRestaurantDetails,
} from "../../../services/superAdminService";

interface PaginatedResponse {
  restaurants: any[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ----------------------------------------------------------------------
// Types (optional but helpful)
// ----------------------------------------------------------------------
interface RestaurantFormData {
  name: string;
  email: string;
  phone: string;
  address: {
    street: string;
    city: string;
    state: string;
    pincode: string;
  };
  business: {
    type: string;
    cuisines: string[];
  };
  legal: {
    fssaiNumber: string;
    gstNumber: string;
    panNumber: string;
  };
  tax: {
    cgst: number;
    sgst: number;
    igst: number;
    serviceCharge: number;
  };
  billing: {
    invoicePrefix: string;
    invoiceStart: number;
    enableTaxes: boolean;
    enableServiceCharge: boolean;
    roundOff: boolean;
  };
  operations: {
    tableCount: number;
    dineIn: boolean;
    takeaway: boolean;
    delivery: boolean;
  };
  timings: {
    openTime: string;
    closeTime: string;
  };
  upiId: string;
  currency: string;
  timezone: string;
  subscriptionStatus: string;
  isActive: boolean;
}

// ----------------------------------------------------------------------
// Add / Edit Restaurant Modal
// ----------------------------------------------------------------------
function RestaurantFormModal({
  initialData,
  onClose,
  onSave,
}: {
  initialData?: any;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
}) {
  const isEdit = !!initialData?._id;

  // Form state
  const [formData, setFormData] = useState<RestaurantFormData>({
    name: initialData?.name || "",
    email: initialData?.contactEmail || initialData?.email || "",
    phone: initialData?.contactPhone || initialData?.phone || "",
    address: {
      street: initialData?.address?.street || "",
      city: initialData?.address?.city || "",
      state: initialData?.address?.state || "",
      pincode: initialData?.address?.pincode || "",
    },
    business: {
      type: initialData?.business?.type || "restaurant",
      cuisines: initialData?.business?.cuisines || [],
    },
    legal: {
      fssaiNumber: initialData?.legal?.fssaiNumber || "",
      gstNumber: initialData?.legal?.gstNumber || "",
      panNumber: initialData?.legal?.panNumber || "",
    },
    tax: {
      cgst: initialData?.tax?.cgst || 0,
      sgst: initialData?.tax?.sgst || 0,
      igst: initialData?.tax?.igst || 0,
      serviceCharge: initialData?.tax?.serviceCharge || 0,
    },
    billing: {
      invoicePrefix: initialData?.billing?.invoicePrefix || "INV-",
      invoiceStart: initialData?.billing?.invoiceStart || 1001,
      enableTaxes: initialData?.billing?.enableTaxes ?? true,
      enableServiceCharge: initialData?.billing?.enableServiceCharge ?? false,
      roundOff: initialData?.billing?.roundOff ?? true,
    },
    operations: {
      tableCount: initialData?.operations?.tableCount || 0,
      dineIn: initialData?.operations?.dineIn ?? true,
      takeaway: initialData?.operations?.takeaway ?? true,
      delivery: initialData?.operations?.delivery ?? false,
    },
    timings: {
      openTime: initialData?.timings?.openTime || "09:00",
      closeTime: initialData?.timings?.closeTime || "21:00",
    },
    upiId: initialData?.upiId || "",
    currency: initialData?.currency || "INR",
    timezone: initialData?.timezone || "Asia/Kolkata",
    subscriptionStatus: initialData?.subscriptionStatus || "trial",
    isActive: initialData?.isActive ?? true,
  });

  const [loading, setLoading] = useState(false);
  const [cuisineInput, setCuisineInput] = useState("");

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      // Handle nested fields via dot notation in name
      if (name.includes(".")) {
        const [parent, child] = name.split(".");
        setFormData((prev) => ({
          ...prev,
          [parent]: {
            ...(prev as any)[parent],
            [child]: checked,
          },
        }));
      } else {
        setFormData((prev) => ({ ...prev, [name]: checked }));
      }
    } else {
      if (name.includes(".")) {
        const [parent, child] = name.split(".");
        setFormData((prev) => ({
          ...prev,
          [parent]: {
            ...(prev as any)[parent],
            [child]: value,
          },
        }));
      } else {
        setFormData((prev) => ({ ...prev, [name]: value }));
      }
    }
  };

  const addCuisine = () => {
    if (
      cuisineInput.trim() &&
      !formData.business.cuisines.includes(cuisineInput.trim())
    ) {
      setFormData((prev) => ({
        ...prev,
        business: {
          ...prev.business,
          cuisines: [...prev.business.cuisines, cuisineInput.trim()],
        },
      }));
      setCuisineInput("");
    }
  };

  const removeCuisine = (cuisine: string) => {
    setFormData((prev) => ({
      ...prev,
      business: {
        ...prev.business,
        cuisines: prev.business.cuisines.filter((c) => c !== cuisine),
      },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Build payload matching backend expected structure
      const payload = {
        name: formData.name,
        contactEmail: formData.email,
        contactPhone: formData.phone,
        address: formData.address,
        business: formData.business,
        legal: formData.legal,
        tax: formData.tax,
        billing: formData.billing,
        operations: formData.operations,
        timings: formData.timings,
        upiId: formData.upiId,
        currency: formData.currency,
        timezone: formData.timezone,
        subscriptionStatus: formData.subscriptionStatus,
        isActive: formData.isActive,
      };
      await onSave(payload);
      onClose();
    } catch (error) {
      console.error("Save error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-slate-800">
            {isEdit ? "Edit Restaurant" : "Add New Restaurant"}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-100"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Info */}
          <section>
            <h3 className="text-md font-semibold text-indigo-600 mb-3">
              Basic Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Restaurant Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="mt-1 w-full border rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Contact Email *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="mt-1 w-full border rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Contact Phone
                </label>
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="mt-1 w-full border rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">
                  UPI ID
                </label>
                <input
                  type="text"
                  name="upiId"
                  value={formData.upiId}
                  onChange={handleChange}
                  className="mt-1 w-full border rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Currency
                </label>
                <select
                  name="currency"
                  value={formData.currency}
                  onChange={handleChange}
                  className="mt-1 w-full border rounded-lg px-3 py-2 text-sm"
                >
                  <option value="INR">INR</option>
                  <option value="USD">USD</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Timezone
                </label>
                <select
                  name="timezone"
                  value={formData.timezone}
                  onChange={handleChange}
                  className="mt-1 w-full border rounded-lg px-3 py-2 text-sm"
                >
                  <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                  <option value="America/New_York">
                    America/New_York (EST)
                  </option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Subscription Plan
                </label>
                <select
                  name="subscriptionStatus"
                  value={formData.subscriptionStatus}
                  onChange={handleChange}
                  className="mt-1 w-full border rounded-lg px-3 py-2 text-sm"
                >
                  <option value="trial">Trial</option>
                  <option value="active">Active</option>
                  <option value="expired">Expired</option>
                </select>
              </div>
              <div className="flex items-center mt-6">
                <input
                  type="checkbox"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleChange}
                  className="h-4 w-4 text-indigo-600 rounded"
                />
                <label className="ml-2 text-sm text-slate-700">Active</label>
              </div>
            </div>
          </section>

          {/* Address */}
          <section>
            <h3 className="text-md font-semibold text-indigo-600 mb-3">
              Address
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                name="address.street"
                placeholder="Street"
                value={formData.address.street}
                onChange={handleChange}
                className="border rounded-lg px-3 py-2 text-sm"
              />
              <input
                type="text"
                name="address.city"
                placeholder="City"
                value={formData.address.city}
                onChange={handleChange}
                className="border rounded-lg px-3 py-2 text-sm"
              />
              <input
                type="text"
                name="address.state"
                placeholder="State"
                value={formData.address.state}
                onChange={handleChange}
                className="border rounded-lg px-3 py-2 text-sm"
              />
              <input
                type="text"
                name="address.pincode"
                placeholder="Pincode"
                value={formData.address.pincode}
                onChange={handleChange}
                className="border rounded-lg px-3 py-2 text-sm"
              />
            </div>
          </section>

          {/* Business */}
          <section>
            <h3 className="text-md font-semibold text-indigo-600 mb-3">
              Business
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <select
                name="business.type"
                value={formData.business.type}
                onChange={handleChange}
                className="border rounded-lg px-3 py-2 text-sm"
              >
                <option value="restaurant">Restaurant</option>
                <option value="cafe">Cafe</option>
                <option value="dhaba">Dhaba</option>
              </select>
              <div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Add cuisine (e.g., Italian)"
                    value={cuisineInput}
                    onChange={(e) => setCuisineInput(e.target.value)}
                    className="flex-1 border rounded-lg px-3 py-2 text-sm"
                  />
                  <button
                    type="button"
                    onClick={addCuisine}
                    className="px-3 py-2 bg-indigo-100 text-indigo-700 rounded-lg text-sm"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.business.cuisines.map((cuisine) => (
                    <span
                      key={cuisine}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 rounded-full text-xs"
                    >
                      {cuisine}
                      <button
                        type="button"
                        onClick={() => removeCuisine(cuisine)}
                        className="text-slate-500 hover:text-rose-500"
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Legal */}
          <section>
            <h3 className="text-md font-semibold text-indigo-600 mb-3">
              Legal Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input
                type="text"
                name="legal.fssaiNumber"
                placeholder="FSSAI Number"
                value={formData.legal.fssaiNumber}
                onChange={handleChange}
                className="border rounded-lg px-3 py-2 text-sm"
              />
              <input
                type="text"
                name="legal.gstNumber"
                placeholder="GST Number"
                value={formData.legal.gstNumber}
                onChange={handleChange}
                className="border rounded-lg px-3 py-2 text-sm"
              />
              <input
                type="text"
                name="legal.panNumber"
                placeholder="PAN Number"
                value={formData.legal.panNumber}
                onChange={handleChange}
                className="border rounded-lg px-3 py-2 text-sm"
              />
            </div>
          </section>

          {/* Tax Rates */}
          <section>
            <h3 className="text-md font-semibold text-indigo-600 mb-3">
              Tax Rates (%)
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="text-sm">CGST</label>
                <input
                  type="number"
                  name="tax.cgst"
                  value={formData.tax.cgst}
                  onChange={handleChange}
                  step="0.1"
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-sm">SGST</label>
                <input
                  type="number"
                  name="tax.sgst"
                  value={formData.tax.sgst}
                  onChange={handleChange}
                  step="0.1"
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-sm">IGST</label>
                <input
                  type="number"
                  name="tax.igst"
                  value={formData.tax.igst}
                  onChange={handleChange}
                  step="0.1"
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-sm">Service Charge</label>
                <input
                  type="number"
                  name="tax.serviceCharge"
                  value={formData.tax.serviceCharge}
                  onChange={handleChange}
                  step="0.1"
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                />
              </div>
            </div>
          </section>

          {/* Billing Settings */}
          <section>
            <h3 className="text-md font-semibold text-indigo-600 mb-3">
              Billing Settings
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm">Invoice Prefix</label>
                <input
                  type="text"
                  name="billing.invoicePrefix"
                  value={formData.billing.invoicePrefix}
                  onChange={handleChange}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-sm">Start Number</label>
                <input
                  type="number"
                  name="billing.invoiceStart"
                  value={formData.billing.invoiceStart}
                  onChange={handleChange}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="billing.enableTaxes"
                  checked={formData.billing.enableTaxes}
                  onChange={handleChange}
                />
                <span className="text-sm">Enable Taxes</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="billing.enableServiceCharge"
                  checked={formData.billing.enableServiceCharge}
                  onChange={handleChange}
                />
                <span className="text-sm">Enable Service Charge</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="billing.roundOff"
                  checked={formData.billing.roundOff}
                  onChange={handleChange}
                />
                <span className="text-sm">Round Off</span>
              </label>
            </div>
          </section>

          {/* Operations */}
          <section>
            <h3 className="text-md font-semibold text-indigo-600 mb-3">
              Operations
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="text-sm">Table Count</label>
                <input
                  type="number"
                  name="operations.tableCount"
                  value={formData.operations.tableCount}
                  onChange={handleChange}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="operations.dineIn"
                  checked={formData.operations.dineIn}
                  onChange={handleChange}
                />
                <span className="text-sm">Dine In</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="operations.takeaway"
                  checked={formData.operations.takeaway}
                  onChange={handleChange}
                />
                <span className="text-sm">Takeaway</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="operations.delivery"
                  checked={formData.operations.delivery}
                  onChange={handleChange}
                />
                <span className="text-sm">Delivery</span>
              </label>
            </div>
          </section>

          {/* Timings */}
          <section>
            <h3 className="text-md font-semibold text-indigo-600 mb-3">
              Operating Hours
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm">Open Time</label>
                <input
                  type="time"
                  name="timings.openTime"
                  value={formData.timings.openTime}
                  onChange={handleChange}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-sm">Close Time</label>
                <input
                  type="time"
                  name="timings.closeTime"
                  value={formData.timings.closeTime}
                  onChange={handleChange}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                />
              </div>
            </div>
          </section>

          <div className="sticky bottom-0 bg-white border-t px-6 py-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded-lg text-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading ? "Saving..." : "Save Restaurant"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------
// Delete Confirmation Modal
// ----------------------------------------------------------------------
function DeleteConfirmModal({
  restaurantName,
  onConfirm,
  onClose,
}: {
  restaurantName: string;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <h3 className="text-lg font-bold text-slate-800">Delete Restaurant</h3>
        <p className="mt-2 text-slate-600">
          Are you sure you want to delete <strong>{restaurantName}</strong>?
          This action cannot be undone.
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border rounded-lg text-slate-700"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------
// Subscription Update Modal (or inline dropdown)
// ----------------------------------------------------------------------
function SubscriptionModal({
  restaurant,
  onClose,
  onUpdate,
}: {
  restaurant: any;
  onClose: () => void;
  onUpdate: (id: string, newPlan: string) => Promise<void>;
}) {
  const [plan, setPlan] = useState(restaurant.subscriptionStatus || "trial");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    await onUpdate(restaurant._id, plan);
    setLoading(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <h3 className="text-lg font-bold text-slate-800">
          Update Subscription
        </h3>
        <p className="mt-1 text-sm text-slate-500">
          Restaurant: {restaurant.name}
        </p>
        <div className="mt-4">
          <label className="block text-sm font-medium text-slate-700">
            Plan
          </label>
          <select
            value={plan}
            onChange={(e) => setPlan(e.target.value)}
            className="mt-1 w-full border rounded-lg px-3 py-2"
          >
            <option value="trial">Trial</option>
            <option value="active">Active</option>
            <option value="expired">Expired</option>
          </select>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 border rounded-lg">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            {loading ? "Updating..." : "Update"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------
// Main Restaurants Page
// ----------------------------------------------------------------------
export default function RestaurantsPage() {
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(false);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Sorting state
  const [sortBy, setSortBy] = useState<"name" | "createdAt">("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc"); // newest first by

  // Modal states
  const [selectedRestaurant, setSelectedRestaurant] = useState<any>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingRestaurant, setEditingRestaurant] = useState<any>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<any>(null);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState<any>(null);
  const [showViewModal, setShowViewModal] = useState(false);

  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    getRestaurants();
  }, [
    currentPage,
    pageSize,
    sortBy,
    sortOrder,
    search,
    planFilter,
    statusFilter,
  ]);

  const getRestaurants = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("page", currentPage.toString());
      params.append("limit", pageSize.toString());
      params.append("sort", sortBy);
      params.append("order", sortOrder);
      if (search) params.append("search", search);
      if (planFilter !== "all") params.append("plan", planFilter);
      if (statusFilter !== "all") params.append("status", statusFilter);

      const response = await getAllRestaurants();

      setRestaurants(response.restaurants);
      setTotalPages(response.totalPages);
    } catch (error) {
      console.error("Error fetching restaurants:", error);
    } finally {
      setLoading(false);
    }
  };
  // Reset to page 1 when filters/sort change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, planFilter, statusFilter, sortBy, sortOrder, pageSize]);
  // Pagination controls
  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };
  const updateSubscription = async (id: string, newPlan: string) => {
    await API.patch(`/api/super-admin/restaurants/${id}/subscription`, {
      subscriptionStatus: newPlan,
    });
    await getRestaurants(); // refresh list
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteRestaurantService(id);

      await getRestaurants();

      setShowDeleteConfirm(null);
    } catch (error) {
      console.error("Delete restaurant failed", error);
    }
  };
  const SortIndicator = ({ column }: { column: string }) => {
    if (sortBy !== column)
      return <span className="ml-1 text-slate-300">↕️</span>;
    return <span className="ml-1">{sortOrder === "asc" ? "↑" : "↓"}</span>;
  };
  const handleSort = (column: "name" | "createdAt") => {
    if (sortBy === column) {
      // toggle order
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder(column === "createdAt" ? "desc" : "asc"); // default: newest first for date, A-Z for name
    }
  };
  // Filter logic
  const filtered = restaurants.filter((r) => {
    const matchesSearch =
      r.name?.toLowerCase().includes(search.toLowerCase()) ||
      r.owner?.toLowerCase().includes(search.toLowerCase()) ||
      (r.contactEmail || r.email || "")
        .toLowerCase()
        .includes(search.toLowerCase());
    const matchesPlan =
      planFilter === "all" || r.subscriptionStatus === planFilter;
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && r.isActive) ||
      (statusFilter === "inactive" && !r.isActive);
    return matchesSearch && matchesPlan && matchesStatus;
  });

  const getStatusBadge = (isActive: boolean) =>
    isActive ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700";

  const formatDate = (dateStr: string) =>
    dateStr ? new Date(dateStr).toLocaleDateString() : "—";

  // Handlers
  const handleAddSave = async (data: any) => {
    await createRestaurantService(data);
    await getRestaurants();
    setShowAddModal(false);
  };

  const handleEditSave = async (data: any) => {
    if (editingRestaurant) {
      await updateRestaurantService(editingRestaurant._id, data);
      await getRestaurants();
      setShowEditModal(false);
      setEditingRestaurant(null);
    }
  };

  const openEditModal = (restaurant: any) => {
    setEditingRestaurant(restaurant);
    setShowEditModal(true);
  };

  const openSubscriptionModal = (restaurant: any) => {
    setShowSubscriptionModal(restaurant);
  };
  const handleViewRestaurant = async (id: string) => {
    try {
      setDetailLoading(true);
      const response = await getRestaurantDetails(id);

      setSelectedRestaurant(response);
      setShowViewModal(true);
    } catch (error) {
      console.error(error);
    } finally {
      setDetailLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Restaurants</h1>
          <p className="text-slate-500 text-sm">
            Manage all partner restaurants
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm transition text-sm font-medium"
        >
          <Plus size={16} /> Add Restaurant
        </button>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, owner or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg w-64 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={planFilter}
            onChange={(e) => setPlanFilter(e.target.value)}
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white"
          >
            <option value="all">All Plans</option>
            <option value="trial">Trial</option>
            <option value="active">Active</option>
            <option value="expired">Expired</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <select
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white"
          >
            <option value="10">10 per page</option>
            <option value="25">25 per page</option>
            <option value="50">50 per page</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th
                  className="px-5 py-3 text-left text-slate-600 font-semibold cursor-pointer"
                  onClick={() => handleSort("name")}
                >
                  Restaurant Name <SortIndicator column="name" />
                </th>
                <th className="px-5 py-3 text-left text-slate-600 font-semibold">
                  Owner / Email
                </th>
                <th className="px-5 py-3 text-left text-slate-600 font-semibold">
                  Plan
                </th>
                <th
                  className="px-5 py-3 text-left text-slate-600 font-semibold cursor-pointer"
                  onClick={() => handleSort("createdAt")}
                >
                  Joined <SortIndicator column="createdAt" />
                </th>
                <th className="px-5 py-3 text-left text-slate-600 font-semibold">
                  Status
                </th>
                <th className="px-5 py-3 text-right text-slate-600 font-semibold">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((restaurant) => (
                <tr
                  key={restaurant._id}
                  className="hover:bg-slate-50 transition"
                >
                  <td className="px-5 py-3 font-medium text-slate-800">
                    {restaurant.name}
                  </td>
                  <td className="px-5 py-3">
                    <div>{restaurant.owner || "—"}</div>
                    <div className="text-xs text-slate-400">
                      {restaurant.contactEmail || restaurant.email || "—"}
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <button
                      onClick={() => openSubscriptionModal(restaurant)}
                      className="inline-flex items-center px-2 py-1 rounded-md bg-indigo-50 text-indigo-700 text-xs font-medium hover:bg-indigo-100"
                    >
                      {restaurant.subscriptionStatus || "trial"}
                    </button>
                  </td>
                  <td className="px-5 py-3 text-slate-600">
                    {formatDate(restaurant.createdAt)}
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(restaurant.isActive)}`}
                    >
                      {restaurant.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleViewRestaurant(restaurant._id)}
                        className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500"
                        title="View details"
                      >
                        <Eye size={15} />
                      </button>
                      <button
                        onClick={() => openEditModal(restaurant)}
                        className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500"
                      >
                        <Edit2 size={15} />
                      </button>
                      <button
                        onClick={() => setShowDeleteConfirm(restaurant)}
                        className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-500"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!loading && (
          <div className="px-5 py-4 border-t border-slate-200 flex items-center justify-between">
            <div className="text-sm text-slate-500">
              Showing {(currentPage - 1) * pageSize + 1} to{" "}
              {Math.min(
                currentPage * pageSize,
                restaurants.length + (currentPage - 1) * pageSize,
              )}{" "}
              of {totalPages * pageSize} restaurants
            </div>
            <div className="flex gap-2 items-center">
              <button
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border border-slate-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-sm">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg border border-slate-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}

        {loading && (
          <div className="text-center py-12 text-slate-400">Loading...</div>
        )}
        {!loading && restaurants.length === 0 && (
          <div className="text-center py-12 text-slate-400">
            No restaurants found
          </div>
        )}
      </div>

      {/* Modals */}
      {showViewModal &&
        (detailLoading ? (
          <div className="fixed inset-0 flex items-center justify-center bg-black/50">
            <div className="bg-white p-6 rounded-lg">Loading details...</div>
          </div>
        ) : (
          <RestaurantDetailModal
            restaurant={selectedRestaurant}
            onClose={() => setShowViewModal(false)}
          />
        ))}

      {showAddModal && (
        <RestaurantFormModal
          onClose={() => setShowAddModal(false)}
          onSave={handleAddSave}
        />
      )}

      {showEditModal && editingRestaurant && (
        <RestaurantFormModal
          initialData={editingRestaurant}
          onClose={() => {
            setShowEditModal(false);
            setEditingRestaurant(null);
          }}
          onSave={handleEditSave}
        />
      )}

      {showDeleteConfirm && (
        <DeleteConfirmModal
          restaurantName={showDeleteConfirm.name}
          onConfirm={() => handleDelete(showDeleteConfirm._id)}
          onClose={() => setShowDeleteConfirm(null)}
        />
      )}

      {showSubscriptionModal && (
        <SubscriptionModal
          restaurant={showSubscriptionModal}
          onClose={() => setShowSubscriptionModal(null)}
          onUpdate={updateSubscription}
        />
      )}
    </div>
  );
}

// ----------------------------------------------------------------------
// Modal Component for Restaurant Details
// ----------------------------------------------------------------------
function RestaurantDetailModal({
  restaurant,
  onClose,
}: {
  restaurant: any;
  onClose: () => void;
}) {
  if (!restaurant) return null;

  const renderValue = (value: any) =>
    value !== undefined && value !== null && value !== "" ? value : "—";

  const formatDate = (dateStr: string) =>
    dateStr ? new Date(dateStr).toLocaleDateString() : "—";

  // Helper to render status badge
  const StatusBadge = ({ active }: { active: boolean }) => (
    <span
      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
        active ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
      }`}
    >
      {active ? "Active" : "Inactive"}
    </span>
  );

  // Staff statistics
  const totalStaff = restaurant.staff?.length || 0;
  const managers =
    restaurant.staff?.filter((s: any) => s.role === "manager").length || 0;
  const waiters =
    restaurant.staff?.filter((s: any) => s.role === "waiter").length || 0;
  const activeStaff =
    restaurant.staff?.filter((s: any) => s.isActive).length || 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center z-10">
          <div>
            <h2 className="text-xl font-bold text-slate-800">
              {restaurant.name}
            </h2>
            <p className="text-sm text-slate-500 mt-0.5">Restaurant details</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100"
          >
            ✕
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* ========== 1. Basic Information Card ========== */}
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <div className="bg-slate-50 px-5 py-3 border-b">
              <h3 className="font-semibold text-slate-800">
                📋 Basic Information
              </h3>
            </div>
            <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 text-sm">
              <div>
                <span className="text-slate-500 font-medium">
                  Restaurant ID:
                </span>{" "}
                <span className="font-mono text-xs">{restaurant._id}</span>
              </div>
              <div>
                <span className="text-slate-500 font-medium">Slug:</span>{" "}
                {renderValue(restaurant.slug)}
              </div>
              <div>
                <span className="text-slate-500 font-medium">
                  Contact Email:
                </span>{" "}
                {renderValue(restaurant.contactEmail || restaurant.email)}
              </div>
              <div>
                <span className="text-slate-500 font-medium">
                  Contact Phone:
                </span>{" "}
                {renderValue(restaurant.contactPhone || restaurant.phone)}
              </div>
              <div>
                <span className="text-slate-500 font-medium">UPI ID:</span>{" "}
                {renderValue(restaurant.upiId)}
              </div>
              <div>
                <span className="text-slate-500 font-medium">Currency:</span>{" "}
                {renderValue(restaurant.currency)}
              </div>
              <div>
                <span className="text-slate-500 font-medium">Timezone:</span>{" "}
                {renderValue(restaurant.timezone)}
              </div>
              <div>
                <span className="text-slate-500 font-medium">
                  Subscription:
                </span>{" "}
                <span className="inline-block px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-full text-xs">
                  {renderValue(restaurant.subscriptionStatus)}
                </span>
              </div>
              <div>
                <span className="text-slate-500 font-medium">Status:</span>{" "}
                <StatusBadge active={restaurant.isActive} />
              </div>
              <div>
                <span className="text-slate-500 font-medium">Created:</span>{" "}
                {formatDate(restaurant.createdAt)}
              </div>
              <div>
                <span className="text-slate-500 font-medium">
                  Last updated:
                </span>{" "}
                {formatDate(restaurant.updatedAt)}
              </div>
            </div>
          </div>

          {/* ========== 2. Owner Information (only if owner exists) ========== */}
          {(restaurant.owner || restaurant.ownerId) && (
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <div className="bg-slate-50 px-5 py-3 border-b">
                <h3 className="font-semibold text-slate-800">
                  👤 Owner Information
                </h3>
              </div>
              <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 text-sm">
                {restaurant.owner?.name && (
                  <div>
                    <span className="text-slate-500 font-medium">Name:</span>{" "}
                    {restaurant.owner.name}
                  </div>
                )}
                {restaurant.owner?.email && (
                  <div>
                    <span className="text-slate-500 font-medium">Email:</span>{" "}
                    {restaurant.owner.email}
                  </div>
                )}
                {restaurant.owner?.phone && (
                  <div>
                    <span className="text-slate-500 font-medium">Phone:</span>{" "}
                    {restaurant.owner.phone}
                  </div>
                )}
                {restaurant.owner?.role && (
                  <div>
                    <span className="text-slate-500 font-medium">Role:</span>{" "}
                    {restaurant.owner.role}
                  </div>
                )}
                {!restaurant.owner?.name && !restaurant.owner?.email && (
                  <div className="col-span-2">
                    <span className="text-slate-500 font-medium">
                      Owner ID:
                    </span>{" "}
                    <span className="font-mono text-xs">
                      {restaurant.owner || restaurant.ownerId}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========== 3. Address Card ========== */}
          {restaurant.address && (
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <div className="bg-slate-50 px-5 py-3 border-b">
                <h3 className="font-semibold text-slate-800">📍 Address</h3>
              </div>
              <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 text-sm">
                <div>
                  <span className="text-slate-500 font-medium">Street:</span>{" "}
                  {renderValue(restaurant.address.street)}
                </div>
                <div>
                  <span className="text-slate-500 font-medium">City:</span>{" "}
                  {renderValue(restaurant.address.city)}
                </div>
                <div>
                  <span className="text-slate-500 font-medium">State:</span>{" "}
                  {renderValue(restaurant.address.state)}
                </div>
                <div>
                  <span className="text-slate-500 font-medium">Pincode:</span>{" "}
                  {renderValue(restaurant.address.pincode)}
                </div>
              </div>
            </div>
          )}

          {/* ========== 4. Business & Operations (two columns side by side) ========== */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Business */}
            {restaurant.business && (
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <div className="bg-slate-50 px-5 py-3 border-b">
                  <h3 className="font-semibold text-slate-800">🍽️ Business</h3>
                </div>
                <div className="p-5 space-y-3 text-sm">
                  <div>
                    <span className="text-slate-500 font-medium">Type:</span>{" "}
                    {renderValue(restaurant.business.type)}
                  </div>
                  <div>
                    <span className="text-slate-500 font-medium">
                      Cuisines:
                    </span>{" "}
                    {restaurant.business.cuisines?.length
                      ? restaurant.business.cuisines.join(", ")
                      : "—"}
                  </div>
                </div>
              </div>
            )}

            {/* Operations */}
            {restaurant.operations && (
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <div className="bg-slate-50 px-5 py-3 border-b">
                  <h3 className="font-semibold text-slate-800">
                    ⚙️ Operations
                  </h3>
                </div>
                <div className="p-5 grid grid-cols-2 gap-y-3 gap-x-2 text-sm">
                  <div>
                    <span className="text-slate-500 font-medium">
                      Table count:
                    </span>{" "}
                    {renderValue(restaurant.operations.tableCount)}
                  </div>
                  <div>
                    Dine In: {restaurant.operations.dineIn ? "✅" : "❌"}
                  </div>
                  <div>
                    Takeaway: {restaurant.operations.takeaway ? "✅" : "❌"}
                  </div>
                  <div>
                    Delivery: {restaurant.operations.delivery ? "✅" : "❌"}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ========== 5. Timings, Marketing Email, Legal (compact) ========== */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Timings */}
            {restaurant.timings && (
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <div className="bg-slate-50 px-5 py-3 border-b">
                  <h3 className="font-semibold text-slate-800">
                    🕒 Operating Hours
                  </h3>
                </div>
                <div className="p-5 space-y-2 text-sm">
                  <div>Open: {renderValue(restaurant.timings.openTime)}</div>
                  <div>Close: {renderValue(restaurant.timings.closeTime)}</div>
                </div>
              </div>
            )}

            {/* Marketing Email */}
            {restaurant.marketingEmail && (
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <div className="bg-slate-50 px-5 py-3 border-b">
                  <h3 className="font-semibold text-slate-800">
                    📧 Marketing Email
                  </h3>
                </div>
                <div className="p-5 space-y-2 text-sm">
                  <div>
                    <span className="text-slate-500 font-medium">Email:</span>{" "}
                    {renderValue(restaurant.marketingEmail.email)}
                  </div>
                  <div>
                    <span className="text-slate-500 font-medium">
                      Provider:
                    </span>{" "}
                    {renderValue(restaurant.marketingEmail.provider)}
                  </div>
                  <div>
                    <span className="text-slate-500 font-medium">
                      Connected:
                    </span>{" "}
                    {restaurant.marketingEmail.isConnected ? "✅ Yes" : "❌ No"}
                  </div>
                </div>
              </div>
            )}

            {/* Legal (compact) */}
            {restaurant.legal && (
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <div className="bg-slate-50 px-5 py-3 border-b">
                  <h3 className="font-semibold text-slate-800">
                    ⚖️ Legal Info
                  </h3>
                </div>
                <div className="p-5 space-y-2 text-sm">
                  <div>FSSAI: {renderValue(restaurant.legal.fssaiNumber)}</div>
                  <div>GST: {renderValue(restaurant.legal.gstNumber)}</div>
                  <div>PAN: {renderValue(restaurant.legal.panNumber)}</div>
                </div>
              </div>
            )}
          </div>

          {/* ========== 6. Tax & Billing (two columns) ========== */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Tax */}
            {restaurant.tax && (
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <div className="bg-slate-50 px-5 py-3 border-b">
                  <h3 className="font-semibold text-slate-800">
                    💰 Tax Rates (%)
                  </h3>
                </div>
                <div className="p-5 grid grid-cols-2 gap-3 text-sm">
                  <div>CGST: {renderValue(restaurant.tax.cgst)}%</div>
                  <div>SGST: {renderValue(restaurant.tax.sgst)}%</div>
                  <div>IGST: {renderValue(restaurant.tax.igst)}%</div>
                  <div>
                    Service Charge: {renderValue(restaurant.tax.serviceCharge)}%
                  </div>
                </div>
              </div>
            )}

            {/* Billing */}
            {restaurant.billing && (
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <div className="bg-slate-50 px-5 py-3 border-b">
                  <h3 className="font-semibold text-slate-800">
                    🧾 Billing Settings
                  </h3>
                </div>
                <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-slate-500">Prefix:</span>{" "}
                    {renderValue(restaurant.billing.invoicePrefix)}
                  </div>
                  <div>
                    <span className="text-slate-500">Start #:</span>{" "}
                    {renderValue(restaurant.billing.invoiceStart)}
                  </div>
                  <div>
                    Enable Taxes: {restaurant.billing.enableTaxes ? "✅" : "❌"}
                  </div>
                  <div>
                    Enable Service Charge:{" "}
                    {restaurant.billing.enableServiceCharge ? "✅" : "❌"}
                  </div>
                  <div className="sm:col-span-2">
                    Round Off: {restaurant.billing.roundOff ? "✅" : "❌"}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ========== 7. Staff Section ========== */}
          {totalStaff > 0 && (
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <div className="bg-slate-50 px-5 py-3 border-b">
                <h3 className="font-semibold text-slate-800">
                  👥 Staff Members
                </h3>
              </div>
              <div className="p-5">
                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-slate-50 rounded-lg p-4 text-center">
                    <div className="text-xs text-slate-500 uppercase">
                      Total
                    </div>
                    <div className="text-2xl font-bold text-slate-800">
                      {totalStaff}
                    </div>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-4 text-center">
                    <div className="text-xs text-slate-500 uppercase">
                      Managers
                    </div>
                    <div className="text-2xl font-bold text-indigo-600">
                      {managers}
                    </div>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-4 text-center">
                    <div className="text-xs text-slate-500 uppercase">
                      Waiters
                    </div>
                    <div className="text-2xl font-bold text-indigo-600">
                      {waiters}
                    </div>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-4 text-center">
                    <div className="text-xs text-slate-500 uppercase">
                      Active
                    </div>
                    <div className="text-2xl font-bold text-emerald-600">
                      {activeStaff}
                    </div>
                  </div>
                </div>

                {/* Staff Table */}
                <div className="overflow-x-auto border rounded-lg">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 border-b">
                      <tr>
                        <th className="px-4 py-3 text-left font-semibold text-slate-600">
                          Name
                        </th>
                        <th className="px-4 py-3 text-left font-semibold text-slate-600">
                          Email
                        </th>
                        <th className="px-4 py-3 text-left font-semibold text-slate-600">
                          Phone
                        </th>
                        <th className="px-4 py-3 text-left font-semibold text-slate-600">
                          Role
                        </th>
                        <th className="px-4 py-3 text-left font-semibold text-slate-600">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {restaurant.staff.map((staff: any) => (
                        <tr
                          key={staff._id}
                          className="border-b last:border-b-0 hover:bg-slate-50"
                        >
                          <td className="px-4 py-3 font-medium text-slate-800">
                            {staff.name}
                          </td>
                          <td className="px-4 py-3 text-slate-600">
                            {staff.email || "—"}
                          </td>
                          <td className="px-4 py-3 text-slate-600">
                            {staff.phone || "—"}
                          </td>
                          <td className="px-4 py-3">
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700 capitalize">
                              {staff.role}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <StatusBadge active={staff.isActive} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ========== 8. Media (if any) ========== */}
          {(restaurant.logo || restaurant.coverImage) && (
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <div className="bg-slate-50 px-5 py-3 border-b">
                <h3 className="font-semibold text-slate-800">🖼️ Media</h3>
              </div>
              <div className="p-5 flex gap-6">
                {restaurant.logo && (
                  <div>
                    <div className="text-sm text-slate-500 mb-1">Logo</div>
                    <img
                      src={restaurant.logo}
                      alt="Logo"
                      className="h-20 w-20 object-cover rounded border"
                    />
                  </div>
                )}
                {restaurant.coverImage && (
                  <div>
                    <div className="text-sm text-slate-500 mb-1">
                      Cover Image
                    </div>
                    <img
                      src={restaurant.coverImage}
                      alt="Cover"
                      className="h-20 w-32 object-cover rounded border"
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t px-6 py-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
