import { Link } from "wouter";
import { Product } from "@/lib/data";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useCart } from "@/context/cart-context";
import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ShoppingBag } from "lucide-react";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { addToCart } = useCart();
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [isHovered, setIsHovered] = useState(false);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!selectedSize) {
      // Just shake or prompt (handled by disabled button state logic usually, or toast)
      // For this card, let's auto-select first size if clicked without selection or just force user to enter details
      // Better UX: Show quick add overlay
      return;
    }
    addToCart(product, selectedSize);
    setSelectedSize(""); // Reset
  };

  return (
    <motion.div 
      className="group relative flex flex-col"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative aspect-[3/4] overflow-hidden bg-neutral-100">
        {/* Badges */}
        <div className="absolute top-2 left-2 z-10 flex flex-col gap-1">
          {product.isOutlet && (
            <span className="bg-red-600 text-white text-[10px] font-bold px-2 py-1 uppercase tracking-wider">
              Sale
            </span>
          )}
          {product.isNewSeason && (
            <span className="bg-black text-white text-[10px] font-bold px-2 py-1 uppercase tracking-wider">
              New
            </span>
          )}
        </div>

        <Link href={`/shop?id=${product.id}`}> {/* Linking to shop for now, ideally product detail */}
          <div className="h-full w-full cursor-pointer">
            <motion.img
              src={product.image}
              alt={product.name}
              className="h-full w-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
            />
          </div>
        </Link>
        
        {/* Quick Add Overlay */}
        <div className={`absolute bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm p-4 translate-y-full transition-transform duration-300 ease-in-out ${isHovered ? 'translate-y-0' : ''}`}>
          <div className="flex gap-2">
            <Select value={selectedSize} onValueChange={setSelectedSize}>
              <SelectTrigger className="h-9 bg-transparent border-gray-300 rounded-none text-xs">
                <SelectValue placeholder="Taglia" />
              </SelectTrigger>
              <SelectContent>
                {product.sizes.map(size => (
                  <SelectItem key={size} value={size}>{size}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button 
              size="sm" 
              className="h-9 bg-black text-white hover:bg-neutral-800 rounded-none disabled:opacity-50"
              disabled={!selectedSize}
              onClick={handleAddToCart}
            >
              <ShoppingBag className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-1">
        <h3 className="text-sm font-medium uppercase tracking-wide text-white group-hover:text-gray-300 transition-colors">
          {product.name}
        </h3>
        <div className="flex items-center gap-2 text-sm">
          {product.originalPrice && (
             <span className="text-gray-500 line-through">€{product.originalPrice.toFixed(2)}</span>
          )}
          <span className={product.isOutlet ? "text-red-500 font-bold" : "text-gray-200"}>
            €{product.price.toFixed(2)}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
