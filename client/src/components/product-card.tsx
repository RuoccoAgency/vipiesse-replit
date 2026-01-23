import { Link } from "wouter";
import { motion } from "framer-motion";
import { useState, useMemo } from "react";

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
  const [isHovered, setIsHovered] = useState(false);

  // Get first image or placeholder
  const mainImage = useMemo(() => {
    if (product.images && product.images.length > 0) {
      const sorted = [...product.images].sort((a, b) => a.sortOrder - b.sortOrder);
      return sorted[0].imageUrl;
    }
    return '/placeholder.jpg';
  }, [product.images]);

  // Get price to display (lowest variant price or base price)
  const displayPrice = useMemo(() => {
    if (product.variants && product.variants.length > 0) {
      const prices = product.variants
        .filter(v => v.active && v.stockQty > 0)
        .map(v => v.priceCents || product.basePriceCents || 0)
        .filter(p => p > 0);
      if (prices.length > 0) {
        return Math.min(...prices) / 100;
      }
    }
    return (product.basePriceCents || 0) / 100;
  }, [product.variants, product.basePriceCents]);

  // Check if product has variants in stock
  const hasStock = useMemo(() => {
    if (!product.variants) return true;
    return product.variants.some(v => v.active && v.stockQty > 0);
  }, [product.variants]);

  // Get unique colors count
  const colorCount = useMemo(() => {
    if (!product.variants) return 0;
    const colors = new Set(product.variants.filter(v => v.active).map(v => v.color));
    return colors.size;
  }, [product.variants]);

  return (
    <motion.div 
      className="group relative flex flex-col"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      data-testid={`product-card-${product.id}`}
    >
      <div className="relative aspect-[3/4] overflow-hidden bg-neutral-900 rounded-lg">
        {!hasStock && (
          <div className="absolute top-2 left-2 z-10">
            <span className="bg-neutral-600 text-white text-[10px] font-bold px-2 py-1 uppercase tracking-wider">
              Esaurito
            </span>
          </div>
        )}

        <Link href={`/product/${product.id}`}>
          <div className="h-full w-full cursor-pointer p-4 flex items-center justify-center">
            <motion.img
              src={mainImage}
              alt={product.name}
              className="h-full w-full object-contain transition-transform duration-700 group-hover:scale-105"
            />
          </div>
        </Link>
      </div>

      <div className="mt-4 flex flex-col gap-1">
        {product.brand && (
          <span className="text-xs text-neutral-500 uppercase tracking-wider">{product.brand}</span>
        )}
        <h3 className="text-sm font-medium uppercase tracking-wide text-white group-hover:text-gray-300 transition-colors">
          {product.name}
        </h3>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-200 font-medium">
            €{displayPrice.toFixed(2)}
          </span>
          {colorCount > 0 && (
            <span className="text-xs text-neutral-500">
              {colorCount} color{colorCount > 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
