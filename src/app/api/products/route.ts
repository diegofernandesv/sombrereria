import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tipo = searchParams.get("tipo");
  const color = searchParams.get("color");
  const talla = searchParams.get("talla");

  try {
    const products = await prisma.product.findMany({
      where: {
        isActive: true,
        ...(tipo ? { type: tipo as never } : {}),
        variants: {
          some: {
            ...(color ? { color } : {}),
            ...(talla ? { size: talla } : {}),
          },
        },
      },
      include: {
        variants: {
          select: { id: true, color: true, size: true, price: true, stock: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(
      products.map((p) => ({
        ...p,
        variants: p.variants.map((v) => ({
          ...v,
          price: v.price.toString(),
        })),
      }))
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error al obtener productos" }, { status: 500 });
  }
}
