import api from "./axios"; // adjust path to your axios instance
import type { Store, StorePayload, StoreUpdatePayload } from "../types/store";

// GET /stores
export const apiGetStores = (skip = 0, limit = 100): Promise<{ data: Store[] }> =>
  api.get("/stores", { params: { skip, limit } });

// GET /stores/:id
export const apiGetStore = (id: number): Promise<{ data: Store }> =>
  api.get(`/stores/${id}`);

// POST /stores/
export const apiCreateStore = (payload: StorePayload): Promise<{ data: Store }> => {
  console.log("Creating store with payload:", payload); // Debug log
  return api.post("/stores/", payload);
};
  

// PUT /stores/:id
export const apiUpdateStore = (id: number,payload: StoreUpdatePayload): Promise<{ data: Store }> =>{
  console.log(`Updating store ${id} with payload:`, payload); // Debug log
  return api.put(`/stores/${id}`, payload);
};
// DELETE /stores/:id
export const apiDeleteStore = (id: number): Promise<void> =>
  api.delete(`/stores/${id}`);

// POST /api/uploads/image  (form-data)
export const apiUploadStoreImage = (
  file: File,
  entityId: number
): Promise<{ data: { url: string } }> => {
  const form = new FormData();
  form.append("file", file);
  form.append("entity_type", "stores");
  form.append("entity_id", String(entityId));
  return api.post("/api/uploads/image", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};