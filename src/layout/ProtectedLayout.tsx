import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { Sidebar } from "../components/Sidebar";
import "./protectedLayout.css";

export default function ProtectedLayout() {
  const { user } = useAuthStore();

  // Si no hay usuario autenticado, redirige al login
  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="app-main">
        <Outlet /> {/* Aquí se renderizan las rutas hijas */}
      </main>
    </div>
  );
}