import { Toaster } from "react-hot-toast";
import AppRouter from "./routes/AppRouter";

export default function App() {
  return (
    <>
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            fontSize: "18px",
            padding: "16px 20px",
            borderRadius: "10px",
          },
        }}
      />
      <AppRouter />
    </>
  );
}