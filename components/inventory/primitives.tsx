
"use client";

import { forwardRef, type ButtonHTMLAttributes, type InputHTMLAttributes, type SelectHTMLAttributes, type ReactNode } from "react";
import { X } from "lucide-react";

export function cn(...classes: Array<string | false | null | undefined>) {
    return classes.filter(Boolean).join(" ");
}

// ---------------- Button ----------------

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "primary" | "secondary" | "ghost" | "danger";
    size?: "sm" | "md";
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = "primary", size = "md", ...props }, ref) => {
        const base =
            "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2";

        const variants: Record<string, string> = {
            // Primary Orange Button
            primary:
                "bg-orange-500 text-white hover:bg-orange-600 focus-visible:ring-orange-500 shadow-sm",

            // White Button with Orange Border
            secondary:
                "bg-white border border-orange-500 text-orange-600 hover:bg-orange-50 focus-visible:ring-orange-500",

            // Transparent Button
            ghost:
                "text-orange-600 hover:bg-orange-50 focus-visible:ring-orange-500",

            // Danger Button
            danger:
                "bg-red-500 text-white hover:bg-red-600 focus-visible:ring-red-500 shadow-sm",
        };

        const sizes: Record<string, string> = {
            sm: "h-8 px-3 text-sm",
            md: "h-10 px-4 text-sm",
        };

        return (
            <button
                ref={ref}
                className={cn(
                    base,
                    variants[variant],
                    sizes[size],
                    className
                )}
                {...props}
            />
        );
    }
);

Button.displayName = "Button";


// ---------------- Badge (stock status) ----------------

type BadgeTone = "success" | "warning" | "danger" | "neutral";

export function StatusDot({ tone }: { tone: BadgeTone }) {
    const colors: Record<BadgeTone, string> = {
        success: "bg-[#2F6F4F]",
        warning: "bg-[#C77D1D]",
        danger: "bg-[#B3432B]",
        neutral: "bg-gray-400",
    };
    return <span className={cn("inline-block h-2 w-2 rounded-full", colors[tone])} />;
}

export function Badge({ tone, children }: { tone: BadgeTone; children: ReactNode }) {
    const styles: Record<BadgeTone, string> = {
        success: "bg-[#2F6F4F]/10 text-[#2F6F4F]",
        warning: "bg-[#C77D1D]/10 text-[#C77D1D]",
        danger: "bg-[#B3432B]/10 text-[#B3432B]",
        neutral: "bg-gray-100 text-gray-600",
    };
    return (
        <span className={cn("inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium", styles[tone])}>
            <StatusDot tone={tone} />
            {children}
        </span>
    );
}

// ---------------- Card ----------------

export function Card({ className, children }: { className?: string; children: ReactNode }) {
    return (
        <div className={cn("rounded-xl border border-[#E5E1D8] bg-white", className)}>
            {children}
        </div>
    );
}

// ---------------- Ledger number (signature quantity display) ----------------

export function LedgerQty({
    value,
    unit,
    tone = "neutral",
}: {
    value: number;
    unit?: string;
    tone?: BadgeTone;
}) {
    const colors: Record<BadgeTone, string> = {
        success: "text-green-600",
        warning: "text-orange-500",
        danger: "text-red-500",
        neutral: "text-orange-600",
    };

    return (
        <span
            className={cn(
                "font-mono tabular-nums text-sm font-semibold",
                colors[tone]
            )}
        >
            {value?.toLocaleString()}
            {unit ? (
                <span className="ml-1 font-sans text-xs font-normal text-gray-400">
                    {unit}
                </span>
            ) : null}
        </span>
    );
}

// ---------------- Input / Select ----------------

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
    ({ className, ...props }, ref) => (
        <input
            ref={ref}
            className={cn(
                "h-10 w-full rounded-lg border border-[#E5E1D8] bg-white px-3 text-sm text-[#1F2A24] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2F6F4F]/40 focus:border-[#2F6F4F]",
                className
            )}
            {...props}
        />
    )
);
Input.displayName = "Input";

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
    ({ className, children, ...props }, ref) => (
        <select
            ref={ref}
            className={cn(
                "h-10 w-full rounded-lg border border-[#E5E1D8] bg-white px-3 text-sm text-[#1F2A24] focus:outline-none focus:ring-2 focus:ring-[#2F6F4F]/40 focus:border-[#2F6F4F]",
                className
            )}
            {...props}
        >
            {children}
        </select>
    )
);
Select.displayName = "Select";

export function Field({ label, children, error }: { label: string; children: ReactNode; error?: string }) {
    return (
        <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-gray-500">{label}</span>
            {children}
            {error ? <span className="mt-1 block text-xs text-[#B3432B]">{error}</span> : null}
        </label>
    );
}

// ---------------- Modal ----------------

export function Modal({
    open,
    onClose,
    title,
    children,
    footer,
    size = "md",
}: {
    open: boolean;
    onClose: () => void;
    title: string;
    children: ReactNode;
    footer?: ReactNode;
    size?: "sm" | "md" | "lg";
}) {
    if (!open) return null;
    const widths: Record<string, string> = {
        sm: "sm:max-w-sm",
        md: "sm:max-w-md",
        lg: "sm:max-w-xl",
    };
    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
            <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden />
            <div
                className={cn(
                    "relative z-10 w-full rounded-t-2xl bg-white shadow-xl sm:rounded-2xl",
                    "max-h-[90vh] overflow-y-auto",
                    widths[size]
                )}
                role="dialog"
                aria-modal="true"
                aria-label={title}
            >
                <div className="flex items-center justify-between border-b border-[#E5E1D8] px-5 py-4">
                    <h2 className="text-base font-semibold text-[#1F2A24]">{title}</h2>
                    <button
                        onClick={onClose}
                        className="rounded-md p-1 text-gray-400 hover:bg-[#FAF9F6] hover:text-[#1F2A24]"
                        aria-label="Close"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
                <div className="px-5 py-4">{children}</div>
                {footer ? <div className="flex justify-end gap-2 border-t border-[#E5E1D8] px-5 py-4">{footer}</div> : null}
            </div>
        </div>
    );
}

// ---------------- Empty state ----------------

export function EmptyState({
    title,
    description,
    action,
}: {
    title: string;
    description: string;
    action?: ReactNode;
}) {
    return (
        <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
            <div className="text-sm font-medium text-[#1F2A24]">{title}</div>
            <p className="max-w-sm text-sm text-gray-500">{description}</p>
            {action}
        </div>
    );
}

// ---------------- Skeleton ----------------

export function Skeleton({ className }: { className?: string }) {
    return <div className={cn("animate-pulse rounded-md bg-[#E5E1D8]/60", className)} />;
}