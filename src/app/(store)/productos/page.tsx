import { Suspense } from "react";
import { ProductCard } from "@/components/store/ProductCard";
import { prisma } from "@/lib/prisma";
import { PRODUCT_TYPE_LABELS } from "@/lib/utils";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Catálogo de sombreros",
  description: "Explorá nuestra colección completa de sombreros artesanales.",
};

interface PageProps {
  searchParams: Promise<{
    tipo?: string;
    color?: string;
    talla?: string;
  }>;
}

async function ProductGrid({ tipo, color, talla }: { tipo?: string; color?: string; talla?: string }) {
  let products: {
    id: string;
    name: string;
    slug: string;
    images: string[];
    type: string;
    variants: { price: string | number; stock: number; color: string; size: string }[];
  }[] = [];

  try {
    const raw = await prisma.product.findMany({
      where: {
        isActive: true,
        ...(tipo ? { type: tipo as never } : {}),
        variants: {
          some: {
            ...(color ? { color } : {}),
            ...(talla ? { size: talla } : {}),
          },
        },
      },
      include: {
        variants: {
          select: {
            price: true,
            stock: true,
            color: true,
            size: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    products = raw.map((p) => ({
      ...p,
      type: p.type as string,
      variants: p.variants.map((v) => ({ ...v, price: Number(v.price) })),
    }));
  } catch {
    // DB no configurada — mostrar placeholders
  }

  if (products.length === 0) {
    return (
      <div className="col-span-3 py-20 text-center">
        <p className="font-serif text-2xl text-[var(--brown)] font-light mb-2">
          Pronto aquí
        </p>
        <p className="text-sm text-[var(--brown)] opacity-70">
          Estamos cargando la colección. Volvé pronto.
        </p>
      </div>
    );
  }

  return (
    <>
      {products.map((product) => {
        const prices = product.variants.map((v) => Number(v.price));
        const totalStock = product.variants.reduce((s, v) => s + v.stock, 0);
        return (
          <ProductCard
            key={product.id}
            id={product.id}
            name={product.name}
            slug={product.slug}
            images={product.images}
            type={product.type}
            minPrice={Math.min(...prices)}
            maxPrice={Math.max(...prices)}
            totalStock={totalStock}
            variantCount={product.variants.length}
          />
        );
      })}
    </>
  );
}

async function FilterOptions() {
  let colors: string[] = [];
  let sizes: string[] = [];

  try {
    const variants = await prisma.variant.findMany({
      select: { color: true, size: true },
      distinct: ["color", "size"],
    });
    colors = [...new Set(variants.map((v: { color: string; size: string }) => v.color))].sort();
    sizes = [...new Set(variants.map((v: { color: string; size: string }) => v.size))].sort();
  } catch {
    // DB no disponible
  }

  return { colors, sizes };
}

export default async function ProductsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const { tipo, color, talla } = params;
  const { colors, sizes } = await FilterOptions();

  const types = Object.entries(PRODUCT_TYPE_LABELS);

  return (
    <div className="max-w-7xl mx-auto px-5 md:px-8 py-10 md:py-14">
      {/* Header */}
      <div className="mb-10">
        <h1 className="font-serif text-4xl md:text-5xl font-light text-[var(--espresso)] mb-2">
          {tipo ? PRODUCT_TYPE_LABELS[tipo] ?? "Catálogo" : "Catálogo"}
        </h1>
        {tipo && (
          <p className="text-sm text-[var(--brown)]">
            Filtrando por tipo ·{" "}
            <a href="/productos" className="underline underline-offset-2 hover:text-[var(--camel)]">
              Ver todos
            </a>
          </p>
        )}
      </div>

      <div className="flex flex-col md:flex-row gap-10 md:gap-16">
        {/* Sidebar filtros */}
        <aside className="w-full md:w-52 shrink-0">
          <div className="space-y-8">
            {/* Por tipo */}
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--brown)] mb-3">
                Tipo
              </p>
              <ul className="space-y-1.5">
                <li>
                  <a
                    href="/productos"
                    className={`text-sm block py-0.5 transition-colors ${
                      !tipo
                        ? "text-[var(--espresso)] font-medium"
                        : "text-[var(--brown)] hover:text-[var(--espresso)]"
                    }`}
                  >
                    Todos
                  </a>
                </li>
                {types.map(([key, label]) => (
                  <li key={key}>
                    <a
                      href={`/productos?tipo=${key}${color ? `&color=${color}` : ""}${talla ? `&talla=${talla}` : ""}`}
                      className={`text-sm block py-0.5 transition-colors ${
                        tipo === key
                          ? "text-[var(--camel)] font-medium"
                          : "text-[var(--brown)] hover:text-[var(--espresso)]"
                      }`}
                    >
                      {label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Por color */}
            {colors.length > 0 && (
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--brown)] mb-3">
                  Color
                </p>
                <ul className="space-y-1.5">
                  {colors.map((c) => (
                    <li key={c}>
                      <a
                        href={`/productos?${tipo ? `tipo=${tipo}&` : ""}color=${c}${talla ? `&talla=${talla}` : ""}`}
                        className={`text-sm block py-0.5 capitalize transition-colors ${
                          color === c
                            ? "text-[var(--camel)] font-medium"
                            : "text-[var(--brown)] hover:text-[var(--espresso)]"
                        }`}
                      >
                        {c}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Por talla */}
            {sizes.length > 0 && (
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--brown)] mb-3">
                  Talla
                </p>
                <ul className="space-y-1.5">
                  {sizes.map((s) => (
                    <li key={s}>
                      <a
                        href={`/productos?${tipo ? `tipo=${tipo}&` : ""}${color ? `color=${color}&` : ""}talla=${s}`}
                        className={`text-sm block py-0.5 transition-colors ${
                          talla === s
                            ? "text-[var(--camel)] font-medium"
                            : "text-[var(--brown)] hover:text-[var(--espresso)]"
                        }`}
                      >
                        {s}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </aside>

        {/* Grid productos */}
        <div className="flex-1">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-10">
            <Suspense
              fallback={
                <>
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="aspect-[3/4] bg-[var(--ivory-dark)] mb-4" />
                      <div className="h-4 bg-[var(--ivory-dark)] mb-2 w-3/4" />
                      <div className="h-3 bg-[var(--ivory-dark)] w-1/3" />
                    </div>
                  ))}
                </>
              }
            >
              <ProductGrid tipo={tipo} color={color} talla={talla} />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
}
