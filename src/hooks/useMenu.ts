// src/hooks/useMenu.ts
import { useState, useEffect } from "react";
import { menuServices } from "../services/menuServices"; // ajusta la ruta si difiere
import type { MenuItem } from "../types/menu";
import { useAuthStore } from "../store/authStore";

interface UseMenuReturn {
  menu: MenuItem[];
  loading: boolean;
  error: string | null;
}

export const useMenu = (): UseMenuReturn => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Leer directamente del store
  const menu = useAuthStore((state) => state.menu);

  useEffect(() => {
    // Si ya hay menú en el store, no volver a llamar al API
    if (menu.length > 0) return;

    const fetchMenu = async () => {
      try {
        setLoading(true);
        const data = await menuServices.getMenu();
        const sorted = [...data].sort((a, b) => a.order - b.order);
        useAuthStore.getState().setMenu(sorted);
      } catch (err: any) {
        setError(err?.message ?? "Error al cargar el menú");
      } finally {
        setLoading(false);
      }
    };

    fetchMenu();
  }, [menu.length]);

  return { menu, loading, error };
};