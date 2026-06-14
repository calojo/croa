// ─── Company types ─────────────────────────────────────────────────────────────

export interface Company {
  id: number;
  business_name: string;
  rnc: string;
  email: string;
  phone: string;
  address: string;
  country: string;
  currency: string;
  plan: number;
  max_users: number;
  logo_url: string;
  is_active: boolean;
  expiration_date: string;
  created_at: string;
  updated_at: string;
}
