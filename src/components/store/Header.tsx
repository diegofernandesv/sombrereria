"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShoppingBag, Menu, X } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface HeaderProps {
  cartCount?: number;
}

export function Header({ cartCount = 0 }: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  const navLinks = [
    { href: "/productos", label: "Catálogo" },
    { href: "/productos?tipo=PANAMA", label: "Panamá" },
    { href: "/productos?tipo=FEDORA", label: "Fedora" },
    { href: "/productos?tipo=BUCKET", label: "Bucket" },
  ];

  return (
    <>
      <header className="sticky top-0 z-50 bg-[var(--ivory)] border-b border-[var(--border)]">
        <div className="max-w-7xl mx-auto px-5 md:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Logo */}
            <Link href="/" className="flex flex-col leading-none">
              <span className="font-serif text-2xl md:text-3xl font-light tracking-wide text-[var(--espresso)]">
                La Sombrerería
              </span>
              <span className="text-[10px] uppercase tracking-[0.2em] text-[var(--brown)] hidden md:block">
                Artesanal · Buenos Aires
              </span>
            </Link>

            {/* Nav desktop */}
            <nav className="hidden md:flex items-center gap-8">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "text-sm tracking-wide transition-colors",
                    pathname === link.href
                      ? "text-[var(--camel)] font-medium"
                      : "text-[var(--brown)] hover:text-[var(--espresso)]"
                  )}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Acciones */}
            <div className="flex items-center gap-4">
              <Link
                href="/carrito"
                className="relative p-1.5 text-[var(--espresso)] hover:text-[var(--camel)] transition-colors"
                aria-label="Carrito"
              >
                <ShoppingBag size={22} strokeWidth={1.5} />
                {cartCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-[var(--camel)] text-[var(--white)] text-[10px] font-medium flex items-center justify-center rounded-full">
                    {cartCount > 9 ? "9+" : cartCount}
                  </span>
                )}
              </Link>

              {/* Menú mobile */}
              <button
                className="md:hidden p-1.5 text-[var(--espresso)]"
                onClick={() => setMenuOpen(!menuOpen)}
                aria-label="Menú"
              >
                {menuOpen ? <X size={22} strokeWidth={1.5} /> : <Menu size={22} strokeWidth={1.5} />}
              </button>
            </div>
          </div>
        </div>

        {/* Nav mobile */}
        {menuOpen && (
          <div className="md:hidden border-t border-[var(--border)] bg-[var(--white)] animate-fade-in">
            <nav className="max-w-7xl mx-auto px-5 py-4 flex flex-col gap-3">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className="text-[var(--brown)] hover:text-[var(--espresso)] py-1 text-base"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
        )}
      </header>
    </>
  );
}
