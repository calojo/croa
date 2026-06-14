import api from "./axios";

export const loginService = async (username: string,password: string) => {
  try {
    const res = await api.post("/auth/login", {
      username,
      password,
    });
    return res.data;
  } catch (error: any) {
    if (error.response) {
      // error del backend
      throw error.response.data;
    }    
    throw { message: error.response.data.message};
  }
};