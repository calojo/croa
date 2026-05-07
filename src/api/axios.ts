import axios from "axios";
import { useAuthStore } from "../store/authStore";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

  //  Asi lo lei antes 
  //const token = localStorage.getItem("token");

// Lee el token desde Zustand (que ya persiste en auth-storage)
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// 👉 Interceptor response (manejo de 401)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // aquí luego manejamos refresh token
      console.log("Unauthorized - redirigir a login");
      localStorage.removeItem("token");
    }
    return Promise.reject(error);
  }
);

export default api;