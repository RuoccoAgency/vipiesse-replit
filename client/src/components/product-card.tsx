import { Link } from "wouter";
import { motion } from "framer-motion";
import { useMemo } from "react";

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
  active: boolean;
  variants?: ProductVariant[];
  images?: ProductImage[];
}

interface ProductCardProps {
  product: ProductWithVariants;
}

export function ProductCard({ product }: ProductCardProps) {
  const mainImage = useMemo(() => {
    if (product.images && product.images.length > 0) {
      return [...product.images].sort(
        (a, b) => a.sortOrder - b.sortOrder
      )[0].imageUrl;
    }
    return "/placeholder.jpg";
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

        <Link href={`/product/${product.id}`}>
          <div className="h-full w-full p-4 flex items-center justify-center cursor-pointer">
            <motion.img
              src={mainImage}
              alt={product.name}
              className="h-full w-full object-contain transition-transform duration-500 group-hover:scale-105"
              onError={(e) => {
                const target = e.currentTarget;
                target.onerror = null;
                target.src = "/placeholder.jpg";
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

        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-900 font-medium">
            €{displayPrice.toFixed(2)}
          </span>

          {colorCount > 0 && (
            <span className="text-xs text-gray-500">
              {colorCount} color{colorCount > 1 ? "i" : "e"}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}