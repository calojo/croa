import {
  apiGetCategories,
  apiGetCategory,
  apiCreateCategory,
  apiUpdateCategory,
  apiDeleteCategory,
  apiUploadCategoryImage,
} from "../api/apiCategory";
import type { Category, CategoryPayload, CategoryUpdatePayload } from "../types/category";
import { useAuthStore } from "../store/authStore";

  const user = useAuthStore.getState().user;
  if (!user) throw new Error("Usuario no autenticado, debe iniciar sesión para realizar esta acción.");



export const getCategories = async (skip = 0, limit = 100): Promise<Category[]> => {
  const res = await apiGetCategories(skip, limit);
  return res.data;
};

export const getCategory = async (id: number): Promise<Category> => {
  const res = await apiGetCategory(id);
  return res.data;
};


/**
 * Create a category, then optionally:
 *  1. Upload the image  → get back the url
 *  2. PUT image_url     → persist the url on the record
 */
export const createCategory = async (
  payload: CategoryPayload,
  imageFile?: File | null
): Promise<Category> => {
  // Step 1 – create record
  payload.company_id = user.company_id; // Ensure company_id is set from user context 
  const res = await apiCreateCategory(payload);
  let category: Category = res.data;

  // Step 2 – upload image + update url
  if (imageFile) {
    category = await _attachImage(category, imageFile);
  }

  return category;
};

/**
 * Update a category, then optionally upload a new image and persist its url.
 */
export const updateCategory = async (
  id: number,
  payload: CategoryUpdatePayload,
  imageFile?: File | null
): Promise<Category> => {
  // Step 1 – update record
  const res = await apiUpdateCategory(id, payload);
  let category: Category = res.data;

  // Step 2 – upload image + update url
  if (imageFile) {
    category = await _attachImage(category, imageFile);
  }

  return category;
};

export const deleteCategory = async (id: number): Promise<void> => {
  await apiDeleteCategory(id);
};

// ─── Private helper ────────────────────────────────────────────────────────────
/**
 * Upload binary → get url back → PUT url onto the record.
 * Adjust `uploadRes.data.url` to match the exact key your API returns.
 */
const _attachImage = async (category: Category, file: File): Promise<Category> => {
  // Step A – upload binary (multipart/form-data)
  const uploadRes = await apiUploadCategoryImage(file, category.id);
  const imageUrl: string = uploadRes.data.url; // ← change key if needed (.image_url, .path, etc.)

  // Step B – persist image_url on the record
  const updateRes = await apiUpdateCategory(category.id, {
    name: category.name,
    description: category.description,
    image_url: imageUrl,
  });

  return updateRes.data;
};