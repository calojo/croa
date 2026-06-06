import { useAuthStore } from "../store/authStore";
import { useSidebar } from "../context/SidebarContext";
import { Menu } from "lucide-react";

export default function Header() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const { toggle } = useSidebar();

  return (
    <header className="h-14 bg-white shadow flex items-center justify-between px-4 shrink-0">
      <div className="flex items-center gap-3">
        {/* Mobile hamburger — visible only on small screens */}
        <button
          onClick={toggle}
          className="md:hidden p-1.5 rounded hover:bg-gray-100"
          aria-label="Toggle menú"
        >
          <Menu size={20} />
        </button>
        <span className="font-semibold">Dashboard</span>
      </div>

      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-600">{user?.username}</span>
        <button
          onClick={logout}
          className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600 transition-colors"
        >
          Logout
        </button>
      </div>
    </header>
  );
}