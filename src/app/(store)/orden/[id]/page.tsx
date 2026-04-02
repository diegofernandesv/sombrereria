import Link from "next/link";
import { CheckCircle } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatPrice, formatDate, ORDER_STATUS_LABELS } from "@/lib/utils";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Confirmación de compra" };

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function OrderConfirmationPage({ params }: PageProps) {
  const { id } = await params;

  let order = null;
  try {
    order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            variant: {
              include: {
                product: { select: { name: true, images: true } },
              },
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
      <div className="max-w-2xl mx-auto px-5 py-20 text-center">
        <p className="font-serif text-2xl font-light text-[var(--espresso)] mb-4">
          Orden no encontrada
        </p>
        <Link href="/" className="text-sm text-[var(--camel)] underline">
          Volver al inicio
        </Link>
      </div>
    );
  }

  const isPaid = order.status === "PAID" || order.paidAt !== null;

  return (
    <div className="max-w-2xl mx-auto px-5 md:px-8 py-14 md:py-20">
      {/* Status */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-50 mb-5">
          <CheckCircle size={32} className="text-green-600" />
        </div>
        <h1 className="font-serif text-3xl md:text-4xl font-light text-[var(--espresso)] mb-2">
          {isPaid ? "¡Compra confirmada!" : "Pedido recibido"}
        </h1>
        <p className="text-[var(--brown)] text-sm">
          {isPaid
            ? "Te enviamos el comprobante por email."
            : "En cuanto confirmemos el pago, recibirás un email."}
        </p>
      </div>

      {/* Detalles de la orden */}
      <div className="bg-[var(--ivory-dark)] p-6 md:p-8 mb-8">
        <div className="flex justify-between items-start mb-6">
          <div>
            <p className="text-xs uppercase tracking-[0.15em] text-[var(--brown)] mb-1">
              Número de pedido
            </p>
            <p className="font-medium text-[var(--espresso)]">
              {order.orderNumber}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs uppercase tracking-[0.15em] text-[var(--brown)] mb-1">
              Estado
            </p>
            <span className="text-sm font-medium text-[var(--espresso)]">
              {ORDER_STATUS_LABELS[order.status] ?? order.status}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
          <div>
            <p className="text-xs text-[var(--brown)] mb-0.5">Cliente</p>
            <p className="text-[var(--espresso)]">{order.customerName}</p>
          </div>
          <div>
            <p className="text-xs text-[var(--brown)] mb-0.5">Email</p>
            <p className="text-[var(--espresso)]">{order.customerEmail}</p>
          </div>
          <div>
            <p className="text-xs text-[var(--brown)] mb-0.5">Fecha</p>
            <p className="text-[var(--espresso)]">{formatDate(order.createdAt)}</p>
          </div>
          <div>
            <p className="text-xs text-[var(--brown)] mb-0.5">Envío a</p>
            <p className="text-[var(--espresso)] capitalize">
              {(order.shippingAddress as { city?: string })?.city ?? "—"}
            </p>
          </div>
        </div>

        {/* Items */}
        <div className="border-t border-[var(--border)] pt-5 space-y-3">
          {order.items.map((item) => (
            <div key={item.id} className="flex justify-between text-sm">
              <span className="text-[var(--brown)]">
                {item.variant.product.name}
                <span className="text-xs ml-1 capitalize">
                  ({item.variant.color} · {item.variant.size} · ×{item.quantity})
                </span>
              </span>
              <span className="text-[var(--espresso)] font-medium">
                {formatPrice(Number(item.subtotal))}
              </span>
            </div>
          ))}
        </div>

        <div className="border-t border-[var(--border)] mt-4 pt-4 flex justify-between">
          <span className="font-medium text-[var(--espresso)]">Total</span>
          <span className="font-serif text-xl text-[var(--espresso)]">
            {formatPrice(Number(order.total))}
          </span>
        </div>
      </div>

      {/* Acciones */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Link
          href="/productos"
          className="flex-1 text-center border border-[var(--espresso)] text-[var(--espresso)] px-6 py-3 text-sm hover:bg-[var(--espresso)] hover:text-[var(--ivory)] transition-colors"
        >
          Seguir comprando
        </Link>
        <a
          href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "5491112345678"}?text=Hola%2C%20mi%20n%C3%BAmero%20de%20pedido%20es%20${order.orderNumber}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 text-center bg-[var(--espresso)] text-[var(--ivory)] px-6 py-3 text-sm hover:bg-[var(--espresso-mid)] transition-colors"
        >
          Consultar por WhatsApp
        </a>
      </div>
    </div>
  );
}
