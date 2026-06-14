// ─── Tax receipt types ─────────────────────────────────────────────────────────

export interface TaxReceipt {
  id: number;
  company_id: number;
  tax_number: string;
  secuence: number;
  secuence_from: number;
  secuence_to: number;
  description: string;
  status: string;           // "Active" | "Inactive"
  created_date: string;
}
