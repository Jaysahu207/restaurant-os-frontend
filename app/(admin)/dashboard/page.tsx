"use client";
import {
  IndianRupee,
  ShoppingCart,
  Users,
  Utensils,
  TrendingUp,
  TrendingDown,
} from "lucide-react";


// Example interface for stat items – you can extend it as needed
interface Stat {
  title: string;
  value: string;
  icon: React.ElementType;
  trend?: number; // percentage change (positive = up, negative = down)
  trendLabel?: string; // e.g., "vs yesterday"
  color?: string; // optional accent color
}

const stats: Stat[] = [
  {
    title: "Total Revenue",
    value: "₹45,000",
    icon: IndianRupee,
    trend: 2.5,
    trendLabel: "vs yesterday",
    color: "from-emerald-500 to-teal-500",
  },
  {
    title: "Orders Today",
    value: "120",
    icon: ShoppingCart,
    trend: -5.2,
    trendLabel: "vs yesterday",
    color: "from-blue-500 to-indigo-500",
  },
  {
    title: "Customers",
    value: "340",
    icon: Users,
    trend: 8.1,
    trendLabel: "vs yesterday",
    color: "from-amber-500 to-orange-500",
  },
  {
    title: "Menu Items",
    value: "85",
    icon: Utensils,
    color: "from-rose-500 to-pink-500",
  },
];

// Reusable StatCard component
const StatCard = ({
  title,
  value,
  icon: Icon,
  trend,
  trendLabel,
  color,
}: Stat) => {
  const TrendIcon = trend && trend > 0 ? TrendingUp : TrendingDown;
  const trendColor = trend && trend > 0 ? "text-green-600" : "text-red-600";

  return (
    <div
      className={`
        relative overflow-hidden bg-white p-6 rounded-2xl shadow-md 
        hover:shadow-xl transition-all duration-300 group
      `}
    >
      {/* Colored gradient bar at the top */}
      <div
        className={`absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r ${color}`}
      />

      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">
            {title}
          </p>
          <h3 className="text-2xl font-bold text-gray-800 mt-1">{value}</h3>

          {/* Trend indicator (optional) */}
          {trend !== undefined && (
            <div className="flex items-center gap-1 mt-2 text-sm">
              <TrendIcon className={`w-4 h-4 ${trendColor}`} />
              <span className={trendColor}>{Math.abs(trend)}%</span>
              {trendLabel && (
                <span className="text-gray-400 text-xs ml-1">{trendLabel}</span>
              )}
            </div>
          )}
        </div>

        {/* Icon with circular background */}
        <div
          className={`
          p-3 rounded-full bg-gradient-to-br ${color} 
          text-white shadow-lg group-hover:scale-110 transition-transform
        `}
        >
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
};

export default function DashboardPage() {
  return (
    <div>
      <h2 className="text-3xl font-bold mb-8 text-gray-800">
        Dashboard Overview
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </div>
    </div>
  );
}
