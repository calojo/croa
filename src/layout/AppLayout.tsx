import Sidebar from "./Sidebar";
import Header from "./Header";
import Breadcrumbs from "./Breadcrumbs";
import { Outlet } from "react-router-dom";
import { SidebarProvider, useSidebar } from "../context/SidebarContext";

function AppContent() {
  const { collapsed } = useSidebar();

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />

      {/* Overlay for mobile — closes sidebar on tap */}
      {!collapsed && (
        <div
          className="fixed inset-0 bg-black/30 z-30 md:hidden"
          onClick={() => {}} // conectar al toggle si usas mobile
        />
      )}

      {/* Main area shifts depending on sidebar state */}
      <div
        className={`flex-1 flex flex-col transition-all duration-300 ease-in-out ${
          collapsed ? "ml-[60px]" : "ml-64"
        }`}
      >
        <Header />
        <main className="p-4 flex-1 overflow-auto">
          <Breadcrumbs />
          <div className="bg-white p-4 rounded shadow">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

export default function AppLayout() {
  return (
    <SidebarProvider>
      <AppContent />
    </SidebarProvider>
  );
}