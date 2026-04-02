import { prisma } from "@/lib/prisma";
import { formatPrice, formatDate, ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from "@/lib/utils";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Pedidos" };

export default async function AdminPedidosPage() {
  let orders: {
    id: string;
    orderNumber: string;
    customerName: string;
    customerEmail: string;
    total: string | number;
    status: string;
    createdAt: Date;
    paidAt: Date | null;
    receiptUrl: string | null;
    _count: { items: number };
  }[] = [];

  try {
    orders = await prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { items: true } } },
    }) as typeof orders;
  } catch {
    // DB no disponible
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="font-serif text-2xl font-light text-[var(--espresso)]">
          Pedidos
        </h1>
        <p className="text-sm text-[var(--brown)] mt-1">
          {orders.length} pedidos en total
        </p>
      </div>

      <div className="bg-white border border-[var(--border)] rounded overflow-hidden">
        {orders.length === 0 ? (
          <div className="py-20 text-center text-sm text-[var(--brown)]">
            Sin pedidos aún
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--ivory)]">
                  {[
                    "Pedido", "Cliente", "Email", "Artículos",
                    "Total", "Estado", "Fecha", "Comprobante", "",
                  ].map((h) => (
                    <th
                      key={h}
                      className="text-left px-5 py-3 text-[10px] uppercase tracking-[0.12em] text-[var(--brown)] font-normal"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr
                    key={order.id}
                    className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--ivory)] transition-colors"
                  >
                    <td className="px-5 py-3">
                      <Link
                        href={`/admin/pedidos/${order.id}`}
                        className="font-medium text-[var(--camel)] hover:underline"
                      >
                        {order.orderNumber}
                      </Link>
                    </td>
                    <td className="px-5 py-3 text-[var(--espresso)]">
                      {order.customerName}
                    </td>
                    <td className="px-5 py-3 text-[var(--brown)] text-xs">
                      {order.customerEmail}
                    </td>
                    <td className="px-5 py-3 text-[var(--brown)]">
                      {order._count.items}
                    </td>
                    <td className="px-5 py-3 font-medium text-[var(--espresso)]">
                      {formatPrice(Number(order.total))}
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`text-[10px] uppercase tracking-wide px-2 py-0.5 rounded ${
                          ORDER_STATUS_COLORS[order.status] ?? "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {ORDER_STATUS_LABELS[order.status] ?? order.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-[var(--brown)]">
                      {formatDate(order.createdAt)}
                    </td>
                    <td className="px-5 py-3">
                      {order.receiptUrl ? (
                        <a
                          href={order.receiptUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-[var(--camel)] hover:underline"
                        >
                          Ver PDF
                        </a>
                      ) : (
                        <span className="text-xs text-[var(--brown)] opacity-50">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <Link
                        href={`/admin/pedidos/${order.id}`}
                        className="text-xs text-[var(--camel)] hover:underline"
                      >
                        Ver →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
