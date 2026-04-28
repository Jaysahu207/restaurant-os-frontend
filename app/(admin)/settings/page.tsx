"use client";

import { useEffect, useState } from "react";
import {
  Store,
  QrCode,
  CreditCard,
  Bell,
  Users,
  Settings as SettingsIcon,
  Upload,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import {
  getRestaurant,
  updateRestaurant,
  connectGmail,
  disconnectGmail,
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
    delivery: boolean;
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

  // Main restaurant form state
  const [restaurantForm, setRestaurantForm] = useState<RestaurantForm>({
    name: "",
    slug: "",
    address: { street: "", city: "", state: "", pincode: "" },
    contactEmail: "",
    contactPhone: "",
    logo: "",
    coverImage: "",
    upiId: "",
    currency: "INR",
    business: { type: "restaurant", cuisines: [] },
    legal: { fssaiNumber: "", gstNumber: "", panNumber: "" },
    tax: { cgst: 0, sgst: 0, igst: 0, serviceCharge: 0 },
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
      delivery: false,
    },
    timings: { openTime: "", closeTime: "" },
  });

  // Other settings (QR, notifications, users, system)
  const [qrSettings, setQrSettings] = useState({
    baseUrl: "https://order.tastybites.com",
    tablePrefix: "T",
    autoGenerateOnAdd: true,
    qrCodeSize: 200,
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

  const [systemPrefs, setSystemPrefs] = useState({
    currency: "USD",
    taxRate: 8.5,
    orderPrefix: "ORD",
    autoAcceptOrders: false,
  });

  const tabs = [
    { id: "restaurant", label: "Restaurant", icon: Store },
    { id: "qr", label: "QR Codes", icon: QrCode },
    { id: "payment", label: "Payment", icon: CreditCard },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "users", label: "Users", icon: Users },
    { id: "system", label: "System", icon: SettingsIcon },
  ];

  // ----------------------------------------------------------------------
  // Effects
  // ----------------------------------------------------------------------
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
          delivery: restaurant.operations?.delivery ?? false,
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Settings</h2>
      </div>

      {saveSuccess && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg">
          Settings saved successfully!
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex flex-wrap gap-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition ${
                  activeTab === tab.id
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
            <h3 className={sectionTitleClass}>Restaurant Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Basic Info */}
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
                  className={inputClass}
                />
              </div>

              {/* Address */}
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

              {/* Business Details */}
              <div className="md:col-span-2">
                <h4 className={subsectionTitleClass}>Business Details</h4>
              </div>
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
              <div>
                <label className={labelClass}>Cuisines (comma separated)</label>
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

              {/* Legal & Tax */}
              <div className="md:col-span-2">
                <h4 className={subsectionTitleClass}>Legal & Tax Details</h4>
              </div>
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

              {/* Tax Configuration */}
              <div className="md:col-span-2">
                <h4 className={subsectionTitleClass}>Tax Configuration</h4>
              </div>
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
                <label className={labelClass}>IGST (%)</label>
                <input
                  type="number"
                  value={restaurantForm.tax.igst ?? ""}
                  onChange={(e) =>
                    setRestaurantForm({
                      ...restaurantForm,
                      tax: {
                        ...restaurantForm.tax,
                        igst: Number(e.target.value),
                      },
                    })
                  }
                  className={inputClass}
                  placeholder="e.g. 5"
                />
              </div>

              {/* Billing Settings */}
              <div className="md:col-span-2">
                <h4 className={subsectionTitleClass}>Billing Settings</h4>
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
              <div className="flex flex-wrap gap-4 col-span-2">
                {(
                  ["enableTaxes", "enableServiceCharge", "roundOff"] as const
                ).map((field) => (
                  <label
                    key={field}
                    className="flex items-center gap-2 cursor-pointer"
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
                    <span className="text-sm text-gray-700">
                      {field === "enableTaxes" && "Enable Taxes"}
                      {field === "enableServiceCharge" &&
                        "Enable Service Charge"}
                      {field === "roundOff" && "Round Off Invoice"}
                    </span>
                  </label>
                ))}
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

              {/* Operations */}
              <div className="md:col-span-2">
                <h4 className={subsectionTitleClass}>Operations</h4>
              </div>
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
              <div className="flex flex-wrap gap-4 col-span-2">
                {(["dineIn", "takeaway", "delivery"] as const).map((field) => (
                  <label
                    key={field}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={restaurantForm.operations[field]}
                      onChange={(e) =>
                        setRestaurantForm({
                          ...restaurantForm,
                          operations: {
                            ...restaurantForm.operations,
                            [field]: e.target.checked,
                          },
                        })
                      }
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700 capitalize">
                      {field}
                    </span>
                  </label>
                ))}
              </div>

              {/* Timings */}
              <div className="md:col-span-2">
                <h4 className={subsectionTitleClass}>Timings</h4>
              </div>
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

              {/* Currency & Logo */}
              <div>
                <label className={labelClass}>Currency</label>
                <select
                  value={restaurantForm.currency}
                  onChange={(e) =>
                    setRestaurantForm({
                      ...restaurantForm,
                      currency: e.target.value,
                    })
                  }
                  className={inputClass}
                >
                  <option value="INR">INR (₹)</option>
                  <option value="USD">USD ($)</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className={labelClass}>Logo</label>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center border">
                    {restaurantForm.logo ? (
                      <img
                        src={restaurantForm.logo}
                        alt="logo"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Store className="w-8 h-8 text-gray-400" />
                    )}
                  </div>
                  <button
                    type="button"
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition flex items-center gap-2"
                    onClick={() =>
                      toast.error("Upload not implemented in demo")
                    }
                  >
                    <Upload className="w-4 h-4" /> Upload
                  </button>
                </div>
              </div>
            </div>

            {/* SAVE BUTTON */}
            <div className="flex justify-end pt-4">
              <button
                onClick={handleUpdateRestaurant}
                disabled={isSaving}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? "Saving..." : "Save Changes"}
              </button>
            </div>

            {/* Marketing Email Section */}
            <div className="mt-8 border-t pt-6">
              <h3 className={sectionTitleClass}>Marketing Email</h3>
              {restaurant?.marketingEmail?.isConnected ? (
                <div className="flex items-center justify-between bg-green-50 border border-green-200 p-4 rounded-lg">
                  <div>
                    <p className="text-green-700 font-medium">✅ Connected</p>
                    <p className="text-sm text-gray-600">
                      {restaurant.marketingEmail.email || "Gmail Connected"}
                    </p>
                  </div>
                  <button
                    onClick={handleDisconnectGmail}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
                  >
                    Disconnect
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between bg-gray-50 border p-4 rounded-lg">
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
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                  >
                    {connecting ? "Connecting..." : "Connect Gmail"}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* -------------------- QR TAB -------------------- */}
        {activeTab === "qr" && (
          <div className="space-y-6">
            <h3 className={sectionTitleClass}>QR Code Settings</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className={labelClass}>Base Order URL</label>
                <input
                  type="url"
                  value={qrSettings.baseUrl}
                  onChange={(e) =>
                    setQrSettings({ ...qrSettings, baseUrl: e.target.value })
                  }
                  className={inputClass}
                  placeholder="https://order.yourdomain.com"
                />
                <p className="text-xs text-gray-500 mt-1">
                  This URL will be used with ?table=TABLE_NUMBER
                </p>
              </div>
              <div>
                <label className={labelClass}>Table Number Prefix</label>
                <input
                  type="text"
                  value={qrSettings.tablePrefix}
                  onChange={(e) =>
                    setQrSettings({
                      ...qrSettings,
                      tablePrefix: e.target.value,
                    })
                  }
                  className={inputClass}
                  placeholder="T"
                />
              </div>
              <div>
                <label className={labelClass}>QR Code Size (px)</label>
                <input
                  type="number"
                  value={qrSettings.qrCodeSize}
                  onChange={(e) =>
                    setQrSettings({
                      ...qrSettings,
                      qrCodeSize: parseInt(e.target.value),
                    })
                  }
                  className={inputClass}
                  min="100"
                  max="500"
                />
              </div>
              <div className="flex items-center">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={qrSettings.autoGenerateOnAdd}
                    onChange={(e) =>
                      setQrSettings({
                        ...qrSettings,
                        autoGenerateOnAdd: e.target.checked,
                      })
                    }
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">
                    Auto-generate QR when adding table
                  </span>
                </label>
              </div>
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

        {/* -------------------- USERS TAB -------------------- */}
        {activeTab === "users" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className={sectionTitleClass}>User Management</h3>
              <button className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition">
                Add User
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th className="px-4 py-2 text-left">Name</th>
                    <th className="px-4 py-2 text-left">Email</th>
                    <th className="px-4 py-2 text-left">Role</th>
                    <th className="px-4 py-2 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td className="px-4 py-2">{user.name}</td>
                      <td className="px-4 py-2">{user.email}</td>
                      <td className="px-4 py-2 capitalize">{user.role}</td>
                      <td className="px-4 py-2">
                        <button className="text-blue-600 hover:text-blue-800 mr-2">
                          Edit
                        </button>
                        <button className="text-red-600 hover:text-red-800">
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* -------------------- SYSTEM TAB -------------------- */}
        {activeTab === "system" && (
          <div className="space-y-6">
            <h3 className={sectionTitleClass}>System Preferences</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className={labelClass}>Currency</label>
                <select
                  value={systemPrefs.currency}
                  onChange={(e) =>
                    setSystemPrefs({ ...systemPrefs, currency: e.target.value })
                  }
                  className={inputClass}
                >
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="INR">INR (₹)</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Tax Rate (%)</label>
                <input
                  type="number"
                  value={systemPrefs.taxRate}
                  onChange={(e) =>
                    setSystemPrefs({
                      ...systemPrefs,
                      taxRate: parseFloat(e.target.value),
                    })
                  }
                  step="0.1"
                  min="0"
                  max="100"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Order Number Prefix</label>
                <input
                  type="text"
                  value={systemPrefs.orderPrefix}
                  onChange={(e) =>
                    setSystemPrefs({
                      ...systemPrefs,
                      orderPrefix: e.target.value,
                    })
                  }
                  className={inputClass}
                  placeholder="ORD"
                />
              </div>
              <div className="flex items-center">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={systemPrefs.autoAcceptOrders}
                    onChange={(e) =>
                      setSystemPrefs({
                        ...systemPrefs,
                        autoAcceptOrders: e.target.checked,
                      })
                    }
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">
                    Auto-accept orders
                  </span>
                </label>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
