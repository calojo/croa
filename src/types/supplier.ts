// ─── Supplier Entity ────────────────────────────────────────────────────────

export interface Supplier {
  id: number;
  company_id: number;
  name: string;
  description: string;

}

// ─── Payload for creating a supplier (POST) ──────────────────────────────────
// company_id is injected automatically from authStore, not sent by the user
export interface CreateSupplierPayload {
  company_id: number;
  name: string;
  description: string;

}

// ─── Payload for updating a supplier (PUT) ───────────────────────────────────
export interface UpdateSupplierPayload {
  name?: string;
  description?: string;
}

// ─── Form data used by UI components ─────────────────────────────────────────
// This is the contract between the drawer/form and the service layer.
// imageFile is handled by the service (upload → resolve URL) before hitting the API.
export interface SupplierFormData {
  name: string;
  description: string;
  // existing URL preserved on edit when no new file chosen
}