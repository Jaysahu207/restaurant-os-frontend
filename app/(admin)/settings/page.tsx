"use client";

import { useEffect, useState } from "react";
import {
    Store,
    QrCode,
    CreditCard,
    Bell,
    Users,
    Settings as SettingsIcon,
    Save,
    Upload,
    ToggleLeft,
    ToggleRight,
} from "lucide-react";

import { useAuthStore } from "@/store/useAuthStore";
import API from "@/config/axios";
export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState("restaurant");
    const [saveSuccess, setSaveSuccess] = useState(false);
    const user = useAuthStore((state) => state.user);
    const restaurant = useAuthStore((state) => state.restaurant);
    const token = useAuthStore((state) => state.token);
    const setAuth = useAuthStore((state) => state.setAuth);
    console.log(user, restaurant);

    const [restaurantForm, setRestaurantForm] = useState({
        name: "",
        phone: "",
        email: "",
        address: "",
        logo: "",
        slug: "",
    });
    useEffect(() => {
        if (restaurant) {
            setRestaurantForm({
                name: restaurant.name || "",
                phone: restaurant.phone || "",
                email: restaurant.email || "",
                address: restaurant.address || "",
                logo: restaurant.logo || "",
                slug: restaurant.slug || "",
            });
        }
    }, [restaurant]);

    const handleUpdateRestaurant = async () => {
        try {
            const { data } = await API.put("/api/auth/update-restaurant", restaurantForm);

            setAuth({
                user,
                token,
                restaurant: data.restaurant, // 🔥 update store
            });

        } catch (err) {
            console.log(err);
        }
    };

    // QR settings state
    const [qrSettings, setQrSettings] = useState({
        baseUrl: "https://order.tastybites.com",
        tablePrefix: "T",
        autoGenerateOnAdd: true,
        qrCodeSize: 200,
    });

    // Payment settings
    const [paymentSettings, setPaymentSettings] = useState({
        stripeEnabled: true,
        stripePublicKey: process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY  "",
        stripeSecretKey: "",
        cashEnabled: true,
        upiEnabled: true,
        upiId: "tastybites@okhdfcbank",
    });

    // Notification settings
    const [notificationSettings, setNotificationSettings] = useState({
        emailNewOrder: true,
        emailOrderReady: true,
        smsNewOrder: false,
        smsOrderReady: false,
        whatsappAlerts: true,
    });

    // User management (simplified)
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

    // System preferences
    const [systemPrefs, setSystemPrefs] = useState({
        currency: "USD",
        taxRate: 8.5,
        orderPrefix: "ORD",
        autoAcceptOrders: false,
    });

    const handleSave = () => {
        // In a real app, you would send data to an API
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
    };

    const tabs = [
        { id: "restaurant", label: "Restaurant", icon: Store },
        { id: "qr", label: "QR Codes", icon: QrCode },
        { id: "payment", label: "Payment", icon: CreditCard },
        { id: "notifications", label: "Notifications", icon: Bell },
        { id: "users", label: "Users", icon: Users },
        { id: "system", label: "System", icon: SettingsIcon },
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-800">Settings</h2>
                <button
                    onClick={handleSave}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:shadow-md transition"
                >
                    <Save className="w-4 h-4" />
                    Save Changes
                </button>
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
                {activeTab === "restaurant" && (
                    <div className="space-y-6">
                        <h3 className="text-lg font-semibold text-gray-800">
                            Restaurant Information
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Restaurant Name
                                </label>
                                <input
                                    type="text"
                                    value={restaurantForm.name}
                                    onChange={(e) =>
                                        setRestaurantForm({
                                            ...restaurantForm,
                                            name: e.target.value,
                                        })
                                    }
                                    className="w-full px-3 py-2 text-gray-800  border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"

                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Phone
                                </label>
                                <input
                                    type="text"
                                    value={restaurantForm.phone}
                                    onChange={(e) =>
                                        setRestaurantForm({ ...restaurant, phone: e.target.value })
                                    }
                                    className="w-full px-3 py-2 text-gray-800 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Email
                                </label>
                                <input
                                    type="email"
                                    value={restaurantForm.email}
                                    onChange={(e) =>
                                        setRestaurantForm({ ...restaurant, email: e.target.value })
                                    }
                                    className="w-full px-3 py-2 text-gray-800 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Address
                                </label>
                                <input
                                    type="text"
                                    value={restaurantForm.address}
                                    onChange={(e) =>
                                        setRestaurantForm({ ...restaurant, address: e.target.value })
                                    }
                                    className="w-full px-3 py-2 text-gray-800 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1"> Slug</label>

                                <input
                                    type="text"
                                    value={restaurantForm.slug}
                                    onChange={(e) =>
                                        setRestaurantForm({ ...restaurant, slug: e.target.value })
                                    }
                                    className="w-full px-3 py-2 text-gray-800 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Logo
                                </label>
                                {/* <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center text-gray-400">
                                        {restaurant.logo ? (
                                            <img
                                                src={restaurant.logo}
                                                alt="logo"
                                                className="w-full h-full object-cover rounded-lg"
                                            />
                                        ) : (
                                            <Store className="w-8 h-8" />
                                        )}
                                    </div>
                                    <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50">
                                        <Upload className="w-4 h-4" />
                                        Upload New
                                    </button>
                                </div> */}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === "qr" && (
                    <div className="space-y-6">
                        <h3 className="text-lg font-semibold text-gray-800">
                            QR Code Settings
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Base Order URL
                                </label>
                                <input
                                    type="url"
                                    value={qrSettings.baseUrl}
                                    onChange={(e) =>
                                        setQrSettings({ ...qrSettings, baseUrl: e.target.value })
                                    }
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="https://order.yourdomain.com"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    This URL will be used with ?table=TABLE_NUMBER
                                </p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Table Number Prefix
                                </label>
                                <input
                                    type="text"
                                    value={qrSettings.tablePrefix}
                                    onChange={(e) =>
                                        setQrSettings({
                                            ...qrSettings,
                                            tablePrefix: e.target.value,
                                        })
                                    }
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="T"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    QR Code Size (px)
                                </label>
                                <input
                                    type="number"
                                    value={qrSettings.qrCodeSize}
                                    onChange={(e) =>
                                        setQrSettings({
                                            ...qrSettings,
                                            qrCodeSize: parseInt(e.target.value),
                                        })
                                    }
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                    />
                                    <span className="text-sm text-gray-700">
                                        Auto-generate QR when adding table
                                    </span>
                                </label>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === "payment" && (
                    <div className="space-y-6">
                        <h3 className="text-lg font-semibold text-gray-800">
                            Payment Configuration
                        </h3>
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={paymentSettings.stripeEnabled}
                                        onChange={(e) =>
                                            setPaymentSettings({
                                                ...paymentSettings,
                                                stripeEnabled: e.target.checked,
                                            })
                                        }
                                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                    />
                                    <span className="text-sm text-gray-700">Enable Stripe</span>
                                </label>
                            </div>
                            {paymentSettings.stripeEnabled && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Publishable Key
                                        </label>
                                        <input
                                            type="text"
                                            value={paymentSettings.stripePublicKey}
                                            onChange={(e) =>
                                                setPaymentSettings({
                                                    ...paymentSettings,
                                                    stripePublicKey: e.target.value,
                                                })
                                            }
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Secret Key
                                        </label>
                                        <input
                                            type="password"
                                            value={paymentSettings.stripeSecretKey}
                                            onChange={(e) =>
                                                setPaymentSettings({
                                                    ...paymentSettings,
                                                    stripeSecretKey: e.target.value,
                                                })
                                            }
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                        />
                                    </div>
                                </div>
                            )}
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
                                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
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
                                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                    />
                                    <span className="text-sm text-gray-700">
                                        UPI / GPay / PhonePe
                                    </span>
                                </label>
                            </div>
                            {paymentSettings.upiEnabled && (
                                <div className="pl-6">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        UPI ID
                                    </label>
                                    <input
                                        type="text"
                                        value={paymentSettings.upiId}
                                        onChange={(e) =>
                                            setPaymentSettings({
                                                ...paymentSettings,
                                                upiId: e.target.value,
                                            })
                                        }
                                        className="w-full max-w-md px-3 py-2 border border-gray-300 rounded-lg"
                                        placeholder="restaurant@okhdfcbank"
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === "notifications" && (
                    <div className="space-y-6">
                        <h3 className="text-lg font-semibold text-gray-800">
                            Notification Settings
                        </h3>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-700">
                                    Email on New Order
                                </span>
                                <button
                                    onClick={() =>
                                        setNotificationSettings({
                                            ...notificationSettings,
                                            emailNewOrder: !notificationSettings.emailNewOrder,
                                        })
                                    }
                                    className="focus:outline-none"
                                >
                                    {notificationSettings.emailNewOrder ? (
                                        <ToggleRight className="w-8 h-8 text-blue-600" />
                                    ) : (
                                        <ToggleLeft className="w-8 h-8 text-gray-400" />
                                    )}
                                </button>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-700">
                                    Email when Order Ready
                                </span>
                                <button
                                    onClick={() =>
                                        setNotificationSettings({
                                            ...notificationSettings,
                                            emailOrderReady: !notificationSettings.emailOrderReady,
                                        })
                                    }
                                    className="focus:outline-none"
                                >
                                    {notificationSettings.emailOrderReady ? (
                                        <ToggleRight className="w-8 h-8 text-blue-600" />
                                    ) : (
                                        <ToggleLeft className="w-8 h-8 text-gray-400" />
                                    )}
                                </button>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-700">SMS on New Order</span>
                                <button
                                    onClick={() =>
                                        setNotificationSettings({
                                            ...notificationSettings,
                                            smsNewOrder: !notificationSettings.smsNewOrder,
                                        })
                                    }
                                    className="focus:outline-none"
                                >
                                    {notificationSettings.smsNewOrder ? (
                                        <ToggleRight className="w-8 h-8 text-blue-600" />
                                    ) : (
                                        <ToggleLeft className="w-8 h-8 text-gray-400" />
                                    )}
                                </button>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-700">
                                    SMS when Order Ready
                                </span>
                                <button
                                    onClick={() =>
                                        setNotificationSettings({
                                            ...notificationSettings,
                                            smsOrderReady: !notificationSettings.smsOrderReady,
                                        })
                                    }
                                    className="focus:outline-none"
                                >
                                    {notificationSettings.smsOrderReady ? (
                                        <ToggleRight className="w-8 h-8 text-blue-600" />
                                    ) : (
                                        <ToggleLeft className="w-8 h-8 text-gray-400" />
                                    )}
                                </button>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-700">WhatsApp Alerts</span>
                                <button
                                    onClick={() =>
                                        setNotificationSettings({
                                            ...notificationSettings,
                                            whatsappAlerts: !notificationSettings.whatsappAlerts,
                                        })
                                    }
                                    className="focus:outline-none"
                                >
                                    {notificationSettings.whatsappAlerts ? (
                                        <ToggleRight className="w-8 h-8 text-blue-600" />
                                    ) : (
                                        <ToggleLeft className="w-8 h-8 text-gray-400" />
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === "users" && (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center">
                            <h3 className="text-lg font-semibold text-gray-800">
                                User Management
                            </h3>
                            <button className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
                                Add User
                            </button>
                        </div>
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
                )}

                {activeTab === "system" && (
                    <div className="space-y-6">
                        <h3 className="text-lg font-semibold text-gray-800">
                            System Preferences
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Currency
                                </label>
                                <select
                                    value={systemPrefs.currency}
                                    onChange={(e) =>
                                        setSystemPrefs({ ...systemPrefs, currency: e.target.value })
                                    }
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                                >
                                    <option value="USD">USD ($)</option>
                                    <option value="EUR">EUR (€)</option>
                                    <option value="GBP">GBP (£)</option>
                                    <option value="INR">INR (₹)</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Tax Rate (%)
                                </label>
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
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Order Number Prefix
                                </label>
                                <input
                                    type="text"
                                    value={systemPrefs.orderPrefix}
                                    onChange={(e) =>
                                        setSystemPrefs({
                                            ...systemPrefs,
                                            orderPrefix: e.target.value,
                                        })
                                    }
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
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
