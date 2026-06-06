export interface Client {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  credit_limit: number;
  balance: number;
  status: string;
  type_person: string;
  tax_id: string | null;
  notes: string | null;
  company_id: number;
  branch_id: number;
}

export type ClientPayload = Omit<Client, "id">;