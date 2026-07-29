import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { Check, ChevronDown, Search, Plus } from "lucide-react";

/**
 * CategoryCombobox
 * ------------------------------------------------------------------
 * Drop-in replacement for the plain <select name="category" ...> field
 * in MenuFormModal. It is fully self-contained (no external UI lib),
 * matches the existing design system (rounded-lg, border-gray-300,
 * focus:ring-2 focus:ring-blue-500, etc.), and preserves the parent's
 * existing state management contract:
 *
 *   - It never mutates formData directly.
 *   - On selection it calls `onChange` with a synthetic event shaped
 *     like { target: { name: "category", value, type: "text" } } so
 *     it can be wired straight into the existing `handleChange`.
 *
 * Usage (inside MenuFormModal, in place of the old <select>):
 *
 *   <CategoryCombobox
 *     name="category"
 *     categories={categories}
 *     value={formData.category}
 *     onChange={handleChange}
 *   />
 *
 * `categories` supports both string[] and {_id, name}[] shapes, same
 * as the original <select> did.
 */

type RawCategory = any;

interface CategoryComboboxProps {
    name?: string;
    categories: RawCategory[];
    value: string;
    onChange: (e: { target: { name: string; value: string; type: string } }) => void;
    onCreateCategory?: () => void;
    placeholder?: string;
    disabled?: boolean;
}

const RECENT_KEY = "recentMenuCategories";
const MAX_RECENT = 5;

function getCatValue(cat: RawCategory): string {
    return typeof cat === "string" ? cat : cat?._id ?? cat?.id ?? "";
}

function getCatLabel(cat: RawCategory): string {
    return typeof cat === "string" ? cat : cat?.name ?? "";
}

