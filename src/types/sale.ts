// ─── Sale types ────────────────────────────────────────────────────────────────

export interface SaleDetail {
  id?: number;
  quantity: number;
  price: number;
  discount: number;
  total: number;
  product_id: number;
  sale_id: number;
  note: string;
}

export interface SaleDetailPayload {
  quantity: number;
  price: number;
  discount: number;
  total: number;
  product_id: number;
  sale_id: number;
  note: string;
}

export interface Sale {
  id: number;
  pay_amount: number;
  change_amount: number;
  gross_value: number;
  discount: number;
  net_value: number;
  tax_value: number;
  total_value: number;
  payment_method: string;
  sale_type: string;
  status: string;
  notes: string;
  tax_receipt_id: number;
  tax_receipt_number: string;
  company_id: number;
  branch_id: number;
  user_id: number;
  client_id: number;
  created_date: string;
  details: SaleDetail[];
}

export interface SalePayload {
  pay_amount: number;
  change_amount: number;
  gross_value: number;
  discount: number;
  net_value: number;
  tax_value: number;
  total_value: number;
  payment_method: string;
  sale_type: string;        // "contado" | "credito"
  status: string;           // "open" | "closed"
  notes: string;
  tax_receipt_id: number;
  tax_receipt_number: string;
  company_id: number;
  branch_id: number;
  user_id: number;
  client_id: number;
  details: SaleDetailPayload[];
}

// ─── UI-only line item (never sent directly to the API) ───────────────────────
export interface SaleLine {
  _uid: number;           // local React key
  product_id: number;
  name: string;
  code: string;
  qty: number;
  price: number;          // unit price from product catalogue (read-only)
  unit_itbis: number;     // itbis per unit from product catalogue (read-only)
  disc_pct: number;       // discount % entered by user (0–100)
  generic: boolean;
  note: string;
}

// ─── Per-line computed values (derived in UI, not persisted) ──────────────────
export interface SaleLineCalc {
  gross: number;
  disc_amt: number;
  net: number;
  itbis: number;
  total: number;
}
