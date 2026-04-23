// app/super-admin/settings/page.tsx
"use client";

import { useState } from "react";
import {
  Settings as SettingsIcon,
  User,
  Bell,
  Shield,
  Key,
  Globe,
  Save,
  Lock,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  Moon,
  Sun,
  Smartphone,
  Database,
  Server,
  AlertCircle,
} from "lucide-react";

type TabType = "general" | "profile" | "notifications" | "security" | "api";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabType>("general");

  // Form states
  const [generalSettings, setGeneralSettings] = useState({
    siteName: "Restaurant Admin Suite",
    siteUrl: "https://admin.restaurantapp.com",
    timezone: "America/New_York",
    dateFormat: "MM/DD/YYYY",
    language: "en",
    maintenanceMode: false,
  });

  const [profile, setProfile] = useState({
    name: "Super Admin",
    email: "super.admin@restaurantapp.com",
    phone: "+1 (555) 123-4567",
    location: "San Francisco, CA",
    department: "Executive",
    bio: "Platform administrator with 5+ years of experience in restaurant management systems.",
  });

  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    pushNotifications: true,
    newRestaurantAlerts: true,
    subscriptionRenewals: true,
    supportTickets: true,
    systemUpdates: false,
    weeklyReports: true,
  });

  const [security, setSecurity] = useState({
    twoFactorAuth: false,
    sessionTimeout: "30",
    loginAlerts: true,
    ipWhitelist: "",
  });

  const [apiSettings, setApiSettings] = useState({
    apiKey: process.env.NEXT_PUBLIC_API_KEY,
    webhookUrl: "https://api.restaurantapp.com/webhooks",
    rateLimit: "1000",
    allowedOrigins: "https://admin.restaurantapp.com",
  });

  const [saveMessage, setSaveMessage] = useState("");

  const handleSave = (section: string) => {
    setSaveMessage(`${section} settings saved successfully!`);
    setTimeout(() => setSaveMessage(""), 3000);
  };

  const tabs = [
    { id: "general", label: "General", icon: SettingsIcon },
    { id: "profile", label: "Profile", icon: User },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "security", label: "Security", icon: Shield },
    { id: "api", label: "API", icon: Key },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold bg-gradient-to-r from-indigo-700 to-purple-700 bg-clip-text text-transparent">
          Settings
        </h1>
        <p className="text-slate-500 mt-1">
          Manage your application preferences, profile, and security
        </p>
      </div>

      {/* Save Message Toast */}
      {saveMessage && (
        <div className="fixed top-20 right-6 z-50 bg-emerald-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 animate-in slide-in-from-top-2">
          <Save size={16} />
          {saveMessage}
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar Tabs */}
        <div className="lg:w-64 flex-shrink-0">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden sticky top-20">
            <div className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-slate-200">
              <h2 className="font-semibold text-slate-800 flex items-center gap-2">
                <SettingsIcon size={18} className="text-indigo-600" />
                Preferences
              </h2>
            </div>
            <div className="p-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as TabType)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 mb-1 ${
                      activeTab === tab.id
                        ? "bg-indigo-50 text-indigo-700 font-medium"
                        : "text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <Icon size={18} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            {/* General Settings Tab */}
            {activeTab === "general" && (
              <div>
                <div className="p-5 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white">
                  <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                    <Globe size={20} className="text-indigo-600" />
                    General Settings
                  </h2>
                  <p className="text-sm text-slate-500 mt-1">
                    Configure basic platform settings
                  </p>
                </div>
                <div className="p-5 space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Site Name
                      </label>
                      <input
                        type="text"
                        value={generalSettings.siteName}
                        onChange={(e) =>
                          setGeneralSettings({
                            ...generalSettings,
                            siteName: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Site URL
                      </label>
                      <input
                        type="url"
                        value={generalSettings.siteUrl}
                        onChange={(e) =>
                          setGeneralSettings({
                            ...generalSettings,
                            siteUrl: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Timezone
                      </label>
                      <select
                        value={generalSettings.timezone}
                        onChange={(e) =>
                          setGeneralSettings({
                            ...generalSettings,
                            timezone: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none"
                      >
                        <option>America/New_York</option>
                        <option>America/Los_Angeles</option>
                        <option>Europe/London</option>
                        <option>Asia/Tokyo</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Date Format
                      </label>
                      <select
                        value={generalSettings.dateFormat}
                        onChange={(e) =>
                          setGeneralSettings({
                            ...generalSettings,
                            dateFormat: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none"
                      >
                        <option>MM/DD/YYYY</option>
                        <option>DD/MM/YYYY</option>
                        <option>YYYY-MM-DD</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Default Language
                      </label>
                      <select
                        value={generalSettings.language}
                        onChange={(e) =>
                          setGeneralSettings({
                            ...generalSettings,
                            language: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none"
                      >
                        <option value="en">English</option>
                        <option value="es">Spanish</option>
                        <option value="fr">French</option>
                        <option value="de">German</option>
                      </select>
                    </div>
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-slate-700">
                        Maintenance Mode
                      </label>
                      <button
                        onClick={() =>
                          setGeneralSettings({
                            ...generalSettings,
                            maintenanceMode: !generalSettings.maintenanceMode,
                          })
                        }
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                          generalSettings.maintenanceMode
                            ? "bg-amber-500"
                            : "bg-slate-300"
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                            generalSettings.maintenanceMode
                              ? "translate-x-6"
                              : "translate-x-1"
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                  <div className="flex justify-end pt-4">
                    <button
                      onClick={() => handleSave("General")}
                      className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                    >
                      <Save size={16} /> Save Changes
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Profile Tab */}
            {activeTab === "profile" && (
              <div>
                <div className="p-5 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white">
                  <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                    <User size={20} className="text-indigo-600" />
                    Admin Profile
                  </h2>
                  <p className="text-sm text-slate-500 mt-1">
                    Update your personal information
                  </p>
                </div>
                <div className="p-5 space-y-5">
                  <div className="flex items-center gap-4 pb-4 border-b border-slate-100">
                    <div className="h-20 w-20 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold shadow-md">
                      SA
                    </div>
                    <div>
                      <button className="text-sm text-indigo-600 hover:text-indigo-800">
                        Change Avatar
                      </button>
                      <p className="text-xs text-slate-400 mt-1">
                        JPG, GIF or PNG. Max size 2MB.
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Full Name
                      </label>
                      <input
                        type="text"
                        value={profile.name}
                        onChange={(e) =>
                          setProfile({ ...profile, name: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={profile.email}
                        onChange={(e) =>
                          setProfile({ ...profile, email: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        value={profile.phone}
                        onChange={(e) =>
                          setProfile({ ...profile, phone: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Location
                      </label>
                      <input
                        type="text"
                        value={profile.location}
                        onChange={(e) =>
                          setProfile({ ...profile, location: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Department
                      </label>
                      <input
                        type="text"
                        value={profile.department}
                        onChange={(e) =>
                          setProfile({ ...profile, department: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Bio
                      </label>
                      <textarea
                        rows={3}
                        value={profile.bio}
                        onChange={(e) =>
                          setProfile({ ...profile, bio: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end pt-4">
                    <button
                      onClick={() => handleSave("Profile")}
                      className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                    >
                      <Save size={16} /> Update Profile
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Notifications Tab */}
            {activeTab === "notifications" && (
              <div>
                <div className="p-5 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white">
                  <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                    <Bell size={20} className="text-indigo-600" />
                    Notification Preferences
                  </h2>
                  <p className="text-sm text-slate-500 mt-1">
                    Choose what alerts you receive
                  </p>
                </div>
                <div className="p-5 space-y-4">
                  <div className="space-y-3">
                    {Object.entries(notifications).map(([key, value]) => (
                      <div
                        key={key}
                        className="flex items-center justify-between py-2 border-b border-slate-100"
                      >
                        <div>
                          <p className="font-medium text-slate-700">
                            {key
                              .replace(/([A-Z])/g, " $1")
                              .replace(/^./, (str) => str.toUpperCase())}
                          </p>
                          <p className="text-xs text-slate-400">
                            {key === "emailNotifications" &&
                              "Receive email updates"}
                            {key === "pushNotifications" &&
                              "Browser push notifications"}
                            {key === "newRestaurantAlerts" &&
                              "When new restaurants register"}
                            {key === "subscriptionRenewals" &&
                              "Subscription payment updates"}
                            {key === "supportTickets" && "New support tickets"}
                            {key === "systemUpdates" &&
                              "Platform maintenance & updates"}
                            {key === "weeklyReports" && "Weekly summary report"}
                          </p>
                        </div>
                        <button
                          onClick={() =>
                            setNotifications({
                              ...notifications,
                              [key]: !value,
                            })
                          }
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                            value ? "bg-indigo-600" : "bg-slate-300"
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                              value ? "translate-x-6" : "translate-x-1"
                            }`}
                          />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-end pt-4">
                    <button
                      onClick={() => handleSave("Notification")}
                      className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                    >
                      <Save size={16} /> Save Preferences
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Security Tab */}
            {activeTab === "security" && (
              <div>
                <div className="p-5 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white">
                  <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                    <Shield size={20} className="text-indigo-600" />
                    Security Settings
                  </h2>
                  <p className="text-sm text-slate-500 mt-1">
                    Protect your account and platform
                  </p>
                </div>
                <div className="p-5 space-y-5">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between py-2 border-b border-slate-100">
                      <div>
                        <p className="font-medium text-slate-700">
                          Two-Factor Authentication
                        </p>
                        <p className="text-xs text-slate-400">
                          Add an extra layer of security to your account
                        </p>
                      </div>
                      <button
                        onClick={() =>
                          setSecurity({
                            ...security,
                            twoFactorAuth: !security.twoFactorAuth,
                          })
                        }
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                          security.twoFactorAuth
                            ? "bg-indigo-600"
                            : "bg-slate-300"
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                            security.twoFactorAuth
                              ? "translate-x-6"
                              : "translate-x-1"
                          }`}
                        />
                      </button>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-slate-100">
                      <div>
                        <p className="font-medium text-slate-700">
                          Login Alerts
                        </p>
                        <p className="text-xs text-slate-400">
                          Get notified of new login attempts
                        </p>
                      </div>
                      <button
                        onClick={() =>
                          setSecurity({
                            ...security,
                            loginAlerts: !security.loginAlerts,
                          })
                        }
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                          security.loginAlerts
                            ? "bg-indigo-600"
                            : "bg-slate-300"
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                            security.loginAlerts
                              ? "translate-x-6"
                              : "translate-x-1"
                          }`}
                        />
                      </button>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Session Timeout (minutes)
                      </label>
                      <select
                        value={security.sessionTimeout}
                        onChange={(e) =>
                          setSecurity({
                            ...security,
                            sessionTimeout: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                      >
                        <option value="15">15 minutes</option>
                        <option value="30">30 minutes</option>
                        <option value="60">1 hour</option>
                        <option value="120">2 hours</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        IP Whitelist (comma-separated)
                      </label>
                      <textarea
                        rows={2}
                        placeholder="192.168.1.1, 10.0.0.1"
                        value={security.ipWhitelist}
                        onChange={(e) =>
                          setSecurity({
                            ...security,
                            ipWhitelist: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                      />
                      <p className="text-xs text-slate-400 mt-1">
                        Leave empty to allow all IPs
                      </p>
                    </div>
                    <div className="pt-2">
                      <button className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition">
                        <Lock size={16} /> Change Password
                      </button>
                    </div>
                  </div>
                  <div className="flex justify-end pt-4">
                    <button
                      onClick={() => handleSave("Security")}
                      className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                    >
                      <Save size={16} /> Save Security Settings
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* API Tab */}
            {activeTab === "api" && (
              <div>
                <div className="p-5 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white">
                  <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                    <Key size={20} className="text-indigo-600" />
                    API Configuration
                  </h2>
                  <p className="text-sm text-slate-500 mt-1">
                    Manage API keys and webhook endpoints
                  </p>
                </div>
                <div className="p-5 space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      API Key
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={apiSettings.apiKey}
                        readOnly
                        className="flex-1 px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 font-mono text-sm"
                      />
                      <button className="px-3 py-2 bg-slate-100 rounded-lg hover:bg-slate-200 transition text-sm">
                        Copy
                      </button>
                      <button className="px-3 py-2 bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200 transition text-sm">
                        Regenerate
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Webhook URL
                    </label>
                    <input
                      type="url"
                      value={apiSettings.webhookUrl}
                      onChange={(e) =>
                        setApiSettings({
                          ...apiSettings,
                          webhookUrl: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Rate Limit (requests per minute)
                    </label>
                    <input
                      type="number"
                      value={apiSettings.rateLimit}
                      onChange={(e) =>
                        setApiSettings({
                          ...apiSettings,
                          rateLimit: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Allowed Origins (CORS)
                    </label>
                    <input
                      type="text"
                      value={apiSettings.allowedOrigins}
                      onChange={(e) =>
                        setApiSettings({
                          ...apiSettings,
                          allowedOrigins: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                      placeholder="https://example.com, https://api.example.com"
                    />
                  </div>
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
                    <AlertCircle size={16} className="text-amber-600 mt-0.5" />
                    <p className="text-xs text-amber-700">
                      Regenerating your API key will invalidate the old key
                      immediately. Make sure to update any integrations using
                      this key.
                    </p>
                  </div>
                  <div className="flex justify-end pt-4">
                    <button
                      onClick={() => handleSave("API")}
                      className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                    >
                      <Save size={16} /> Save API Settings
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
