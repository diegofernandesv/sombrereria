import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";
import { ProductType } from "@prisma/client";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, description, type, images = [], variants } = body;

    if (!name || !type || !variants?.length) {
      return NextResponse.json({ error: "Faltan datos requeridos" }, { status: 400 });
    }

    if (!Object.values(ProductType).includes(type)) {
      return NextResponse.json({ error: "Tipo de producto inválido" }, { status: 400 });
    }

    // Generar slug único
    let slug = slugify(name);
    const existing = await prisma.product.findUnique({ where: { slug } });
    if (existing) slug = `${slug}-${Date.now()}`;

    const product = await prisma.product.create({
      data: {
        name,
        slug,
        description: description || "",
        type: type as ProductType,
        images,
        variants: {
          create: variants.map((v: {
            color: string;
            size: string;
            sku: string;
            price: number;
            stock: number;
            lowStockThreshold?: number;
          }) => ({
            color: v.color.toLowerCase().trim(),
            size: v.size.trim(),
            sku: v.sku.trim(),
            price: v.price,
            stock: v.stock,
            lowStockThreshold: v.lowStockThreshold ?? 3,
          })),
        },
      },
      include: { variants: true },
    });

    // Registrar stock inicial
    for (const variant of product.variants) {
      if (variant.stock > 0) {
        await prisma.stockLog.create({
          data: {
            variantId: variant.id,
            delta: variant.stock,
            reason: "INITIAL",
            note: "Stock inicial al crear producto",
          },
        });
      }
    }

    return NextResponse.json({ ok: true, product }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error al crear producto" }, { status: 500 });
  }
}
