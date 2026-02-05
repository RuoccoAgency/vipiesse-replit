import { useEffect, useState } from "react";
import { Link, useParams, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/auth-context";
import { 
  Loader2, Package, ArrowLeft, Truck, CheckCircle, Clock, 
  ExternalLink, MapPin, CreditCard, Phone, Mail 
} from "lucide-react";

interface OrderItem {
  productName: string;
  variantColor: string;
  variantSize: string;
  variantSku: string;
  quantity: number;
  priceCents: number;
  imageUrl?: string;
}

interface OrderWithItems {
  id: number;
  orderNumber: string;
  status: string;
  paymentMethod: string | null;
  totalCents: number;
  subtotalCents: number;
  shippingCents: number;
  createdAt: string;
  customerName: string;
  customerSurname?: string;
  customerEmail: string;
  customerPhone?: string;
  shippingAddress: string;
  shippingCity?: string;
  shippingCap?: string;
  shippingCountry?: string;
  estimatedDeliveryDate?: string;
  shippedAt?: string;
  deliveredAt?: string;
  carrier?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  items: OrderItem[];
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

const paymentMethodLabels: Record<string, string> = {
  stripe: "Carta di credito",
  bank_transfer: "Bonifico bancario",
};

export function OrderDetail() {
  const { orderNumber } = useParams<{ orderNumber: string }>();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [order, setOrder] = useState<OrderWithItems | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      setLocation("/login");
      return;
    }

    if (isAuthenticated && orderNumber) {
      fetchOrder();
    }
  }, [isAuthenticated, authLoading, orderNumber]);

  const fetchOrder = async () => {
    try {
      const res = await fetch(`/api/my/orders/${orderNumber}`, {
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        setOrder(data);
      } else {
        setError("Ordine non trovato");
      }
    } catch (err) {
      console.error("Error fetching order:", err);
      setError("Errore nel caricamento dell'ordine");
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

  if (error || !order) {
    return (
      <div className="min-h-screen bg-white pt-24">
        <div className="container mx-auto px-4 py-12 max-w-3xl text-center">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h1 className="text-2xl font-heading font-bold text-gray-900 mb-2">
            {error || "Ordine non trovato"}
          </h1>
          <Link href="/account/orders">
            <Button className="mt-4">Torna ai miei ordini</Button>
          </Link>
        </div>
      </div>
    );
  }

  const status = statusLabels[order.status] || { label: order.status, color: "bg-gray-100 text-gray-800" };
  const StatusIcon = status.icon;

  return (
    <div className="min-h-screen bg-white pt-24">
      <div className="container mx-auto px-4 py-12 max-w-3xl">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/account/orders">
            <Button variant="ghost" size="icon" className="rounded-full">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-heading font-bold uppercase tracking-tighter text-gray-900">
              Ordine {order.orderNumber}
            </h1>
            <p className="text-sm text-gray-500">{formatDate(order.createdAt)}</p>
          </div>
        </div>

        {/* Status Banner */}
        <div className={`rounded-xl p-4 mb-6 ${status.color.replace('text-', 'border-').replace('100', '200')} border`}>
          <div className="flex items-center gap-3">
            {StatusIcon && <StatusIcon className="w-6 h-6" />}
            <div>
              <p className="font-bold">{status.label}</p>
              {order.status === 'shipped' && order.shippedAt && (
                <p className="text-sm">Spedito il {formatDate(order.shippedAt)}</p>
              )}
              {order.status === 'delivered' && order.deliveredAt && (
                <p className="text-sm">Consegnato il {formatDate(order.deliveredAt)}</p>
              )}
              {(order.status === 'paid' || order.status === 'processing') && order.estimatedDeliveryDate && (
                <p className="text-sm">Consegna prevista: {formatDate(order.estimatedDeliveryDate)}</p>
              )}
            </div>
          </div>

          {/* Tracking Info */}
          {order.status === 'shipped' && order.carrier && (
            <div className="mt-4 pt-4 border-t border-purple-200">
              <div className="flex items-center gap-2 text-sm">
                <Truck className="w-4 h-4" />
                <span>Corriere: <strong>{order.carrier}</strong></span>
              </div>
              {order.trackingNumber && (
                <p className="text-sm mt-1">
                  Tracking: <span className="font-mono font-bold">{order.trackingNumber}</span>
                </p>
              )}
              {order.trackingUrl && (
                <a 
                  href={order.trackingUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 mt-2 text-sm bg-white text-purple-700 px-3 py-1.5 rounded-lg hover:bg-purple-50 transition-colors"
                >
                  Traccia spedizione <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          )}
        </div>

        {/* Order Items */}
        <div className="bg-gray-50 rounded-xl p-4 mb-6">
          <h2 className="font-bold text-gray-900 mb-4">Articoli ordinati</h2>
          <div className="space-y-4">
            {order.items.map((item, index) => (
              <div key={index} className="flex gap-4">
                {item.imageUrl && (
                  <img 
                    src={item.imageUrl} 
                    alt={item.productName}
                    className="w-16 h-16 object-cover rounded-lg bg-gray-200"
                  />
                )}
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{item.productName}</p>
                  <p className="text-sm text-gray-500">
                    {item.variantColor} - Taglia {item.variantSize}
                  </p>
                  <p className="text-sm text-gray-500">Quantità: {item.quantity}</p>
                </div>
                <p className="font-medium text-gray-900">
                  €{((item.priceCents * item.quantity) / 100).toFixed(2)}
                </p>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="border-t border-gray-200 mt-4 pt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Subtotale</span>
              <span>€{(order.subtotalCents / 100).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Spedizione</span>
              <span>{order.shippingCents === 0 ? 'Gratuita' : `€${(order.shippingCents / 100).toFixed(2)}`}</span>
            </div>
            <div className="flex justify-between font-bold text-lg pt-2 border-t border-gray-200">
              <span>Totale</span>
              <span>€{(order.totalCents / 100).toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Shipping Address */}
        <div className="bg-gray-50 rounded-xl p-4 mb-6">
          <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <MapPin className="w-4 h-4" /> Indirizzo di spedizione
          </h2>
          <p className="text-gray-700">
            {order.customerName} {order.customerSurname}
          </p>
          <p className="text-gray-700">{order.shippingAddress}</p>
          {order.shippingCity && order.shippingCap && (
            <p className="text-gray-700">{order.shippingCap} {order.shippingCity}</p>
          )}
          <p className="text-gray-700">{order.shippingCountry || 'Italia'}</p>
        </div>

        {/* Contact & Payment */}
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-gray-50 rounded-xl p-4">
            <h2 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
              <Mail className="w-4 h-4" /> Contatto
            </h2>
            <p className="text-gray-700">{order.customerEmail}</p>
            {order.customerPhone && (
              <p className="text-gray-700 flex items-center gap-1 mt-1">
                <Phone className="w-3 h-3" /> {order.customerPhone}
              </p>
            )}
          </div>

          <div className="bg-gray-50 rounded-xl p-4">
            <h2 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
              <CreditCard className="w-4 h-4" /> Pagamento
            </h2>
            <p className="text-gray-700">
              {order.paymentMethod ? paymentMethodLabels[order.paymentMethod] || order.paymentMethod : 'N/A'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
