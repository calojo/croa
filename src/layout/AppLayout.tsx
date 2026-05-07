import Sidebar from "./Sidebar";
import Header from "./Header";
import Breadcrumbs from "./Breadcrumbs";
import { Outlet } from "react-router-dom";

export default function AppLayout() {
  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar — fixed to the left, full height */}
      <Sidebar />

      {/* Main — offset by sidebar width, scrollable independently */}
      <div className="flex-1 flex flex-col ml-64 min-h-screen">
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