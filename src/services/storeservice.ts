import {
  apiGetStores,
  apiGetStore,
  apiCreateStore,
  apiUpdateStore,
  apiDeleteStore,
  apiUploadStoreImage,
} from "../api/apiStores";
import type { Store, StorePayload, StoreUpdatePayload } from "../types/store";
import { useAuthStore } from "../store/authStore";

  const user = useAuthStore.getState().user;
  if (!user) throw new Error("Usuario no autenticado, debe iniciar sesión para realizar esta acción.");



export const getStores = async (skip = 0, limit = 100): Promise<Store[]> => {
  const res = await apiGetStores(skip, limit);
  return res.data;
};

export const getStore = async (id: number): Promise<Store> => {
  const res = await apiGetStore(id);
  return res.data;
};

/**
 * Create a store, then optionally:
 *  1. Upload the image  → get back the url
 *  2. PUT image_url     → persist the url on the record
 */
export const createStore = async (
  payload: StorePayload,
  imageFile?: File | null
): Promise<Store> => {
  // Step 1 – create record
  payload.company_id = user.company_id; // Ensure company_id is set from user context 
  payload.branch_id = user.branch_id; // Ensure branch_id is set from user context 
  const res = await apiCreateStore(payload);
  let store: Store = res.data;

  // Step 2 – upload image + update url
  if (imageFile) {
    store = await _attachImage(store, imageFile);
  }

  return store;
};

/**
 * Update a Store, then optionally upload a new image and persist its url.
 */
export const updateStore = async (
  id: number,
  payload: StoreUpdatePayload,
  imageFile?: File | null
): Promise<Store> => {
  // Step 1 – update record
  const res = await apiUpdateStore(id, payload);
  let store: Store = res.data;

  // Step 2 – upload image + update url
  if (imageFile) {
    store = await _attachImage(store, imageFile);
  }

  return store;
};

export const deleteStore = async (id: number): Promise<void> => {
  await apiDeleteStore(id);
};

// ─── Private helper ────────────────────────────────────────────────────────────
/**
 * Upload binary → get url back → PUT url onto the record.
 * Adjust `uploadRes.data.url` to match the exact key your API returns.
 */
const _attachImage = async (store: Store, file: File): Promise<Store> => {
  // Step A – upload binary (multipart/form-data)
  const uploadRes = await apiUploadStoreImage(file, store.id);
  const imageUrl: string = uploadRes.data.url; // ← change key if needed (.image_url, .path, etc.)

  // Step B – persist image_url on the record
  const updateRes = await apiUpdateStore(store.id, {
    name: store.name,
    description: store.description,
    image_url: imageUrl,
    is_active: store.is_active,
  });

  return updateRes.data;
};