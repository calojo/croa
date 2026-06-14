import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { MenuItem, MenuPermissions } from "../types/menu";

type User = {
  user_id: number;
  username: string;
  company_id: number;
  branch_id: number;
  role_id: number;
};

type AuthState = {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  menu: MenuItem[];                          // ← nuevo
  setAuth: (token: string, user: User) => void;
  logout: () => void;
  setMenu: (menu: MenuItem[]) => void;       // ← nuevo
  getPermissions: (route: string) => MenuPermissions; // ← nuevo
};

const DEFAULT_PERMISSIONS: MenuPermissions = {
  can_view: false,
  can_create: false,
  can_edit: false,
  can_delete: false,
  can_approve: false,
  can_export: false,
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      menu: [],                              // ← nuevo

      setAuth: (token, user) =>
        set({ token, user, isAuthenticated: true }),

      logout: () =>
        set({ token: null, user: null, isAuthenticated: false, menu: [] }),

      setMenu: (menu) => set({ menu }),      // ← nuevo

    getPermissions: (route) => {
      const menu = get().menu;
      
      // Busca en primer nivel
      const item = menu.find((m) => m.route === route);
      if (item) return item.permissions;
      
      // Busca en children
      for (const parent of menu) {
        const child = parent.children?.find((c) => c.route === route);
        if (child) return child.permissions;
      }
      
      return DEFAULT_PERMISSIONS;
    },



    }),
    {
      name: "auth-storage",
    }
  )
);