import api from "./axios"; // shared axios instance with token interceptor
import type {
  Supplier,
  CreateSupplierPayload,
  UpdateSupplierPayload,
} from "../types/supplier";

// ─── GET /suppliers ───────────────────────────────────────────────────────────
export const fetchSuppliersApi = async (): Promise<Supplier[]> => {
  const res = await api.get<Supplier[]>("/suppliers");
  return res.data;
};

// ─── GET /suppliers/{supplier_id} ────────────────────────────────────────────
export const fetchSupplierByIdApi = async (
  supplier_id : number
): Promise<Supplier> => {
  const res = await api.get<Supplier>(`/suppliers/${supplier_id }`);
  return res.data;
};

// ─── POST /suppliers ──────────────────────────────────────────────────────────
export const createSupplierApi = async (
  payload: CreateSupplierPayload
): Promise<Supplier> => {
  const res = await api.post<Supplier>("/suppliers", payload);
  return res.data;
};

// ─── PUT /suppliers/{supplier_id} ─────────────────────────────────────────────
export const updateSupplierApi = async (
  supplier_id : number,
  payload: UpdateSupplierPayload
): Promise<Supplier> => {
  const res = await api.put<Supplier>(`/suppliers/${supplier_id }`, payload);
  return res.data;
};

// ─── DELETE /suppliers/{supplier_id} ─────────────────────────────────────────
export const deleteSupplierApi = async (supplier_id : number): Promise<void> => {
  await api.delete(`/suppliers/${supplier_id }`);
};



