import Link from "next/link";
import { LayoutDashboard, Package, BarChart3, ShoppingCart, LogOut } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s | Admin — La Sombrerería" },
};

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/productos", label: "Productos", icon: Package },
  { href: "/admin/inventario", label: "Inventario", icon: BarChart3 },
  { href: "/admin/pedidos", label: "Pedidos", icon: ShoppingCart },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#F8F5F0] flex">
      {/* Sidebar */}
      <aside className="w-56 shrink-0 bg-[var(--espresso)] flex flex-col">
        <div className="px-6 py-6 border-b border-[var(--espresso-mid)]">
          <Link href="/" className="block">
            <p className="font-serif text-lg text-[var(--ivory)] font-light">
              La Sombrerería
            </p>
            <p className="text-[10px] uppercase tracking-[0.15em] text-[var(--brown)] mt-0.5">
              Backoffice
            </p>
          </Link>
        </div>

        <nav className="flex-1 px-3 py-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 px-3 py-2.5 text-sm text-[var(--ivory-dark)] hover:text-[var(--ivory)] hover:bg-[var(--espresso-mid)] rounded transition-colors mb-0.5"
              >
                <Icon size={16} strokeWidth={1.5} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="px-3 py-4 border-t border-[var(--espresso-mid)]">
          <Link
            href="/api/auth/signout"
            className="flex items-center gap-3 px-3 py-2.5 text-sm text-[var(--brown)] hover:text-[var(--ivory)] transition-colors"
          >
            <LogOut size={16} strokeWidth={1.5} />
            Salir
          </Link>
        </div>
      </aside>

      {/* Contenido */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
