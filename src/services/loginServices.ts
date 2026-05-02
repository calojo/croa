import {loginService} from "../api/apiService";

export const login = async (username: string, password: string) => {
  try {
    const accessToken = await loginService(username, password);    
    return accessToken;
  } catch (error) {
    console.error("Login error", error);
    return null;
  } 
};