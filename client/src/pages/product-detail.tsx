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
    <div className="bg-white min-h-screen">
      <div className="container mx-auto px-4 py-8 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-20">
          {/* Left: Gallery (Updated Layout) */}
          <div className="flex flex-col md:flex-row gap-4 h-fit sticky top-24">
             {/* Thumbnails (Left on desktop, hidden on mobile usually but requested below/dots) */}
             <div className="hidden md:flex md:flex-col gap-3 overflow-y-auto max-h-[600px] scrollbar-hide shrink-0 w-20">
                {galleryImages.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImage(img)}
                    className={cn(
                      "relative w-full aspect-square border rounded-lg overflow-hidden transition-all bg-white",
                      activeImage === img ? "border-black ring-1 ring-black" : "border-neutral-200 hover:border-neutral-400"
                    )}
                  >
                    <img src={img} alt={`View ${idx}`} className="w-full h-full object-contain p-1" />
                  </button>
                ))}
             </div>

             {/* Main Image */}
             <div className="flex-1 bg-white rounded-xl overflow-hidden relative aspect-square md:aspect-[4/5] flex items-center justify-center border border-neutral-100 shadow-sm">
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
             
             {/* Mobile Thumbnails/Carousel Indicators */}
             <div className="flex md:hidden gap-2 overflow-x-auto pb-2 scrollbar-hide w-full justify-center">
                {galleryImages.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImage(img)}
                    className={cn(
                      "w-2 h-2 rounded-full transition-all",
                      activeImage === img ? "bg-black w-4" : "bg-neutral-300"
                    )}
                  />
                ))}
             </div>
          </div>

          {/* Right: Details (Clean Layout) */}
          <div className="space-y-8 pt-2">
             <div className="space-y-4">
               <div className="flex items-center gap-2">
                  <span className="text-sm font-bold uppercase tracking-widest text-neutral-500">{product.brand}</span>
                  {product.isBestSeller && <span className="bg-neutral-100 text-neutral-900 text-[10px] font-bold px-2 py-0.5 uppercase tracking-wide rounded-sm">Best Seller</span>}
               </div>
               
               <h1 className="text-3xl md:text-4xl font-normal text-neutral-900 leading-tight">
                 {product.name}
               </h1>
               
               <div className="flex items-baseline gap-3 pb-4 border-b border-neutral-100">
                 <span className="text-2xl font-semibold text-neutral-900">€{product.price.toFixed(2)}</span>
                 {product.originalPrice && (
                    <span className="text-lg text-neutral-400 line-through">€{product.originalPrice.toFixed(2)}</span>
                 )}
                 <span className="text-sm text-neutral-500 font-light">
                   (€14.59 – €20.50)
                 </span>
               </div>
               
               <div className="flex items-center gap-2 text-sm text-green-700 font-medium">
                  <div className="w-2 h-2 rounded-full bg-green-600" />
                  Disponibile
               </div>
             </div>

             {/* Selectors */}
             <div className="space-y-6">
                {/* Colors */}
                {product.colors && (
                  <div className="space-y-3">
                    <span className="text-sm font-medium text-neutral-900 flex items-center gap-2">
                      Colore: <span className="text-neutral-500">{selectedColor || 'Seleziona'}</span>
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {product.colors.map(color => (
                         <button
                           key={color}
                           onClick={() => handleColorChange(color)}
                           className={cn(
                             "px-4 py-2 border rounded-md text-sm transition-all",
                             selectedColor === color 
                               ? "border-black bg-neutral-900 text-white shadow-sm" 
                               : "border-neutral-200 hover:border-neutral-400 text-neutral-700 bg-white"
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
                      <span className="text-sm font-medium text-neutral-900 flex items-center gap-2">
                          Taglia: <span className="text-neutral-500">{selectedSize || 'Seleziona'}</span>
                      </span>
                      <button className="text-xs underline text-neutral-500 hover:text-black">Guida Taglie</button>
                   </div>
                   <div className="flex flex-wrap gap-2">
                      {product.sizes.map(size => (
                         <button
                           key={size}
                           onClick={() => setSelectedSize(size)}
                           className={cn(
                             "min-w-[3.5rem] h-10 px-2 flex items-center justify-center border rounded-md text-sm font-medium transition-all",
                             selectedSize === size 
                               ? "border-black bg-neutral-900 text-white shadow-sm" 
                               : "border-neutral-200 hover:border-neutral-400 text-neutral-700 bg-white"
                           )}
                         >
                           {size.replace(' EU', '')}
                         </button>
                      ))}
                   </div>
                </div>

                {/* Quantity + Add */}
                <div className="flex flex-col sm:flex-row gap-4 pt-6">
                   <div className="flex items-center border border-neutral-200 rounded-md w-fit bg-white">
                      <button 
                        className="p-3 hover:bg-neutral-50 transition-colors disabled:opacity-30 text-neutral-600"
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        disabled={quantity <= 1}
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="w-10 text-center font-medium text-neutral-900 text-sm">{quantity}</span>
                      <button 
                        className="p-3 hover:bg-neutral-50 transition-colors text-neutral-600"
                        onClick={() => setQuantity(quantity + 1)}
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                   </div>

                   <Button 
                     className="flex-1 h-12 text-sm font-bold uppercase tracking-wider bg-black text-white hover:bg-neutral-800 rounded-md shadow-sm transition-all"
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
                  <AccordionItem value="details" className="border-t border-neutral-100">
                    <AccordionTrigger className="text-sm uppercase tracking-wider font-bold text-neutral-900 hover:no-underline hover:text-neutral-700 py-4">
                      Dettagli Prodotto
                    </AccordionTrigger>
                    <AccordionContent className="text-neutral-600 leading-relaxed text-sm whitespace-pre-line pb-6">
                      {product.description}
                      
                      <div className="mt-6 pt-4 border-t border-neutral-100 grid grid-cols-2 gap-4 text-xs uppercase tracking-wider text-neutral-500">
                         <div>SKU: <span className="text-neutral-900 font-bold block mt-1">{product.sku || 'N/A'}</span></div>
                         <div>Marchio: <span className="text-neutral-900 font-bold block mt-1">{product.brand}</span></div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="shipping" className="border-t border-b border-neutral-100">
                    <AccordionTrigger className="text-sm uppercase tracking-wider font-bold text-neutral-900 hover:no-underline hover:text-neutral-700 py-4">
                      Spedizione e Resi
                    </AccordionTrigger>
                    <AccordionContent className="text-neutral-600 leading-relaxed text-sm pb-6">
                      Spedizione gratuita per ordini superiori a €50. Reso gratuito entro 30 giorni.
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

