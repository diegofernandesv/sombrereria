import { prisma } from "@/lib/prisma";
import { formatPrice, ORDER_STATUS_LABELS, ORDER_STATUS_COLORS, formatDate } from "@/lib/utils";
import Link from "next/link";
import { Package, ShoppingCart, AlertTriangle, TrendingUp } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Dashboard" };

async function getDashboardData() {
  try {
    const [
      totalOrders,
      paidOrders,
      recentOrders,
      lowStockVariants,
      totalProducts,
    ] = await Promise.all([
      prisma.order.count(),
      prisma.order.aggregate({
        where: { status: { in: ["PAID", "PREPARING", "SHIPPED", "DELIVERED"] } },
        _sum: { total: true },
        _count: true,
      }),
      prisma.order.findMany({
        orderBy: { createdAt: "desc" },
        take: 6,
        select: {
          id: true,
          orderNumber: true,
          customerName: true,
          total: true,
          status: true,
          createdAt: true,
        },
      }),
      prisma.variant.findMany({
        where: { stock: { lte: 3 } },
        take: 5,
        include: { product: { select: { name: true } } },
        orderBy: { stock: "asc" },
      }),
      prisma.product.count({ where: { isActive: true } }),
    ]);

    return { totalOrders, paidOrders, recentOrders, lowStockVariants, totalProducts };
  } catch {
    return {
      totalOrders: 0,
      paidOrders: { _sum: { total: null }, _count: 0 },
      recentOrders: [],
      lowStockVariants: [],
      totalProducts: 0,
    };
  }
}

export default async function AdminDashboard() {
  const { totalOrders, paidOrders, recentOrders, lowStockVariants, totalProducts } =
    await getDashboardData();

  const stats = [
    {
      label: "Ventas totales",
      value: formatPrice(Number(paidOrders._sum?.total ?? 0)),
      sub: `${paidOrders._count} pedidos pagados`,
      icon: TrendingUp,
      color: "text-green-700",
      bg: "bg-green-50",
    },
    {
      label: "Pedidos",
      value: String(totalOrders),
      sub: "Total histórico",
      icon: ShoppingCart,
      color: "text-blue-700",
      bg: "bg-blue-50",
    },
    {
      label: "Productos activos",
      value: String(totalProducts),
      sub: "En catálogo",
      icon: Package,
      color: "text-purple-700",
      bg: "bg-purple-50",
    },
    {
      label: "Alertas de stock",
      value: String(lowStockVariants.length),
      sub: "Variantes con poco stock",
      icon: AlertTriangle,
      color: lowStockVariants.length > 0 ? "text-amber-700" : "text-gray-500",
      bg: lowStockVariants.length > 0 ? "bg-amber-50" : "bg-gray-50",
    },
  ];

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="font-serif text-2xl font-light text-[var(--espresso)]">
          Dashboard
        </h1>
        <p className="text-sm text-[var(--brown)] mt-1">
          Resumen de tu tienda
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="bg-white rounded p-5 border border-[var(--border)]"
            >
              <div className={`inline-flex p-2 rounded ${stat.bg} mb-3`}>
                <Icon size={18} className={stat.color} />
              </div>
              <p className="text-2xl font-serif font-light text-[var(--espresso)]">
                {stat.value}
              </p>
              <p className="text-xs text-[var(--brown)] mt-0.5">{stat.label}</p>
              <p className="text-[10px] text-[var(--brown)] opacity-60 mt-0.5">
                {stat.sub}
              </p>
            </div>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Últimos pedidos */}
        <div className="lg:col-span-2 bg-white border border-[var(--border)] rounded">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
            <h2 className="font-serif text-base font-light text-[var(--espresso)]">
              Últimos pedidos
            </h2>
            <Link
              href="/admin/pedidos"
              className="text-xs text-[var(--camel)] hover:underline"
            >
              Ver todos →
            </Link>
          </div>

          {recentOrders.length === 0 ? (
            <div className="py-10 text-center text-sm text-[var(--brown)]">
              Sin pedidos aún
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  {["Pedido", "Cliente", "Total", "Estado", "Fecha"].map((h) => (
                    <th
                      key={h}
                      className="text-left px-5 py-3 text-[10px] uppercase tracking-[0.12em] text-[var(--brown)] font-normal"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order: { id: string; orderNumber: string; customerName: string; total: { toNumber?: () => number } | number | string; status: string; createdAt: Date }) => (
                  <tr
                    key={order.id}
                    className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--ivory)] transition-colors"
                  >
                    <td className="px-5 py-3">
                      <Link
                        href={`/admin/pedidos/${order.id}`}
                        className="font-medium text-[var(--camel)] hover:underline"
                      >
                        {order.orderNumber}
                      </Link>
                    </td>
                    <td className="px-5 py-3 text-[var(--espresso)]">
                      {order.customerName}
                    </td>
                    <td className="px-5 py-3 text-[var(--espresso)]">
                      {formatPrice(Number(order.total))}
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`text-[10px] uppercase tracking-wide px-2 py-0.5 rounded ${
                          ORDER_STATUS_COLORS[order.status] ?? "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {ORDER_STATUS_LABELS[order.status] ?? order.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-[var(--brown)]">
                      {formatDate(order.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Alertas de stock */}
        <div className="bg-white border border-[var(--border)] rounded">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
            <h2 className="font-serif text-base font-light text-[var(--espresso)]">
              Alertas de stock
            </h2>
            <Link
              href="/admin/inventario"
              className="text-xs text-[var(--camel)] hover:underline"
            >
              Ver inventario →
            </Link>
          </div>

          {lowStockVariants.length === 0 ? (
            <div className="py-10 text-center text-sm text-[var(--brown)]">
              Todo el stock en orden
            </div>
          ) : (
            <div className="divide-y divide-[var(--border)]">
              {lowStockVariants.map((v) => (
                <div key={v.id} className="px-5 py-3">
                  <p className="text-sm text-[var(--espresso)] font-medium">
                    {v.product.name}
                  </p>
                  <p className="text-xs text-[var(--brown)] capitalize mt-0.5">
                    {v.color} · {v.size}
                  </p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded font-medium ${
                        v.stock === 0
                          ? "bg-red-100 text-red-700"
                          : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {v.stock === 0 ? "Sin stock" : `${v.stock} unidades`}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
