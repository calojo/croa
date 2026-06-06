export interface Category {
  id: number;
  name: string;
  description: string;
  image_url: string;
  company_id: number;
  created_date: string;
}

export interface CategoryPayload {
  name: string;
  description: string;
  image_url: string;
  company_id: number;  
}

export interface CategoryUpdatePayload {
  name: string;
  description: string;
  image_url: string;
}