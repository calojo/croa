import type { MenuPermissions } from "../types/menu";

export const can = (
  permissions: MenuPermissions,
  action: keyof MenuPermissions
) => {
  return permissions[action];
};