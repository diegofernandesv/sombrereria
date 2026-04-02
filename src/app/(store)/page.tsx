import { redirect } from "next/navigation";

// Esta ruta la maneja app/page.tsx — redirigimos para evitar conflicto de rutas
export default function StorePage() {
  redirect("/");
}
