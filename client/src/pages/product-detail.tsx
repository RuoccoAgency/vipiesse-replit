import { useRoute, Link } from "wouter";
import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/context/cart-context";
import { Minus, Plus, Heart } from "lucide-react";
import { WishlistButton } from "@/components/wishlist-button";
import { ProductReviews } from "@/components/product-reviews";
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
    queryKey: ["product", params?.id],
    queryFn: () => fetchProductById(params!.id),
    enabled: !!params?.id,
  });
  const { addToCart } = useCart();
  const { toast } = useToast();

  const [selectedColor, setSelectedColor] = useState<string>("");
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState<string>("");

  const availableColors = useMemo(() => {
    if (!product?.variants) return [];
    const colorSet = new Set(product.variants.filter(v => v.active).map(v => v.color));
    return Array.from(colorSet).sort();
  }, [product?.variants]);

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

  const selectedVariant = useMemo(() => {
    if (!product?.variants || !selectedColor || !selectedSize) return null;
    return product.variants.find(v => v.color === selectedColor && v.size === selectedSize) || null;
  }, [product?.variants, selectedColor, selectedSize]);

  const galleryImages = useMemo(() => {
    // Neutral gray placeholder for products without images
    const NO_IMAGE_PLACEHOLDER = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400' viewBox='0 0 400 400'%3E%3Crect fill='%23f3f4f6' width='400' height='400'/%3E%3Ctext x='200' y='200' text-anchor='middle' dominant-baseline='middle' font-family='system-ui' font-size='14' fill='%239ca3af'%3ENessuna immagine%3C/text%3E%3C/svg%3E";
    if (!product?.images || product.images.length === 0) return [NO_IMAGE_PLACEHOLDER];
    return product.images
      .slice()
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map(img => img.imageUrl);
  }, [product?.images]);

  const displayPrice = useMemo(() => {
    if (selectedVariant?.priceCents) return selectedVariant.priceCents / 100;
    if (product?.basePriceCents) return product.basePriceCents / 100;
    return 0;
  }, [selectedVariant, product?.basePriceCents]);

  const stockStatus = useMemo(() => {
    if (!selectedVariant) return { inStock: false, qty: 0 };
    return { inStock: selectedVariant.stockQty > 0, qty: selectedVariant.stockQty };
  }, [selectedVariant]);

  useEffect(() => {
    if (product && availableColors.length > 0 && !selectedColor) {
      setSelectedColor(availableColors[0]);
    }
  }, [product, availableColors, selectedColor]);

  useEffect(() => {
    // Always set activeImage to the first gallery image when product loads or changes
    if (galleryImages.length > 0) {
      setActiveImage(galleryImages[0]);
    }
  }, [galleryImages]);

  useEffect(() => {
    setSelectedSize("");
  }, [selectedColor]);

  if (isLoading) {
    return (
      <div className="bg-white min-h-screen pt-24 text-gray-900 flex items-center justify-center">
        <div className="text-center">Caricamento...</div>
      </div>
    );
  }

  if (!product) return <NotFound />;

  const handleAddToCart = () => {
    if (!selectedColor) {
      toast({
        title: "Colore richiesto",
        description: "Seleziona un colore per procedere.",
        variant: "destructive",
      });
      return;
    }

    if (!selectedSize) {
      toast({
        title: "Taglia richiesta",
        description: "Seleziona una taglia per procedere.",
        variant: "destructive",
      });
      return;
    }

    if (!selectedVariant) {
      toast({
        title: "Selezione non valida",
        description: "Seleziona una combinazione valida di colore e taglia.",
        variant: "destructive",
      });
      return;
    }

    if (!stockStatus.inStock) {
      toast({
        title: "Esaurito",
        description: "Questa variante è attualmente esaurita.",
        variant: "destructive",
      });
      return;
    }

    for (let i = 0; i < quantity; i++) {
      addToCart(
        {
          id: product.id.toString(),
          variantId: selectedVariant.id,
          name: product.name,
          brand: product.brand || "",
          price: displayPrice,
          image: galleryImages[0] || "",
          color: selectedColor,
          size: selectedSize,
          sku: selectedVariant.sku,
        },
        selectedSize
      );
    }

    toast({
      title: "Aggiunto al carrello",
      description: `${product.name} (${selectedColor}, ${selectedSize}) è stato aggiunto al carrello.`,
    });
  };

  return (
    <div className="bg-white min-h-screen pt-24 text-gray-900 font-sans">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">

          {/* LEFT COLUMN: Main Image + Thumbnails */}
          <div className="lg:col-span-7 space-y-6">

            {/* CARD IMMAGINE */}
            <div className="w-full bg-white rounded-lg overflow-hidden border border-gray-900 p-8 flex items-center justify-center aspect-[4/3] relative">
              <motion.img
                key={activeImage}
                src={activeImage}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2 }}
                alt={product.name}
                className="w-full h-full object-contain max-h-[70vh]"
                onError={(e) => {
                  const target = e.currentTarget;
                  target.onerror = null;
                  target.style.display = 'none';
                }}
              />
            </div>

            {/* THUMBNAILS */}
            {galleryImages.length > 1 && (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
                {galleryImages.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImage(img)}
                    className={cn(
                      "relative w-full aspect-square border rounded-md overflow-hidden transition-all bg-white p-2 flex items-center justify-center",
                      activeImage === img
                        ? "border-gray-900 ring-1 ring-gray-900"
                        : "border-gray-400 hover:border-gray-900"
                    )}
                  >
                    <img
                      src={img}
                      alt={`View ${idx}`}
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        const target = e.currentTarget;
                        target.onerror = null;
                        target.style.display = 'none';
                      }}
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
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
                    {product.brand}
                  </span>
                </div>
              )}

              <h1 className="text-2xl md:text-3xl font-medium text-gray-900 leading-tight mb-4">
                {product.name}
              </h1>

              <div className="flex items-center justify-between pb-6 border-b border-gray-200">
                <span className="text-2xl font-bold text-gray-900">
                  €{displayPrice.toFixed(2)}
                </span>
                <WishlistButton productId={product.id} showText size="md" />
              </div>

              {selectedVariant && (
                <div
                  className={cn(
                    "mt-4 flex items-center gap-2 text-sm font-medium",
                    stockStatus.inStock ? "text-green-400" : "text-red-400"
                  )}
                >
                  <div
                    className={cn(
                      "w-2 h-2 rounded-full",
                      stockStatus.inStock ? "bg-green-500" : "bg-red-500"
                    )}
                  />
                  {stockStatus.inStock
                    ? `Disponibile (${stockStatus.qty} pezzi)`
                    : "Esaurito"}
                </div>
              )}
            </div>

            {/* Selectors */}
            <div className="space-y-6">
              {/* Colors */}
              {availableColors.length > 0 && (
                <div className="space-y-3">
                  <span className="text-sm font-bold text-gray-900 flex items-center gap-2">
                    Colore:{" "}
                    <span className="font-normal text-gray-500">
                      {selectedColor || "Seleziona"}
                    </span>
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {availableColors.map(color => (
                      <button
                        key={color}
                        onClick={() => setSelectedColor(color)}
                        data-testid={`color-${color.toLowerCase()}`}
                        className={cn(
                          "px-4 py-2 border rounded-full text-sm font-medium transition-all min-w-[3rem]",
                          selectedColor === color
                            ? "border-gray-900 bg-gray-900 text-white shadow-sm"
                            : "border-gray-300 hover:border-gray-400 text-gray-700 bg-white"
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
                  <span className="text-sm font-bold text-gray-900 flex items-center gap-2">
                    Taglia:{" "}
                    <span className="font-normal text-gray-500">
                      {selectedSize || "Seleziona"}
                    </span>
                  </span>
                  <Link href="/help/taglie" className="text-xs underline text-gray-500 hover:text-gray-900">
                    Guida Taglie
                  </Link>
                </div>

                {availableSizes.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {availableSizes.map(size => (
                      <button
                        key={size}
                        onClick={() => setSelectedSize(size)}
                        data-testid={`size-${size}`}
                        className={cn(
                          "min-w-[3.5rem] h-10 px-2 flex items-center justify-center border rounded-full text-sm font-medium transition-all",
                          selectedSize === size
                            ? "border-gray-900 bg-gray-900 text-white shadow-sm"
                            : "border-gray-300 hover:border-gray-400 text-gray-700 bg-white"
                        )}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                ) : selectedColor ? (
                  <p className="text-sm text-gray-500">
                    Nessuna taglia disponibile per questo colore
                  </p>
                ) : (
                  <p className="text-sm text-gray-500">
                    Seleziona un colore per vedere le taglie disponibili
                  </p>
                )}
              </div>

              {/* Quantity + Add */}
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <div className="flex items-center border border-gray-300 rounded-md w-fit bg-white h-12">
                  <button
                    className="px-3 h-full hover:bg-gray-100 transition-colors disabled:opacity-30 text-gray-500 hover:text-gray-900"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                    data-testid="quantity-decrease"
                  >
                    <Minus className="h-4 w-4" />
                  </button>

                  <span
                    className="w-10 text-center font-bold text-gray-900 text-sm"
                    data-testid="quantity-value"
                  >
                    {quantity}
                  </span>

                  <button
                    className="px-3 h-full hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-900 disabled:opacity-30"
                    onClick={() => setQuantity(Math.min(stockStatus.qty || 99, quantity + 1))}
                    disabled={quantity >= (stockStatus.qty || 99)}
                    data-testid="quantity-increase"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>

                <Button
                  className="flex-1 h-12 text-sm font-bold uppercase tracking-wider bg-gray-900 text-white hover:bg-gray-800 rounded-md shadow-md transition-all disabled:opacity-50"
                  disabled={!selectedColor || !selectedSize || !stockStatus.inStock}
                  onClick={handleAddToCart}
                  data-testid="add-to-cart-button"
                >
                  {stockStatus.inStock ? "AGGIUNGI AL CARRELLO" : "ESAURITO"}
                </Button>
              </div>
            </div>

            {/* Details Accordion */}
            <div className="pt-6">
              <Accordion type="single" collapsible className="w-full border-t border-gray-200">
                <AccordionItem value="description" className="border-b border-gray-200">
                  <AccordionTrigger className="text-sm font-bold text-gray-900 hover:no-underline hover:text-gray-600 py-4">
                    Descrizione Prodotto
                  </AccordionTrigger>
                  <AccordionContent className="text-gray-600 leading-relaxed text-sm whitespace-pre-line pb-6">
                    {product.description || "Nessuna descrizione disponibile."}
                    {selectedVariant && (
                      <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-2 gap-4 text-xs uppercase tracking-wider text-gray-500">
                        <div>
                          SKU:
                          <span className="text-gray-900 font-bold block mt-1">{selectedVariant.sku}</span>
                        </div>
                        <div>
                          Marca:
                          <span className="text-gray-900 font-bold block mt-1">{product.brand || "N/A"}</span>
                        </div>
                      </div>
                    )}
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="shipping" className="border-b border-gray-200">
                  <AccordionTrigger className="text-sm font-bold text-gray-900 hover:no-underline hover:text-gray-600 py-4">
                    Spedizione e Resi
                  </AccordionTrigger>
                  <AccordionContent className="text-gray-600 leading-relaxed text-sm pb-6">
                    Spedizione gratuita per ordini superiori a €50. Resi gratuiti entro 30 giorni.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>

            {/* Product Reviews */}
            <ProductReviews productId={product.id} />
          </div>

        </div>
      </div>
    </div>
  );
}