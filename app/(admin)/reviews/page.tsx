"use client";

import { useState } from "react";
import {
    Star,
    StarHalf,
    ThumbsUp,
    MessageCircle,
    Filter,
    Search,
    Calendar,
    ExternalLink,
    X,
} from "lucide-react";

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
        comment:
            "Loved the pasta and the dessert. Good value for money.",
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
                <Star key={`full-${i}`} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            ))}
            {halfStar && <StarHalf className="w-4 h-4 fill-yellow-400 text-yellow-400" />}
            {[...Array(emptyStars)].map((_, i) => (
                <Star key={`empty-${i}`} className="w-4 h-4 text-gray-300" />
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

    // Filter reviews
    const filteredReviews = reviews.filter((review) => {
        const matchesSearch =
            review.customer.toLowerCase().includes(search.toLowerCase()) ||
            review.comment.toLowerCase().includes(search.toLowerCase());
        const matchesSource = sourceFilter === "All" || review.source === sourceFilter;
        const matchesRating =
            ratingFilter === "All" || review.rating === parseInt(ratingFilter);
        return matchesSearch && matchesSource && matchesRating;
    });

    // Stats
    const totalReviews = reviews.length;
    const averageRating =
        reviews.reduce((acc, r) => acc + r.rating, 0) / totalReviews || 0;
    const ratingCounts = [5, 4, 3, 2, 1].map(
        (star) => reviews.filter((r) => Math.floor(r.rating) === star).length
    );

    // Reply handler
    const handleReply = (id: number) => {
        if (replyText.trim()) {
            setReviews(
                reviews.map((r) =>
                    r.id === id ? { ...r, replied: true, replyText: replyText.trim() } : r
                )
            );
            setReplyingTo(null);
            setReplyText("");
        }
    };

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800">Customer Reviews</h2>

            {/* Stats Cards + Google Rating */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl shadow-sm col-span-1 md:col-span-3">
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
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
                        />
                    </div>
                </div>

                {/* Google Maps Rating Card */}
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-gray-700">Google Maps</h3>
                        <ExternalLink className="w-4 h-4 text-gray-400" />
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="text-3xl font-bold text-gray-800">4.3</div>
                        <div className="text-sm text-gray-500">(128 reviews)</div>
                    </div>
                    <div className="flex items-center gap-1 mt-1">
                        {renderStars(4.3)}
                    </div>
                    <p className="text-xs text-gray-400 mt-2">Last updated today</p>
                </div>
            </div>

            {/* Filters and search */}
            <div className="bg-white p-4 rounded-xl shadow-sm space-y-4">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Search by customer or comment..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    <div className="sm:w-40">
                        <select
                            value={sourceFilter}
                            onChange={(e) => setSourceFilter(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                        >
                            {sources.map((s) => (
                                <option key={s} value={s}>
                                    {s}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="sm:w-40">
                        <select
                            value={ratingFilter}
                            onChange={(e) => setRatingFilter(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
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

            {/* Reviews list */}
            <div className="space-y-4">
                {filteredReviews.length === 0 ? (
                    <div className="bg-white p-8 rounded-xl text-center text-gray-500">
                        No reviews found.
                    </div>
                ) : (
                    filteredReviews.map((review) => (
                        <div
                            key={review.id}
                            className="bg-white rounded-xl shadow-sm hover:shadow-md transition p-5 border border-gray-100"
                        >
                            <div className="flex flex-col md:flex-row md:items-start gap-4">
                                {/* Left: Customer & Rating */}
                                <div className="flex-1">
                                    <div className="flex items-center justify-between mb-2">
                                        <div>
                                            <h3 className="font-semibold text-gray-800">{review.customer}</h3>
                                            <div className="flex items-center gap-2 mt-1">
                                                {renderStars(review.rating)}
                                                <span className="text-sm text-gray-500">
                                                    {new Date(review.date).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </div>
                                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700">
                                            {review.source}
                                        </span>
                                    </div>
                                    <p className="text-gray-600 text-sm mt-2">{review.comment}</p>

                                    {/* Reply section */}
                                    {review.replied ? (
                                        <div className="mt-3 p-3 bg-gray-50 rounded-lg text-sm">
                                            <p className="font-medium text-gray-700">Your reply:</p>
                                            <p className="text-gray-600 mt-1">{review.replyText}</p>
                                        </div>
                                    ) : (
                                        replyingTo === review.id ? (
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
                                                className="mt-3 flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
                                            >
                                                <MessageCircle className="w-4 h-4" />
                                                Reply
                                            </button>
                                        )
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
function StatBox({ label, value, icon: Icon, color, suffix = "" }: any) {
    return (
        <div className="bg-white p-4 rounded-xl border border-gray-100">
            <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-500">{label}</p>
                <div className={`p-2 rounded-full ${color} text-white`}>
                    <Icon className="w-4 h-4" />
                </div>
            </div>
            <p className="text-2xl font-bold text-gray-800">
                {value}
                {suffix}
            </p>
        </div>
    );
}