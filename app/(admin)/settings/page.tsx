"use client";

import { useEffect, useState } from "react";
import {
  Store,
  CreditCard,
  Bell,
  Settings,
  Upload,
  ToggleLeft,
  ToggleRight,
  Loader2,
  CheckCircle2,
  Settings2,
} from "lucide-react";
import {
  getRestaurant,
  updateRestaurant,
  connectGmail,
  disconnectGmail,
  uploadRestaurantLogo,
  removeRestaurantLogo,
} from "@/services/restaurantService";
import { useAuthStore } from "@/store/useAuthStore";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";

// ----------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------
interface RestaurantForm {
  name: string;
  slug: string;

  address: {
    street: string;
    city: string;
    state: string;
    pincode: string;
  };

  contactEmail: string;
  contactPhone: string;

  logo: string;
  coverImage: string;

  upiId: string;
  currency: string;

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

    delivery: {
      enabled: boolean;
      minimumOrder: number;
      deliveryCharge: number;
      freeDeliveryAbove: number;
      estimatedDeliveryTime: number;
    };

    preparationTime: number;
  };

  timings: {
    openTime: string;
    closeTime: string;
  };
}

// ----------------------------------------------------------------------
// Component
// ----------------------------------------------------------------------
export default function SettingsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const user = useAuthStore((state) => state.user);
  const restaurant = useAuthStore((state) => state.restaurant);
  const token = useAuthStore((state) => state.token);
  const setAuth = useAuthStore((state) => state.setAuth);

  const [activeTab, setActiveTab] = useState("restaurant");
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  // console.log(" Restaurant Data ->", restaurant);

  // Main restaurant form state
  const [restaurantForm, setRestaurantForm] = useState<RestaurantForm>({
    name: "",
    slug: "",

    address: {
      street: "",
      city: "",
      state: "",
      pincode: "",
    },

    contactEmail: "",
    contactPhone: "",

    logo: "",
    coverImage: "",

    upiId: "",
    currency: "INR",

    business: {
      type: "restaurant",
      cuisines: [],
    },

    legal: {
      fssaiNumber: "",
      gstNumber: "",
      panNumber: "",
    },

    tax: {
      cgst: 0,
      sgst: 0,
      igst: 0,
      serviceCharge: 0,
    },

    billing: {
      invoicePrefix: "INV-",
      invoiceStart: 1001,
      enableTaxes: true,
      enableServiceCharge: false,
      roundOff: true,
    },

    operations: {
      tableCount: 0,
      dineIn: true,
      takeaway: true,

      delivery: {
        enabled: false,
        minimumOrder: 0,
        deliveryCharge: 0,
        freeDeliveryAbove: 0,
        estimatedDeliveryTime: 45,
      },

      preparationTime: 15,
    },

    timings: {
      openTime: "",
      closeTime: "",
    },
  });

  const [paymentSettings, setPaymentSettings] = useState({
    stripeEnabled: true,
    stripePublicKey: process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY,
    stripeSecretKey: "",
    cashEnabled: true,
    upiEnabled: true,
    // upiId moved to restaurantForm
  });

  const [notificationSettings, setNotificationSettings] = useState({
    emailNewOrder: true,
    emailOrderReady: true,
    smsNewOrder: false,
    smsOrderReady: false,
    whatsappAlerts: true,
  });

  const [users, setUsers] = useState([
    { id: 1, name: "Admin User", email: "admin@tastybites.com", role: "admin" },
    {
      id: 2,
      name: "Manager",
      email: "manager@tastybites.com",
      role: "manager",
    },
    { id: 3, name: "Staff", email: "staff@tastybites.com", role: "staff" },
  ]);

  const tabs = [
    { id: "restaurant", label: "Restaurant", icon: Store },

    { id: "payment", label: "Payment", icon: CreditCard },
    { id: "notifications", label: "Notifications", icon: Bell },
  ];

  // ----------------------------------------------------------------------
  // Effects
  // ----------------------------------------------------------------------

  useEffect(() => {
    loadRestaurant();
  }, []);

  const loadRestaurant = async () => {
    try {
      const data = await getRestaurant();

      setAuth({
        user,
        token,
        restaurant: data,
      });
    } catch (error) {
      console.error(error);
      toast.error("Failed to load restaurant");
    }
  };

  useEffect(() => {
    if (restaurant) {
      setRestaurantForm({
        name: restaurant.name || "",
        slug: restaurant.slug || "",
        address: {
          street: restaurant.address?.street || "",
          city: restaurant.address?.city || "",
          state: restaurant.address?.state || "",
          pincode: restaurant.address?.pincode || "",
        },
        contactEmail: restaurant.contactEmail || "",
        contactPhone: restaurant.contactPhone || "",
        logo: restaurant.logo || "",
        coverImage: restaurant.coverImage || "",
        upiId: restaurant.upiId || "",
        currency: restaurant.currency || "INR",
        business: {
          type: restaurant.business?.type || "restaurant",
          cuisines: restaurant.business?.cuisines || [],
        },
        legal: {
          fssaiNumber: restaurant.legal?.fssaiNumber || "",
          gstNumber: restaurant.legal?.gstNumber || "",
          panNumber: restaurant.legal?.panNumber || "",
        },
        tax: {
          cgst: restaurant.tax?.cgst || 0,
          sgst: restaurant.tax?.sgst || 0,
          igst: restaurant.tax?.igst || 0,
          serviceCharge: restaurant.tax?.serviceCharge || 0,
        },
        billing: {
          invoicePrefix: restaurant.billing?.invoicePrefix || "INV-",
          invoiceStart: restaurant.billing?.invoiceStart || 1001,
          enableTaxes: restaurant.billing?.enableTaxes ?? true,
          enableServiceCharge: restaurant.billing?.enableServiceCharge ?? false,
          roundOff: restaurant.billing?.roundOff ?? true,
        },
        operations: {
          tableCount: restaurant.operations?.tableCount || 0,
          dineIn: restaurant.operations?.dineIn ?? true,
          takeaway: restaurant.operations?.takeaway ?? true,

          delivery: {
            enabled: restaurant.operations?.delivery?.enabled ?? false,
            minimumOrder: restaurant.operations?.delivery?.minimumOrder ?? 0,
            deliveryCharge:
              restaurant.operations?.delivery?.deliveryCharge ?? 0,
            freeDeliveryAbove:
              restaurant.operations?.delivery?.freeDeliveryAbove ?? 0,
            estimatedDeliveryTime:
              restaurant.operations?.delivery?.estimatedDeliveryTime ?? 45,
          },

          preparationTime: restaurant.operations?.preparationTime || 15,
        },
        timings: {
          openTime: restaurant.timings?.openTime || "",
          closeTime: restaurant.timings?.closeTime || "",
        },
      });
    }
  }, [restaurant]);

  // Gmail OAuth callback handler
  useEffect(() => {
    const gmailStatus = searchParams.get("gmail");
    if (gmailStatus === "success") {
      (async () => {
        const updatedRestaurant = await getRestaurant();
        setAuth({
          user: user,
          token: token,
          restaurant: { ...updatedRestaurant },
        });
        router.replace("/settings");
      })();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // ----------------------------------------------------------------------
  // Handlers
  // ----------------------------------------------------------------------
  const handleUpdateRestaurant = async () => {
    setIsSaving(true);
    try {
      const res = await updateRestaurant(restaurantForm);
      setAuth({
        user,
        token,
        restaurant: res.restaurant,
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      toast.success("Restaurant updated successfully!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to update restaurant.");
    } finally {
      setIsSaving(false);
    }
  };
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!file) return;
    const updatedRestaurant = await getRestaurant();

    try {
      // ✅ Local Preview
      const preview = URL.createObjectURL(file);

      setRestaurantForm((prev) => ({
        ...prev,
        logo: preview,
      }));

      // ✅ Create FormData
      const formData = new FormData();

      formData.append("logo", file);

      // ✅ Upload API
      const res = await uploadRestaurantLogo(formData);
      const updatedRestaurant = await getRestaurant();

      // ✅ Update auth state
      setAuth({
        user,
        token,
        restaurant: updatedRestaurant,
      });

      // ✅ Update local form
      setRestaurantForm((prev) => ({
        ...prev,
        logo: res.logo,
      }));
      // console.log("UPLOAD RESPONSE", res);
      toast.success("Logo uploaded successfully!");
    } catch (err) {
      console.error(err);

      toast.error("Failed to upload logo.");
    }
  };
  const handleRemoveLogo = async () => {
    try {
      await removeRestaurantLogo();

      setRestaurantForm((prev) => ({
        ...prev,
        logo: "",
      }));

      toast.success("Logo removed successfully");
    } catch (error) {
      console.error(error);

      toast.error("Failed to remove logo");
    }
  };

  const handleSaveUPI = async () => {
    // Update restaurantForm with latest UPI ID and save
    try {
      const res = await updateRestaurant(restaurantForm);
      setAuth({
        user,
        token,
        restaurant: res.restaurant,
      });
      toast.success("UPI ID updated successfully!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to update UPI ID");
    }
  };

  const handleConnectGmail = () => {
    setConnecting(true);
    connectGmail(token);
  };

  const handleDisconnectGmail = async () => {
    try {
      await disconnectGmail();
      const updatedRestaurant = await getRestaurant();
      setAuth({
        user,
        token,
        restaurant: updatedRestaurant,
      });
      toast.success("Gmail disconnected successfully!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to disconnect Gmail");
    }
  };

  // ----------------------------------------------------------------------
  // Render Helpers
  // ----------------------------------------------------------------------
  const inputClass =
    "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1";
  const sectionTitleClass = "text-lg font-semibold text-gray-800 mb-4";
  const subsectionTitleClass =
    "text-md font-semibold text-gray-700 mb-3 border-t pt-4";

  return (
    <div className="space-y-6 p-6 md:p-8 ">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">
                Restaurant Settings
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Manage your restaurant information, taxes, billing, delivery,
                branding and operational preferences.
              </p>
            </div>
          </div>
        </div>

        {saveSuccess && (
          <div className="mt-5 flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            </div>

            <div className="flex-1">
              <h4 className="font-semibold text-green-800">
                Settings Updated Successfully
              </h4>
              <p className="text-sm text-green-700 mt-1">
                Your restaurant settings have been saved successfully and are
                now active across your QR Menu, Ordering System, Billing and
                Dashboard.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex flex-wrap gap-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition ${activeTab === tab.id
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Panels */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        {/* -------------------- RESTAURANT TAB -------------------- */}
        {activeTab === "restaurant" && (
          <div className="space-y-6">
            {/* ===== Header ===== */}
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-semibold text-gray-800">
                Restaurant Information
              </h3>
              <button
                onClick={handleUpdateRestaurant}
                disabled={isSaving}
                className="px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                {isSaving ? "Saving..." : "Save Changes"}
              </button>
            </div>

            {/* ===== Basic Info Card ===== */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
                Basic Information
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className={labelClass}>Restaurant Name</label>
                  <input
                    type="text"
                    value={restaurantForm.name}
                    onChange={(e) =>
                      setRestaurantForm({
                        ...restaurantForm,
                        name: e.target.value,
                      })
                    }
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Phone</label>
                  <input
                    type="text"
                    value={restaurantForm.contactPhone}
                    onChange={(e) =>
                      setRestaurantForm({
                        ...restaurantForm,
                        contactPhone: e.target.value,
                      })
                    }
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Contact Email</label>
                  <input
                    type="email"
                    value={restaurantForm.contactEmail}
                    onChange={(e) =>
                      setRestaurantForm({
                        ...restaurantForm,
                        contactEmail: e.target.value,
                      })
                    }
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Slug</label>
                  <input
                    type="text"
                    value={restaurantForm.slug}
                    onChange={(e) =>
                      setRestaurantForm({
                        ...restaurantForm,
                        slug: e.target.value,
                      })
                    }
                    disabled
                    className={`${inputClass} bg-gray-100 text-gray-500 cursor-not-allowed border-gray-200`}
                  />
                </div>
                {/* Add a placeholder div if needed to keep 3-col layout, or let it wrap naturally */}
              </div>
            </div>

            {/* ===== Address Card ===== */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
                Address
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className={labelClass}>Street</label>
                  <input
                    value={restaurantForm.address.street}
                    onChange={(e) =>
                      setRestaurantForm({
                        ...restaurantForm,
                        address: {
                          ...restaurantForm.address,
                          street: e.target.value,
                        },
                      })
                    }
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>City</label>
                  <input
                    value={restaurantForm.address.city}
                    onChange={(e) =>
                      setRestaurantForm({
                        ...restaurantForm,
                        address: {
                          ...restaurantForm.address,
                          city: e.target.value,
                        },
                      })
                    }
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>State</label>
                  <input
                    value={restaurantForm.address.state}
                    onChange={(e) =>
                      setRestaurantForm({
                        ...restaurantForm,
                        address: {
                          ...restaurantForm.address,
                          state: e.target.value,
                        },
                      })
                    }
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Pincode</label>
                  <input
                    value={restaurantForm.address.pincode}
                    onChange={(e) =>
                      setRestaurantForm({
                        ...restaurantForm,
                        address: {
                          ...restaurantForm.address,
                          pincode: e.target.value,
                        },
                      })
                    }
                    className={inputClass}
                  />
                </div>
              </div>
            </div>

            {/* ===== Business Details Card ===== */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
                Business Details
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className={labelClass}>Business Type</label>
                  <select
                    value={restaurantForm.business.type}
                    onChange={(e) =>
                      setRestaurantForm({
                        ...restaurantForm,
                        business: {
                          ...restaurantForm.business,
                          type: e.target.value,
                        },
                      })
                    }
                    className={inputClass}
                  >
                    <option value="restaurant">Restaurant</option>
                    <option value="cafe">Cafe</option>
                    <option value="dhaba">Dhaba</option>
                    <option value="hotel">Hotel</option>
                    <option value="cloud_kitchen">Cloud Kitchen</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className={labelClass}>
                    Cuisines (comma separated)
                  </label>
                  <input
                    value={restaurantForm.business.cuisines.join(",")}
                    onChange={(e) =>
                      setRestaurantForm({
                        ...restaurantForm,
                        business: {
                          ...restaurantForm.business,
                          cuisines: e.target.value
                            .split(",")
                            .map((c) => c.trim()),
                        },
                      })
                    }
                    className={inputClass}
                    placeholder="e.g. Indian, Chinese, Italian"
                  />
                </div>
              </div>
            </div>

            {/* ===== Legal & Tax Card ===== */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
                Legal & Tax Details
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className={labelClass}>FSSAI License Number</label>
                  <input
                    type="text"
                    value={restaurantForm.legal.fssaiNumber}
                    onChange={(e) =>
                      setRestaurantForm({
                        ...restaurantForm,
                        legal: {
                          ...restaurantForm.legal,
                          fssaiNumber: e.target.value,
                        },
                      })
                    }
                    className={inputClass}
                    placeholder="Enter FSSAI License"
                  />
                </div>
                <div>
                  <label className={labelClass}>GST Number (GSTIN)</label>
                  <input
                    type="text"
                    value={restaurantForm.legal.gstNumber}
                    onChange={(e) =>
                      setRestaurantForm({
                        ...restaurantForm,
                        legal: {
                          ...restaurantForm.legal,
                          gstNumber: e.target.value,
                        },
                      })
                    }
                    className={inputClass}
                    placeholder="Enter GST Number"
                  />
                </div>
                <div>
                  <label className={labelClass}>PAN Number</label>
                  <input
                    type="text"
                    value={restaurantForm.legal.panNumber}
                    onChange={(e) =>
                      setRestaurantForm({
                        ...restaurantForm,
                        legal: {
                          ...restaurantForm.legal,
                          panNumber: e.target.value,
                        },
                      })
                    }
                    className={inputClass}
                    placeholder="Enter PAN Number"
                  />
                </div>
              </div>
            </div>

            {/* ===== Tax Configuration + Billing Settings (combined) ===== */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
                Tax & Billing
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className={labelClass}>CGST (%)</label>
                  <input
                    type="number"
                    value={restaurantForm.tax.cgst ?? ""}
                    onChange={(e) =>
                      setRestaurantForm({
                        ...restaurantForm,
                        tax: {
                          ...restaurantForm.tax,
                          cgst: Number(e.target.value),
                        },
                      })
                    }
                    className={inputClass}
                    placeholder="e.g. 2.5"
                  />
                </div>
                <div>
                  <label className={labelClass}>SGST (%)</label>
                  <input
                    type="number"
                    value={restaurantForm.tax.sgst ?? ""}
                    onChange={(e) =>
                      setRestaurantForm({
                        ...restaurantForm,
                        tax: {
                          ...restaurantForm.tax,
                          sgst: Number(e.target.value),
                        },
                      })
                    }
                    className={inputClass}
                    placeholder="e.g. 2.5"
                  />
                </div>
                <div>
                  <label className={labelClass}>Service Charge (%)</label>
                  <input
                    type="number"
                    value={restaurantForm.tax.serviceCharge ?? ""}
                    onChange={(e) =>
                      setRestaurantForm({
                        ...restaurantForm,
                        tax: {
                          ...restaurantForm.tax,
                          serviceCharge: parseFloat(e.target.value),
                        },
                      })
                    }
                    className={inputClass}
                    step="0.1"
                  />
                </div>
                <div>
                  <label className={labelClass}>Invoice Prefix</label>
                  <input
                    type="text"
                    value={restaurantForm.billing.invoicePrefix}
                    onChange={(e) =>
                      setRestaurantForm({
                        ...restaurantForm,
                        billing: {
                          ...restaurantForm.billing,
                          invoicePrefix: e.target.value,
                        },
                      })
                    }
                    className={inputClass}
                    placeholder="e.g. INV-"
                  />
                </div>
                <div className="md:col-span-2 flex flex-wrap items-center gap-4 mt-1">
                  {(
                    ["enableTaxes", "enableServiceCharge", "roundOff"] as const
                  ).map((field) => (
                    <label
                      key={field}
                      className="flex items-center gap-2 cursor-pointer text-sm text-gray-700"
                    >
                      <input
                        type="checkbox"
                        checked={restaurantForm.billing[field]}
                        onChange={(e) =>
                          setRestaurantForm({
                            ...restaurantForm,
                            billing: {
                              ...restaurantForm.billing,
                              [field]: e.target.checked,
                            },
                          })
                        }
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <span>
                        {field === "enableTaxes" && "Enable Taxes"}
                        {field === "enableServiceCharge" &&
                          "Enable Service Charge"}
                        {field === "roundOff" && "Round Off Invoice"}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* ===== Operations Card ===== */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
                Operations
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className={labelClass}>Table Count</label>
                  <input
                    type="number"
                    value={restaurantForm.operations.tableCount}
                    onChange={(e) =>
                      setRestaurantForm({
                        ...restaurantForm,
                        operations: {
                          ...restaurantForm.operations,
                          tableCount: parseInt(e.target.value) || 0,
                        },
                      })
                    }
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>
                    Preparation Time (minutes)
                  </label>
                  <input
                    type="number"
                    value={restaurantForm.operations.preparationTime ?? 15}
                    onChange={(e) =>
                      setRestaurantForm({
                        ...restaurantForm,
                        operations: {
                          ...restaurantForm.operations,
                          preparationTime: parseInt(e.target.value) || 15,
                        },
                      })
                    }
                    className={inputClass}
                  />
                </div>
                <div className="flex flex-wrap items-center gap-4 mt-1">
                  <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={restaurantForm.operations.dineIn}
                      onChange={(e) =>
                        setRestaurantForm({
                          ...restaurantForm,
                          operations: {
                            ...restaurantForm.operations,
                            dineIn: e.target.checked,
                          },
                        })
                      }
                      className="w-4 h-4"
                    />
                    <span>Dine In</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={restaurantForm.operations.takeaway}
                      onChange={(e) =>
                        setRestaurantForm({
                          ...restaurantForm,
                          operations: {
                            ...restaurantForm.operations,
                            takeaway: e.target.checked,
                          },
                        })
                      }
                      className="w-4 h-4"
                    />
                    <span>Takeaway</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={restaurantForm.operations.delivery.enabled}
                      onChange={(e) =>
                        setRestaurantForm({
                          ...restaurantForm,
                          operations: {
                            ...restaurantForm.operations,
                            delivery: {
                              ...restaurantForm.operations.delivery,
                              enabled: e.target.checked,
                            },
                          },
                        })
                      }
                      className="w-4 h-4"
                    />
                    <span>Delivery</span>
                  </label>
                </div>
              </div>

              {/* Delivery Settings (conditional) */}
              {restaurantForm.operations.delivery.enabled && (
                <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-4">
                  <h4 className="font-semibold text-orange-700 text-sm mb-3">
                    🚚 Delivery Settings
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className={labelClass}>Minimum Order (₹)</label>
                      <input
                        type="number"
                        value={
                          restaurantForm.operations.delivery.minimumOrder ?? ""
                        }
                        onChange={(e) =>
                          setRestaurantForm({
                            ...restaurantForm,
                            operations: {
                              ...restaurantForm.operations,
                              delivery: {
                                ...restaurantForm.operations.delivery,
                                minimumOrder: Number(e.target.value),
                              },
                            },
                          })
                        }
                        className={inputClass}
                        placeholder="e.g. 199"
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Delivery Charge (₹)</label>
                      <input
                        type="number"
                        value={
                          restaurantForm.operations.delivery.deliveryCharge ??
                          ""
                        }
                        onChange={(e) =>
                          setRestaurantForm({
                            ...restaurantForm,
                            operations: {
                              ...restaurantForm.operations,
                              delivery: {
                                ...restaurantForm.operations.delivery,
                                deliveryCharge: Number(e.target.value),
                              },
                            },
                          })
                        }
                        className={inputClass}
                        placeholder="e.g. 40"
                      />
                    </div>
                    <div>
                      <label className={labelClass}>
                        Free Delivery Above (₹)
                      </label>
                      <input
                        type="number"
                        value={
                          restaurantForm.operations.delivery
                            .freeDeliveryAbove ?? ""
                        }
                        onChange={(e) =>
                          setRestaurantForm({
                            ...restaurantForm,
                            operations: {
                              ...restaurantForm.operations,
                              delivery: {
                                ...restaurantForm.operations.delivery,
                                freeDeliveryAbove: Number(e.target.value),
                              },
                            },
                          })
                        }
                        className={inputClass}
                        placeholder="e.g. 499"
                      />
                    </div>
                    <div>
                      <label className={labelClass}>
                        Estimated Delivery Time (Minutes)
                      </label>
                      <input
                        type="number"
                        value={
                          restaurantForm.operations.delivery
                            .estimatedDeliveryTime ?? ""
                        }
                        onChange={(e) =>
                          setRestaurantForm({
                            ...restaurantForm,
                            operations: {
                              ...restaurantForm.operations,
                              delivery: {
                                ...restaurantForm.operations.delivery,
                                estimatedDeliveryTime: Number(e.target.value),
                              },
                            },
                          })
                        }
                        className={inputClass}
                        placeholder="e.g. 45"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* ===== Timings Card ===== */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
                Timings
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className={labelClass}>Open Time</label>
                  <input
                    type="time"
                    value={restaurantForm.timings.openTime}
                    onChange={(e) =>
                      setRestaurantForm({
                        ...restaurantForm,
                        timings: {
                          ...restaurantForm.timings,
                          openTime: e.target.value,
                        },
                      })
                    }
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Close Time</label>
                  <input
                    type="time"
                    value={restaurantForm.timings.closeTime}
                    onChange={(e) =>
                      setRestaurantForm({
                        ...restaurantForm,
                        timings: {
                          ...restaurantForm.timings,
                          closeTime: e.target.value,
                        },
                      })
                    }
                    className={inputClass}
                  />
                </div>
              </div>
            </div>

            {/* ===== Branding (Logo) Card ===== */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
                Restaurant Branding
              </h4>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
                {/* Logo Preview */}
                <div className="relative group">
                  {restaurantForm.logo ? (
                    <img
                      src={restaurantForm.logo}
                      alt="Restaurant Logo"
                      className="w-24 h-24 rounded-2xl object-cover border-2 border-orange-100 shadow-md"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-md">
                      <Store className="w-10 h-10 text-white" />
                    </div>
                  )}
                  <div className="absolute -bottom-2 -right-2 bg-green-500 w-6 h-6 rounded-full border-2 border-white flex items-center justify-center">
                    <span className="text-white text-[10px]">✓</span>
                  </div>
                </div>

                {/* Upload Controls */}
                <div className="flex-1">
                  <p className="text-sm text-gray-500 mt-1">
                    Upload your restaurant logo to personalise your menu, QR
                    ordering page and invoices.
                  </p>
                  <div className="flex flex-wrap gap-3 mt-4">
                    <button
                      disabled={uploadingLogo}
                      type="button"
                      onClick={() =>
                        document.getElementById("logoUpload")?.click()
                      }
                      className="px-4 py-2 bg-orange-500 text-white text-sm font-medium rounded-xl hover:bg-orange-600 transition disabled:opacity-50 flex items-center gap-2"
                    >
                      {uploadingLogo ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4" />
                          Upload Logo
                        </>
                      )}
                    </button>
                    {restaurantForm.logo && (
                      <button
                        type="button"
                        onClick={handleRemoveLogo}
                        className="px-4 py-2 border border-red-200 text-red-600 hover:bg-red-50 text-sm font-medium rounded-xl transition"
                      >
                        Remove Logo
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-3">
                    PNG, JPG or WEBP • Recommended: 512×512px
                  </p>
                </div>
              </div>
              <input
                type="file"
                accept="image/*"
                id="logoUpload"
                className="hidden"
                onChange={handleLogoUpload}
              />
            </div>

            {/* ===== Marketing Email Card ===== */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
                Marketing Email
              </h4>
              {restaurant?.marketingEmail?.isConnected ? (
                <div className="flex items-center justify-between bg-green-50 border border-green-200 p-3 rounded-lg">
                  <div>
                    <p className="text-green-700 font-medium">✅ Connected</p>
                    <p className="text-sm text-gray-600">
                      {restaurant.marketingEmail.email || "Gmail Connected"}
                    </p>
                  </div>
                  <button
                    onClick={handleDisconnectGmail}
                    className="px-4 py-2 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600 transition"
                  >
                    Disconnect
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between bg-gray-50 border p-3 rounded-lg">
                  <div>
                    <p className="text-gray-800 font-medium">
                      Connect your Gmail
                    </p>
                    <p className="text-sm text-gray-500">
                      Send offers & updates to customers
                    </p>
                  </div>
                  <button
                    onClick={handleConnectGmail}
                    disabled={connecting}
                    className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                  >
                    {connecting ? "Connecting..." : "Connect Gmail"}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
        {/* -------------------- PAYMENT TAB -------------------- */}
        {activeTab === "payment" && (
          <div className="space-y-6">
            <h3 className={sectionTitleClass}>Payment Configuration</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={paymentSettings.cashEnabled}
                    onChange={(e) =>
                      setPaymentSettings({
                        ...paymentSettings,
                        cashEnabled: e.target.checked,
                      })
                    }
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">
                    Cash on Delivery
                  </span>
                </label>
              </div>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={paymentSettings.upiEnabled}
                    onChange={(e) =>
                      setPaymentSettings({
                        ...paymentSettings,
                        upiEnabled: e.target.checked,
                      })
                    }
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">
                    UPI / GPay / PhonePe
                  </span>
                </label>
              </div>
              {paymentSettings.upiEnabled && (
                <div className="pl-6">
                  <label className={labelClass}>UPI ID</label>
                  <input
                    type="text"
                    value={restaurantForm.upiId}
                    onChange={(e) =>
                      setRestaurantForm({
                        ...restaurantForm,
                        upiId: e.target.value,
                      })
                    }
                    className={inputClass + " max-w-md"}
                    placeholder="e.g. restaurant@okhdfcbank"
                  />
                </div>
              )}
              <button
                onClick={handleSaveUPI}
                disabled={isSaving}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50"
              >
                Save UPI Settings
              </button>
            </div>
          </div>
        )}

        {/* -------------------- NOTIFICATIONS TAB -------------------- */}
        {activeTab === "notifications" && (
          <div className="space-y-6">
            <h3 className={sectionTitleClass}>Notification Settings</h3>
            <div className="space-y-3">
              {[
                { key: "emailNewOrder", label: "Email on New Order" },
                { key: "emailOrderReady", label: "Email when Order Ready" },
                { key: "smsNewOrder", label: "SMS on New Order" },
                { key: "smsOrderReady", label: "SMS when Order Ready" },
                { key: "whatsappAlerts", label: "WhatsApp Alerts" },
              ].map((item) => (
                <div
                  key={item.key}
                  className="flex items-center justify-between"
                >
                  <span className="text-sm text-gray-700">{item.label}</span>
                  <button
                    onClick={() =>
                      setNotificationSettings({
                        ...notificationSettings,
                        [item.key]:
                          !notificationSettings[
                          item.key as keyof typeof notificationSettings
                          ],
                      })
                    }
                    className="focus:outline-none"
                  >
                    {notificationSettings[
                      item.key as keyof typeof notificationSettings
                    ] ? (
                      <ToggleRight className="w-8 h-8 text-blue-600" />
                    ) : (
                      <ToggleLeft className="w-8 h-8 text-gray-400" />
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
