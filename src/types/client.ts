export interface Client {
  id: number;
  name: string;
  email: string;
  phone: string;
  address: string;
  credit_limit: number;
  balance: number;
  status: string;
  type_person: string;
  tax_id: string;
  notes: string;
  company_id: number;
  branch_id: number;
}

// Lo que el formulario envía — sin campos que inyecta el backend/token
export type ClientPayload = Omit<Client, "id" | "company_id" | "branch_id">;