import { useAuthStore } from "../store/authStore";

export default function Dashboard() {
  const user = useAuthStore((state) => state.user);

  return (
    <div>
      <h1>Bienvenido {user?.username}</h1>
    </div>
  );
}