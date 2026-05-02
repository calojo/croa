import Sidebar from "./Sidebar";
import Header from "./Header";
import Breadcrumbs from "./Breadcrumbs";
import { Outlet } from "react-router-dom";

export default function AppLayout() {
  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <Sidebar />

      {/* Main */}
      <div className="flex-1 flex flex-col">
        <Header />

        <main className="p-4 overflow-auto">
          <Breadcrumbs />

          <div className="bg-white p-4 rounded shadow">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}