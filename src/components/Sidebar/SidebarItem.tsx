// src/components/Sidebar/SidebarItem.tsx
import { useState } from "react";
import { NavLink } from "react-router";  // ← react-router v7, NO react-router-dom
import { ChevronDown, Circle,  } from "lucide-react";
import * as Icons from "lucide-react";
import type { MenuItem } from "../../types/menu";
import type { FC, SVGProps } from "react";

interface SidebarItemProps {
  item: MenuItem;
  collapsed: boolean;
  depth?: number;
}

type IconType = FC<SVGProps<SVGSVGElement> & { size?: number; className?: string }>;

interface DynamicIconProps {
  name: string;
  size?: number;
  className?: string;
}

const DynamicIcon = ({ name, size, className }: DynamicIconProps) => {
  const IconComponent = (Icons as Record<string, unknown>)[name] as IconType | undefined;
  if (!IconComponent) return <Circle size={size} className={className} />;
  return <IconComponent size={size} className={className} />;
};


export const SidebarItem = ({ item, collapsed, depth = 0 }: SidebarItemProps) => {
  const [open, setOpen] = useState(false);
  const hasChildren = item.children && item.children.length > 0;

  if (!item.permissions.can_view) return null;

  const sortedChildren = [...(item.children || [])].sort((a, b) => a.order - b.order);

  if (hasChildren) {
    return (
      <li className="sidebar-item">
        <button
          className={`sidebar-link sidebar-link--group ${open ? "is-open" : ""}`}
          onClick={() => setOpen(!open)}
          style={{ paddingLeft: `${16 + depth * 12}px` }}
          title={collapsed ? item.name : undefined}
        >
          <DynamicIcon name={item.icon} size={18} className="sidebar-icon" />
          {!collapsed && (
            <>
              <span className="sidebar-label">{item.name}</span>
              <ChevronDown
                size={14}
                className={`sidebar-chevron ${open ? "rotated" : ""}`}
              />
            </>
          )}
        </button>

        {open && !collapsed && (
          <ul className="sidebar-submenu">
            {sortedChildren.map((child) => (
              <SidebarItem
                key={child.id}
                item={child}
                collapsed={collapsed}
                depth={depth + 1}
              />
            ))}
          </ul>
        )}
      </li>
    );
  }

  return (
    <li className="sidebar-item">
      <NavLink
        to={item.route}
        className={({ isActive }) => `sidebar-link ${isActive ? "is-active" : ""}`}
        style={{ paddingLeft: `${16 + depth * 12}px` }}
        title={collapsed ? item.name : undefined}
      >
        <DynamicIcon name={item.icon} size={18} className="sidebar-icon" />
        {!collapsed && <span className="sidebar-label">{item.name}</span>}
      </NavLink>
    </li>
  );
};