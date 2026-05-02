import { Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import ProtectedLayout from "./layout/ProtectedLayout";

export default function App() {
  return (
    <>
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            fontSize: "18px",
            padding: "16px 20px",
            borderRadius: "10px",
          },
        }}
      />

      <Routes>
        {/* Ruta pública */}
        <Route path="/login" element={<Login />} />

        {/* Rutas protegidas — todas las que necesiten Sidebar */}
        <Route element={<ProtectedLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          {/* Agrega aquí el resto de tus rutas protegidas */}
          {/* <Route path="/facturas" element={<Facturas />} /> */}
          {/* <Route path="/clientes" element={<Clientes />} /> */}
        </Route>

        {/* Ruta por defecto */}
        <Route path="*" element={<Login />} />
      </Routes>
    </>
  );
}