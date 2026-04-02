import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionId } from "@/lib/cart";

export async function GET() {
  try {
    const sessionId = await getSessionId();

    const cart = await prisma.cart.findUnique({
      where: { sessionId },
      include: {
        items: {
          include: {
            variant: {
              include: {
                product: {
                  select: { name: true, slug: true, images: true },
                },
              },
            },
          },
        },
      },
    });

    if (!cart) {
      return NextResponse.json({ items: [] });
    }

    return NextResponse.json({
      ...cart,
      items: cart.items.map((item) => ({
        ...item,
        variant: {
          ...item.variant,
          price: item.variant.price.toString(),
        },
      })),
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error al obtener carrito" }, { status: 500 });
  }
}
