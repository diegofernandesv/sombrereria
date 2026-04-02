import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionId } from "@/lib/cart";

export async function POST(req: Request) {
  try {
    const { variantId, quantity = 1 } = await req.json();
    const sessionId = await getSessionId();

    // Verificar stock disponible
    const variant = await prisma.variant.findUnique({
      where: { id: variantId },
    });
    if (!variant) {
      return NextResponse.json({ error: "Variante no encontrada" }, { status: 404 });
    }
    if (variant.stock < quantity) {
      return NextResponse.json({ error: "Stock insuficiente" }, { status: 400 });
    }

    // Obtener o crear carrito
    let cart = await prisma.cart.findUnique({ where: { sessionId } });
    if (!cart) {
      cart = await prisma.cart.create({ data: { sessionId } });
    }

    // Verificar si ya existe el item
    const existing = await prisma.cartItem.findFirst({
      where: { cartId: cart.id, variantId },
    });

    if (existing) {
      const newQty = existing.quantity + quantity;
      if (newQty > variant.stock) {
        return NextResponse.json({ error: "Stock insuficiente" }, { status: 400 });
      }
      await prisma.cartItem.update({
        where: { id: existing.id },
        data: { quantity: newQty },
      });
    } else {
      await prisma.cartItem.create({
        data: { cartId: cart.id, variantId, quantity },
      });
    }

    // Actualizar updatedAt del carrito
    await prisma.cart.update({ where: { id: cart.id }, data: {} });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error al agregar al carrito" }, { status: 500 });
  }
}
