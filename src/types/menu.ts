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