import api from "./axios";
import type { Sale, SalePayload } from "../types/sale";

// ─── Sale API ──────────────────────────────────────────────────────────────────

export const apiCreateSale = async (payload: SalePayload): Promise<Sale> => {
  try {
    const res = await api.post<Sale>("/sales/", payload);
     console.log("Sale created successfully:", res.data);
  return res.data;
  } catch (error: any) {
    if (error.response) {
      // error del backend
      console.log("Sale created Error:", error.response.data);
      throw error.response.data;
    }    
    throw { message: error.message || "Network error" };
  }
  
 
};

export const apiGetSaleById = async (id: number): Promise<Sale> => {
  const res = await api.get<Sale>(`/sales/${id}`);
  return res.data;
};

export const apiGetSales = async (skip = 0, limit = 100): Promise<Sale[]> => {
  const res = await api.get<Sale[]>("/sales/", { params: { skip, limit } });
  return res.data;
};
