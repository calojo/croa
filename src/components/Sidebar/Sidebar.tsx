// src/components/Sidebar/Sidebar.tsx
import { useState } from "react";
import { ChevronLeft } from "lucide-react";
import { useMenu } from "../../hooks/useMenu";
import { SidebarItem } from "./SidebarItem";
import { SidebarSkeleton } from "./SidebarSkeleton";
import "./sidebar.css";

export const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const { menu, loading, error } = useMenu();

  return (
    <aside className={`sidebar ${collapsed ? "sidebar--collapsed" : ""}`}>
      {/* Header / Logo */}
      <div className="sidebar-header">
        {!collapsed && <span className="sidebar-logo">⚡ FacturaPro</span>}
        <button className="sidebar-toggle" onClick={() => setCollapsed(!collapsed)}>
          <ChevronLeft size={16} className={`toggle-icon ${collapsed ? "rotated" : ""}`} />
        </button>
      </div>

      {/* Menu Items */}
      <nav className="sidebar-nav">
        {loading && <SidebarSkeleton />}
        {error && <p className="sidebar-error">{error}</p>}
        {!loading && !error && (
          <ul className="sidebar-menu">
            {menu.map((item) => (
              <SidebarItem key={item.id} item={item} collapsed={collapsed} />
            ))}
          </ul>
        )}
      </nav>

      {/* Footer */}
      {!collapsed && (
        <div className="sidebar-footer">
          <span>v1.0.0</span>
        </div>
      )}
    </aside>
  );
};