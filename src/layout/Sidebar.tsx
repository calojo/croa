import { Link, useLocation } from "react-router-dom";
import { useMenu } from "../hooks/useMenu";
import { getIcon } from "../utils/iconMap";
import type { MenuItem } from "../types/menu";

export default function Sidebar() {
  const { menu } = useMenu();
  const location = useLocation();

  const renderMenu = (items: MenuItem[], level = 0) => {
    console.log("MENU:", menu);
    return items
      .sort((a, b) => a.order - b.order)
      .map((item) => {
        const Icon = getIcon(item.icon);
        const hasChildren = item.children?.length > 0;

        return (
          <div key={item.id} className={`ml-${level * 3}`}>
            {/* ITEM */}
            <Link
              to={item.route}
              className={`flex items-center gap-2 p-2 rounded hover:bg-gray-800 ${
                location.pathname === item.route ? "bg-gray-700" : ""
              }`}
            >
              {Icon && <Icon size={16} />}
              <span>{item.name}</span>
            </Link>

            {/* CHILDREN */}
            {hasChildren && (
              <div className="ml-4 border-l border-gray-700 pl-2">
                {renderMenu(item.children, level + 1)}
              </div>
            )}
          </div>
        );
      });
  };

  return (
    <aside className="w-64 h-screen bg-gray-900 text-white p-3 overflow-y-auto">
      <h1 className="text-lg font-bold mb-4">Sistema</h1>
      <nav>{renderMenu(menu)}</nav>
    </aside>
  );
}