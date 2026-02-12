import { Link } from "wouter";
import { motion } from "framer-motion";
import { useMemo } from "react";
import { WishlistButton } from "./wishlist-button";
import { useAuth } from "@/context/auth-context";

interface ProductVariant {
  id: number;
  color: string;
  size: string;
  sku: string;
  stockQty: number;
  priceCents: number | null;
  active: boolean;
}

interface ProductImage {
  id: number;
  imageUrl: string;
  sortOrder: number;
}

interface ProductWithVariants {
  id: number;
  name: string;
  brand: string | null;
  basePriceCents: number | null;
  b2bPriceCents?: number | null;
  compareAtPriceCents?: number | null;
  active: boolean;
  variants?: ProductVariant[];
  images?: ProductImage[];
}

interface ProductCardProps {
  product: ProductWithVariants;
  isOutlet?: boolean;
}

// Neutral gray placeholder for products without images
const NO_IMAGE_PLACEHOLDER = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400' viewBox='0 0 400 400'%3E%3Crect fill='%23f3f4f6' width='400' height='400'/%3E%3Ctext x='200' y='200' text-anchor='middle' dominant-baseline='middle' font-family='system-ui' font-size='14' fill='%239ca3af'%3ENessuna immagine%3C/text%3E%3C/svg%3E";

export function ProductCard({ product, isOutlet }: ProductCardProps) {
  const { user } = useAuth();
  const isB2b = user?.isB2b && product.b2bPriceCents;

  const mainImage = useMemo(() => {
    if (product.images && product.images.length > 0) {
      return [...product.images].sort(
        (a, b) => a.sortOrder - b.sortOrder
      )[0].imageUrl;
    }
    return NO_IMAGE_PLACEHOLDER;
  }, [product.images]);

  const displayPrice = useMemo(() => {
    if (product.variants && product.variants.length > 0) {
      const prices = product.variants
        .filter(v => v.active && v.stockQty > 0)
        .map(v => v.priceCents ?? product.basePriceCents ?? 0)
        .filter(p => p > 0);

      if (prices.length > 0) return Math.min(...prices) / 100;
    }
    return (product.basePriceCents ?? 0) / 100;
  }, [product.variants, product.basePriceCents]);

  const hasDiscount = isOutlet && product.compareAtPriceCents && product.compareAtPriceCents > (product.basePriceCents || 0);
  const discountPercent = hasDiscount
    ? Math.round((1 - (product.basePriceCents || 0) / product.compareAtPriceCents!) * 100)
    : 0;

  const hasStock = useMemo(() => {
    if (!product.variants) return true;
    return product.variants.some(v => v.active && v.stockQty > 0);
  }, [product.variants]);

  const colorCount = useMemo(() => {
    if (!product.variants) return 0;
    return new Set(
      product.variants.filter(v => v.active).map(v => v.color)
    ).size;
  }, [product.variants]);

  return (
    <motion.div
      className="group flex flex-col"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      data-testid={`product-card-${product.id}`}
    >
      {/* IMMAGINE → SFONDO BIANCO con bordo nero */}
      <div className="relative aspect-[3/4] rounded-2xl bg-white overflow-hidden border border-gray-900">
        {!hasStock && (
          <span className="absolute top-2 left-2 z-10 bg-black text-white text-[10px] font-bold px-2 py-1 uppercase">
            Esaurito
          </span>
        )}
        {hasStock && hasDiscount && (
          <span className="absolute top-2 left-2 z-10 bg-red-600 text-white text-[10px] font-bold px-2 py-1 uppercase rounded">
            -{discountPercent}%
          </span>
        )}

        <div className="absolute top-2 right-2 z-10">
          <WishlistButton productId={product.id} size="sm" />
        </div>

        <Link href={`/product/${product.id}`}>
          <div className="h-full w-full p-4 flex items-center justify-center cursor-pointer">
            <motion.img
              src={mainImage}
              alt={product.name}
              className="h-full w-full object-contain transition-transform duration-500 group-hover:scale-105"
              onError={(e) => {
                const target = e.currentTarget;
                target.onerror = null;
                target.src = NO_IMAGE_PLACEHOLDER;
              }}
            />
          </div>
        </Link>
      </div>

      {/* TESTO → SFONDO BIANCO */}
      <div className="mt-3 flex flex-col gap-1">
        {product.brand && (
          <span className="text-xs uppercase tracking-wider text-gray-500">
            {product.brand}
          </span>
        )}

        <h3 className="text-sm font-semibold uppercase text-gray-900">
          {product.name}
        </h3>

        <div className="text-sm">
          <div className="flex items-center gap-1.5">
            {isB2b ? (
              <>
                <span className="text-gray-900 font-medium" data-testid={`text-b2b-price-${product.id}`}>
                  €{(product.b2bPriceCents! / 100).toFixed(2)}
                </span>
                <span className="text-xs text-gray-400 line-through">
                  €{displayPrice.toFixed(2)}
                </span>
                <span className="text-[10px] font-bold bg-black text-white px-1 py-0.5 rounded">
                  B2B
                </span>
              </>
            ) : hasDiscount ? (
              <>
                <span className="text-red-600 font-semibold" data-testid={`text-outlet-price-${product.id}`}>
                  da €{displayPrice.toFixed(2)}
                </span>
              </>
            ) : (
              <span className="text-gray-900 font-medium">
                €{displayPrice.toFixed(2)}
              </span>
            )}

            {!hasDiscount && colorCount > 0 && (
              <span className="text-xs text-gray-500 ml-auto">
                {colorCount} color{colorCount > 1 ? "i" : "e"}
              </span>
            )}
          </div>

          {hasDiscount && (
            <div className="mt-1 space-y-0.5">
              <p className="text-[11px] text-gray-500">
                Prezzo più basso degli ultimi 30 giorni: <span className="line-through">€{(product.compareAtPriceCents! / 100).toFixed(2)}</span>
              </p>
              <p className="text-xs font-bold text-red-600">
                Fino a -{discountPercent}%
              </p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}