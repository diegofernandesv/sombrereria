import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionId, getCart } from "@/lib/cart";
import { generateOrderNumber } from "@/lib/utils";

export async function POST(req: Request) {
  try {
    const { customerName, customerEmail, customerPhone, shippingAddress } =
      await req.json();

    if (!customerName || !customerEmail || !shippingAddress) {
      return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
    }

    const sessionId = await getSessionId();
    const cart = await getCart(sessionId);

    if (!cart || cart.items.length === 0) {
      return NextResponse.json({ error: "Carrito vacío" }, { status: 400 });
    }

    // Verificar stock para todos los items
    for (const item of cart.items) {
      if (item.variant.stock < item.quantity) {
        return NextResponse.json(
          {
            error: `Sin stock suficiente para ${item.variant.product.name} (${item.variant.color} ${item.variant.size})`,
          },
          { status: 400 }
        );
      }
    }

    const subtotal = cart.items.reduce(
      (sum, item) => sum + Number(item.variant.price) * item.quantity,
      0
    );

    // Crear la orden
    const order = await prisma.order.create({
      data: {
        orderNumber: generateOrderNumber(),
        customerName,
        customerEmail,
        customerPhone,
        shippingAddress,
        subtotal,
        shipping: 0,
        total: subtotal,
        items: {
          create: cart.items.map((item) => ({
            variantId: item.variantId,
            quantity: item.quantity,
            unitPrice: Number(item.variant.price),
            subtotal: Number(item.variant.price) * item.quantity,
          })),
        },
      },
    });

    return NextResponse.json({ orderId: order.id });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error al crear la orden" }, { status: 500 });
  }
}
