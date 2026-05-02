import { Routes, Route } from "react-router-dom";

// Pages
import AppLayout from "../layout/AppLayout";
import Login from "../pages/Login";
import Dashboard from "../pages/Dashboard";

import PrivateRoute from "./PrivateRoute";
import Clients from "../pages/Clients";

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route element={<PrivateRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/clientes" element={<Clients />} />
        </Route>
        
      </Route>


    </Routes>
  );
}