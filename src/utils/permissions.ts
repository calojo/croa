//utils/permissions.ts
// This file defines a utility function to check user permissions for menu actions in a web application.

import type { MenuPermissions } from "../types/menu";

export const can = (
  permissions: MenuPermissions,
  action: keyof MenuPermissions
) => {
  return permissions[action];
};