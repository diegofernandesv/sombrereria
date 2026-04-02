import { prisma } from "@/lib/prisma";
import { formatPrice, formatDate, ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from "@/lib/utils";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import { OrderStatusForm } from "./OrderStatusForm";

export const metadata: Metadata = { title: "Detalle de pedido" };

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function OrderDetailPage({ params }: PageProps) {
  const { id } = await params;

  let order = null;
  try {
    order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            variant: {
              include: { product: { select: { name: true } } },
            },
          },
        },
      },
    });
  } catch {
    // DB no disponible
  }

  if (!order) {
    return (
      <div className="p-8">
        <p className="text-[var(--brown)]">Pedido no encontrado.</p>
        <Link href="/admin/pedidos" className="text-sm text-[var(--camel)] mt-2 inline-block">
          ← Volver a pedidos
        </Link>
      </div>
    );
  }

  const address = order.shippingAddress as Record<string, string>;

  return (
    <div className="p-8">
      <Link
        href="/admin/pedidos"
        className="inline-flex items-center gap-2 text-sm text-[var(--brown)] hover:text-[var(--espresso)] mb-6 transition-colors"
      >
        <ArrowLeft size={14} />
        Volver a pedidos
      </Link>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="font-serif text-2xl font-light text-[var(--espresso)]">
            {order.orderNumber}
          </h1>
          <p className="text-sm text-[var(--brown)] mt-1">
            {formatDate(order.createdAt)} · {order.customerEmail}
          </p>
        </div>
        <span
          className={`text-xs uppercase tracking-wide px-3 py-1.5 rounded ${
            ORDER_STATUS_COLORS[order.status] ?? "bg-gray-100 text-gray-700"
          }`}
        >
          {ORDER_STATUS_LABELS[order.status] ?? order.status}
        </span>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Productos */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white border border-[var(--border)] rounded overflow-hidden">
            <div className="px-5 py-4 border-b border-[var(--border)]">
              <h2 className="font-serif text-base font-light text-[var(--espresso)]">
                Artículos ({order.items.length})
              </h2>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--ivory)]">
                  {["Producto", "Color", "Talla", "Cantidad", "Precio unit.", "Subtotal"].map((h) => (
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
                {order.items.map((item) => (
                  <tr key={item.id} className="border-b border-[var(--border)] last:border-0">
                    <td className="px-5 py-3 font-medium text-[var(--espresso)]">
                      {item.variant.product.name}
                    </td>
                    <td className="px-5 py-3 text-[var(--brown)] capitalize">{item.variant.color}</td>
                    <td className="px-5 py-3 text-[var(--brown)]">{item.variant.size}</td>
                    <td className="px-5 py-3 text-[var(--espresso)]">{item.quantity}</td>
                    <td className="px-5 py-3 text-[var(--espresso)]">
                      {formatPrice(Number(item.unitPrice))}
                    </td>
                    <td className="px-5 py-3 font-medium text-[var(--espresso)]">
                      {formatPrice(Number(item.subtotal))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="px-5 py-4 border-t border-[var(--border)] flex justify-end">
              <div className="text-right space-y-1">
                <div className="flex gap-8 text-sm">
                  <span className="text-[var(--brown)]">Subtotal</span>
                  <span className="text-[var(--espresso)]">{formatPrice(Number(order.subtotal))}</span>
                </div>
                <div className="flex gap-8 text-sm">
                  <span className="text-[var(--brown)]">Envío</span>
                  <span className="text-[var(--espresso)]">{formatPrice(Number(order.shipping))}</span>
                </div>
                <div className="flex gap-8 font-serif text-xl">
                  <span className="text-[var(--espresso)]">Total</span>
                  <span className="text-[var(--espresso)]">{formatPrice(Number(order.total))}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Panel lateral */}
        <div className="space-y-4">
          {/* Cambiar estado */}
          <div className="bg-white border border-[var(--border)] rounded p-5">
            <h2 className="font-serif text-base font-light text-[var(--espresso)] mb-4">
              Estado del pedido
            </h2>
            <OrderStatusForm orderId={order.id} currentStatus={order.status} />
          </div>

          {/* Cliente */}
          <div className="bg-white border border-[var(--border)] rounded p-5">
            <h2 className="font-serif text-base font-light text-[var(--espresso)] mb-3">
              Cliente
            </h2>
            <dl className="space-y-2 text-sm">
              <div>
                <dt className="text-xs text-[var(--brown)]">Nombre</dt>
                <dd className="text-[var(--espresso)]">{order.customerName}</dd>
              </div>
              <div>
                <dt className="text-xs text-[var(--brown)]">Email</dt>
                <dd className="text-[var(--espresso)]">{order.customerEmail}</dd>
              </div>
              {order.customerPhone && (
                <div>
                  <dt className="text-xs text-[var(--brown)]">Teléfono</dt>
                  <dd className="text-[var(--espresso)]">{order.customerPhone}</dd>
                </div>
              )}
            </dl>
          </div>

          {/* Dirección */}
          <div className="bg-white border border-[var(--border)] rounded p-5">
            <h2 className="font-serif text-base font-light text-[var(--espresso)] mb-3">
              Dirección de envío
            </h2>
            <p className="text-sm text-[var(--espresso)]">
              {address.street}
              <br />
              {address.city}, {address.province} {address.zip}
            </p>
          </div>

          {/* Pago */}
          <div className="bg-white border border-[var(--border)] rounded p-5">
            <h2 className="font-serif text-base font-light text-[var(--espresso)] mb-3">
              Pago
            </h2>
            <dl className="space-y-2 text-sm">
              <div>
                <dt className="text-xs text-[var(--brown)]">Estado</dt>
                <dd className="text-[var(--espresso)]">{order.paymentStatus ?? "—"}</dd>
              </div>
              {order.paidAt && (
                <div>
                  <dt className="text-xs text-[var(--brown)]">Pagado el</dt>
                  <dd className="text-[var(--espresso)]">{formatDate(order.paidAt)}</dd>
                </div>
              )}
              {order.paymentId && (
                <div>
                  <dt className="text-xs text-[var(--brown)]">ID de pago</dt>
                  <dd className="text-[var(--espresso)] text-xs font-mono">{order.paymentId}</dd>
                </div>
              )}
            </dl>
          </div>

          {/* Comprobante */}
          {order.receiptUrl && (
            <div className="bg-white border border-[var(--border)] rounded p-5">
              <h2 className="font-serif text-base font-light text-[var(--espresso)] mb-3">
                Comprobante
              </h2>
              <a
                href={order.receiptUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-[var(--camel)] hover:underline"
              >
                Descargar PDF →
              </a>
              {order.receiptSentAt && (
                <p className="text-xs text-[var(--brown)] mt-1">
                  Enviado el {formatDate(order.receiptSentAt)}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
