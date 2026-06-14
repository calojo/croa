// ─── Product types ─────────────────────────────────────────────────────────────

export interface Product {
  id: number;
  sku: string;
  name: string;
  brand: string;
  description: string;
  barcode: string;
  cost: number;
  price: number;
  tax: number;
  image_url: string;
  allow_negative_stock: boolean;
  min_margin: number;
  main_store_id: number;
  company_id: number;
  branch_id: number;
  category_id: number;
  supplier_id: number;
  created_date: string;
}

export interface ProductPayload {
  sku: string;
  name: string;
  brand: string;
  description: string;
  barcode: string;
  cost: number;
  price: number;
  tax: number;
  image_url: string;
  allow_negative_stock: boolean;
  min_margin: number;
  main_store_id: number;
  company_id: number;
  branch_id: number;
  category_id: number;
  supplier_id: number;
}

export type ProductUpdatePayload = Partial<ProductPayload>;

// ─── Stock types ────────────────────────────────────────────────────────────────

export interface ProductStock {
  id: number;
  company_id: number;
  branch_id: number;
  store_id: number;
  product_id: number;
  quantity: string;
  reserved_quantity: string;
  available_quantity: string;
  last_cost: string;
  average_cost: string;
}