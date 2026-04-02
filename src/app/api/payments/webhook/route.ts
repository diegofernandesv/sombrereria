import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { type, data } = body;

    if (type !== "payment") {
      return NextResponse.json({ ok: true });
    }

    const paymentId = data?.id;
    if (!paymentId) {
      return NextResponse.json({ error: "Sin payment ID" }, { status: 400 });
    }

    // Consultar el pago en MercadoPago
    const accessToken = process.env.MP_ACCESS_TOKEN;
    if (!accessToken) {
      return NextResponse.json({ error: "MP no configurado" }, { status: 500 });
    }

    const mpRes = await fetch(
      `https://api.mercadopago.com/v1/payments/${paymentId}`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    if (!mpRes.ok) throw new Error("Error consultando pago MP");
    const payment = await mpRes.json();

    const orderId: string = payment.external_reference;
    if (!orderId) return NextResponse.json({ ok: true });

    const order = await prisma.order.findUnique({
      where: { id: orderId },
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

    if (!order) return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });

    if (payment.status === "approved" && order.status === "PENDING") {
      // 1. Actualizar orden
      await prisma.order.update({
        where: { id: orderId },
        data: {
          status: "PAID",
          paymentId: String(paymentId),
          paymentStatus: payment.status,
          paymentMethod: payment.payment_type_id,
          paidAt: new Date(),
        },
      });

      // 2. Descontar stock
      for (const item of order.items) {
        await prisma.variant.update({
          where: { id: item.variantId },
          data: { stock: { decrement: item.quantity } },
        });

        await prisma.stockLog.create({
          data: {
            variantId: item.variantId,
            delta: -item.quantity,
            reason: "SALE",
            orderId: order.id,
          },
        });
      }

      // 3. Limpiar carrito
      const cart = await prisma.cart.findFirst({
        where: {
          items: { some: { variant: { orderItems: { some: { orderId: order.id } } } } },
        },
      });
      if (cart) {
        await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
      }

      // 4. Enviar email de confirmación
      if (process.env.RESEND_API_KEY) {
        const itemsList = order.items
          .map(
            (item) =>
              `• ${item.variant.product.name} (${item.variant.color} ${item.variant.size}) ×${item.quantity} — $${Number(item.subtotal).toLocaleString("es-AR")}`
          )
          .join("\n");

        await resend.emails.send({
          from: process.env.EMAIL_FROM ?? "hola@tusombrereria.com",
          to: order.customerEmail,
          subject: `✅ Compra confirmada — ${order.orderNumber}`,
          text: `Hola ${order.customerName},\n\nTu compra fue confirmada.\n\nPedido: ${order.orderNumber}\n\n${itemsList}\n\nTotal: $${Number(order.total).toLocaleString("es-AR")}\n\nTe avisaremos cuando despachemos tu pedido.\n\nGracias por comprar en La Sombrerería.`,
        });

        await prisma.order.update({
          where: { id: orderId },
          data: { receiptSentAt: new Date() },
        });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ error: "Error en webhook" }, { status: 500 });
  }
}
