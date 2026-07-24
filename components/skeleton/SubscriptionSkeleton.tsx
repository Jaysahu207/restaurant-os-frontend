// components/SubscriptionSkeleton.tsx
export default function SubscriptionSkeleton() {
    return (
        <div className="space-y-6 p-6 animate-pulse">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <div className="h-8 w-64 bg-gray-200 rounded"></div>
                    <div className="h-4 w-72 bg-gray-200 rounded mt-1"></div>
                </div>
            </div>

            {/* Current Plan Card */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50">
                    <div className="flex items-center gap-2">
                        <div className="w-5 h-5 bg-gray-200 rounded"></div>
                        <div className="h-5 w-28 bg-gray-200 rounded"></div>
                    </div>
                </div>
                <div className="p-5">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div className="space-y-3">
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                                <div className="h-6 w-20 bg-gray-200 rounded-full"></div>
                                <div className="h-6 w-20 bg-gray-200 rounded-full"></div>
                                <div className="flex items-center gap-1">
                                    <div className="w-4 h-4 bg-gray-200 rounded"></div>
                                    <div className="h-4 w-32 bg-gray-200 rounded"></div>
                                </div>
                            </div>
                            <div className="flex items-start gap-2 p-3 bg-gray-100 rounded-lg">
                                <div className="w-4 h-4 bg-gray-200 rounded mt-0.5"></div>
                                <div className="h-4 w-64 bg-gray-200 rounded"></div>
                            </div>
                        </div>
                        <div className="h-10 w-40 bg-gray-200 rounded-lg"></div>
                    </div>
                </div>
            </div>

            {/* Free Trial Banner Placeholder */}
            <div className="bg-gray-300 rounded-xl shadow-sm overflow-hidden h-24">
                <div className="px-6 py-6 md:px-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="space-y-2">
                        <div className="w-40 h-6 bg-gray-400 rounded-full"></div>
                        <div className="h-7 w-64 bg-gray-400 rounded"></div>
                        <div className="h-4 w-96 bg-gray-400 rounded"></div>
                    </div>
                </div>
            </div>

            {/* Usage Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div className="h-4 w-24 bg-gray-200 rounded"></div>
                            <div className="w-5 h-5 bg-gray-200 rounded"></div>
                        </div>
                        <div className="h-8 w-12 bg-gray-200 rounded mt-1"></div>
                    </div>
                ))}
            </div>

            {/* Plans Section */}
            <div className="space-y-4">
                <div>
                    <div className="h-7 w-40 bg-gray-200 rounded"></div>
                    <div className="h-4 w-64 bg-gray-200 rounded mt-1"></div>
                </div>
                {/* Billing toggle */}
                <div className="flex justify-center mb-8">
                    <div className="inline-flex rounded-xl bg-gray-200 p-1">
                        <div className="px-5 py-2 rounded-lg w-24 h-10 bg-white shadow"></div>
                        <div className="px-5 py-2 rounded-lg w-24 h-10 bg-gray-300"></div>
                    </div>
                </div>
                {/* Plan Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[...Array(2)].map((_, idx) => (
                        <div
                            key={idx}
                            className="relative bg-white rounded-xl border border-slate-200 shadow-sm p-6"
                        >
                            {idx === 0 && (
                                <div className="absolute -top-3 left-6 h-6 w-28 bg-indigo-300 rounded-full"></div>
                            )}
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <div className="h-6 w-32 bg-gray-200 rounded"></div>
                                    <div className="h-4 w-40 bg-gray-200 rounded mt-1"></div>
                                </div>
                                <div className="bg-gray-200 p-2 rounded-lg w-10 h-10"></div>
                            </div>
                            <div className="mb-4">
                                <div className="flex items-baseline gap-1">
                                    <div className="h-8 w-20 bg-gray-200 rounded"></div>
                                    <div className="h-4 w-12 bg-gray-200 rounded"></div>
                                </div>
                            </div>
                            <div className="space-y-2 mb-6">
                                {[...Array(5)].map((_, i) => (
                                    <div key={i} className="flex items-center gap-2">
                                        <div className="w-4 h-4 bg-gray-200 rounded"></div>
                                        <div className="h-4 w-32 bg-gray-200 rounded"></div>
                                    </div>
                                ))}
                            </div>
                            <div className="w-full h-10 bg-gray-200 rounded-lg"></div>
                            <div className="text-center h-4 w-40 bg-gray-200 rounded mx-auto mt-3"></div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Invoice & Payment Methods */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Invoices */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50">
                        <div className="h-5 w-32 bg-gray-200 rounded"></div>
                    </div>
                    <div className="divide-y divide-slate-100">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="flex items-center justify-between p-4">
                                <div>
                                    <div className="h-5 w-20 bg-gray-200 rounded"></div>
                                    <div className="h-3 w-24 bg-gray-200 rounded mt-1"></div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="h-5 w-16 bg-gray-200 rounded"></div>
                                    <div className="w-12 h-5 bg-gray-200 rounded-full"></div>
                                    <div className="w-6 h-6 bg-gray-200 rounded"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/30 text-right">
                        <div className="h-4 w-20 bg-gray-200 rounded ml-auto"></div>
                    </div>
                </div>

                {/* Payment Methods */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                        <div className="h-5 w-32 bg-gray-200 rounded"></div>
                        <div className="h-5 w-12 bg-gray-200 rounded"></div>
                    </div>
                    <div className="divide-y divide-slate-100">
                        {[...Array(2)].map((_, i) => (
                            <div key={i} className="flex items-center justify-between p-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-5 h-5 bg-gray-200 rounded"></div>
                                    <div>
                                        <div className="h-5 w-20 bg-gray-200 rounded"></div>
                                        <div className="h-3 w-24 bg-gray-200 rounded mt-1"></div>
                                    </div>
                                </div>
                                <div className="h-5 w-14 bg-gray-200 rounded-full"></div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Support Footer */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 text-center">
                <div className="h-4 w-64 bg-gray-200 rounded mx-auto"></div>
            </div>
        </div>
    );
}