import { useRoute } from "wouter";
import { products } from "@/lib/data";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/context/cart-context";
import { Minus, Plus, ShoppingBag } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import NotFound from "./not-found";
import { useToast } from "@/hooks/use-toast";

export function ProductDetail() {
  const [, params] = useRoute("/product/:id");
  const product = products.find(p => p.id === params?.id);
  const { addToCart } = useCart();
  const { toast } = useToast();

  const [selectedSize, setSelectedSize] = useState<string>("");
  const [selectedColor, setSelectedColor] = useState<string>("");
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState<string>("");

  useEffect(() => {
    if (product) {
        setActiveImage(product.image);
    }
  }, [product]);

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

  const gallery = product.gallery && product.gallery.length > 0 ? product.gallery : [product.image];

  return (
    <div className="container mx-auto px-4 py-8 md:py-16 min-h-screen">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-20">
        {/* Left: Gallery */}
        <div className="flex flex-col-reverse md:flex-row gap-4 h-fit sticky top-24">
           {/* Thumbnails */}
           <div className="flex md:flex-col gap-4 overflow-x-auto md:overflow-visible pb-2 md:pb-0 scrollbar-hide md:max-h-[80vh] md:w-24 shrink-0">
              {gallery.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImage(img)}
                  className={cn(
                    "relative w-20 h-20 flex-shrink-0 border-2 rounded-lg overflow-hidden transition-all bg-neutral-50",
                    activeImage === img ? "border-black" : "border-transparent hover:border-gray-300"
                  )}
                >
                  <img src={img} alt={`View ${idx}`} className="w-full h-full object-contain p-1" />
                </button>
              ))}
           </div>

           {/* Main Image */}
           <div className="flex-1 bg-neutral-50 rounded-xl overflow-hidden relative aspect-square md:aspect-[4/5] flex items-center justify-center border border-neutral-100">
              <motion.img
                key={activeImage}
                src={activeImage || product.image}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                alt={product.name}
                className="w-full h-full object-contain p-4 md:p-8 max-h-[80vh]"
              />
           </div>
        </div>

        {/* Right: Details */}
        <div className="space-y-8 pt-4">
           <div>
             <div className="flex items-center gap-2 mb-3">
                <span className="text-sm font-bold uppercase tracking-widest text-neutral-500">{product.brand}</span>
                {product.isBestSeller && <span className="bg-yellow-400 text-black text-[10px] font-bold px-2 py-0.5 uppercase">Best Seller</span>}
             </div>
             <h1 className="text-2xl md:text-3xl lg:text-4xl font-heading font-bold uppercase leading-tight text-neutral-900 mb-4">
               {product.name}
             </h1>
             
             <div className="flex items-baseline gap-3 mb-4 flex-wrap">
               <span className="text-2xl md:text-3xl font-bold">€{product.price.toFixed(2)}</span>
               {product.originalPrice && (
                  <span className="text-lg text-neutral-400 line-through">€{product.originalPrice.toFixed(2)}</span>
               )}
               {/* Price Range */}
               <span className="text-sm text-neutral-500">
                 (€14.59 – €20.50)
               </span>
             </div>

             <div className="flex items-center gap-2 text-sm text-green-600 font-medium bg-green-50 w-fit px-3 py-1 rounded-full border border-green-100">
                <div className="w-2 h-2 rounded-full bg-green-600 animate-pulse" />
                Disponibile
             </div>
           </div>

           <div className="h-px w-full bg-neutral-200" />

           {/* Selectors */}
           <div className="space-y-8">
              {/* Colors */}
              {product.colors && (
                <div className="space-y-4">
                  <span className="text-sm font-bold uppercase tracking-wide text-neutral-900 flex items-center gap-2">
                    Colore: <span className="font-normal text-neutral-600 bg-neutral-100 px-2 py-0.5 rounded text-xs">{selectedColor || 'Seleziona'}</span>
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {product.colors.map(color => (
                       <button
                         key={color}
                         onClick={() => setSelectedColor(color)}
                         className={cn(
                           "px-4 py-2 border rounded-full text-sm transition-all hover:shadow-md",
                           selectedColor === color 
                             ? "border-black bg-black text-white shadow-md" 
                             : "border-neutral-200 hover:border-black text-neutral-700 bg-white"
                         )}
                       >
                         {color}
                       </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Sizes */}
              <div className="space-y-4">
                 <div className="flex justify-between items-center">
                    <span className="text-sm font-bold uppercase tracking-wide text-neutral-900 flex items-center gap-2">
                        Taglia: <span className="font-normal text-neutral-600 bg-neutral-100 px-2 py-0.5 rounded text-xs">{selectedSize || 'Seleziona'}</span>
                    </span>
                    <button className="text-xs underline text-neutral-500 hover:text-black font-medium">Guida Taglie</button>
                 </div>
                 <div className="flex flex-wrap gap-2">
                    {product.sizes.map(size => (
                       <button
                         key={size}
                         onClick={() => setSelectedSize(size)}
                         className={cn(
                           "min-w-[3rem] h-10 px-2 flex items-center justify-center border rounded-md text-sm font-medium transition-all hover:shadow-sm",
                           selectedSize === size 
                             ? "border-black bg-black text-white shadow-md" 
                             : "border-neutral-200 hover:border-black text-neutral-900 bg-white"
                         )}
                       >
                         {size.replace(' EU', '')}
                       </button>
                    ))}
                 </div>
              </div>

              {/* Quantity + Add */}
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                 <div className="flex items-center border border-neutral-300 rounded-lg w-fit bg-white shadow-sm">
                    <button 
                      className="p-3 hover:bg-neutral-100 transition-colors disabled:opacity-50 text-neutral-600"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      disabled={quantity <= 1}
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="w-12 text-center font-bold text-neutral-900">{quantity}</span>
                    <button 
                      className="p-3 hover:bg-neutral-100 transition-colors text-neutral-600"
                      onClick={() => setQuantity(quantity + 1)}
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                 </div>

                 <Button 
                   className="flex-1 py-7 text-sm font-bold uppercase tracking-widest bg-black text-white hover:bg-neutral-800 rounded-lg shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5"
                   disabled={!selectedSize || (!!product.colors && !selectedColor)}
                   onClick={handleAddToCart}
                 >
                   <ShoppingBag className="mr-2 h-5 w-5" /> Aggiungi al Carrello
                 </Button>
              </div>
           </div>

           <div className="h-px w-full bg-neutral-200" />

           {/* Info */}
           <div className="bg-neutral-50 p-6 rounded-xl border border-neutral-100">
              <h3 className="font-bold uppercase tracking-widest text-sm mb-4">Dettagli Prodotto</h3>
              <p className="whitespace-pre-line leading-relaxed text-sm text-neutral-600">
                {product.description}
              </p>
              
              <div className="pt-6 mt-6 border-t border-neutral-200 grid grid-cols-2 gap-4 text-xs uppercase tracking-wider text-neutral-500">
                 <div>SKU: <span className="text-neutral-900 font-bold block mt-1">{product.sku || 'N/A'}</span></div>
                 <div>Marchio: <span className="text-neutral-900 font-bold block mt-1">{product.brand}</span></div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
