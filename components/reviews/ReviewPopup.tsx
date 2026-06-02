"use client";

import { Star, ExternalLink, X } from "lucide-react";

interface Props {
    open: boolean;
    onClose: () => void;
    onFinish?: () => void;
    googleReviewLink?: string;
}
export default function ReviewPopup({
    open,
    onClose,
    onFinish,
    googleReviewLink
}: Props) {
    if (!open) return null;
    const handleRating = (rating: number) => {
        if (rating >= 4) {
            window.open(googleReviewLink, "_blank");
        } else {
            alert("Open Internal Feedback Form");
        }

        onClose();

        // reset after small delay
        setTimeout(() => {
            onFinish?.();
        }, 3000);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div className="relative w-full max-w-md animate-in fade-in zoom-in">
                {/* Close button (top-right) */}
                <button
                    onClick={onClose}
                    className="absolute -top-2 -right-2 rounded-full bg-white p-1.5 shadow-md hover:bg-slate-100 transition z-10"
                >
                    <X size={18} className="text-slate-500" />
                </button>

                {/* Main card */}
                <div className="bg-white rounded-2xl shadow-xl p-6 text-center">
                    {/* Icon / Emoji */}
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-orange-100 to-amber-100">
                        <span className="text-3xl">❤️</span>
                    </div>

                    <h2 className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
                        Thank You!
                    </h2>

                    <p className="text-slate-600 mt-2 text-sm">
                        How was your dining experience?
                    </p>

                    {/* Star rating */}
                    <div className="flex justify-center gap-2 mt-6">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <button
                                key={star}
                                onClick={() => handleRating(star)}
                                className="group transition-transform hover:scale-110 focus:outline-none"
                            >
                                <Star
                                    className="h-10 w-10 fill-amber-400 text-amber-400 drop-shadow-sm transition group-hover:fill-amber-500 group-hover:text-amber-500"
                                    strokeWidth={1.5}
                                />
                            </button>
                        ))}
                    </div>

                    {/* Divider */}
                    <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-slate-200"></div>
                        </div>
                        <div className="relative flex justify-center text-xs">
                            <span className="bg-white px-2 text-slate-400">or</span>
                        </div>
                    </div>

                    {/* Google review button */}
                    <button
                        onClick={() => window.open(googleReviewLink, "_blank")}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 px-4 py-3 text-sm font-semibold text-white shadow-md transition-all hover:from-orange-700 hover:to-amber-700 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                    >
                        <ExternalLink size={18} />
                        Review on Google
                    </button>

                    {/* Later link */}
                    <button
                        onClick={() => {
                            onClose();

                            // reset later
                            setTimeout(() => {
                                onFinish?.();
                            }, 5000);
                        }}
                        className="mt-4 text-sm text-slate-400 hover:text-slate-600 transition"
                    >
                        Maybe later
                    </button>
                </div>
            </div>
        </div>
    );
}