//types/menu.ts
// This file defines the TypeScript interfaces for menu items and their permissions in a web application.

export interface MenuPermissions {
  can_view: boolean;
  can_create: boolean;
  can_edit: boolean;
  can_delete: boolean;
  can_approve: boolean;
  can_export: boolean;
}

export interface MenuItem {
  id: number;
  name: string;
  icon: string;
  route: string;
  order: number;
  permissions: MenuPermissions;
  children: MenuItem[];
}