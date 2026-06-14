import api from "./axios"; // shared axios instance with token interceptor
import type { Product, ProductPayload, ProductUpdatePayload, ProductStock } from "../types/product";

// ─── Products ──────────────────────────────────────────────────────────────────

export const fetchProducts = () =>
  api.get<Product[]>("/products/");

export const fetchProductById = (id: number) =>
  api.get<Product>(`/products/${id}`);

export const postProduct = (payload: ProductPayload) =>
  api.post<Product>("/products/", payload);

export const putProduct = (id: number, payload: ProductUpdatePayload) =>
  api.put<Product>(`/products/${id}`, payload);

export const removeProduct = (id: number) =>
  api.delete(`/products/${id}`);

// ─── Product image upload ──────────────────────────────────────────────────────

export const uploadProductImage = (id: number, file: File) => {
  const formData = new FormData();
  formData.append("file", file);
  return api.post<{ image_url: string }>(`/products/${id}/image`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

// ─── Inventory / Stock ─────────────────────────────────────────────────────────

export const fetchProductStock = (productId: number) =>
  api.get<ProductStock[]>("/inventory/stock", { params: { product_id: productId } });