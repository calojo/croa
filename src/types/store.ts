export interface Store {
  id: number;
  name: string;
  description: string;
  image_url: string;
  company_id: number;
  branch_id: number;
  created_date: string;
  is_active: boolean;
}

export interface StorePayload {
  name: string;
  description: string;
  image_url: string;
  company_id: number;
  branch_id: number;
  is_active: boolean;
}

export interface StoreUpdatePayload {
  name: string;
  description: string;
  image_url: string;
  is_active: boolean;
}