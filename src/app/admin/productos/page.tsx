import { prisma } from "@/lib/prisma";
import { formatPrice, PRODUCT_TYPE_LABELS, formatDate } from "@/lib/utils";
import Link from "next/link";
import { Plus } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Productos" };

export default async function AdminProductsPage() {
  let products: {
    id: string;
    name: string;
    type: string;
    isActive: boolean;
    createdAt: Date;
    images: string[];
    variants: { price: string | number; stock: number }[];
  }[] = [];

  try {
    const raw = await prisma.product.findMany({
      include: {
        variants: {
          select: { price: true, stock: true },
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
    // DB no disponible
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-serif text-2xl font-light text-[var(--espresso)]">
            Productos
          </h1>
          <p className="text-sm text-[var(--brown)] mt-1">
            {products.length} productos en total
          </p>
        </div>
        <Link
          href="/admin/productos/nuevo"
          className="inline-flex items-center gap-2 bg-[var(--espresso)] text-[var(--ivory)] px-5 py-2.5 text-sm hover:bg-[var(--espresso-mid)] transition-colors"
        >
          <Plus size={16} />
          Nuevo producto
        </Link>
      </div>

      <div className="bg-white border border-[var(--border)] rounded overflow-hidden">
        {products.length === 0 ? (
          <div className="py-20 text-center">
            <p className="font-serif text-xl font-light text-[var(--brown)] mb-2">
              Sin productos aún
            </p>
            <p className="text-sm text-[var(--brown)] opacity-70 mb-6">
              Creá tu primer producto para empezar a vender.
            </p>
            <Link
              href="/admin/productos/nuevo"
              className="inline-flex items-center gap-2 bg-[var(--espresso)] text-[var(--ivory)] px-5 py-2.5 text-sm"
            >
              <Plus size={16} />
              Crear primer producto
            </Link>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--ivory)]">
                {["Producto", "Tipo", "Variantes", "Stock total", "Precio desde", "Estado", "Fecha", ""].map(
                  (h) => (
                    <th
                      key={h}
                      className="text-left px-5 py-3 text-[10px] uppercase tracking-[0.12em] text-[var(--brown)] font-normal"
                    >
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {products.map((product) => {
                const prices = product.variants.map((v) => Number(v.price));
                const totalStock = product.variants.reduce(
                  (s, v) => s + v.stock,
                  0
                );
                const minPrice = prices.length > 0 ? Math.min(...prices) : 0;

                return (
                  <tr
                    key={product.id}
                    className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--ivory)] transition-colors"
                  >
                    <td className="px-5 py-3">
                      <p className="font-medium text-[var(--espresso)]">
                        {product.name}
                      </p>
                    </td>
                    <td className="px-5 py-3 text-[var(--brown)]">
                      {PRODUCT_TYPE_LABELS[product.type] ?? product.type}
                    </td>
                    <td className="px-5 py-3 text-[var(--brown)]">
                      {product.variants.length}
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`font-medium ${
                          totalStock === 0
                            ? "text-red-600"
                            : totalStock <= 5
                            ? "text-amber-600"
                            : "text-[var(--espresso)]"
                        }`}
                      >
                        {totalStock}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-[var(--espresso)]">
                      {minPrice > 0 ? formatPrice(minPrice) : "—"}
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`text-[10px] uppercase tracking-wide px-2 py-0.5 rounded ${
                          product.isActive
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {product.isActive ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-[var(--brown)]">
                      {formatDate(product.createdAt)}
                    </td>
                    <td className="px-5 py-3">
                      <Link
                        href={`/admin/productos/${product.id}`}
                        className="text-xs text-[var(--camel)] hover:underline"
                      >
                        Editar
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
