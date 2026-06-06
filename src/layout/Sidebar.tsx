import { Link, useLocation } from "react-router-dom";
import { useMenu } from "../hooks/useMenu";
import { getIcon } from "../utils/iconMap";
import { useSidebar } from "../context/SidebarContext";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { MenuItem } from "../types/menu";

export default function Sidebar() {
  const { menu } = useMenu();
  const location = useLocation();
  const { collapsed, toggle } = useSidebar();

  const renderMenu = (items: MenuItem[], level = 0) => {
    return items
      .sort((a, b) => a.order - b.order)
      .map((item) => {
        const Icon = getIcon(item.icon);
        const hasChildren = item.children?.length > 0;
        const isActive = location.pathname === item.route;

        return (
          <div key={item.id}>
            <Link
              to={item.route}
              title={collapsed ? item.name : undefined} // tooltip when collapsed
              className={`flex items-center gap-2 p-2 rounded transition-colors duration-150
                hover:bg-gray-800
                ${isActive ? "bg-gray-700" : ""}
                ${collapsed ? "justify-center" : ""}
                ${level > 0 ? "text-sm" : ""}
              `}
            >
              {Icon && <Icon size={16} className="shrink-0" />}

              {/* Label — hidden when collapsed */}
              {!collapsed && (
                <span className="truncate">{item.name}</span>
              )}
            </Link>

            {/* Children — hidden when collapsed */}
            {hasChildren && !collapsed && (
              <div
                className={`border-l border-gray-700 pl-2 ${
                  level === 0 ? "ml-4" : `ml-${level * 3 + 4}`
                }`}
              >
                {renderMenu(item.children, level + 1)}
              </div>
            )}
          </div>
        );
      });
  };

  return (
    <aside
      className={`
        fixed top-0 left-0 h-screen bg-gray-900 text-white
        flex flex-col z-40 overflow-hidden
        transition-all duration-300 ease-in-out
        ${collapsed ? "w-[60px]" : "w-64"}
      `}
    >
      {/* Header del sidebar */}
      <div
        className={`flex items-center h-14 px-3 shrink-0 border-b border-gray-700
          ${collapsed ? "justify-center" : "justify-between"}
        `}
      >
        {!collapsed && (
          <h1 className="text-lg font-bold truncate">Sistema</h1>
        )}

        {/* Toggle button */}
        <button
          onClick={toggle}
          className="p-1.5 rounded hover:bg-gray-700 transition-colors shrink-0"
          aria-label={collapsed ? "Expandir menú" : "Colapsar menú"}
        >
          {collapsed
            ? <ChevronRight size={18} />
            : <ChevronLeft size={18} />
          }
        </button>
      </div>

      {/* Nav items — scrollable */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden p-2 space-y-0.5">
        {renderMenu(menu)}
      </nav>
    </aside>
  );
}