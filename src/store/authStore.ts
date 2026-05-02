import { create } from "zustand";
import { persist } from "zustand/middleware"; // ← agregar

type User = {
  username: string;
  company_id: number;
  branch_id: number;
  role_id: number;
};

type AuthState = {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  setAuth: (token: string, user: User) => void;
  logout: () => void;
};

export const useAuthStore = create<AuthState>()(
  persist(                          // ← envolver con persist
    (set) => ({
      token: null,
      user: null,
      isAuthenticated: false,

      setAuth: (token, user) =>
        set({
          token,
          user,
          isAuthenticated: true,
        }),

      logout: () =>
        set({
          token: null,
          user: null,
          isAuthenticated: false,
        }),
    }),
    {
      name: "auth-storage", // ← key en localStorage
    }
  )
);