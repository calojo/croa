import {
  fetchSuppliersApi,
  fetchSupplierByIdApi,
  createSupplierApi,
  updateSupplierApi,
  deleteSupplierApi,
} from "../api/apiSuppliers";
import { useAuthStore } from "../store/authStore";
import type { Supplier, SupplierFormData } from "../types/supplier";

// ─── Get all suppliers ────────────────────────────────────────────────────────
export const getSuppliers = async (): Promise<Supplier[]> => {
  return await fetchSuppliersApi();
};

// ─── Get a single supplier by ID a
export const getSupplierById = async (supplierId: number): Promise<Supplier> => {
  return await fetchSupplierByIdApi(supplierId);
};

// ─── Create supplier ──────────────────────────────────────────────────────────
// Business logic:
//   1. Upload the image file first → obtain the public URL
//   2. Inject company_id from the authenticated user (authStore)
//   3. Call the create endpoint with the resolved payload
export const createSupplier = async (formData: SupplierFormData): Promise<Supplier> => {
  const { user } = useAuthStore.getState();
  if (!user?.company_id) throw new Error("No company_id found in session.");

  

  return await createSupplierApi({
    company_id: user.company_id,
    name: formData.name,
    description: formData.description,

  });
};

// ─── Update supplier ──────────────────────────────────────────────────────────
// Business logic:
//   1. If a new image file was selected → upload it and get the resolved URL
//   2. Otherwise keep the existing URL (or empty string as safe fallback)
//   3. Always send all three fields as strings — backend requires a complete body
export const updateSupplier = async (
  supplierId: number,
  formData: SupplierFormData
): Promise<Supplier> => {
  // Always resolve to a string; backend rejects undefined/missing fields (422)
 

 
  return await updateSupplierApi(supplierId, {
    name: formData.name,
    description: formData.description,
  });
};

// ─── Delete supplier ──────────────────────────────────────────────────────────
export const deleteSupplier = async (supplierId: number): Promise<void> => {
  await deleteSupplierApi(supplierId);
};