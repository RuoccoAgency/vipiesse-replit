import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/auth-context";
import { Loader2, Package, Heart, ChevronRight, ShoppingBag, User, LogOut, Clock } from "lucide-react";
import type { ProductWithVariants, Order } from "@shared/schema";

interface DashboardData {
  orders: Order[];
  savedItems: ProductWithVariants[];
  orderCount: number;
  savedCount: number;
}

const statusLabels: Record<string, { label: string; color: string }> = {
  pending_payment: { label: "In attesa di pagamento", color: "bg-yellow-100 text-yellow-800" },
  awaiting_bank: { label: "In attesa bonifico", color: "bg-blue-100 text-blue-800" },
  awaiting_paypal: { label: "In attesa PayPal", color: "bg-blue-100 text-blue-800" },
  paid: { label: "Pagato", color: "bg-green-100 text-green-800" },
  shipped: { label: "Spedito", color: "bg-purple-100 text-purple-800" },
  completed: { label: "Completato", color: "bg-gray-100 text-gray-800" },
  cancelled: { label: "Annullato", color: "bg-red-100 text-red-800" },
};

export function Dashboard() {
  const { user, isAuthenticated, isLoading: authLoading, logout } = useAuth();
  const [, setLocation] = useLocation();
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      setLocation("/login");
      return;
    }

    if (isAuthenticated) {
      fetchDashboard();
    }
  }, [isAuthenticated, authLoading]);

  const fetchDashboard = async () => {
    try {
      const res = await fetch("/api/my/dashboard");
      if (res.ok) {
        const data = await res.json();
        setDashboard(data);
      }
    } catch (error) {
      console.error("Error fetching dashboard:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("it-IT", {
      day: "numeric",
      month: "short",
      year: "numeric"
    });
  };

  const handleLogout = async () => {
    await logout();
    setLocation("/");
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-white pt-24 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

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

  return (
    <div className="min-h-screen bg-gray-50 pt-24">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-heading font-bold uppercase tracking-tighter text-gray-900">
                Ciao, {user?.name}!
              </h1>
              <p className="text-gray-500 mt-1">Benvenuto nella tua area personale</p>
            </div>
            <Button
              variant="outline"
              onClick={handleLogout}
              className="text-gray-600 border-gray-300 hover:bg-gray-100"
              data-testid="button-logout"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Esci
            </Button>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Link href="/account/orders" className="block">
            <div className="bg-white rounded-xl border border-gray-200 p-6 hover:border-gray-300 hover:shadow-md transition-all cursor-pointer" data-testid="card-orders-summary">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gray-900 rounded-xl flex items-center justify-center">
                  <Package className="w-6 h-6 text-white" />
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </div>
              <h3 className="font-heading font-bold text-lg text-gray-900 mb-1">I Miei Ordini</h3>
              <p className="text-gray-500 text-sm">
                {dashboard?.orderCount === 0 
                  ? "Nessun ordine effettuato" 
                  : `${dashboard?.orderCount} ordini totali`}
              </p>
            </div>
          </Link>

          <Link href="/account/saved" className="block">
            <div className="bg-white rounded-xl border border-gray-200 p-6 hover:border-gray-300 hover:shadow-md transition-all cursor-pointer" data-testid="card-saved-summary">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-red-500 rounded-xl flex items-center justify-center">
                  <Heart className="w-6 h-6 text-white" />
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </div>
              <h3 className="font-heading font-bold text-lg text-gray-900 mb-1">Preferiti</h3>
              <p className="text-gray-500 text-sm">
                {dashboard?.savedCount === 0 
                  ? "Nessun prodotto salvato" 
                  : `${dashboard?.savedCount} prodotti salvati`}
              </p>
            </div>
          </Link>
        </div>

        {dashboard && dashboard.orders.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-heading font-bold text-lg text-gray-900 flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Ordini Recenti
              </h2>
              <Link href="/account/orders">
                <Button variant="ghost" size="sm" className="text-gray-600">
                  Vedi tutti <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>
            
            <div className="space-y-3">
              {dashboard.orders.map((order) => {
                const status = statusLabels[order.status] || { label: order.status, color: "bg-gray-100 text-gray-800" };
                
                return (
                  <div 
                    key={order.id} 
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                    data-testid={`dashboard-order-${order.id}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center">
                        <Package className="w-5 h-5 text-gray-500" />
                      </div>
                      <div>
                        <p className="font-mono font-bold text-gray-900 text-sm">{order.orderNumber}</p>
                        <p className="text-xs text-gray-500">{formatDate(order.createdAt as unknown as string)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${status.color}`}>
                        {status.label}
                      </span>
                      <p className="font-bold text-gray-900 text-sm mt-1">€{(order.totalCents / 100).toFixed(2)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {dashboard && dashboard.savedItems.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-heading font-bold text-lg text-gray-900 flex items-center gap-2">
                <Heart className="w-5 h-5" />
                Prodotti Preferiti
              </h2>
              <Link href="/account/saved">
                <Button variant="ghost" size="sm" className="text-gray-600">
                  Vedi tutti <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {dashboard.savedItems.map((product) => (
                <Link key={product.id} href={`/product/${product.id}`}>
                  <div 
                    className="group cursor-pointer" 
                    data-testid={`dashboard-saved-${product.id}`}
                  >
                    <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden mb-2">
                      <img 
                        src={getProductImage(product)} 
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    </div>
                    <p className="text-sm font-medium text-gray-900 line-clamp-1">{product.name}</p>
                    <p className="text-sm text-gray-600">€{getProductPrice(product).toFixed(2)}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {dashboard && dashboard.orders.length === 0 && dashboard.savedItems.length === 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <ShoppingBag className="w-10 h-10 text-gray-400" />
            </div>
            <h2 className="text-xl font-heading font-bold text-gray-900 mb-2">
              Inizia a fare shopping!
            </h2>
            <p className="text-gray-500 mb-6">
              Scopri la nostra collezione e salva i tuoi prodotti preferiti
            </p>
            <Link href="/shop">
              <Button className="bg-gray-900 text-white hover:bg-gray-800">
                Vai allo Shop
              </Button>
            </Link>
          </div>
        )}

        <div className="mt-8 bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-heading font-bold text-lg text-gray-900 flex items-center gap-2 mb-4">
            <User className="w-5 h-5" />
            Informazioni Account
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Nome</p>
              <p className="font-medium text-gray-900">{user?.name} {user?.surname}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Email</p>
              <p className="font-medium text-gray-900">{user?.email}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
