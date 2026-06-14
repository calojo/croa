import { useState } from "react";
import { login  } from "../services/loginServices";
import { useAuthStore } from "../store/authStore";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";


export default function Login() {
  const [user, setUser] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  //const setAuth = useAuthStore((state) => state.setAuth);
  const navigate = useNavigate();

const handleLogin = async (e?: React.FormEvent) => {
  e?.preventDefault();

  if (!user || !password) return;

  try {
    setLoading(true);

    const data = await login(user, password);
    
    if (!data) {
      toast.error("Credenciales inválidas");
      return;
    }
    
   useAuthStore.getState().setAuth(data.access_token, {
      user_id: data.user_id,
      username: data.username,
      company_id: data.company_id,
      branch_id: data.branch_id,
      role_id: data.rol_id,
    });

    //setAuth(data.access_token, data.user);
    navigate("/dashboard");

  } catch (error: any) {
    const message =
      error?.detail ||
      error?.message ||
      "Error al iniciar sesión";

    toast.error(message);

  } finally {
    setLoading(false);
  }
};

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 px-4">

      {/* CARD */}
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">

        {/* HEADER */}
        <div className="text-center mb-8">
          <div className="mx-auto w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            🔐
          </div>

          <h1 className="text-3xl font-bold text-gray-800">Bienvenido</h1>
          <p className="text-gray-500 text-sm mt-1">
            Inicia sesión para continuar
          </p>
        </div>

        {/* USER */}
        <div className="mb-4">
          <label className="text-sm text-gray-600">Usuario</label>
          <input
            className="w-full mt-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
            placeholder="Ingresa tu usuario"
            onChange={(e) => setUser(e.target.value)}
          />
        </div>

        {/* PASSWORD */}
        <div className="mb-6">
          <label className="text-sm text-gray-600">Contraseña</label>
          <input
            type="password"
            className="w-full mt-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
            placeholder="Ingresa tu contraseña"
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {/* BUTTON */}
        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg transition-all duration-200 font-medium"
        >
          {loading ? "Entrando..." : "Entrar"}
        </button>

        {/* FOOTER */}
        <div className="text-center mt-6 text-sm text-gray-500">
          ¿No tienes cuenta?{" "}
          <span className="text-blue-600 cursor-pointer">
            Contacta a tu administrador
          </span>
        </div>

      </div>
    </div>
  );
}