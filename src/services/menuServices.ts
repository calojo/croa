import {getMenu} from "../api/apiMenu"; 
import type { MenuItem } from "../types/menu";
import { useAuthStore } from "../store/authStore";

export const menuServices = { getMenu: async (): Promise<MenuItem[]> => {
    try {
    const { user } = useAuthStore.getState();

    if (!user) throw new Error("User not authenticated");

        const data = await getMenu(user.role_id, user.company_id); // viene de apiMenu.ts
       
        return data as MenuItem[];
       
        } catch (error: any) {
        throw error?.message
            ? error
            : { message: "Error loading menu" };
        }
    },
};



