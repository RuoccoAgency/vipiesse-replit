import { useState, useMemo } from "react";
import { ProductCard } from "@/components/product-card";
import { SlidersHorizontal, X, Tag } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { fetchProductsByCollection } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

interface OutletProps {
  category?: "donna" | "uomo" | "bambino";
}

export function Outlet({ category }: OutletProps) {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 100]);
  const [sortBy, setSortBy] = useState<string>("newest");

  const { data: outletProducts = [], isLoading: isLoadingOutlet } = useQuery({
    queryKey: ['products', 'outlet'],
    queryFn: () => fetchProductsByCollection('outlet'),
  });

  const { data: categoryProducts = [], isLoading: isLoadingCategory } = useQuery({
    queryKey: ['products', category, 'includeOutlet'],
    queryFn: () => fetchProductsByCollection(category!, true),
    enabled: !!category,
  });

  const products = useMemo(() => {
    if (!category) return outletProducts;
    
    const categoryProductIds = new Set(categoryProducts.map((p: any) => p.id));
    return outletProducts.filter((p: any) => categoryProductIds.has(p.id));
  }, [outletProducts, categoryProducts, category]);

  const isLoading = isLoadingOutlet || (category && isLoadingCategory);

  const brands = useMemo(() => {
    const brandSet = new Set<string>();
    products.forEach((p: any) => {
      if (p.brand) {
        const brandName = p.brand.split('(')[0].trim();
        brandSet.add(brandName);
      }
    });
    return Array.from(brandSet).sort();
  }, [products]);

  const priceStats = useMemo(() => {
    if (products.length === 0) return { min: 0, max: 100 };
    const prices = products.map((p: any) => (p.basePriceCents || 0) / 100);
    return {
      min: Math.floor(Math.min(...prices)),
      max: Math.ceil(Math.max(...prices))
    };
  }, [products]);

  const filteredProducts = useMemo(() => {
    let result = [...products];

    if (selectedBrands.length > 0) {
      result = result.filter((p: any) => {
        if (!p.brand) return false;
        const brandName = p.brand.split('(')[0].trim();
        return selectedBrands.includes(brandName);
      });
    }

    if (priceRange[0] > 0 || priceRange[1] < priceStats.max) {
      result = result.filter((p: any) => {
        const price = (p.basePriceCents || 0) / 100;
        return price >= priceRange[0] && price <= priceRange[1];
      });
    }

    switch (sortBy) {
      case "price-asc":
        result.sort((a: any, b: any) => (a.basePriceCents || 0) - (b.basePriceCents || 0));
        break;
      case "price-desc":
        result.sort((a: any, b: any) => (b.basePriceCents || 0) - (a.basePriceCents || 0));
        break;
      case "name-asc":
        result.sort((a: any, b: any) => a.name.localeCompare(b.name));
        break;
      case "newest":
      default:
        result.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
    }

    return result;
  }, [products, selectedBrands, priceRange, priceStats.max, sortBy]);

  const toggleBrand = (brand: string) => {
    setSelectedBrands(prev => 
      prev.includes(brand) 
        ? prev.filter(b => b !== brand)
        : [...prev, brand]
    );
  };

  const clearFilters = () => {
    setSelectedBrands([]);
    setPriceRange([0, priceStats.max]);
  };

  const activeFiltersCount = selectedBrands.length + (priceRange[0] > 0 || priceRange[1] < priceStats.max ? 1 : 0);

  const getCategoryTitle = () => {
    switch (category) {
      case "donna": return "Outlet Donna";
      case "uomo": return "Outlet Uomo";
      case "bambino": return "Outlet Bambino";
      default: return "Outlet";
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 min-h-screen pt-24">
      <div className="bg-gradient-to-r from-red-600 to-red-500 text-white rounded-2xl p-8 mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Tag className="w-6 h-6" />
          <span className="text-sm font-bold uppercase tracking-widest opacity-80">Saldi</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-heading font-bold uppercase tracking-tighter">
          {getCategoryTitle()}
        </h1>
        <p className="mt-2 opacity-90">Scopri le migliori offerte sui nostri prodotti selezionati.</p>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-end mb-8 border-b border-gray-200 pb-4 gap-4">
        <div>
          <span className="text-xs text-gray-500 uppercase tracking-widest">
            {filteredProducts.length} Prodotti
          </span>
        </div>
        
        <div className="flex gap-4 items-center">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="text-sm border border-gray-300 rounded-md px-3 py-2 bg-white focus:ring-1 focus:ring-gray-900 focus:border-gray-900 outline-none"
            data-testid="sort-select"
          >
            <option value="newest">Più recenti</option>
            <option value="price-asc">Prezzo: basso-alto</option>
            <option value="price-desc">Prezzo: alto-basso</option>
            <option value="name-asc">Nome A-Z</option>
          </select>

          <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
            <SheetTrigger asChild>
              <button 
                className="flex items-center gap-2 text-sm uppercase tracking-wide hover:text-gray-500 relative"
                data-testid="filter-button"
              >
                <SlidersHorizontal className="h-4 w-4" /> Filtra
                {activeFiltersCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {activeFiltersCount}
                  </span>
                )}
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[320px] sm:w-[400px]">
              <SheetHeader>
                <SheetTitle className="flex items-center justify-between">
                  <span className="font-heading uppercase tracking-wide">Filtri</span>
                  {activeFiltersCount > 0 && (
                    <button
                      onClick={clearFilters}
                      className="text-sm text-gray-500 hover:text-gray-900 underline font-normal"
                    >
                      Cancella tutto
                    </button>
                  )}
                </SheetTitle>
              </SheetHeader>

              <div className="mt-6 space-y-6">
                {brands.length > 0 && (
                  <div>
                    <h3 className="font-bold text-sm uppercase tracking-wide mb-3">Marca</h3>
                    <div className="space-y-2">
                      {brands.map((brand) => (
                        <label 
                          key={brand} 
                          className="flex items-center gap-3 cursor-pointer group"
                        >
                          <div className={cn(
                            "w-5 h-5 border-2 rounded flex items-center justify-center transition-colors",
                            selectedBrands.includes(brand) 
                              ? "bg-red-600 border-red-600" 
                              : "border-gray-300 group-hover:border-gray-400"
                          )}>
                            {selectedBrands.includes(brand) && (
                              <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none">
                                <path d="M2 6L5 9L10 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            )}
                          </div>
                          <span className="text-sm text-gray-700">{brand}</span>
                          <input
                            type="checkbox"
                            checked={selectedBrands.includes(brand)}
                            onChange={() => toggleBrand(brand)}
                            className="sr-only"
                          />
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <h3 className="font-bold text-sm uppercase tracking-wide mb-3">Prezzo</h3>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="flex-1">
                        <label className="text-xs text-gray-500 mb-1 block">Min</label>
                        <input
                          type="number"
                          min={0}
                          max={priceRange[1]}
                          value={priceRange[0]}
                          onChange={(e) => setPriceRange([Number(e.target.value), priceRange[1]])}
                          className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                        />
                      </div>
                      <span className="text-gray-400 mt-5">—</span>
                      <div className="flex-1">
                        <label className="text-xs text-gray-500 mb-1 block">Max</label>
                        <input
                          type="number"
                          min={priceRange[0]}
                          max={priceStats.max}
                          value={priceRange[1]}
                          onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
                          className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                        />
                      </div>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={priceStats.max}
                      value={priceRange[1]}
                      onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
                      className="w-full accent-red-600"
                    />
                  </div>
                </div>

                <Button
                  onClick={() => setIsFilterOpen(false)}
                  className="w-full bg-red-600 text-white hover:bg-red-700"
                >
                  Mostra {filteredProducts.length} prodotti
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          {selectedBrands.map(brand => (
            <button
              key={brand}
              onClick={() => toggleBrand(brand)}
              className="inline-flex items-center gap-1 px-3 py-1 bg-red-50 text-red-700 rounded-full text-sm hover:bg-red-100 transition-colors"
            >
              {brand}
              <X className="w-3 h-3" />
            </button>
          ))}
          {(priceRange[0] > 0 || priceRange[1] < priceStats.max) && (
            <button
              onClick={() => setPriceRange([0, priceStats.max])}
              className="inline-flex items-center gap-1 px-3 py-1 bg-red-50 text-red-700 rounded-full text-sm hover:bg-red-100 transition-colors"
            >
              €{priceRange[0]} - €{priceRange[1]}
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      )}

      {isLoading && (
        <div className="text-center py-16 text-gray-500">Caricamento prodotti...</div>
      )}

      {!isLoading && filteredProducts.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-12">
          {filteredProducts.map((product: any) => (
            <ProductCard key={product.id} product={product} isOutlet />
          ))}
        </div>
      ) : !isLoading ? (
        <div className="py-20 text-center text-gray-500">
          <p>Nessun prodotto outlet disponibile al momento.</p>
          {activeFiltersCount > 0 && (
            <button
              onClick={clearFilters}
              className="mt-4 text-red-600 underline hover:no-underline"
            >
              Cancella filtri
            </button>
          )}
        </div>
      ) : null}
    </div>
  );
}
