import { Routes, Route } from "react-router-dom";

// Pages
import AppLayout from "../layout/AppLayout";
import Login from "../pages/Login";
import Dashboard from "../pages/Dashboard";

import PrivateRoute from "./PrivateRoute";
import Clients from  "../pages/maintenance/clients/ClientsPage";
import Supplier from "../pages/maintenance/suppliers/SuppliersPage";
import Category from "../pages/maintenance/categories/CategoriesPage";
import StoresPage from "../pages/maintenance/stores/StoresPage";
import ProductsPage from "../pages/maintenance/products/ProductsPage";
import SalesPage from "../pages/sales/SalesPage";

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route element={<PrivateRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/maintenance/clients" element={<Clients />} />
          <Route path="/maintenance/suppliers" element={<Supplier />} />
          <Route path="/maintenance/categories" element={<Category />} />
          <Route path="/maintenance/stores" element={<StoresPage />} />
          <Route path="/maintenance/products" element={<ProductsPage />} />
          <Route path="/sales/new" element={<SalesPage />} />
        </Route>
      </Route>
    </Routes>
  );
}