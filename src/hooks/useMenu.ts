// src/hooks/useMenu.ts
import { useState, useEffect } from "react";
import { menuServices } from "../services/menuServices"; // ajusta la ruta si difiere
import type { MenuItem } from "../types/menu";

interface UseMenuReturn {
  menu: MenuItem[];
  loading: boolean;
  error: string | null;
}

export const useMenu = (): UseMenuReturn => {
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        setLoading(true);
        const data = await menuServices.getMenu();
        console.log("✅ Menu cargado:", data);       // ← ¿llega aquí?
        const sorted = [...data].sort((a, b) => a.order - b.order);
        setMenu(sorted);
      } catch (err: any) {
        setError(err?.message ?? "Error al cargar el menú");
      } finally {
        setLoading(false);
      }
    };

    fetchMenu();
  }, []);

  return { menu, loading, error };
};