import { Header } from "@/components/store/Header";
import { Footer } from "@/components/store/Footer";
import { getSessionId, getCartItemCount } from "@/lib/cart";

export default async function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let cartCount = 0;
  try {
    const sessionId = await getSessionId();
    cartCount = await getCartItemCount(sessionId);
  } catch {
    // DB no disponible en dev sin configurar
  }

  return (
    <>
      <Header cartCount={cartCount} />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  );
}
