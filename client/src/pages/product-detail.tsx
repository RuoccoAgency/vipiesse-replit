import { useRoute } from "wouter";
import { products } from "@/lib/data";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/context/cart-context";
import { Minus, Plus, ShoppingBag, ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import NotFound from "./not-found";
import { useToast } from "@/hooks/use-toast";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export function ProductDetail() {
  const [, params] = useRoute("/product/:id");
  const product = products.find(p => p.id === params?.id);
  const { addToCart } = useCart();
  const { toast } = useToast();

  const [selectedSize, setSelectedSize] = useState<string>("");
  const [selectedColor, setSelectedColor] = useState<string>("");
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState<string>("");
  const [galleryImages, setGalleryImages] = useState<string[]>([]);

  // Initialize
  useEffect(() => {
    if (product) {
        // Set initial images
        let initialGallery = product.gallery && product.gallery.length > 0 ? product.gallery : [product.image];
        
        // If there are colors, try to pick the first one
        if (product.colors && product.colors.length > 0) {
           const firstColor = product.colors[0];
           setSelectedColor(firstColor);
           if (product.imagesByColor && product.imagesByColor[firstColor]) {
               initialGallery = product.imagesByColor[firstColor];
           }
        }
        
        setGalleryImages(initialGallery);
        setActiveImage(initialGallery[0]);
    }
  }, [product]);

  // Handle color change -> update images
  const handleColorChange = (color: string) => {
      setSelectedColor(color);
      if (product?.imagesByColor && product.imagesByColor[color]) {
          const newImages = product.imagesByColor[color];
          setGalleryImages(newImages);
          setActiveImage(newImages[0]);
      } else {
          // Fallback to main gallery or keep current if no specific images
          // But user requested "Color -> Image Sync (Must)"
          // If no mapping, we might default to main image
           if (product?.gallery) {
             // setGalleryImages(product.gallery);
             // setActiveImage(product.gallery[0]);
             // KEEPING current behavior for now: don't break if no images
           }
      }
  };

  if (!product) return <NotFound />;

  const handleAddToCart = () => {
    if (!selectedSize) {
        toast({
            title: "Seleziona una taglia",
            description: "Devi selezionare una taglia per procedere.",
            variant: "destructive"
        });
        return;
    }
    
    if (product.colors && !selectedColor) {
        toast({
            title: "Seleziona un colore",
            description: "Devi selezionare un colore per procedere.",
            variant: "destructive"
        });
        return;
    }

    // Add multiple items based on quantity
    for(let i=0; i<quantity; i++) {
        addToCart(product, selectedSize);
    }
    
    toast({
        title: "Aggiunto al carrello",
        description: `${product.name} è stato aggiunto al carrello.`,
    });
  };

  return (
    <div className="bg-black min-h-screen pt-24 text-white">
      <div className="container mx-auto px-4 py-8 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-20 mb-20">
            {/* Left: Main Image */}
            <div className="bg-black rounded-xl overflow-hidden relative aspect-square md:aspect-[4/5] flex items-center justify-center border border-white/10 shadow-sm">
                <motion.img
                  key={activeImage}
                  src={activeImage}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                  alt={product.name}
                  className="w-full h-full object-contain p-4 md:p-8 max-h-[80vh]"
                />
            </div>

            {/* Right: Details (Clean Layout) */}
            <div className="space-y-8 pt-2">
                <div className="space-y-4">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-bold uppercase tracking-widest text-neutral-400">{product.brand}</span>
                    {product.isBestSeller && <span className="bg-neutral-800 text-white text-[10px] font-bold px-2 py-0.5 uppercase tracking-wide rounded-sm border border-neutral-700">Best Seller</span>}
                </div>
                
                <h1 className="text-3xl md:text-4xl font-normal text-white leading-tight">
                    {product.name}
                </h1>
                
                <div className="flex items-baseline gap-3 pb-4 border-b border-white/10">
                    <span className="text-2xl font-semibold text-white">€{product.price.toFixed(2)}</span>
                    {product.originalPrice && (
                    <span className="text-lg text-neutral-500 line-through">€{product.originalPrice.toFixed(2)}</span>
                    )}
                    <span className="text-sm text-neutral-400 font-light">
                    (€14.59 – €20.50)
                    </span>
                </div>
                
                <div className="flex items-center gap-2 text-sm text-green-400 font-medium">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    Disponibile
                </div>
                </div>

                {/* Selectors */}
                <div className="space-y-6">
                {/* Colors */}
                {product.colors && (
                    <div className="space-y-3">
                    <span className="text-sm font-medium text-white flex items-center gap-2">
                        Colore: <span className="text-neutral-400">{selectedColor || 'Seleziona'}</span>
                    </span>
                    <div className="flex flex-wrap gap-2">
                        {product.colors.map(color => (
                            <button
                            key={color}
                            onClick={() => handleColorChange(color)}
                            className={cn(
                                "px-4 py-2 border rounded-md text-sm transition-all",
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
                        <span className="text-sm font-medium text-white flex items-center gap-2">
                            Taglia: <span className="text-neutral-400">{selectedSize || 'Seleziona'}</span>
                        </span>
                        <button className="text-xs underline text-neutral-400 hover:text-white">Guida Taglie</button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {product.sizes.map(size => (
                            <button
                            key={size}
                            onClick={() => setSelectedSize(size)}
                            className={cn(
                                "min-w-[3.5rem] h-10 px-2 flex items-center justify-center border rounded-md text-sm font-medium transition-all",
                                selectedSize === size 
                                ? "border-white bg-white text-black shadow-sm" 
                                : "border-white/20 hover:border-white/40 text-neutral-300 bg-black"
                            )}
                            >
                            {size.replace(' EU', '')}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Quantity + Add */}
                <div className="flex flex-col sm:flex-row gap-4 pt-6">
                    <div className="flex items-center border border-white/20 rounded-md w-fit bg-black">
                        <button 
                        className="p-3 hover:bg-white/10 transition-colors disabled:opacity-30 text-neutral-400 hover:text-white"
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        disabled={quantity <= 1}
                        >
                        <Minus className="h-4 w-4" />
                        </button>
                        <span className="w-10 text-center font-medium text-white text-sm">{quantity}</span>
                        <button 
                        className="p-3 hover:bg-white/10 transition-colors text-neutral-400 hover:text-white"
                        onClick={() => setQuantity(quantity + 1)}
                        >
                        <Plus className="h-4 w-4" />
                        </button>
                    </div>

                    <Button 
                        className="flex-1 h-12 text-sm font-bold uppercase tracking-wider bg-white text-black hover:bg-neutral-200 rounded-md shadow-sm transition-all"
                        disabled={!selectedSize || (!!product.colors && !selectedColor)}
                        onClick={handleAddToCart}
                    >
                        AGGIUNGI AL CARRELLO
                    </Button>
                </div>
                </div>

                {/* Details Accordion */}
                <div className="pt-8">
                <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="details" className="border-t border-white/10">
                    <AccordionTrigger className="text-sm uppercase tracking-wider font-bold text-white hover:no-underline hover:text-neutral-300 py-4">
                        Dettagli Prodotto
                    </AccordionTrigger>
                    <AccordionContent className="text-neutral-400 leading-relaxed text-sm whitespace-pre-line pb-6">
                        {product.description}
                        
                        <div className="mt-6 pt-4 border-t border-white/10 grid grid-cols-2 gap-4 text-xs uppercase tracking-wider text-neutral-500">
                            <div>SKU: <span className="text-white font-bold block mt-1">{product.sku || 'N/A'}</span></div>
                            <div>Marchio: <span className="text-white font-bold block mt-1">{product.brand}</span></div>
                        </div>
                    </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="shipping" className="border-t border-b border-white/10">
                    <AccordionTrigger className="text-sm uppercase tracking-wider font-bold text-white hover:no-underline hover:text-neutral-300 py-4">
                        Spedizione e Resi
                    </AccordionTrigger>
                    <AccordionContent className="text-neutral-400 leading-relaxed text-sm pb-6">
                        Spedizione gratuita per ordini superiori a €50. Reso gratuito entro 30 giorni.
                    </AccordionContent>
                    </AccordionItem>
                </Accordion>
                </div>
            </div>
        </div>

        {/* Bottom Section: Image Grid */}
        <div className="pt-12 border-t border-white/10">
            <h2 className="text-xl font-heading font-bold text-white mb-8 uppercase tracking-widest">Galleria Immagini</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {galleryImages.map((img, idx) => (
                    <div 
                        key={idx} 
                        className="bg-black border border-white/10 rounded-lg overflow-hidden aspect-[4/5] flex items-center justify-center p-4 cursor-pointer hover:border-white/40 transition-colors"
                        onClick={() => {
                            setActiveImage(img);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                    >
                        <img 
                            src={img} 
                            alt={`Product gallery ${idx}`} 
                            className="w-full h-full object-contain"
                        />
                    </div>
                ))}
            </div>
        </div>

      </div>
    </div>
  );
}

