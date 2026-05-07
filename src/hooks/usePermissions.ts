import { useAuthStore } from "../store/authStore";
import { can } from "../utils/permissions";
import type { MenuPermissions } from "../types/menu";

const usePermissions = (route: string) => {
const getPermissions = useAuthStore((state) => state.getPermissions);
const permissions = getPermissions(route);

  return {
    canView:    can(permissions, "can_view"),
    canCreate:  can(permissions, "can_create"),
    canEdit:    can(permissions, "can_edit"),
    canDelete:  can(permissions, "can_delete"),
    canApprove: can(permissions, "can_approve"),
    canExport:  can(permissions, "can_export"),
    raw: permissions as MenuPermissions,
  };
};

export default usePermissions;