import api from "./axios";

export const getMenu = async (role_id : number,company_id  : number) => {
  try { 

  const res = await api.get(`/auth/menu/${role_id}`, {
    params: {
      company_id 
    },
  });
  return res.data;
  } catch (error: any) {
    if (error.response) {
      // error del backend
      throw error.response.data;
    }
  };
}
