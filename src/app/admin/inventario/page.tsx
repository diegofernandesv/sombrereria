import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import type { Metadata } from "next";
import { StockAdjustForm } from "./StockAdjustForm";

export const metadata: Metadata = { title: "Inventario" };

export default async function InventarioPage() {
  let variants: {
    id: number;
    color: string;
    size: string;
    sku: string;
    stock: number;
    lowStockThreshold: number;
    product: { name: string };
  }[] = [];

  let recentLogs: {
    id: string;
    delta: number;
    reason: string;
    note: string | null;
    createdAt: Date;
    variant: { color: string; size: string; product: { name: string } };
  }[] = [];

  try {
    [variants, recentLogs] = await Promise.all([
      prisma.variant.findMany({
        include: { product: { select: { name: true } } },
        orderBy: [{ stock: "asc" }, { id: "asc" }],
      }),
      prisma.stockLog.findMany({
        take: 20,
        orderBy: { createdAt: "desc" },
        include: {
          variant: {
            include: { product: { select: { name: true } } },
          },
        },
      }),
    ]);
  } catch {
    // DB no disponible
  }

  const lowStock = variants.filter((v) => v.stock <= v.lowStockThreshold && v.stock > 0);
  const outOfStock = variants.filter((v) => v.stock === 0);

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="font-serif text-2xl font-light text-[var(--espresso)]">
          Inventario
        </h1>
        <p className="text-sm text-[var(--brown)] mt-1">
          Control de stock por variante
        </p>
      </div>

      {/* Alertas */}
      {(lowStock.length > 0 || outOfStock.length > 0) && (
        <div className="mb-6 space-y-2">
          {outOfStock.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded px-4 py-3 text-sm text-red-700">
              <strong>{outOfStock.length} variante{outOfStock.length !== 1 ? "s" : ""}</strong> sin stock.
            </div>
          )}
          {lowStock.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded px-4 py-3 text-sm text-amber-700">
              <strong>{lowStock.length} variante{lowStock.length !== 1 ? "s" : ""}</strong> con stock bajo.
            </div>
          )}
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Tabla de variantes */}
        <div className="lg:col-span-2 bg-white border border-[var(--border)] rounded overflow-hidden">
          <div className="px-5 py-4 border-b border-[var(--border)]">
            <h2 className="font-serif text-base font-light text-[var(--espresso)]">
              Stock por variante
            </h2>
          </div>

          {variants.length === 0 ? (
            <div className="py-10 text-center text-sm text-[var(--brown)]">
              Sin variantes cargadas
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--border)] bg-[var(--ivory)]">
                    {["Producto", "Color", "Talla", "SKU", "Stock", "Umbral", "Acción"].map((h) => (
                      <th
                        key={h}
                        className="text-left px-4 py-3 text-[10px] uppercase tracking-[0.12em] text-[var(--brown)] font-normal"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {variants.map((v) => (
                    <tr
                      key={v.id}
                      className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--ivory)] transition-colors"
                    >
                      <td className="px-4 py-3 text-[var(--espresso)] font-medium">
                        {v.product.name}
                      </td>
                      <td className="px-4 py-3 text-[var(--brown)] capitalize">
                        {v.color}
                      </td>
                      <td className="px-4 py-3 text-[var(--brown)]">{v.size}</td>
                      <td className="px-4 py-3 text-[var(--brown)] text-xs font-mono">
                        {v.sku}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`font-semibold text-base ${
                            v.stock === 0
                              ? "text-red-600"
                              : v.stock <= v.lowStockThreshold
                              ? "text-amber-600"
                              : "text-[var(--espresso)]"
                          }`}
                        >
                          {v.stock}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[var(--brown)]">
                        {v.lowStockThreshold}
                      </td>
                      <td className="px-4 py-3">
                        <StockAdjustForm variantId={v.id} currentStock={v.stock} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Historial de movimientos */}
        <div className="bg-white border border-[var(--border)] rounded">
          <div className="px-5 py-4 border-b border-[var(--border)]">
            <h2 className="font-serif text-base font-light text-[var(--espresso)]">
              Movimientos recientes
            </h2>
          </div>

          {recentLogs.length === 0 ? (
            <div className="py-10 text-center text-sm text-[var(--brown)]">
              Sin movimientos
            </div>
          ) : (
            <div className="divide-y divide-[var(--border)] max-h-[600px] overflow-y-auto">
              {recentLogs.map((log) => (
                <div key={log.id} className="px-5 py-3">
                  <div className="flex items-center justify-between mb-0.5">
                    <p className="text-sm font-medium text-[var(--espresso)]">
                      {log.variant.product.name}
                    </p>
                    <span
                      className={`text-sm font-semibold ${
                        log.delta > 0 ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {log.delta > 0 ? "+" : ""}{log.delta}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--brown)] capitalize">
                    {log.variant.color} · {log.variant.size}
                  </p>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-[10px] uppercase tracking-wide text-[var(--brown)] opacity-70">
                      {log.reason}
                    </span>
                    <span className="text-[10px] text-[var(--brown)] opacity-60">
                      {formatDate(log.createdAt)}
                    </span>
                  </div>
                  {log.note && (
                    <p className="text-xs text-[var(--brown)] italic mt-0.5">
                      {log.note}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
