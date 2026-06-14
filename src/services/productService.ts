import {
  fetchProducts,
  fetchProductById,
  postProduct,
  putProduct,
  removeProduct,
  uploadProductImage,
  fetchProductStock,
} from "../api/apiProduct";
import type { Product, ProductPayload, ProductUpdatePayload, ProductStock } from "../types/product";

// ─── Get all products ──────────────────────────────────────────────────────────

export const getProducts = async (): Promise<Product[]> => {
  const res = await fetchProducts();
  return res.data;
};

// ─── Get single product ────────────────────────────────────────────────────────

export const getProductById = async (id: number): Promise<Product> => {
  const res = await fetchProductById(id);
  return res.data;
};

// ─── Create product (+ optional image upload) ─────────────────────────────────

export const createProduct = async (
  payload: ProductPayload,
  file: File | null
): Promise<Product> => {
  const res = await postProduct(payload);
  const product = res.data;

  if (file) {
    try {
      const imgRes = await uploadProductImage(product.id, file);
      // Update product with the returned image_url
      await putProduct(product.id, { image_url: imgRes.data.image_url });
      product.image_url = imgRes.data.image_url;
    } catch {
      // Image upload failure is non-blocking; product already created
      console.warn("Image upload failed after product creation");
    }
  }

  return product;
};

// ─── Update product (+ optional image upload) ─────────────────────────────────

export const updateProduct = async (
  id: number,
  payload: ProductUpdatePayload,
  file: File | null
): Promise<Product> => {
  if (file) {
    try {
      const imgRes = await uploadProductImage(id, file);
      payload = { ...payload, image_url: imgRes.data.image_url };
    } catch {
      console.warn("Image upload failed during product update");
    }
  }

  const res = await putProduct(id, payload);
  return res.data;
};

// ─── Delete product ────────────────────────────────────────────────────────────

export const deleteProduct = async (id: number): Promise<void> => {
  await removeProduct(id);
};

// ─── Get stock for a product ───────────────────────────────────────────────────

export const getProductStock = async (productId: number): Promise<ProductStock[]> => {
  const res = await fetchProductStock(productId);
  return res.data;
};