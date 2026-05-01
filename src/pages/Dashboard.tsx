import { useAuthStore } from "../store/authStore";

export default function Dashboard() {
  const user = useAuthStore((state) => state.user);

  return (
    <div>
      <h1>Bienvenido {user?.name}</h1>
    </div>
  );
}