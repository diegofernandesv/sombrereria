"use client";

import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import Image from "next/image";
import { ArrowLeft, Minus, Plus, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { formatPrice, PRODUCT_TYPE_LABELS } from "@/lib/utils";
import { Button } from "@/components/ui/Button";

interface Variant {
  id: number;
  color: string;
  size: string;
  price: string;
  stock: number;
  sku: string;
}

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  images: string[];
  type: string;
  variants: Variant[];
}

export default function ProductPage() {
  const { slug } = useParams<{ slug: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedColor, setSelectedColor] = useState<string>("");
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    fetch(`/api/products/${slug}`)
      .then((r) => r.json())
      .then((data) => {
        setProduct(data);
        if (data.variants?.length > 0) {
          setSelectedColor(data.variants[0].color);
          setSelectedSize(data.variants[0].size);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-5 md:px-8 py-14">
        <div className="grid md:grid-cols-2 gap-12 animate-pulse">
          <div className="aspect-[3/4] bg-[var(--ivory-dark)]" />
          <div className="space-y-4 pt-4">
            <div className="h-8 bg-[var(--ivory-dark)] w-2/3" />
            <div className="h-5 bg-[var(--ivory-dark)] w-1/4" />
            <div className="h-32 bg-[var(--ivory-dark)] mt-8" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-5 md:px-8 py-20 text-center">
        <p className="font-serif text-2xl text-[var(--brown)] font-light">
          Producto no encontrado
        </p>
        <Link href="/productos" className="text-sm text-[var(--camel)] mt-4 inline-block">
          ← Ver catálogo
        </Link>
      </div>
    );
  }

  const colors = [...new Set(product.variants.map((v) => v.color))];
  const sizesForColor = [
    ...new Set(
      product.variants
        .filter((v) => !selectedColor || v.color === selectedColor)
        .map((v) => v.size)
    ),
  ];

  const selectedVariant = product.variants.find(
    (v) => v.color === selectedColor && v.size === selectedSize
  );

  const inStock = (selectedVariant?.stock ?? 0) > 0;

  async function handleAddToCart() {
    if (!selectedVariant) return;
    setAdding(true);
    try {
      await fetch("/api/cart/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ variantId: selectedVariant.id, quantity }),
      });
      setAdded(true);
      setTimeout(() => setAdded(false), 2500);
    } catch {
      // error silencioso
    } finally {
      setAdding(false);
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-5 md:px-8 py-10 md:py-14">
      {/* Breadcrumb */}
      <Link
        href="/productos"
        className="inline-flex items-center gap-2 text-sm text-[var(--brown)] hover:text-[var(--espresso)] mb-8 transition-colors"
      >
        <ArrowLeft size={14} />
        Volver al catálogo
      </Link>

      <div className="grid md:grid-cols-2 gap-10 md:gap-16 lg:gap-24">
        {/* Galería */}
        <div className="space-y-3">
          <div className="relative aspect-[3/4] bg-[var(--ivory-dark)] overflow-hidden">
            {product.images[activeImage] ? (
              <Image
                src={product.images[activeImage]}
                alt={product.name}
                fill
                className="object-cover"
                priority
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="font-serif text-8xl text-[var(--border)]">S</span>
              </div>
            )}
          </div>

          {product.images.length > 1 && (
            <div className="flex gap-2">
              {product.images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImage(i)}
                  className={`relative w-16 h-16 shrink-0 overflow-hidden transition-all ${
                    activeImage === i
                      ? "ring-1 ring-[var(--camel)]"
                      : "opacity-60 hover:opacity-100"
                  }`}
                >
                  <Image src={img} alt="" fill className="object-cover" sizes="64px" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex flex-col">
          <div className="mb-2">
            <span className="text-[10px] uppercase tracking-[0.2em] text-[var(--brown)]">
              {PRODUCT_TYPE_LABELS[product.type] ?? product.type}
            </span>
          </div>

          <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl font-light text-[var(--espresso)] leading-tight mb-4">
            {product.name}
          </h1>

          <p className="font-serif text-2xl text-[var(--espresso)] mb-6">
            {selectedVariant
              ? formatPrice(Number(selectedVariant.price))
              : "—"}
          </p>

          <p className="text-sm text-[var(--brown)] leading-relaxed mb-8">
            {product.description}
          </p>

          <hr className="border-[var(--border)] mb-8" />

          {/* Selector color */}
          <div className="mb-6">
            <p className="text-xs uppercase tracking-[0.15em] text-[var(--brown)] mb-3">
              Color · <span className="capitalize normal-case font-medium text-[var(--espresso)]">{selectedColor}</span>
            </p>
            <div className="flex gap-2 flex-wrap">
              {colors.map((c) => (
                <button
                  key={c}
                  onClick={() => {
                    setSelectedColor(c);
                    // reset size if not available
                    const available = product.variants
                      .filter((v) => v.color === c)
                      .map((v) => v.size);
                    if (!available.includes(selectedSize)) {
                      setSelectedSize(available[0] ?? "");
                    }
                  }}
                  className={`text-sm px-4 py-2 capitalize border transition-all ${
                    selectedColor === c
                      ? "border-[var(--espresso)] bg-[var(--espresso)] text-[var(--ivory)]"
                      : "border-[var(--border)] text-[var(--brown)] hover:border-[var(--espresso)]"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Selector talla */}
          <div className="mb-8">
            <p className="text-xs uppercase tracking-[0.15em] text-[var(--brown)] mb-3">
              Talla
            </p>
            <div className="flex gap-2 flex-wrap">
              {sizesForColor.map((s) => {
                const variant = product.variants.find(
                  (v) => v.color === selectedColor && v.size === s
                );
                const available = (variant?.stock ?? 0) > 0;
                return (
                  <button
                    key={s}
                    onClick={() => available && setSelectedSize(s)}
                    disabled={!available}
                    className={`text-sm px-4 py-2 border transition-all relative ${
                      selectedSize === s
                        ? "border-[var(--espresso)] bg-[var(--espresso)] text-[var(--ivory)]"
                        : available
                        ? "border-[var(--border)] text-[var(--brown)] hover:border-[var(--espresso)]"
                        : "border-[var(--border)] text-[var(--border)] cursor-not-allowed line-through"
                    }`}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Cantidad */}
          <div className="flex items-center gap-4 mb-8">
            <p className="text-xs uppercase tracking-[0.15em] text-[var(--brown)]">
              Cantidad
            </p>
            <div className="flex items-center border border-[var(--border)]">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-9 h-9 flex items-center justify-center text-[var(--brown)] hover:text-[var(--espresso)] transition-colors"
              >
                <Minus size={14} />
              </button>
              <span className="w-10 text-center text-sm font-medium text-[var(--espresso)]">
                {quantity}
              </span>
              <button
                onClick={() =>
                  setQuantity(
                    Math.min(selectedVariant?.stock ?? 1, quantity + 1)
                  )
                }
                className="w-9 h-9 flex items-center justify-center text-[var(--brown)] hover:text-[var(--espresso)] transition-colors"
              >
                <Plus size={14} />
              </button>
            </div>
            {selectedVariant && selectedVariant.stock <= 3 && selectedVariant.stock > 0 && (
              <span className="text-xs text-amber-700">
                Últimas {selectedVariant.stock} unidades
              </span>
            )}
          </div>

          {/* Botón agregar */}
          <Button
            size="lg"
            onClick={handleAddToCart}
            disabled={!inStock || !selectedVariant}
            loading={adding}
            className="w-full"
          >
            {added ? (
              "¡Agregado al carrito!"
            ) : inStock ? (
              <>
                <ShoppingBag size={16} />
                Agregar al carrito
              </>
            ) : (
              "Sin stock"
            )}
          </Button>

          {selectedVariant && (
            <p className="text-xs text-[var(--brown)] mt-3 text-center">
              SKU: {selectedVariant.sku}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
