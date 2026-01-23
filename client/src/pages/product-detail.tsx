import { useRoute } from "wouter";
import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/context/cart-context";
import { Minus, Plus } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import NotFound from "./not-found";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { fetchProductById } from "@/lib/api";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface ProductVariant {
  id: number;
  productId: number;
  color: string;
  size: string;
  sku: string;
  stockQty: number;
  priceCents: number | null;
  active: boolean;
}

interface ProductImage {
  id: number;
  productId: number;
  imageUrl: string;
  sortOrder: number;
}

interface ProductWithVariants {
  id: number;
  name: string;
  brand: string | null;
  description: string | null;
  basePriceCents: number | null;
  active: boolean;
  variants: ProductVariant[];
  images: ProductImage[];
}

export function ProductDetail() {
  const [, params] = useRoute("/product/:id");
  const { data: product, isLoading } = useQuery<ProductWithVariants>({
    queryKey: ['product', params?.id],
    queryFn: () => fetchProductById(params!.id),
    enabled: !!params?.id,
  });
  const { addToCart } = useCart();
  const { toast } = useToast();

  const [selectedColor, setSelectedColor] = useState<string>("");
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState<string>("");

  // Get unique colors from variants
  const availableColors = useMemo(() => {
    if (!product?.variants) return [];
    const colorSet = new Set(product.variants.filter(v => v.active).map(v => v.color));
    return Array.from(colorSet).sort();
  }, [product?.variants]);

  // Get available sizes for selected color
  const availableSizes = useMemo(() => {
    if (!product?.variants || !selectedColor) return [];
    const sizes = product.variants
      .filter(v => v.color === selectedColor && v.active && v.stockQty > 0)
      .map(v => v.size);
    return Array.from(new Set(sizes)).sort((a, b) => {
      const numA = parseInt(a);
      const numB = parseInt(b);
      if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
      return a.localeCompare(b);
    });
  }, [product?.variants, selectedColor]);

  // Get the selected variant
  const selectedVariant = useMemo(() => {
    if (!product?.variants || !selectedColor || !selectedSize) return null;
    return product.variants.find(v => v.color === selectedColor && v.size === selectedSize);
  }, [product?.variants, selectedColor, selectedSize]);

  // Get gallery images
  const galleryImages = useMemo(() => {
    if (!product?.images || product.images.length === 0) {
      return ['/placeholder.jpg'];
    }
    return product.images.sort((a, b) => a.sortOrder - b.sortOrder).map(img => img.imageUrl);
  }, [product?.images]);

  // Get display price
  const displayPrice = useMemo(() => {
    if (selectedVariant?.priceCents) {
      return selectedVariant.priceCents / 100;
    }
    if (product?.basePriceCents) {
      return product.basePriceCents / 100;
    }
    return 0;
  }, [selectedVariant, product?.basePriceCents]);

  // Get stock status
  const stockStatus = useMemo(() => {
    if (!selectedVariant) return { inStock: false, qty: 0 };
    return { inStock: selectedVariant.stockQty > 0, qty: selectedVariant.stockQty };
  }, [selectedVariant]);

  // Initialize selections
  useEffect(() => {
    if (product && availableColors.length > 0 && !selectedColor) {
      setSelectedColor(availableColors[0]);
    }
  }, [product, availableColors, selectedColor]);

  useEffect(() => {
    if (galleryImages.length > 0 && !activeImage) {
      setActiveImage(galleryImages[0]);
    }
  }, [galleryImages, activeImage]);

  // Reset size when color changes
  useEffect(() => {
    setSelectedSize("");
  }, [selectedColor]);

  if (isLoading) {
    return (
      <div className="bg-black min-h-screen pt-24 text-white flex items-center justify-center">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  if (!product) return <NotFound />;

  const handleAddToCart = () => {
    if (!selectedColor) {
      toast({
        title: "Color required",
        description: "Please select a color to proceed.",
        variant: "destructive"
      });
      return;
    }

    if (!selectedSize) {
      toast({
        title: "Size required",
        description: "Please select a size to proceed.",
        variant: "destructive"
      });
      return;
    }

    if (!selectedVariant) {
      toast({
        title: "Selection invalid",
        description: "Please select a valid color and size combination.",
        variant: "destructive"
      });
      return;
    }

    if (!stockStatus.inStock) {
      toast({
        title: "Out of stock",
        description: "This variant is currently out of stock.",
        variant: "destructive"
      });
      return;
    }

    // Add to cart with variant info
    for (let i = 0; i < quantity; i++) {
      addToCart({
        id: product.id.toString(),
        variantId: selectedVariant.id,
        name: product.name,
        brand: product.brand || '',
        price: displayPrice,
        image: galleryImages[0] || '/placeholder.jpg',
        color: selectedColor,
        size: selectedSize,
        sku: selectedVariant.sku
      }, selectedSize);
    }

    toast({
      title: "Added to cart",
      description: `${product.name} (${selectedColor}, ${selectedSize}) has been added to your cart.`,
    });
  };

  return (
    <div className="bg-black min-h-screen pt-24 text-white font-sans">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* LEFT COLUMN: Main Image + Thumbnails */}
          <div className="lg:col-span-7 space-y-6">
            <div className="w-full bg-black rounded-lg overflow-hidden border border-white/10 p-8 flex items-center justify-center aspect-[4/3] relative">
              <motion.img
                key={activeImage}
                src={activeImage}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2 }}
                alt={product.name}
                className="w-full h-full object-contain max-h-[70vh]"
              />
            </div>

            {galleryImages.length > 1 && (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
                {galleryImages.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImage(img)}
                    className={cn(
                      "relative w-full aspect-square border rounded-md overflow-hidden transition-all bg-black p-2 flex items-center justify-center",
                      activeImage === img ? "border-white ring-1 ring-white" : "border-white/20 hover:border-white/40"
                    )}
                  >
                    <img 
                      src={img} 
                      alt={`View ${idx}`} 
                      className="w-full h-full object-contain" 
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: Product Info */}
          <div className="lg:col-span-5 space-y-8">
            <div>
              {product.brand && (
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">{product.brand}</span>
                </div>
              )}
              
              <h1 className="text-2xl md:text-3xl font-medium text-white leading-tight mb-4">
                {product.name}
              </h1>
              
              <div className="flex items-baseline gap-3 pb-6 border-b border-white/10">
                <span className="text-2xl font-bold text-white">
                  €{displayPrice.toFixed(2)}
                </span>
              </div>
              
              {selectedVariant && (
                <div className={cn(
                  "mt-4 flex items-center gap-2 text-sm font-medium",
                  stockStatus.inStock ? "text-green-400" : "text-red-400"
                )}>
                  <div className={cn(
                    "w-2 h-2 rounded-full",
                    stockStatus.inStock ? "bg-green-500" : "bg-red-500"
                  )} />
                  {stockStatus.inStock ? `In Stock (${stockStatus.qty} available)` : "Out of Stock"}
                </div>
              )}
            </div>

            {/* Selectors */}
            <div className="space-y-6">
              {/* Colors */}
              {availableColors.length > 0 && (
                <div className="space-y-3">
                  <span className="text-sm font-bold text-white flex items-center gap-2">
                    Color: <span className="font-normal text-neutral-400">{selectedColor || 'Select'}</span>
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {availableColors.map((color) => (
                      <button
                        key={color}
                        onClick={() => setSelectedColor(color)}
                        data-testid={`color-${color.toLowerCase()}`}
                        className={cn(
                          "px-4 py-2 border rounded-full text-sm font-medium transition-all min-w-[3rem]",
                          selectedColor === color 
                            ? "border-white bg-white text-black shadow-sm" 
                            : "border-white/20 hover:border-white/40 text-neutral-300 bg-black"
                        )}
                      >
                        {color}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Sizes */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-white flex items-center gap-2">
                    Size: <span className="font-normal text-neutral-400">{selectedSize || 'Select'}</span>
                  </span>
                  <button className="text-xs underline text-neutral-400 hover:text-white">Size Guide</button>
                </div>
                {availableSizes.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {availableSizes.map((size) => (
                      <button
                        key={size}
                        onClick={() => setSelectedSize(size)}
                        data-testid={`size-${size}`}
                        className={cn(
                          "min-w-[3.5rem] h-10 px-2 flex items-center justify-center border rounded-full text-sm font-medium transition-all",
                          selectedSize === size 
                            ? "border-white bg-white text-black shadow-sm" 
                            : "border-white/20 hover:border-white/40 text-neutral-300 bg-black"
                        )}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                ) : selectedColor ? (
                  <p className="text-sm text-neutral-500">No sizes available for this color</p>
                ) : (
                  <p className="text-sm text-neutral-500">Select a color to see available sizes</p>
                )}
              </div>

              {/* Quantity + Add */}
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <div className="flex items-center border border-white/20 rounded-md w-fit bg-black h-12">
                  <button 
                    className="px-3 h-full hover:bg-white/10 transition-colors disabled:opacity-30 text-neutral-400 hover:text-white"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                    data-testid="quantity-decrease"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="w-10 text-center font-bold text-white text-sm" data-testid="quantity-value">{quantity}</span>
                  <button 
                    className="px-3 h-full hover:bg-white/10 transition-colors text-neutral-400 hover:text-white"
                    onClick={() => setQuantity(Math.min(stockStatus.qty || 99, quantity + 1))}
                    disabled={quantity >= (stockStatus.qty || 99)}
                    data-testid="quantity-increase"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>

                <Button 
                  className="flex-1 h-12 text-sm font-bold uppercase tracking-wider bg-white text-black hover:bg-neutral-200 rounded-md shadow-md transition-all disabled:opacity-50"
                  disabled={!selectedColor || !selectedSize || !stockStatus.inStock}
                  onClick={handleAddToCart}
                  data-testid="add-to-cart-button"
                >
                  {stockStatus.inStock ? 'ADD TO CART' : 'OUT OF STOCK'}
                </Button>
              </div>
            </div>

            {/* Details Accordion */}
            <div className="pt-6">
              <Accordion type="single" collapsible className="w-full border-t border-white/10">
                <AccordionItem value="description" className="border-b border-white/10">
                  <AccordionTrigger className="text-sm font-bold text-white hover:no-underline hover:text-neutral-300 py-4">
                    Product Description
                  </AccordionTrigger>
                  <AccordionContent className="text-neutral-400 leading-relaxed text-sm whitespace-pre-line pb-6">
                    {product.description || 'No description available.'}
                    {selectedVariant && (
                      <div className="mt-4 pt-4 border-t border-white/10 grid grid-cols-2 gap-4 text-xs uppercase tracking-wider text-neutral-500">
                        <div>SKU: <span className="text-white font-bold block mt-1">{selectedVariant.sku}</span></div>
                        <div>Brand: <span className="text-white font-bold block mt-1">{product.brand || 'N/A'}</span></div>
                      </div>
                    )}
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="shipping" className="border-b border-white/10">
                  <AccordionTrigger className="text-sm font-bold text-white hover:no-underline hover:text-neutral-300 py-4">
                    Shipping & Returns
                  </AccordionTrigger>
                  <AccordionContent className="text-neutral-400 leading-relaxed text-sm pb-6">
                    Free shipping on orders over €50. Free returns within 30 days.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
