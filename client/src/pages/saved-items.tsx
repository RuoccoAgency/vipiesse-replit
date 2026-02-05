import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/auth-context";
import { useCart } from "@/context/cart-context";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Heart, ArrowLeft, Trash2, ShoppingCart } from "lucide-react";
import type { ProductWithVariants } from "@shared/schema";

export function SavedItems() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { addToCart } = useCart();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [savedItems, setSavedItems] = useState<ProductWithVariants[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [removingId, setRemovingId] = useState<number | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      setLocation("/login");
      return;
    }

    if (isAuthenticated) {
      fetchSavedItems();
    }
  }, [isAuthenticated, authLoading]);

  const fetchSavedItems = async () => {
    try {
      const res = await fetch("/api/my/saved", {
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        setSavedItems(data);
      }
    } catch (error) {
      console.error("Error fetching saved items:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemove = async (productId: number) => {
    setRemovingId(productId);
    try {
      const res = await fetch(`/api/my/saved/${productId}`, { 
        method: "DELETE",
        credentials: 'include',
      });
      if (res.ok) {
        setSavedItems(items => items.filter(item => item.id !== productId));
        toast({
          title: "Rimosso",
          description: "Prodotto rimosso dai preferiti",
        });
      }
    } catch (error) {
      toast({
        title: "Errore",
        description: "Impossibile rimuovere il prodotto",
        variant: "destructive",
      });
    } finally {
      setRemovingId(null);
    }
  };

  const handleAddToCart = (product: ProductWithVariants) => {
    if (!product.variants || product.variants.length === 0) {
      toast({
        title: "Non disponibile",
        description: "Questo prodotto non ha varianti disponibili",
        variant: "destructive",
      });
      return;
    }

    const variant = product.variants.find(v => v.stockQty > 0) || product.variants[0];
    const image = product.images?.[0]?.imageUrl || "/placeholder-product.jpg";
    const price = variant.priceCents ? variant.priceCents / 100 : (product.basePriceCents || 0) / 100;

    addToCart({
      id: product.id,
      variantId: variant.id,
      name: product.name,
      brand: product.brand || "",
      price,
      color: variant.color,
      image,
    }, variant.size, 1);

    toast({
      title: "Aggiunto al carrello",
      description: `${product.name} aggiunto al carrello`,
    });
  };

  const getProductImage = (product: ProductWithVariants) => {
    if (product.images && product.images.length > 0) {
      return product.images[0].imageUrl;
    }
    return "/placeholder-product.jpg";
  };

  const getProductPrice = (product: ProductWithVariants) => {
    if (product.variants && product.variants.length > 0 && product.variants[0].priceCents) {
      return product.variants[0].priceCents / 100;
    }
    return product.basePriceCents ? product.basePriceCents / 100 : 0;
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-white pt-24 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pt-24">
      <div className="container mx-auto px-4 py-12 max-w-5xl">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/account">
            <Button variant="ghost" size="icon" className="rounded-full">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="text-3xl font-heading font-bold uppercase tracking-tighter text-gray-900">
            I Miei Preferiti
          </h1>
        </div>

        {savedItems.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Heart className="w-10 h-10 text-gray-400" />
            </div>
            <h2 className="text-xl font-heading font-bold text-gray-900 mb-2">
              Nessun preferito
            </h2>
            <p className="text-gray-500 mb-6">
              Non hai ancora salvato nessun prodotto.
            </p>
            <Link href="/shop">
              <Button className="bg-gray-900 text-white hover:bg-gray-800">
                Scopri i prodotti
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {savedItems.map((product) => (
              <div 
                key={product.id} 
                className="group relative"
                data-testid={`saved-item-${product.id}`}
              >
                <Link href={`/product/${product.id}`}>
                  <div className="aspect-[3/4] bg-gray-100 rounded-lg overflow-hidden mb-3">
                    <img 
                      src={getProductImage(product)} 
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                </Link>
                
                <button
                  onClick={() => handleRemove(product.id)}
                  disabled={removingId === product.id}
                  className="absolute top-2 right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-md hover:bg-red-50 transition-colors"
                  data-testid={`remove-saved-${product.id}`}
                >
                  {removingId === product.id ? (
                    <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                  ) : (
                    <Trash2 className="w-4 h-4 text-red-500" />
                  )}
                </button>
                
                <div className="space-y-1">
                  <Link href={`/product/${product.id}`}>
                    <h3 className="font-medium text-gray-900 line-clamp-1 hover:underline">
                      {product.name}
                    </h3>
                  </Link>
                  {product.brand && (
                    <p className="text-sm text-gray-500">{product.brand}</p>
                  )}
                  <p className="font-bold text-gray-900">
                    €{getProductPrice(product).toFixed(2)}
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full mt-2 text-sm"
                    onClick={() => handleAddToCart(product)}
                    data-testid={`add-to-cart-${product.id}`}
                  >
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    Aggiungi al carrello
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
