import api from "./axios";
import type { TaxReceipt } from "../types/taxReceipt";

// ─── Tax Receipts API ──────────────────────────────────────────────────────────

export const apiGetTaxReceipts = async (skip = 0, limit = 100): Promise<TaxReceipt[]> => {
  const res = await api.get<TaxReceipt[]>("/tax-receipts/", { params: { skip, limit } });
  return res.data;
};