function loadRecent(): string[] {
    try {
        const raw = localStorage.getItem(RECENT_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

function saveRecent(ids: string[]) {
    try {
        localStorage.setItem(RECENT_KEY, JSON.stringify(ids.slice(0, MAX_RECENT)));
    } catch {
        // ignore storage errors (private mode, quota, etc.)
    }
}

export default function CategoryCombobox({
    name = "category",
    categories,
    value,
    onChange,
    onCreateCategory,
    placeholder = "Select category",
    disabled = false,
}: CategoryComboboxProps) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");
    const [highlightedIndex, setHighlightedIndex] = useState(0);
    const [recentIds, setRecentIds] = useState<string[]>([]);

    const containerRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const listRef = useRef<HTMLUListElement>(null);

    useEffect(() => {
        setRecentIds(loadRecent());
    }, []);

    // Close on outside click.
    useEffect(() => {
        if (!open) return;
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [open]);

    // Autofocus search input when the popover opens.
    useEffect(() => {
        if (open) {
            setSearch("");
            setHighlightedIndex(0);
            // rAF so the input exists in the DOM before we focus it.
            requestAnimationFrame(() => searchInputRef.current?.focus());
        }
    }, [open]);

    const selectedCategory = useMemo(
        () => categories.find((cat) => getCatValue(cat) === value),
        [categories, value],
    );

    const filteredCategories = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return categories;
        return categories.filter((cat) => getCatLabel(cat).toLowerCase().includes(q));
    }, [categories, search]);

    // Recently selected categories, shown at the top only while not searching.
    const recentCategories = useMemo(() => {
        if (search.trim()) return [];
        return recentIds
            .map((id) => categories.find((cat) => getCatValue(cat) === id))
            .filter(Boolean) as RawCategory[];
    }, [recentIds, categories, search]);

    const recentValueSet = useMemo(
        () => new Set(recentCategories.map((cat) => getCatValue(cat))),
        [recentCategories],
    );

    // The rest of the list, excluding whatever is already shown under "Recent".
    const remainingCategories = useMemo(() => {
        if (recentCategories.length === 0) return filteredCategories;
        return filteredCategories.filter((cat) => !recentValueSet.has(getCatValue(cat)));
    }, [filteredCategories, recentCategories, recentValueSet]);

    // Flat list used for keyboard navigation, matching visual order.
    const flatOptions = useMemo(
        () => [...recentCategories, ...remainingCategories],
        [recentCategories, remainingCategories],
    );

    useEffect(() => {
        setHighlightedIndex(0);
    }, [search]);

    const commitSelection = useCallback(
        (cat: RawCategory) => {
            const catValue = getCatValue(cat);
            onChange({ target: { name, value: catValue, type: "text" } });
            setRecentIds((prev) => {
                const next = [catValue, ...prev.filter((id) => id !== catValue)].slice(0, MAX_RECENT);
                saveRecent(next);
                return next;
            });
            setOpen(false);
        },
        [name, onChange],
    );

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Escape") {
            e.preventDefault();
            setOpen(false);
            return;
        }
        if (e.key === "ArrowDown") {
            e.preventDefault();
            setHighlightedIndex((i) => Math.min(i + 1, flatOptions.length - 1));
            return;
        }
        if (e.key === "ArrowUp") {
            e.preventDefault();
            setHighlightedIndex((i) => Math.max(i - 1, 0));
            return;
        }
        if (e.key === "Enter") {
            e.preventDefault();
            const target = flatOptions[highlightedIndex];
            if (target) commitSelection(target);
            return;
        }
    };

    // Keep the highlighted row scrolled into view.
    useEffect(() => {
        if (!open || !listRef.current) return;
        const el = listRef.current.querySelector<HTMLElement>(`[data-index="${highlightedIndex}"]`);
        el?.scrollIntoView({ block: "nearest" });
    }, [highlightedIndex, open]);

    const renderRow = (cat: RawCategory, flatIndex: number) => {
        const catValue = getCatValue(cat);
        const isSelected = catValue === value;
        const isHighlighted = flatIndex === highlightedIndex;
        return (
            <li
                key={catValue || getCatLabel(cat)}
                data-index={flatIndex}
                role="option"
                aria-selected={isSelected}
                onMouseEnter={() => setHighlightedIndex(flatIndex)}
                onClick={() => commitSelection(cat)}
                className={`flex items-center justify-between gap-2 px-3 py-2 text-sm rounded-lg cursor-pointer transition-colors ${isHighlighted ? "bg-blue-50 text-blue-700" : "text-gray-700 hover:bg-gray-50"
                    }`}
            >
                <span className="truncate">{getCatLabel(cat)}</span>
                {isSelected && <Check className="w-4 h-4 text-blue-600 shrink-0" />}
            </li>
        );
    };

    return (
        <div ref={containerRef} className="relative">
            <button
                type="button"
                disabled={disabled}
                onClick={() => setOpen((o) => !o)}
                className={`w-full flex items-center justify-between px-3 py-2 text-left border border-gray-300 rounded-lg bg-white transition focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${disabled ? "bg-gray-50 text-gray-400 cursor-not-allowed" : "text-gray-700"
                    }`}
            >
                <span className={selectedCategory ? "truncate" : "truncate text-gray-400"}>
                    {selectedCategory ? getCatLabel(selectedCategory) : placeholder}
                </span>
                <ChevronDown className={`w-4 h-4 text-gray-400 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
            </button>

            {open && (
                <div className="absolute z-20 mt-1.5 w-full bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
                    <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-100">
                        <Search className="w-4 h-4 text-gray-400 shrink-0" />
                        <input
                            ref={searchInputRef}
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Search categories..."
                            className="w-full text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none"
                        />
                    </div>

                    <ul ref={listRef} role="listbox" className="max-h-64 overflow-y-auto p-1.5">
                        {categories.length === 0 ? (
                            <li className="px-3 py-6 flex flex-col items-center gap-2 text-center">
                                <span className="text-sm text-gray-400">No categories yet.</span>
                                {onCreateCategory && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setOpen(false);
                                            onCreateCategory();
                                        }}
                                        className="flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition"
                                    >
                                        <Plus className="w-4 h-4" /> Create New Category
                                    </button>
                                )}
                            </li>
                        ) : flatOptions.length === 0 ? (
                            <li className="px-3 py-6 text-center text-sm text-gray-400">No category found.</li>
                        ) : (
                            <>
                                {recentCategories.length > 0 && (
                                    <>
                                        <li className="px-3 pt-1.5 pb-1 text-xs font-medium uppercase tracking-wide text-gray-400">
                                            Recent
                                        </li>
                                        {recentCategories.map((cat, i) => renderRow(cat, i))}
                                        {remainingCategories.length > 0 && (
                                            <li className="px-3 pt-2 pb-1 text-xs font-medium uppercase tracking-wide text-gray-400">
                                                All categories
                                            </li>
                                        )}
                                    </>
                                )}
                                {remainingCategories.map((cat, i) => renderRow(cat, recentCategories.length + i))}
                            </>
                        )}
                    </ul>
                </div>
            )}
        </div>
    );
}