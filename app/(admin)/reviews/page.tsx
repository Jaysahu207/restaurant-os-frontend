"use client";

import { useState } from "react";
import {
  Star,
  StarHalf,
  MessageCircle,
  Search,
  ExternalLink,
  Save,
  Download,
} from "lucide-react";

import QRCode from "react-qr-code";
import toast from "react-hot-toast";
import { useAuthStore } from "@/store/useAuthStore";

import { GoogleReviewSection } from "@/components/reviews/GoogleReviewSection";
// Mock reviews data (replace with API)
const initialReviews = [
  {
    id: 1,
    customer: "Rahul Sharma",
    rating: 5,
    comment:
      "Amazing food and great service! The butter chicken was delicious and the staff was very courteous.",
    date: "2025-03-19T18:30:00",
    source: "App", // App, Google, Zomato, etc.
    replied: true,
    replyText: "Thank you Rahul! We're glad you enjoyed your meal.",
  },
  {
    id: 2,
    customer: "Priya Patel",
    rating: 4,
    comment:
      "Good ambiance and tasty food. The pizza was nice but could have been crispier. Overall good experience.",
    date: "2025-03-18T12:15:00",
    source: "Google",
    replied: false,
  },
  {
    id: 3,
    customer: "Amit Kumar",
    rating: 5,
    comment:
      "Excellent restaurant! The staff is very friendly and the food quality is top notch. Will visit again.",
    date: "2025-03-17T20:45:00",
    source: "Zomato",
    replied: true,
    replyText: "Thanks Amit! Looking forward to serving you again.",
  },
  {
    id: 4,
    customer: "Neha Singh",
    rating: 3,
    comment:
      "Food was okay, but service was a bit slow. The starters were good though.",
    date: "2025-03-16T14:30:00",
    source: "App",
    replied: false,
  },
  {
    id: 5,
    customer: "Vikram Joshi",
    rating: 5,
    comment:
      "Best place in town! The ambiance, food, and service are all excellent. Highly recommended.",
    date: "2025-03-15T19:00:00",
    source: "Google",
    replied: true,
    replyText: "Thank you Vikram! We appreciate your kind words.",
  },
  {
    id: 6,
    customer: "Ananya Reddy",
    rating: 4,
    comment: "Loved the pasta and the dessert. Good value for money.",
    date: "2025-03-14T13:45:00",
    source: "App",
    replied: false,
  },
];

// Source options
const sources = ["All", "App", "Google", "Zomato", "Swiggy"];

// Helper to render stars
const renderStars = (rating: number) => {
  const fullStars = Math.floor(rating);
  const halfStar = rating % 1 !== 0;
  const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);

  return (
    <div className="flex items-center gap-0.5">
      {[...Array(fullStars)].map((_, i) => (
        <Star
          key={`full-${i}`}
          className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400 sm:w-4 sm:h-4"
        />
      ))}
      {halfStar && (
        <StarHalf className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400 sm:w-4 sm:h-4" />
      )}
      {[...Array(emptyStars)].map((_, i) => (
        <Star key={`empty-${i}`} className="w-3.5 h-3.5 text-gray-300 sm:w-4 sm:h-4" />
      ))}
    </div>
  );
};

