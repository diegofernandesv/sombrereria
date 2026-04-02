import Link from "next/link";
import Image from "next/image";
import { formatPrice, PRODUCT_TYPE_LABELS } from "@/lib/utils";

interface ProductCardProps {
  id: string;
  name: string;
  slug: string;
  images: string[];
  type: string;
  minPrice: number;
  maxPrice: number;
  totalStock: number;
  variantCount: number;
}

export function ProductCard({
  name,
  slug,
  images,
  type,
  minPrice,
  maxPrice,
  totalStock,
}: ProductCardProps) {
  const isOutOfStock = totalStock === 0;

  return (
    <Link href={`/productos/${slug}`} className="group block">
      {/* Imagen */}
      <div className="relative aspect-[3/4] overflow-hidden bg-[var(--ivory-dark)] mb-4">
        {images[0] ? (
          <Image
            src={images[0]}
            alt={name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-103"
            sizes="(max-width: 768px) 50vw, 33vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="font-serif text-4xl text-[var(--border)]">S</span>
          </div>
        )}

        {/* Tag tipo */}
        <div className="absolute top-3 left-3">
          <span className="text-[10px] uppercase tracking-[0.15em] bg-[var(--white)] text-[var(--brown)] px-2 py-1">
            {PRODUCT_TYPE_LABELS[type] ?? type}
          </span>
        </div>

        {/* Sin stock */}
        {isOutOfStock && (
          <div className="absolute inset-0 bg-[var(--ivory)]/70 flex items-center justify-center">
            <span className="text-xs uppercase tracking-[0.15em] text-[var(--brown)]">
              Sin stock
            </span>
          </div>
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-[var(--espresso)]/0 group-hover:bg-[var(--espresso)]/5 transition-colors duration-300" />
      </div>

      {/* Info */}
      <div>
        <h3 className="font-serif text-lg font-light text-[var(--espresso)] leading-snug mb-1 group-hover:text-[var(--camel)] transition-colors">
          {name}
        </h3>
        <p className="text-sm text-[var(--brown)]">
          {minPrice === maxPrice
            ? formatPrice(minPrice)
            : `${formatPrice(minPrice)} — ${formatPrice(maxPrice)}`}
        </p>
      </div>
    </Link>
  );
}
