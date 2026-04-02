import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";
import { ProductType } from "@prisma/client";
import * as XLSX from "xlsx";

interface ExcelRow {
  nombre?: string;
  tipo?: string;
  descripcion?: string;
  color?: string;
  talla?: string;
  precio?: number | string;
  stock?: number | string;
  sku?: string;
  umbral_stock?: number | string;
}

const VALID_TYPES = Object.values(ProductType);

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No se recibió ningún archivo" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows: ExcelRow[] = XLSX.utils.sheet_to_json(sheet, { defval: "" });

    if (rows.length === 0) {
      return NextResponse.json({ error: "El archivo está vacío" }, { status: 400 });
    }

    // Validar columnas mínimas
    const first = rows[0];
    const required = ["nombre", "tipo", "color", "talla", "precio", "stock", "sku"];
    const missing = required.filter((k) => !(k in first));
    if (missing.length > 0) {
      return NextResponse.json(
        { error: `Columnas faltantes: ${missing.join(", ")}` },
        { status: 400 }
      );
    }

    // Agrupar filas por nombre de producto
    const productMap = new Map<string, { rows: ExcelRow[]; first: ExcelRow }>();
    for (const row of rows) {
      const name = String(row.nombre ?? "").trim();
      if (!name) continue;
      if (!productMap.has(name)) {
        productMap.set(name, { rows: [], first: row });
      }
      productMap.get(name)!.rows.push(row);
    }

    const results: { created: string[]; skipped: string[]; errors: string[] } = {
      created: [],
      skipped: [],
      errors: [],
    };

    for (const [name, { rows: variantRows, first: firstRow }] of productMap) {
      try {
        const tipo = String(firstRow.tipo ?? "").toUpperCase().trim();
        if (!VALID_TYPES.includes(tipo as ProductType)) {
          results.errors.push(`"${name}": tipo inválido "${firstRow.tipo}"`);
          continue;
        }

        // Verificar SKUs duplicados
        const skus = variantRows.map((r) => String(r.sku ?? "").trim()).filter(Boolean);
        const existingVariant = await prisma.variant.findFirst({
          where: { sku: { in: skus } },
        });
        if (existingVariant) {
          results.skipped.push(`"${name}": SKU "${existingVariant.sku}" ya existe`);
          continue;
        }

        // Generar slug único
        let slug = slugify(name);
        const existing = await prisma.product.findUnique({ where: { slug } });
        if (existing) slug = `${slug}-${Date.now()}`;

        const product = await prisma.product.create({
          data: {
            name,
            slug,
            description: String(firstRow.descripcion ?? ""),
            type: tipo as ProductType,
            images: [],
            variants: {
              create: variantRows.map((row) => ({
                color: String(row.color ?? "").toLowerCase().trim(),
                size: String(row.talla ?? "").trim(),
                sku: String(row.sku ?? "").trim(),
                price: Number(row.precio) || 0,
                stock: Math.max(0, Number(row.stock) || 0),
                lowStockThreshold: Number(row.umbral_stock) || 3,
              })),
            },
          },
          include: { variants: true },
        });

        // Stock inicial
        for (const variant of product.variants) {
          if (variant.stock > 0) {
            await prisma.stockLog.create({
              data: {
                variantId: variant.id,
                delta: variant.stock,
                reason: "INITIAL",
                note: "Importado desde Excel",
              },
            });
          }
        }

        results.created.push(name);
      } catch (err) {
        results.errors.push(`"${name}": ${err instanceof Error ? err.message : "error desconocido"}`);
      }
    }

    return NextResponse.json({
      ok: true,
      summary: {
        total: productMap.size,
        created: results.created.length,
        skipped: results.skipped.length,
        errors: results.errors.length,
      },
      details: results,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error al procesar el archivo" }, { status: 500 });
  }
}

// Genera y descarga el template de Excel
export async function GET() {
  const template = [
    {
      nombre: "Panamá Classic",
      tipo: "PANAMA",
      descripcion: "Sombrero de paja toquilla tejido a mano",
      color: "natural",
      talla: "M",
      precio: 15000,
      stock: 10,
      sku: "PAN-NAT-M",
      umbral_stock: 3,
    },
    {
      nombre: "Panamá Classic",
      tipo: "PANAMA",
      descripcion: "Sombrero de paja toquilla tejido a mano",
      color: "natural",
      talla: "L",
      precio: 15000,
      stock: 8,
      sku: "PAN-NAT-L",
      umbral_stock: 3,
    },
    {
      nombre: "Fedora Negro",
      tipo: "FEDORA",
      descripcion: "Fedora clásico de lana",
      color: "negro",
      talla: "S",
      precio: 18000,
      stock: 5,
      sku: "FED-NEG-S",
      umbral_stock: 2,
    },
  ];

  const ws = XLSX.utils.json_to_sheet(template);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Productos");

  // Anchos de columna
  ws["!cols"] = [
    { wch: 20 }, { wch: 12 }, { wch: 35 }, { wch: 12 },
    { wch: 8 }, { wch: 10 }, { wch: 8 }, { wch: 16 }, { wch: 14 },
  ];

  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

  return new Response(buf, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="template_productos.xlsx"',
    },
  });
}