export default function ReviewsPage() {
  const [reviews, setReviews] = useState(initialReviews);
  const [search, setSearch] = useState("");
  const [sourceFilter, setSourceFilter] = useState("All");
  const [ratingFilter, setRatingFilter] = useState("All"); // All, 5,4,3,2,1
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [replyText, setReplyText] = useState("");

  const restaurant = useAuthStore((state) => state.restaurant);

  // console.log("Restaurant from store in Reviews Page:", restaurant);
  // Filter reviews
  const filteredReviews = reviews.filter((review) => {
    const matchesSearch =
      review.customer.toLowerCase().includes(search.toLowerCase()) ||
      review.comment.toLowerCase().includes(search.toLowerCase());
    const matchesSource =
      sourceFilter === "All" || review.source === sourceFilter;
    const matchesRating =
      ratingFilter === "All" || review.rating === parseInt(ratingFilter);
    return matchesSearch && matchesSource && matchesRating;
  });

  // Stats
  const totalReviews = reviews.length;
  const averageRating =
    reviews.reduce((acc, r) => acc + r.rating, 0) / totalReviews || 0;
  const ratingCounts = [5, 4, 3, 2, 1].map(
    (star) => reviews.filter((r) => Math.floor(r.rating) === star).length,
  );

  // Reply handler
  const handleReply = (id: number) => {
    if (replyText.trim()) {
      setReviews(
        reviews.map((r) =>
          r.id === id
            ? { ...r, replied: true, replyText: replyText.trim() }
            : r,
        ),
      );
      setReplyingTo(null);
      setReplyText("");
    }
  };

  return (
    <div className="space-y-4 p-3 sm:space-y-6 sm:p-4 md:p-6 mx-auto">
      <div>
        <h2 className="text-lg font-bold text-gray-800 sm:text-2xl md:text-3xl">Customer Reviews</h2>
        <p className="hidden text-sm text-gray-500 sm:block">manage your customer reviews </p>
      </div>

      {/* Stats Cards + Google Rating */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-4 md:gap-4">
        <div className="bg-white rounded-xl border border-gray-100 p-2 sm:p-5 col-span-1 md:col-span-3">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-5 sm:gap-4">
            <StatBox
              label="Total Reviews"
              value={totalReviews}
              icon={MessageCircle}
              color="bg-blue-500"
            />
            <StatBox
              label="Average Rating"
              value={averageRating.toFixed(1)}
              icon={Star}
              color="bg-yellow-500"
              suffix="/5"
            />
            <StatBox
              label="5 Star"
              value={ratingCounts[0]}
              icon={Star}
              color="bg-green-500"
            />
            <StatBox
              label="4 Star"
              value={ratingCounts[1]}
              icon={Star}
              color="bg-green-400"
            />
            <StatBox
              label="3 Star"
              value={ratingCounts[2]}
              icon={Star}
              color="bg-yellow-400"
              className="col-span-2 sm:col-span-1"
            />
          </div>
        </div>

        {/* Google Maps Rating Card */}
        <div className="bg-white rounded-xl border border-gray-100 p-3 sm:p-5">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-xs font-semibold text-gray-700 sm:text-base">
              Google Maps
            </h3>

            <ExternalLink className="h-4 w-4 text-gray-400" />
          </div>

          <div className="flex items-center gap-2">
            <div className="text-xl font-bold text-gray-800 sm:text-3xl">
              4.3
            </div>

            <div className="text-[10px] text-gray-500 sm:text-sm">
              (128 reviews)
            </div>
          </div>

          <div className="mt-1 flex items-center gap-1">
            {renderStars(4.3)}
          </div>

          <p className="mt-2 text-[10px] text-gray-400 sm:text-xs">
            Last updated today
          </p>
        </div>
      </div>

      {/* Filters and search */}
      <div className="bg-white p-3 rounded-xl shadow-sm space-y-3 sm:p-4 sm:space-y-4">
        <div className="flex flex-col gap-2.5 md:flex-row md:gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
            <input
              type="text"
              placeholder="Search by customer or comment..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:pl-10"
            />
          </div>

          <div className="flex gap-2.5 md:contents">
            <div className="flex-1 md:w-40 md:flex-none">
              <select
                value={sourceFilter}
                onChange={(e) => setSourceFilter(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white sm:px-4"
              >
                {sources.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex-1 md:w-40 md:flex-none">
              <select
                value={ratingFilter}
                onChange={(e) => setRatingFilter(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white sm:px-4"
              >
                <option value="All">All Ratings</option>
                <option value="5">5 Stars</option>
                <option value="4">4 Stars</option>
                <option value="3">3 Stars</option>
                <option value="2">2 Stars</option>
                <option value="1">1 Star</option>
              </select>
            </div>
          </div>
        </div>
      </div>
      {restaurant && (
        <GoogleReviewSection
          restaurantId={restaurant._id}
          existingLink={restaurant.googleReviewLink}
        />
      )}
      {/* Reviews list */}
      <div className="space-y-3 sm:space-y-4">
        {filteredReviews.length === 0 ? (
          <div className="bg-white p-6 rounded-xl text-center text-sm text-gray-500 sm:p-8">
            No reviews found.
          </div>
        ) : (
          filteredReviews.map((review) => (
            <div
              key={review.id}
              className="bg-white rounded-xl shadow-sm hover:shadow-md transition p-3 border border-gray-100 sm:p-5"
            >
              <div className="flex flex-col md:flex-row md:items-start gap-3 sm:gap-4">
                {/* Left: Customer & Rating */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="min-w-0">
                      <h3 className="truncate text-sm font-semibold text-gray-800 sm:text-base">
                        {review.customer}
                      </h3>
                      <div className="flex flex-wrap items-center gap-1.5 mt-1 sm:gap-2">
                        {renderStars(review.rating)}
                        <span className="text-xs text-gray-500 sm:text-sm">
                          {new Date(review.date).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <span className="shrink-0 px-2 py-1 text-[10px] font-medium rounded-full bg-blue-100 text-blue-700 sm:text-xs">
                      {review.source}
                    </span>
                  </div>
                  <p className="text-gray-600 text-xs mt-2 sm:text-sm">{review.comment}</p>

                  {/* Reply section */}
                  {review.replied ? (
                    <div className="mt-3 p-2.5 bg-gray-50 rounded-lg text-xs sm:p-3 sm:text-sm">
                      <p className="font-medium text-gray-700">Your reply:</p>
                      <p className="text-gray-600 mt-1">{review.replyText}</p>
                    </div>
                  ) : replyingTo === review.id ? (
                    <div className="mt-3">
                      <textarea
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Write your reply..."
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      />
                      <div className="flex justify-end gap-2 mt-2">
                        <button
                          onClick={() => setReplyingTo(null)}
                          className="px-3 py-1 text-sm border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleReply(review.id)}
                          className="px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                          Send Reply
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setReplyingTo(review.id)}
                      className="mt-3 flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 sm:text-sm"
                    >
                      <MessageCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      Reply
                    </button>
                  )}
                </div>

                {/* Right: maybe source icon? Already displayed */}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// Stat Box Component (reused)
function StatBox({
  label,
  value,
  icon: Icon,
  color,
  suffix = "",
  className = "",
}: any) {
  return (
    <div
      className={`bg-white rounded-lg border border-gray-100 p-2 sm:p-4 ${className}`}
    >
      <div className="mb-1 flex items-center justify-between">
        <p className="truncate text-[10px] font-medium text-gray-500 sm:text-sm">
          {label}
        </p>

        <div
          className={`flex h-6 w-6 items-center justify-center rounded-full ${color} text-white sm:h-9 sm:w-9`}
        >
          <Icon className="h-3 w-3 sm:h-4 sm:w-4" />
        </div>
      </div>

      <p className="text-base font-bold text-gray-800 sm:text-2xl">
        {value}
        <span className="text-xs sm:text-base">{suffix}</span>
      </p>
    </div>
  );
}