import { apiGetCompany } from "../api/apiCompany";
import { useAuthStore } from "../store/authStore";
import type { Company } from "../types/company";

// ─── Company Service ───────────────────────────────────────────────────────────
// Single responsibility: fetch and expose company info.
// Cached in module scope so we only hit the API once per session.



  const user = useAuthStore.getState().user;
  if (!user) throw new Error("Usuario no autenticado, debe iniciar sesión para realizar esta acción.");

let _cache: Company | null = null;

export const getCompany = async (): Promise<Company> => {
  if (_cache) return _cache;
  _cache = await apiGetCompany(user.company_id);
  return _cache;
};

export const clearCompanyCache = () => {
  _cache = null;
};
