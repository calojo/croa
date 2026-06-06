import api from "./axios"; // adjust path to your axios instance
import type { Category, CategoryPayload, CategoryUpdatePayload } from "../types/category";

// GET /categories
export const apiGetCategories = (skip = 0, limit = 100): Promise<{ data: Category[] }> =>
  api.get("/categories", { params: { skip, limit } });

// GET /categories/:id
export const apiGetCategory = (id: number): Promise<{ data: Category }> =>
  api.get(`/categories/${id}`);

// POST /categories/
export const apiCreateCategory = (payload: CategoryPayload): Promise<{ data: Category }> => {
  console.log("API: Creating category with payload:", payload); // Debug log
  return api.post("/categories/", payload);
};
  

// PUT /categories/:id
export const apiUpdateCategory = (
  id: number,
  payload: CategoryUpdatePayload
): Promise<{ data: Category }> =>
  api.put(`/categories/${id}`, payload);

// DELETE /categories/:id
export const apiDeleteCategory = (id: number): Promise<void> =>
  api.delete(`/categories/${id}`);

// POST /api/uploads/image  (form-data)
export const apiUploadCategoryImage = (
  file: File,
  entityId: number
): Promise<{ data: { url: string } }> => {
  const form = new FormData();
  form.append("file", file);
  form.append("entity_type", "categories");
  form.append("entity_id", String(entityId));
  return api.post("/api/uploads/image", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};