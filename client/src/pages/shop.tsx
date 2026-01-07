import { products, Product } from "@/lib/data";
import { ProductCard } from "@/components/product-card";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import { SlidersHorizontal } from "lucide-react";

interface ShopProps {
  category?: 'donna' | 'uomo' | 'bambino';
  isOutlet?: boolean;
}

export function Shop({ category, isOutlet = false }: ShopProps) {
  const [location, setLocation] = useLocation();
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);

  // Parse query params for other filters if needed (e.g. ?filter=bestseller)
  const searchParams = new URLSearchParams(window.location.search);
  const filterParam = searchParams.get('filter');

  useEffect(() => {
    let result = products;

    if (category) {
      result = result.filter(p => p.category === category);
    }

    if (isOutlet) {
      result = result.filter(p => p.isOutlet);
    }

    if (filterParam === 'bestseller') {
      result = result.filter(p => p.isBestSeller);
    } else if (filterParam === 'new') {
      result = result.filter(p => p.isNewSeason);
    }

    setFilteredProducts(result);
  }, [category, isOutlet, filterParam]);

  const title = isOutlet 
    ? `Outlet ${category || ''}` 
    : category 
      ? `Collezione ${category}` 
      : filterParam === 'bestseller' ? 'I più venduti'
      : filterParam === 'new' ? 'Nuovi Arrivi'
      : 'Tutti i prodotti';

  return (
    <div className="container mx-auto px-4 py-8 min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-end mb-8 border-b border-neutral-800 pb-4 gap-4">
        <div>
          <span className="text-xs text-neutral-400 uppercase tracking-widest">
            {filteredProducts.length} Prodotti
          </span>
          <h1 className="text-4xl md:text-5xl font-heading font-bold uppercase tracking-tighter mt-2">
            {title}
          </h1>
        </div>
        
        <div className="flex gap-4">
           {/* Simple Filter UI Placeholder */}
           <button className="flex items-center gap-2 text-sm uppercase tracking-wide hover:text-neutral-400">
             <SlidersHorizontal className="h-4 w-4" /> Filtra
           </button>
        </div>
      </div>

      {filteredProducts.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-12">
          {filteredProducts.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="py-20 text-center text-neutral-500">
          <p>Nessun prodotto trovato in questa categoria.</p>
        </div>
      )}
    </div>
  );
}
