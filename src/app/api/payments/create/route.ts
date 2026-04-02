import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { orderId } = await req.json();

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

    if (!order) {
      return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const accessToken = process.env.MP_ACCESS_TOKEN;

    if (!accessToken) {
      // Modo demo: redirigir directamente a la página de confirmación
      return NextResponse.json({
        checkoutUrl: `${appUrl}/orden/${orderId}`,
      });
    }

    // Crear preferencia en MercadoPago
    const preference = {
      items: order.items.map((item) => ({
        id: String(item.variant.id),
        title: `${item.variant.product.name} — ${item.variant.color} ${item.variant.size}`,
        quantity: item.quantity,
        unit_price: Number(item.unitPrice),
        currency_id: "ARS",
      })),
      payer: {
        name: order.customerName,
        email: order.customerEmail,
      },
      external_reference: order.id,
      back_urls: {
        success: `${appUrl}/orden/${orderId}`,
        failure: `${appUrl}/checkout`,
        pending: `${appUrl}/orden/${orderId}`,
      },
      auto_return: "approved",
      notification_url: `${appUrl}/api/payments/webhook`,
    };

    const mpRes = await fetch(
      "https://api.mercadopago.com/checkout/preferences",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(preference),
      }
    );

    if (!mpRes.ok) {
      throw new Error(`MercadoPago error: ${mpRes.status}`);
    }

    const mpData = await mpRes.json();
    const checkoutUrl =
      process.env.NODE_ENV === "production"
        ? mpData.init_point
        : mpData.sandbox_init_point;

    return NextResponse.json({ checkoutUrl });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Error al crear preferencia de pago" },
      { status: 500 }
    );
  }
}
