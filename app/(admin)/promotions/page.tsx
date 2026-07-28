"use client";

import { useState, useMemo } from "react";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  X,
  Eye,
  Mail,
  Check,
  Users,
  IndianRupee,
  AlertTriangle,
  Star,
  UserPlus,
  TrendingUp,
} from "lucide-react";
import toast from "react-hot-toast";
import { useAuthStore } from "@/store/useAuthStore";
import { useRouter } from "next/navigation";
import PromotionSkeleton from "@/components/skeleton/PromotionSkeleton";
import { useCustomers, type Customer } from "@/hooks/useCustomers";
import {
  usePromotions,
  useCreatePromotion,
  useUpdatePromotion,
  useDeletePromotion,
  useSendMarketingEmail,
  type Promotion,
} from "@/hooks/usePromotions";

const statusOptions = ["All", "active", "expired", "scheduled"];
const typeOptions = ["All", "percentage", "fixed"];

export default function PromotionsPage() {
  const { restaurant } = useAuthStore();
  const restaurantId = restaurant?._id;
  const router = useRouter();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPromo, setEditingPromo] = useState<Promotion | null>(null);
  const [viewingPromo, setViewingPromo] = useState<Promotion | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [promoToDelete, setPromoToDelete] = useState<string | null>(null);

  // ====== Customer / Audience filter state ======
  const [customerSearch, setCustomerSearch] = useState("");
  const [customerTypeFilter, setCustomerTypeFilter] = useState("all");
  const [orderCountFilter, setOrderCountFilter] = useState("all");
  const [spendingFilter, setSpendingFilter] = useState("all");
  const [lastVisitFilter, setLastVisitFilter] = useState("all");
  const [onlyWithEmail, setOnlyWithEmail] = useState(true);
  const [selectedCustomers, setSelectedCustomers] = useState<Customer[]>([]);

  const [selectedPromotionId, setSelectedPromotionId] = useState<string>("");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailMessage, setEmailMessage] = useState("");

  // ====== Data ======
  const {
    data: promotions = [],
    isLoading: isPromotionsLoading,
    error: promotionsError,
  } = usePromotions(restaurantId);
  const { data: customers = [], isLoading: isCustomersLoading } = useCustomers(restaurantId);

  const createPromotionMutation = useCreatePromotion(restaurantId);
  const updatePromotionMutation = useUpdatePromotion(restaurantId);
  const deletePromotionMutation = useDeletePromotion(restaurantId);
  const sendEmailMutation = useSendMarketingEmail();

  // ====== Filtering logic (unchanged) ======
  const filteredCustomers = useMemo(() => {
    let result = customers;

    if (customerSearch.trim() !== "") {
      const lower = customerSearch.toLowerCase();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(lower) ||
          c.email.toLowerCase().includes(lower) ||
          c.phone.includes(lower),
      );
    }

    if (customerTypeFilter === "regular") {
      result = result.filter((c) => c.isRegular === true);
    } else if (customerTypeFilter === "new") {
      result = result.filter((c) => c.totalOrders <= 2);
    }

    if (orderCountFilter === "1-2") {
      result = result.filter((c) => c.totalOrders >= 1 && c.totalOrders <= 2);
    } else if (orderCountFilter === "3-5") {
      result = result.filter((c) => c.totalOrders >= 3 && c.totalOrders <= 5);
    } else if (orderCountFilter === "5+") {
      result = result.filter((c) => c.totalOrders > 5);
    }

    if (spendingFilter === "0-500") {
      result = result.filter((c) => c.totalSpent >= 0 && c.totalSpent <= 500);
    } else if (spendingFilter === "500-1000") {
      result = result.filter((c) => c.totalSpent > 500 && c.totalSpent <= 1000);
    } else if (spendingFilter === "1000-2000") {
      result = result.filter((c) => c.totalSpent > 1000 && c.totalSpent <= 2000);
    } else if (spendingFilter === "2000+") {
      result = result.filter((c) => c.totalSpent > 2000);
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    if (lastVisitFilter === "today") {
      result = result.filter((c) => {
        if (!c.lastVisit) return false;
        const visit = new Date(c.lastVisit);
        const visitDate = new Date(visit.getFullYear(), visit.getMonth(), visit.getDate());
        return visitDate.getTime() === today.getTime();
      });
    } else if (lastVisitFilter === "7days") {
      const sevenDaysAgo = new Date(today);
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      result = result.filter((c) => c.lastVisit && new Date(c.lastVisit) >= sevenDaysAgo);
    } else if (lastVisitFilter === "30days") {
      const thirtyDaysAgo = new Date(today);
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      result = result.filter((c) => c.lastVisit && new Date(c.lastVisit) >= thirtyDaysAgo);
    } else if (lastVisitFilter === "older") {
      const thirtyDaysAgo = new Date(today);
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      result = result.filter((c) => c.lastVisit && new Date(c.lastVisit) < thirtyDaysAgo);
    }

    if (onlyWithEmail) {
      result = result.filter((c) => c.email && c.email.trim() !== "");
    }

    return result;
  }, [
    customers,
    customerSearch,
    customerTypeFilter,
    orderCountFilter,
    spendingFilter,
    lastVisitFilter,
    onlyWithEmail,
  ]);

  const analytics = useMemo(() => {
    const total = customers.length;
    const regular = customers.filter((c) => c.isRegular).length;
    const totalRevenue = customers.reduce((sum, c) => sum + c.totalSpent, 0);
    const withEmail = customers.filter((c) => c.email && c.email.trim() !== "").length;
    return { total, regular, totalRevenue, withEmail };
  }, [customers]);

  const applyQuickFilter = (type: string) => {
    setCustomerTypeFilter("all");
    setOrderCountFilter("all");
    setSpendingFilter("all");
    setLastVisitFilter("all");
    if (type === "regular") setCustomerTypeFilter("regular");
    else if (type === "new") setCustomerTypeFilter("new");
    else if (type === "highSpenders") setSpendingFilter("2000+");
    else if (type === "recent") setLastVisitFilter("7days");
    else if (type === "inactive") setLastVisitFilter("older");
  };

  const handleSelectAll = () => {
    if (selectedCustomers.length === filteredCustomers.length) {
      setSelectedCustomers([]);
    } else {
      setSelectedCustomers([...filteredCustomers]);
    }
  };

  const toggleCustomer = (customer: Customer) => {
    if (selectedCustomers.find((c) => c._id === customer._id)) {
      setSelectedCustomers(selectedCustomers.filter((c) => c._id !== customer._id));
    } else {
      setSelectedCustomers([...selectedCustomers, customer]);
    }
  };

  const handleSendPromotionEmail = () => {
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

    sendEmailMutation.mutate(
      {
        promotionId: promo._id,
        customerIds: selectedCustomers.map((c) => c._id),
        subject: emailSubject,
        message: emailMessage,
        restaurantId,
      },
      {
        onSuccess: () => {
          toast.success(`Promotion email sent to ${selectedCustomers.length} customer(s)!`);
        },
        onError: () => {
          toast.error("Failed to send emails");
        },
      },
    );
  };

  const filteredPromotions = promotions.filter((promo) => {
    const matchesSearch =
      promo.code.toLowerCase().includes(search.toLowerCase()) ||
      promo.description.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "All" || promo.status === statusFilter;
    const matchesType = typeFilter === "All" || promo.type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

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
  const confirmDelete = () => {
    if (!promoToDelete) return;
    deletePromotionMutation.mutate(promoToDelete, {
      onSuccess: () => toast.success("Promotion deleted"),
      onError: () => toast.error("Delete failed"),
      onSettled: () => {
        setPromoToDelete(null);
        setDeleteConfirmOpen(false);
      },
    });
  };
  const openViewModal = (promo: Promotion) => {
    setViewingPromo(promo);
    setIsViewModalOpen(true);
  };

  const handleSubmitPromo = async (formData: any) => {
    try {
      if (editingPromo) {
        await updatePromotionMutation.mutateAsync({ id: editingPromo._id, payload: formData });
        toast.success("Promotion updated");
      } else {
        await createPromotionMutation.mutateAsync(formData);
        toast.success("Promotion created");
      }
      setIsModalOpen(false);
    } catch (err) {
      toast.error(editingPromo ? "Update failed" : "Failed to create promotion");
      throw err;
    }
  };

  const getDiscountDisplay = (promo: Promotion) => {
    if (promo.type === "percentage") {
      return <span className="flex items-center gap-1">{promo.value}%</span>;
    }
    return (
      <span className="flex items-center gap-1">
        <IndianRupee className="w-3 h-3" />₹{promo.value}
      </span>
    );
  };

  const getInitials = (name: string) =>
    name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);

  const getRelativeTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHr = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHr / 24);

    if (diffDay === 0) {
      if (diffHr === 0) return "Just now";
      return `${diffHr}h ago`;
    } else if (diffDay === 1) {
      return "Yesterday";
    } else if (diffDay < 7) {
      return `${diffDay} days ago`;
    } else if (diffDay < 30) {
      const weeks = Math.floor(diffDay / 7);
      return `${weeks}w ago`;
    } else {
      const months = Math.floor(diffDay / 30);
      return `${months}mo ago`;
    }
  };

  if (isPromotionsLoading) {
    return <PromotionSkeleton />;
  }

  if (promotionsError) {
    const status = (promotionsError as any)?.response?.status;
    const backendMessage =
      (promotionsError as any)?.response?.data?.message || "Something went wrong";
    const message = status === 403 ? backendMessage : "Something went wrong";

    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="bg-white border rounded-2xl shadow-sm p-8 max-w-md text-center">
          <AlertTriangle className="w-14 h-14 text-orange-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800">Feature Not Available</h2>
          <p className="text-gray-600 mt-3">{message}</p>
          <button
            onClick={() => router.push("/subscription")}
            className="mt-6 px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl"
          >
            Upgrade Plan
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[70vh] space-y-5 sm:px-5 sm:py-6 md:px-8 lg:px-10 xl:px-12 2xl:px-16">
      {/* ===== HEADER ===== */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Promotions & Offers</h2>
        <button
          onClick={openAddModal}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-linear-to-r from-blue-600 to-indigo-600 text-white px-5 py-2.5 rounded-lg hover:shadow-md transition"
        >
          <Plus className="w-5 h-5" />
          Add Promotion
        </button>
      </div>

      {/* ===== PROMOTIONS FILTERS ===== */}
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
                {opt === "All" ? "All Types" : opt === "percentage" ? "Percentage" : "Fixed Amount"}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ===== CUSTOMER AUDIENCE SECTION ===== */}
      <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 space-y-5">
        <div className="flex items-center gap-2 border-b pb-3">
          <Mail className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-800">Send Promotion to Customers</h3>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-linear-to-br from-blue-50 to-blue-100 p-4 rounded-xl flex items-center gap-3">
            <div className="bg-blue-500 p-2 rounded-full text-white">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-blue-700 font-medium">Total Customers</p>
              <p className="text-2xl font-bold text-blue-900">{analytics.total}</p>
            </div>
          </div>
          <div className="bg-linear-to-br from-green-50 to-green-100 p-4 rounded-xl flex items-center gap-3">
            <div className="bg-green-500 p-2 rounded-full text-white">
              <Star className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-green-700 font-medium">Regular</p>
              <p className="text-2xl font-bold text-green-900">{analytics.regular}</p>
            </div>
          </div>
          <div className="bg-linear-to-br from-purple-50 to-purple-100 p-4 rounded-xl flex items-center gap-3">
            <div className="bg-purple-500 p-2 rounded-full text-white">
              <IndianRupee className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-purple-700 font-medium">Total Revenue</p>
              <p className="text-2xl font-bold text-purple-900">
                {formatCurrency(analytics.totalRevenue)}
              </p>
            </div>
          </div>
          <div className="bg-linear-to-br from-orange-50 to-orange-100 p-4 rounded-xl flex items-center gap-3">
            <div className="bg-orange-500 p-2 rounded-full text-white">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-orange-700 font-medium">Email Available</p>
              <p className="text-2xl font-bold text-orange-900">{analytics.withEmail}</p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-end gap-3 bg-gray-50 p-4 rounded-xl">
          <div className="flex-1 min-w-45">
            <label className="block text-xs font-medium text-gray-600 mb-1">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Name, email, phone..."
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
              />
            </div>
          </div>

          <div className="min-w-32.5">
            <label className="block text-xs font-medium text-gray-600 mb-1">Customer Type</label>
            <select
              value={customerTypeFilter}
              onChange={(e) => setCustomerTypeFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
            >
              <option value="all">All</option>
              <option value="regular">Regular</option>
              <option value="new">New (≤2 orders)</option>
            </select>
          </div>

          <div className="min-w-32.5">
            <label className="block text-xs font-medium text-gray-600 mb-1">Orders</label>
            <select
              value={orderCountFilter}
              onChange={(e) => setOrderCountFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
            >
              <option value="all">All</option>
              <option value="1-2">1-2</option>
              <option value="3-5">3-5</option>
              <option value="5+">5+</option>
            </select>
          </div>

          <div className="min-w-32.5">
            <label className="block text-xs font-medium text-gray-600 mb-1">Spending</label>
            <select
              value={spendingFilter}
              onChange={(e) => setSpendingFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
            >
              <option value="all">All</option>
              <option value="0-500">₹0 – ₹500</option>
              <option value="500-1000">₹500 – ₹1000</option>
              <option value="1000-2000">₹1000 – ₹2000</option>
              <option value="2000+">₹2000+</option>
            </select>
          </div>

          <div className="min-w-32.5">
            <label className="block text-xs font-medium text-gray-600 mb-1">Last Visit</label>
            <select
              value={lastVisitFilter}
              onChange={(e) => setLastVisitFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
            >
              <option value="all">All</option>
              <option value="today">Today</option>
              <option value="7days">Last 7 Days</option>
              <option value="30days">Last 30 Days</option>
              <option value="older">Older than 30 Days</option>
            </select>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="onlyWithEmail"
              checked={onlyWithEmail}
              onChange={(e) => setOnlyWithEmail(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="onlyWithEmail" className="text-sm font-medium text-gray-700 whitespace-nowrap">
              Only with email
            </label>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button onClick={() => applyQuickFilter("all")} className="px-3 py-1.5 text-sm rounded-full border border-gray-300 bg-white hover:bg-gray-50 transition">
            All
          </button>
          <button onClick={() => applyQuickFilter("regular")} className="px-3 py-1.5 text-sm rounded-full border border-green-300 bg-green-50 text-green-700 hover:bg-green-100 transition">
            Regular
          </button>
          <button onClick={() => applyQuickFilter("new")} className="px-3 py-1.5 text-sm rounded-full border border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100 transition">
            New
          </button>
          <button onClick={() => applyQuickFilter("highSpenders")} className="px-3 py-1.5 text-sm rounded-full border border-purple-300 bg-purple-50 text-purple-700 hover:bg-purple-100 transition">
            High Spenders
          </button>
          <button onClick={() => applyQuickFilter("recent")} className="px-3 py-1.5 text-sm rounded-full border border-indigo-300 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition">
            Recent Visitors
          </button>
          <button onClick={() => applyQuickFilter("inactive")} className="px-3 py-1.5 text-sm rounded-full border border-red-300 bg-red-50 text-red-700 hover:bg-red-100 transition">
            Inactive
          </button>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <span className="text-sm text-gray-600">
              Showing <strong>{filteredCustomers.length}</strong> of{" "}
              <strong>{customers.length}</strong> Customers
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-gray-700">
              Selected: <span className="text-blue-600">{selectedCustomers.length}</span> Customers
            </span>
            <button
              type="button"
              onClick={handleSelectAll}
              className="text-sm text-blue-600 hover:underline flex items-center gap-1"
            >
              <Check className="w-3 h-3" />
              {selectedCustomers.length === filteredCustomers.length ? "Clear All" : "Select All"}
            </button>
          </div>
        </div>

        {isCustomersLoading ? (
          <div className="text-center py-8 text-gray-500">Loading customers...</div>
        ) : filteredCustomers.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-xl">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No customers found</p>
            <p className="text-sm text-gray-400">Try adjusting your filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredCustomers.map((customer) => {
              const isSelected = selectedCustomers.some((c) => c._id === customer._id);
              const initials = getInitials(customer.name);
              const isRegular = customer.isRegular;
              const orderCount = customer.totalOrders;
              const spent = customer.totalSpent;
              const lastVisit = customer.lastVisit ? getRelativeTime(customer.lastVisit) : "Never";

              return (
                <div
                  key={customer._id}
                  className={`relative bg-white rounded-xl border p-4 hover:shadow-md transition-shadow duration-200 ${isSelected ? "border-blue-500 ring-2 ring-blue-200" : "border-gray-200"
                    }`}
                >
                  <div className="absolute top-3 right-3">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleCustomer(customer)}
                      className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </div>

                  <div className="flex items-center gap-3 mb-2">
                    <div className="shrink w-12 h-12 rounded-full bg-linear-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold text-lg">
                      {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-800 truncate">{customer.name}</p>
                      <p className="text-xs text-gray-500 truncate">{customer.email}</p>
                      <p className="text-xs text-gray-400">{customer.phone}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1 mb-3">
                    {isRegular ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded-full">
                        <Star className="w-3 h-3" /> Regular
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full">
                        <UserPlus className="w-3 h-3" /> New
                      </span>
                    )}
                    {orderCount > 5 && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-100 text-purple-800 text-xs rounded-full">
                        <TrendingUp className="w-3 h-3" /> Frequent
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-sm border-t pt-2 mt-2">
                    <div>
                      <p className="text-xs text-gray-400">Orders</p>
                      <p className="font-medium">{orderCount}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Spent</p>
                      <p className="font-medium">{formatCurrency(spent)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Last Visit</p>
                      <p className="font-medium text-xs">{lastVisit}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="border-t pt-4 space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Select Promotion *</label>
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
                      {promo.type === "percentage" ? `${promo.value}%` : `₹${promo.value}`})
                    </option>
                  ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Subject *</label>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Email Message *</label>
            <textarea
              placeholder="Write your promotion message... (You can use {code}, {discount}, {expiry} as placeholders)"
              value={emailMessage}
              onChange={(e) => setEmailMessage(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
            <p className="text-xs text-gray-400 mt-1">
              Tip: Use {"{code}"}, {"{discount}"}, {"{expiry}"} to auto‑insert promotion details.
            </p>
          </div>
          <button
            onClick={handleSendPromotionEmail}
            disabled={sendEmailMutation.isPending || !selectedPromotionId || selectedCustomers.length === 0}
            className="w-full bg-green-600 text-white py-2.5 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
          >
            {sendEmailMutation.isPending ? (
              <>Sending...</>
            ) : (
              <>
                <Mail className="w-4 h-4" /> Send to {selectedCustomers.length} Customer(s) 🚀
              </>
            )}
          </button>
        </div>
      </div>

      {/* ===== PROMOTIONS TABLE ===== */}
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
                  const statusColor =
                    promo.status === "active"
                      ? "bg-green-100 text-green-700"
                      : promo.status === "scheduled"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-gray-100 text-gray-700";
                  return (
                    <tr key={promo._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-800">{promo.code}</td>
                      <td className="px-4 py-3 text-gray-600 max-w-xs truncate">{promo.description}</td>
                      <td className="px-4 py-3">{getDiscountDisplay(promo)}</td>
                      <td className="px-4 py-3">₹{promo.minOrder}</td>
                      <td className="px-4 py-3">{promo.startDate}</td>
                      <td className="px-4 py-3">{promo.endDate}</td>
                      <td className="px-4 py-3">{promo.usedCount}/{promo.usageLimit}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColor}`}>
                          {promo.status.charAt(0).toUpperCase() + promo.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button onClick={() => openViewModal(promo)} className="p-1 text-blue-600 hover:bg-blue-50 rounded" title="View">
                            <Eye className="w-4 h-4" />
                          </button>
                          <button onClick={() => openEditModal(promo)} className="p-1 text-indigo-600 hover:bg-indigo-50 rounded" title="Edit">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDeleteClick(promo._id)} className="p-1 text-red-600 hover:bg-red-50 rounded" title="Delete">
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

      {isModalOpen && (
        <PromoFormModal
          editingPromo={editingPromo}
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleSubmitPromo}
        />
      )}

      {isViewModalOpen && viewingPromo && (
        <PromoViewModal promo={viewingPromo} onClose={() => setIsViewModalOpen(false)} />
      )}

      {deleteConfirmOpen && (
        <DeleteConfirmationModal onConfirm={confirmDelete} onCancel={() => setDeleteConfirmOpen(false)} />
      )}
    </div>
  );
}

// ====== MODAL COMPONENTS — unchanged (no data fetching inside) ======
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
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
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
      applicableValue: formData.applicableTo !== "all" ? formData.applicableValue : null,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-md bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b">
          <h3 className="text-lg font-semibold">{editingPromo ? "Edit Promotion" : "Add Promotion"}</h3>
          <button onClick={onClose}>
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label>Promo Code *</label>
            <input name="code" value={formData.code} onChange={handleChange} required className="w-full border rounded-lg p-2" />
          </div>
          <div>
            <label>Description</label>
            <textarea name="description" value={formData.description} onChange={handleChange} rows={2} className="w-full border rounded-lg p-2" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label>Type</label>
              <select name="type" value={formData.type} onChange={handleChange} className="w-full border rounded-lg p-2">
                <option value="percentage">Percentage</option>
                <option value="fixed">Fixed Amount</option>
              </select>
            </div>
            <div>
              <label>Value *</label>
              <input type="number" name="value" value={formData.value} onChange={handleChange} required className="w-full border rounded-lg p-2" />
            </div>
          </div>
          <div>
            <label>Min Order (₹)</label>
            <input type="number" name="minOrder" value={formData.minOrder} onChange={handleChange} className="w-full border rounded-lg p-2" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label>Start Date</label>
              <input type="date" name="startDate" value={formData.startDate} onChange={handleChange} required className="w-full border rounded-lg p-2" />
            </div>
            <div>
              <label>End Date</label>
              <input type="date" name="endDate" value={formData.endDate} onChange={handleChange} required className="w-full border rounded-lg p-2" />
            </div>
          </div>
          <div>
            <label>Applicable To</label>
            <select name="applicableTo" value={formData.applicableTo} onChange={handleChange} className="w-full border rounded-lg p-2">
              <option value="all">All Items</option>
              <option value="category">Category</option>
              <option value="specific">Specific Item</option>
            </select>
          </div>
          {formData.applicableTo !== "all" && (
            <div>
              <label>{formData.applicableTo === "category" ? "Category Name" : "Item Name"}</label>
              <input type="text" name="applicableValue" value={formData.applicableValue} onChange={handleChange} required className="w-full border rounded-lg p-2" />
            </div>
          )}
          <div>
            <label>Usage Limit</label>
            <input type="number" name="usageLimit" value={formData.usageLimit} onChange={handleChange} className="w-full border rounded-lg p-2" />
          </div>
          <div>
            <label>Status</label>
            <select name="status" value={formData.status} onChange={handleChange} className="w-full border rounded-lg p-2">
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 border rounded-lg">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg">Save</button>
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
          <button onClick={onClose}><X /></button>
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
              <p>{promo.type === "percentage" ? `${promo.value}%` : `₹${promo.value}`}</p>
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
              <p>{promo.usedCount} / {promo.usageLimit || "∞"}</p>
            </div>
          </div>
        </div>
        <div className="border-t p-6 flex justify-end">
          <button onClick={onClose} className="px-4 py-2 border rounded-lg">Close</button>
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
        <p className="text-gray-600 my-4">Are you sure you want to delete this promotion?</p>
        <div className="flex justify-end gap-3">
          <button onClick={onCancel} className="px-4 py-2 border rounded-lg">Cancel</button>
          <button onClick={onConfirm} className="px-4 py-2 bg-red-600 text-white rounded-lg">Delete</button>
        </div>
      </div>
    </div>
  );
}