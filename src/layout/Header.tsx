import { useAuthStore } from "../store/authStore";

export default function Header() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  return (
    <header className="h-14 bg-white shadow flex items-center justify-between px-4">
      <span className="font-semibold">Dashboard</span>

      <div className="flex items-center gap-4">
        <span className="text-sm">{user?.username}</span>

        <button
          onClick={logout}
          className="px-3 py-1 bg-red-500 text-white rounded"
        >
          Logout
        </button>
      </div>
    </header>
  );
}