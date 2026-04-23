import { create } from "zustand";

interface UIState {
    sidebarCollapsed: boolean;
    sidebarMobileOpen: boolean;
    toggleSidebarCollapse: () => void;
    setSidebarCollapsed: (collapsed: boolean) => void;
    toggleSidebarMobile: () => void;
    setSidebarMobileOpen: (open: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
    sidebarCollapsed: false,
    sidebarMobileOpen: false,
    toggleSidebarCollapse: () =>
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
    setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
    toggleSidebarMobile: () =>
        set((state) => ({ sidebarMobileOpen: !state.sidebarMobileOpen })),
    setSidebarMobileOpen: (open) => set({ sidebarMobileOpen: open }),
}));