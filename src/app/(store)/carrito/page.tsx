"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Trash2, ArrowLeft, ArrowRight } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/Button";

interface CartItem {
  id: string;
  quantity: number;
  variant: {
    id: number;
    color: string;
    size: string;
    price: string;
    stock: number;
    product: {
      name: string;
      slug: string;
      images: string[];
    };
  };
}

interface Cart {
  id: string;
  items: CartItem[];
}

export default function CartPage() {
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    fetchCart();
  }, []);

  async function fetchCart() {
    try {
      const res = await fetch("/api/cart");
      const data = await res.json();
      setCart(data);
    } catch {
      setCart(null);
    } finally {
      setLoading(false);
    }
  }

  async function updateQuantity(itemId: string, newQty: number) {
    setUpdatingId(itemId);
    try {
      if (newQty <= 0) {
        await fetch(`/api/cart/items/${itemId}`, { method: "DELETE" });
      } else {
        await fetch(`/api/cart/items/${itemId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ quantity: newQty }),
        });
      }
      await fetchCart();
    } catch {
      // error
    } finally {
      setUpdatingId(null);
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-5 md:px-8 py-14 animate-pulse">
        <div className="h-10 bg-[var(--ivory-dark)] w-48 mb-10" />
        {[1, 2].map((i) => (
          <div key={i} className="flex gap-4 mb-6">
            <div className="w-20 h-24 bg-[var(--ivory-dark)]" />
            <div className="flex-1 space-y-2">
              <div className="h-5 bg-[var(--ivory-dark)] w-2/3" />
              <div className="h-4 bg-[var(--ivory-dark)] w-1/3" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  const items = cart?.items ?? [];
  const subtotal = items.reduce(
    (sum, item) => sum + Number(item.variant.price) * item.quantity,
    0
  );

  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-5 md:px-8 py-20 text-center">
        <p className="font-serif text-3xl font-light text-[var(--espresso)] mb-3">
          Tu carrito está vacío
        </p>
        <p className="text-sm text-[var(--brown)] mb-8">
          Explorá nuestra colección y encontrá tu sombrero ideal.
        </p>
        <Link
          href="/productos"
          className="inline-flex items-center gap-2 text-sm text-[var(--espresso)] border border-[var(--espresso)] px-6 py-3 hover:bg-[var(--espresso)] hover:text-[var(--ivory)] transition-colors"
        >
          <ArrowLeft size={14} />
          Ver catálogo
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-5 md:px-8 py-10 md:py-14">
      <Link
        href="/productos"
        className="inline-flex items-center gap-2 text-sm text-[var(--brown)] hover:text-[var(--espresso)] mb-8 transition-colors"
      >
        <ArrowLeft size={14} />
        Seguir comprando
      </Link>

      <h1 className="font-serif text-3xl md:text-4xl font-light text-[var(--espresso)] mb-10">
        Carrito ({items.length} {items.length === 1 ? "artículo" : "artículos"})
      </h1>

      <div className="grid md:grid-cols-3 gap-10 md:gap-16">
        {/* Items */}
        <div className="md:col-span-2 space-y-6">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex gap-4 md:gap-6 pb-6 border-b border-[var(--border)]"
            >
              {/* Imagen */}
              <Link
                href={`/productos/${item.variant.product.slug}`}
                className="shrink-0"
              >
                <div className="relative w-20 h-24 md:w-24 md:h-28 bg-[var(--ivory-dark)] overflow-hidden">
                  {item.variant.product.images[0] ? (
                    <Image
                      src={item.variant.product.images[0]}
                      alt={item.variant.product.name}
                      fill
                      className="object-cover"
                      sizes="96px"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="font-serif text-2xl text-[var(--border)]">S</span>
                    </div>
                  )}
                </div>
              </Link>

              {/* Detalles */}
              <div className="flex-1 min-w-0">
                <Link href={`/productos/${item.variant.product.slug}`}>
                  <h3 className="font-serif text-lg font-light text-[var(--espresso)] hover:text-[var(--camel)] transition-colors leading-tight">
                    {item.variant.product.name}
                  </h3>
                </Link>
                <p className="text-xs text-[var(--brown)] mt-1 capitalize">
                  {item.variant.color} · {item.variant.size}
                </p>
                <p className="text-sm font-medium text-[var(--espresso)] mt-2">
                  {formatPrice(Number(item.variant.price))}
                </p>

                {/* Controles cantidad */}
                <div className="flex items-center gap-3 mt-3">
                  <div className="flex items-center border border-[var(--border)]">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      disabled={updatingId === item.id}
                      className="w-7 h-7 flex items-center justify-center text-[var(--brown)] hover:text-[var(--espresso)] text-base"
                    >
                      −
                    </button>
                    <span className="w-8 text-center text-sm">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      disabled={
                        updatingId === item.id ||
                        item.quantity >= item.variant.stock
                      }
                      className="w-7 h-7 flex items-center justify-center text-[var(--brown)] hover:text-[var(--espresso)] text-base"
                    >
                      +
                    </button>
                  </div>

                  <button
                    onClick={() => updateQuantity(item.id, 0)}
                    disabled={updatingId === item.id}
                    className="p-1 text-[var(--brown)] hover:text-red-600 transition-colors"
                    aria-label="Eliminar"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {/* Subtotal */}
              <div className="text-right shrink-0">
                <p className="font-medium text-[var(--espresso)]">
                  {formatPrice(Number(item.variant.price) * item.quantity)}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Resumen */}
        <div>
          <div className="bg-[var(--ivory-dark)] p-6 md:p-8 sticky top-24">
            <h2 className="font-serif text-xl font-light text-[var(--espresso)] mb-6">
              Resumen
            </h2>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-[var(--brown)]">Subtotal</span>
                <span className="text-[var(--espresso)]">{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[var(--brown)]">Envío</span>
                <span className="text-[var(--brown)]">Se calcula al checkout</span>
              </div>
            </div>

            <div className="border-t border-[var(--border)] pt-4 mb-6">
              <div className="flex justify-between">
                <span className="font-medium text-[var(--espresso)]">Total estimado</span>
                <span className="font-serif text-xl text-[var(--espresso)]">
                  {formatPrice(subtotal)}
                </span>
              </div>
            </div>

            <Link href="/checkout">
              <Button size="lg" className="w-full">
                Finalizar compra
                <ArrowRight size={16} />
              </Button>
            </Link>

            <p className="text-[10px] text-[var(--brown)] text-center mt-3">
              Pago seguro con MercadoPago
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
