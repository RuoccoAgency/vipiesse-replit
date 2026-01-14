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
      }
  };

  if (!product) return <NotFound />;

  const handleAddToCart = () => {
    if (!selectedSize) {
        toast({
            title: "Size required",
            description: "Please select a size to proceed.",
            variant: "destructive"
        });
        return;
    }
    
    if (product.colors && !selectedColor) {
        toast({
            title: "Color required",
            description: "Please select a color to proceed.",
            variant: "destructive"
        });
        return;
    }

    // Add multiple items based on quantity
    for(let i=0; i<quantity; i++) {
        addToCart(product, selectedSize);
    }
    
    toast({
        title: "Added to cart",
        description: `${product.name} has been added to your cart.`,
    });
  };

  return (
    <div className="bg-black min-h-screen pt-24 text-white font-sans">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            
            {/* LEFT COLUMN: Main Image + Thumbnails (lg:col-span-7) */}
            <div className="lg:col-span-7 space-y-6">
                {/* Main Image Container */}
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

                {/* Thumbnails Grid (Below Main Image) */}
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
            </div>

            {/* RIGHT COLUMN: Product Info (lg:col-span-5) */}
            <div className="lg:col-span-5 space-y-8">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">{product.brand}</span>
                        {product.isBestSeller && <span className="bg-neutral-800 text-white text-[10px] font-bold px-2 py-0.5 uppercase tracking-wide rounded-sm border border-neutral-700">Best Seller</span>}
                    </div>
                    
                    <h1 className="text-2xl md:text-3xl font-medium text-white leading-tight mb-4">
                        {product.name}
                    </h1>
                    
                    <div className="flex items-baseline gap-3 pb-6 border-b border-white/10">
                        <span className="text-2xl font-bold text-white">€{product.price.toFixed(2)}</span>
                        {product.originalPrice && (
                            <span className="text-lg text-neutral-500 line-through">€{product.originalPrice.toFixed(2)}</span>
                        )}
                        <span className="text-sm text-neutral-400">
                            (€14.59 – €20.50)
                        </span>
                    </div>
                    
                    <div className="mt-4 flex items-center gap-2 text-sm text-green-400 font-medium">
                        <div className="w-2 h-2 rounded-full bg-green-500" />
                        In Stock
                    </div>
                </div>

                {/* Selectors */}
                <div className="space-y-6">
                    {/* Colors */}
                    {product.colors && (
                        <div className="space-y-3">
                            <span className="text-sm font-bold text-white flex items-center gap-2">
                                Color: <span className="font-normal text-neutral-400">{selectedColor || 'Select'}</span>
                            </span>
                            <div className="flex flex-wrap gap-2">
                                {product.colors.map(color => (
                                    <button
                                        key={color}
                                        onClick={() => handleColorChange(color)}
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
                        <div className="flex flex-wrap gap-2">
                            {product.sizes.map(size => (
                                <button
                                    key={size}
                                    onClick={() => setSelectedSize(size)}
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
                    </div>

                    {/* Quantity + Add */}
                    <div className="flex flex-col sm:flex-row gap-4 pt-4">
                        <div className="flex items-center border border-white/20 rounded-md w-fit bg-black h-12">
                            <button 
                                className="px-3 h-full hover:bg-white/10 transition-colors disabled:opacity-30 text-neutral-400 hover:text-white"
                                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                disabled={quantity <= 1}
                            >
                                <Minus className="h-4 w-4" />
                            </button>
                            <span className="w-10 text-center font-bold text-white text-sm">{quantity}</span>
                            <button 
                                className="px-3 h-full hover:bg-white/10 transition-colors text-neutral-400 hover:text-white"
                                onClick={() => setQuantity(quantity + 1)}
                            >
                                <Plus className="h-4 w-4" />
                            </button>
                        </div>

                        <Button 
                            className="flex-1 h-12 text-sm font-bold uppercase tracking-wider bg-white text-black hover:bg-neutral-200 rounded-md shadow-md transition-all"
                            disabled={!selectedSize || (!!product.colors && !selectedColor)}
                            onClick={handleAddToCart}
                        >
                            ADD TO CART
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
                                {product.description}
                                <div className="mt-4 pt-4 border-t border-white/10 grid grid-cols-2 gap-4 text-xs uppercase tracking-wider text-neutral-500">
                                    <div>SKU: <span className="text-white font-bold block mt-1">{product.sku || 'N/A'}</span></div>
                                    <div>Brand: <span className="text-white font-bold block mt-1">{product.brand}</span></div>
                                </div>
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
