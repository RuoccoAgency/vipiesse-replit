import { ProductCard } from "@/components/product-card";
import { useLocation } from "wouter";
import { SlidersHorizontal } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { fetchProducts, fetchProductsByCollection } from "@/lib/api";

interface ShopProps {
  collection?: string;
}

export function Shop({ collection }: ShopProps) {
  const [location] = useLocation();

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products', collection],
    queryFn: () => collection ? fetchProductsByCollection(collection) : fetchProducts(),
  });

  const title = collection 
    ? collection.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())
    : 'Tutti i prodotti';

  return (
    <div className="container mx-auto px-4 py-8 min-h-screen pt-24">
      <div className="flex flex-col md:flex-row justify-between items-end mb-8 border-b border-gray-200 pb-4 gap-4">
        <div>
          <span className="text-xs text-gray-500 uppercase tracking-widest">
            {products.length} Prodotti
          </span>
          <h1 className="text-4xl md:text-5xl font-heading font-bold uppercase tracking-tighter mt-2">
            {title}
          </h1>
        </div>
        
        <div className="flex gap-4">
           <button className="flex items-center gap-2 text-sm uppercase tracking-wide hover:text-gray-500">
             <SlidersHorizontal className="h-4 w-4" /> Filtra
           </button>
        </div>
      </div>

      {isLoading && (
        <div className="text-center py-16 text-gray-500">Caricamento prodotti...</div>
      )}

      {!isLoading && products.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-12">
          {products.map((product: any) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : !isLoading ? (
        <div className="py-20 text-center text-gray-500">
          <p>Nessun prodotto trovato in questa categoria.</p>
        </div>
      ) : null}
    </div>
  );
}
