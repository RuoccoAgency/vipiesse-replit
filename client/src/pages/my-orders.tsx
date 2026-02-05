import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/auth-context";
import { Loader2, Package, ArrowLeft, ChevronRight, Truck, CheckCircle, Clock, ExternalLink } from "lucide-react";

interface OrderItem {
  productName: string;
  variantColor: string;
  variantSize: string;
  quantity: number;
  priceCents: number;
  imageUrl?: string;
}

interface Order {
  id: number;
  orderNumber: string;
  status: string;
  totalCents: number;
  createdAt: string;
  estimatedDeliveryDate?: string;
  shippedAt?: string;
  deliveredAt?: string;
  carrier?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  items?: OrderItem[];
}

const statusLabels: Record<string, { label: string; color: string; icon?: React.ElementType }> = {
  pending_payment: { label: "In attesa di pagamento", color: "bg-yellow-100 text-yellow-800", icon: Clock },
  awaiting_bank: { label: "In attesa bonifico", color: "bg-blue-100 text-blue-800", icon: Clock },
  paid: { label: "Pagato", color: "bg-green-100 text-green-800", icon: CheckCircle },
  processing: { label: "In elaborazione", color: "bg-blue-100 text-blue-800", icon: Package },
  shipped: { label: "Spedito", color: "bg-purple-100 text-purple-800", icon: Truck },
  delivered: { label: "Consegnato", color: "bg-green-100 text-green-800", icon: CheckCircle },
  completed: { label: "Completato", color: "bg-gray-100 text-gray-800", icon: CheckCircle },
  cancelled: { label: "Annullato", color: "bg-red-100 text-red-800" },
  refunded: { label: "Rimborsato", color: "bg-orange-100 text-orange-800" },
  expired: { label: "Scaduto", color: "bg-gray-100 text-gray-600" },
};

export function MyOrders() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      setLocation("/login");
      return;
    }

    if (isAuthenticated) {
      fetchOrders();
    }
  }, [isAuthenticated, authLoading]);

  const fetchOrders = async () => {
    try {
      const res = await fetch("/api/my/orders", {
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("it-IT", {
      day: "numeric",
      month: "long",
      year: "numeric"
    });
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
      <div className="container mx-auto px-4 py-12 max-w-3xl">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/login">
            <Button variant="ghost" size="icon" className="rounded-full">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="text-3xl font-heading font-bold uppercase tracking-tighter text-gray-900">
            I Miei Ordini
          </h1>
        </div>

        {orders.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Package className="w-10 h-10 text-gray-400" />
            </div>
            <h2 className="text-xl font-heading font-bold text-gray-900 mb-2">
              Nessun ordine
            </h2>
            <p className="text-gray-500 mb-6">
              Non hai ancora effettuato ordini.
            </p>
            <Link href="/shop">
              <Button className="bg-gray-900 text-white hover:bg-gray-800">
                Inizia a fare shopping
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const status = statusLabels[order.status] || { label: order.status, color: "bg-gray-100 text-gray-800" };
              const StatusIcon = status.icon;
              
              return (
                <Link key={order.id} href={`/ordine/${order.orderNumber}`}>
                  <div 
                    className="bg-gray-50 border border-gray-200 rounded-xl p-4 hover:border-gray-300 transition-colors cursor-pointer"
                    data-testid={`order-${order.id}`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="font-mono font-bold text-gray-900">
                            {order.orderNumber}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1 ${status.color}`}>
                            {StatusIcon && <StatusIcon className="w-3 h-3" />}
                            {status.label}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 mb-2">
                          {formatDate(order.createdAt)}
                        </p>
                        <p className="font-bold text-gray-900">
                          €{(order.totalCents / 100).toFixed(2)}
                        </p>
                        
                        {/* Tracking info for shipped orders */}
                        {order.status === 'shipped' && (
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <div className="flex items-center gap-2 text-sm text-purple-700">
                              <Truck className="w-4 h-4" />
                              <span>Spedito con {order.carrier || 'BRT'}</span>
                              {order.trackingNumber && (
                                <span className="font-mono">#{order.trackingNumber}</span>
                              )}
                            </div>
                            {order.trackingNumber && (
                              <a 
                                href={order.trackingUrl || `https://vas.brt.it/vas/sped_det.hsm?tession=${order.trackingNumber}`}
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 mt-2 px-3 py-1.5 bg-purple-100 text-purple-700 rounded-md text-xs font-medium hover:bg-purple-200 transition-colors"
                                onClick={(e) => e.stopPropagation()}
                              >
                                Traccia spedizione <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                          </div>
                        )}
                        
                        {/* ETA for paid/processing orders */}
                        {(order.status === 'paid' || order.status === 'processing') && order.estimatedDeliveryDate && (
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <p className="text-sm text-gray-600">
                              <Clock className="w-4 h-4 inline mr-1" />
                              Consegna prevista: {formatDate(order.estimatedDeliveryDate)}
                            </p>
                          </div>
                        )}
                        
                        {/* Delivered confirmation */}
                        {order.status === 'delivered' && order.deliveredAt && (
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <p className="text-sm text-green-700 flex items-center gap-1">
                              <CheckCircle className="w-4 h-4" />
                              Consegnato il {formatDate(order.deliveredAt)}
                            </p>
                          </div>
                        )}
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0 mt-2" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
