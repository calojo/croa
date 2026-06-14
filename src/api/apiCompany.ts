import api from "./axios";
import type { Company } from "../types/company";

// ─── Company API ───────────────────────────────────────────────────────────────

export const apiGetCompany = async (company_id: number): Promise<Company> => {
  const res = await api.get<Company>(`/companies/${company_id}`);
  return res.data;
};
