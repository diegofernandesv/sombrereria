import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const { delta, note } = await req.json();
    const variantId = parseInt(id);

    if (isNaN(variantId) || delta === 0) {
      return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
    }

    const variant = await prisma.variant.findUnique({ where: { id: variantId } });
    if (!variant) {
      return NextResponse.json({ error: "Variante no encontrada" }, { status: 404 });
    }

    const newStock = variant.stock + delta;
    if (newStock < 0) {
      return NextResponse.json({ error: "Stock no puede ser negativo" }, { status: 400 });
    }

    await prisma.variant.update({
      where: { id: variantId },
      data: { stock: newStock },
    });

    await prisma.stockLog.create({
      data: {
        variantId,
        delta,
        reason: "MANUAL_ADJUSTMENT",
        note,
      },
    });

    return NextResponse.json({ ok: true, newStock });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error al ajustar stock" }, { status: 500 });
  }
}
