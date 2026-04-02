import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Header } from "@/components/store/Header";
import { Footer } from "@/components/store/Footer";
import { PRODUCT_TYPE_LABELS } from "@/lib/utils";
import { getSessionId, getCartItemCount } from "@/lib/cart";

const categories = [
  { type: "PANAMA", label: "Panamá", desc: "Tejido artesanal, elegancia natural" },
  { type: "FEDORA", label: "Fedora", desc: "Clásico atemporal, estilo definido" },
  { type: "BUCKET", label: "Bucket", desc: "Casual y contemporáneo" },
  { type: "BOINA", label: "Boina", desc: "Tradición europea, carácter propio" },
];

export default async function HomePage() {
  let cartCount = 0;
  try {
    const sessionId = await getSessionId();
    cartCount = await getCartItemCount(sessionId);
  } catch {
    // DB no configurada en dev
  }

  return (
    <>
      <Header cartCount={cartCount} />
      <main className="flex-1">
        {/* Hero */}
        <section className="relative min-h-[85vh] flex flex-col justify-end bg-[var(--espresso)] overflow-hidden">
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-gradient-to-b from-[var(--espresso-mid)]/60 to-[var(--espresso)]" />
            <div
              className="absolute inset-0 opacity-10"
              style={{
                backgroundImage: `radial-gradient(circle at 30% 40%, var(--camel) 0%, transparent 50%),
                                  radial-gradient(circle at 80% 80%, var(--camel) 0%, transparent 40%)`,
              }}
            />
          </div>

          <div className="relative max-w-7xl mx-auto px-5 md:px-8 pb-16 md:pb-24 w-full">
            <div className="max-w-2xl animate-fade-up">
              <p className="text-[10px] uppercase tracking-[0.3em] text-[var(--camel-light)] mb-6">
                Buenos Aires · Colección 2026
              </p>
              <h1 className="font-serif text-5xl md:text-7xl lg:text-8xl font-light text-[var(--ivory)] leading-[0.95] mb-8">
                El sombrero
                <br />
                <em className="not-italic text-[var(--camel-light)]">correcto</em>
                <br />
                lo cambia todo.
              </h1>
              <p className="text-base md:text-lg text-[var(--ivory-dark)] opacity-80 mb-10 max-w-md leading-relaxed">
                Sombreros con carácter. Tejidos a mano, diseñados en Buenos Aires,
                para durar toda una vida.
              </p>
              <Link
                href="/productos"
                className="inline-flex items-center gap-3 bg-[var(--camel)] text-[var(--white)] px-8 py-4 text-sm tracking-wide hover:bg-[var(--camel-light)] transition-colors"
              >
                Ver colección
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>

          <div className="absolute bottom-8 right-8 md:right-12 hidden md:flex flex-col items-center gap-2">
            <div className="w-px h-12 bg-[var(--camel)] opacity-40" />
            <p className="text-[9px] uppercase tracking-[0.25em] text-[var(--brown)] rotate-90 origin-center translate-x-4">
              scroll
            </p>
          </div>
        </section>

        {/* Categorías */}
        <section className="max-w-7xl mx-auto px-5 md:px-8 py-16 md:py-24">
          <div className="flex items-center justify-between mb-10">
            <h2 className="font-serif text-3xl md:text-4xl font-light text-[var(--espresso)]">
              Por estilo
            </h2>
            <Link
              href="/productos"
              className="text-sm text-[var(--brown)] hover:text-[var(--camel)] transition-colors flex items-center gap-1.5"
            >
              Ver todo <ArrowRight size={14} />
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {categories.map((cat, i) => (
              <Link
                key={cat.type}
                href={`/productos?tipo=${cat.type}`}
                className="group relative aspect-square bg-[var(--ivory-dark)] overflow-hidden flex flex-col justify-end p-5 hover:bg-[var(--espresso)] transition-colors duration-300"
              >
                <span className="absolute top-4 right-4 font-serif text-5xl text-[var(--border)] group-hover:text-[var(--espresso-mid)] transition-colors leading-none">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div>
                  <h3 className="font-serif text-xl md:text-2xl font-light text-[var(--espresso)] group-hover:text-[var(--ivory)] transition-colors mb-1">
                    {PRODUCT_TYPE_LABELS[cat.type] ?? cat.label}
                  </h3>
                  <p className="text-xs text-[var(--brown)] group-hover:text-[var(--ivory-dark)] transition-colors">
                    {cat.desc}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Propuesta de valor */}
        <section className="bg-[var(--ivory-dark)] border-y border-[var(--border)]">
          <div className="max-w-7xl mx-auto px-5 md:px-8 py-12 md:py-16 grid md:grid-cols-3 gap-8 md:gap-12">
            {[
              { n: "01", title: "Tejido artesanal", body: "Cada sombrero es trabajado a mano por artesanos con más de 20 años de oficio." },
              { n: "02", title: "Materiales naturales", body: "Paja toquilla, lana merino, algodón orgánico. Nada sintético." },
              { n: "03", title: "Envíos a todo el país", body: "Despachamos en 24/48hs hábiles con seguimiento en tiempo real." },
            ].map((item) => (
              <div key={item.n} className="flex gap-5">
                <span className="font-serif text-3xl text-[var(--camel)] opacity-50 leading-none mt-0.5 shrink-0">
                  {item.n}
                </span>
                <div>
                  <h3 className="font-serif text-lg font-light text-[var(--espresso)] mb-1.5">
                    {item.title}
                  </h3>
                  <p className="text-sm text-[var(--brown)] leading-relaxed">{item.body}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA WhatsApp */}
        <section className="max-w-7xl mx-auto px-5 md:px-8 py-16 md:py-20 text-center">
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--brown)] mb-4">
            ¿Tenés alguna duda?
          </p>
          <h2 className="font-serif text-3xl md:text-5xl font-light text-[var(--espresso)] mb-6">
            Escribinos directamente
          </h2>
          <p className="text-[var(--brown)] mb-8 max-w-md mx-auto text-sm leading-relaxed">
            Asesoramos sobre tallas, colores y estilos. Hacemos pedidos especiales.
          </p>
          <a
            href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "5491112345678"}?text=Hola%2C%20me%20gustar%C3%ADa%20consultar%20sobre%20un%20sombrero`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 border border-[var(--espresso)] text-[var(--espresso)] px-8 py-4 text-sm tracking-wide hover:bg-[var(--espresso)] hover:text-[var(--ivory)] transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            Hablar por WhatsApp
          </a>
        </section>
      </main>
      <Footer />
    </>
  );
}
