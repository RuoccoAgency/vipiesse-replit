import { useEffect, useState } from "react";
import { Link, useSearch } from "wouter";
import { Button } from "@/components/ui/button";
import { CheckCircle, Package, ArrowRight, Loader2, XCircle } from "lucide-react";
import { useCart } from "@/context/cart-context";

interface OrderDetails {
  orderNumber: string;
  status: string;
  totalCents: number;
  customerName: string;
  customerEmail: string;
  shippingAddress: string;
  items: Array<{
    productName: string;
    variantColor: string;
    variantSize: string;
    quantity: number;
    priceCents: number;
    imageUrl?: string;
  }>;
}

export function OrderSuccess() {
  const search = useSearch();
  const params = new URLSearchParams(search);
  const orderNumber = params.get("order");
  const sessionId = params.get("session_id");
  
  const { clearCart } = useCart();
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirmedOrderNumber, setConfirmedOrderNumber] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const processOrder = async () => {
      try {
        if (sessionId) {
          const sessionResponse = await fetch(`/api/stripe/session/${sessionId}`);
          const sessionData = await sessionResponse.json();

          if (!sessionResponse.ok) {
            throw new Error(sessionData.error || 'Errore nel recupero della sessione');
          }

          if (sessionData.payment_status !== 'paid') {
            throw new Error('Il pagamento non è stato completato');
          }

          const confirmResponse = await fetch('/api/stripe/confirm-order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionId }),
          });

          const confirmData = await confirmResponse.json();

          if (!confirmResponse.ok) {
            throw new Error(confirmData.error || 'Errore nella conferma dell\'ordine');
          }

          clearCart();
          setConfirmedOrderNumber(confirmData.orderNumber);
          
          const orderResponse = await fetch(`/api/orders/by-number/${confirmData.orderNumber}`);
          const orderData = await orderResponse.json();
          if (orderData.order) {
            setOrderDetails(orderData.order);
          }
        } else if (orderNumber) {
          const response = await fetch(`/api/orders/by-number/${orderNumber}`);
          const data = await response.json();
          if (data.order) {
            setOrderDetails(data.order);
            setConfirmedOrderNumber(orderNumber);
          }
        }
      } catch (err: any) {
        console.error('Order processing error:', err);
        setError(err.message || 'Si è verificato un errore');
      } finally {
        setLoading(false);
      }
    };

    processOrder();
  }, [orderNumber, sessionId, clearCart]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white pt-24 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <h2 className="text-xl font-heading font-bold text-gray-900 mb-2">
            {sessionId ? 'Conferma pagamento in corso...' : 'Caricamento...'}
          </h2>
          <p className="text-gray-600">Non chiudere questa pagina</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white pt-24">
        <div className="container mx-auto px-4 py-12 max-w-lg">
          <div className="text-center">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <XCircle className="w-10 h-10 text-red-600" />
            </div>
            <h1 className="text-2xl font-heading font-bold text-gray-900 mb-4">
              Errore
            </h1>
            <p className="text-gray-600 mb-8">{error}</p>
            <div className="space-y-3">
              <Link href="/checkout">
                <Button className="w-full bg-gray-900 text-white hover:bg-gray-800">
                  Riprova
                </Button>
              </Link>
              <Link href="/shop">
                <Button variant="outline" className="w-full">
                  Torna allo Shop
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pt-24">
      <div className="container mx-auto px-4 py-12 max-w-2xl">
        <div className="bg-green-50 border border-green-200 rounded-xl p-8 text-center mb-8">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          
          <h1 className="text-3xl font-heading font-bold text-gray-900 mb-4">
            {sessionId ? 'Pagamento Completato!' : 'Ordine Confermato!'}
          </h1>
          
          <p className="text-gray-600 text-lg mb-2">
            Grazie per il tuo acquisto!
          </p>
          
          {confirmedOrderNumber && (
            <p className="text-gray-900 font-medium text-xl">
              Ordine: <span className="font-mono">{confirmedOrderNumber}</span>
            </p>
          )}
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Package className="w-5 h-5 text-gray-600" />
            <h2 className="font-heading font-bold text-gray-900">Cosa succede ora?</h2>
          </div>
          
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="w-8 h-8 bg-gray-900 text-white rounded-full flex items-center justify-center flex-shrink-0 text-sm font-medium">
                1
              </div>
              <div>
                <p className="font-medium text-gray-900">Conferma via email</p>
                <p className="text-gray-600 text-sm">Riceverai una email di conferma con tutti i dettagli dell'ordine.</p>
              </div>
            </div>
            
            <div className="flex gap-4">
              <div className="w-8 h-8 bg-gray-900 text-white rounded-full flex items-center justify-center flex-shrink-0 text-sm font-medium">
                2
              </div>
              <div>
                <p className="font-medium text-gray-900">Preparazione</p>
                <p className="text-gray-600 text-sm">Prepareremo il tuo ordine con cura e lo spediremo il prima possibile.</p>
              </div>
            </div>
            
            <div className="flex gap-4">
              <div className="w-8 h-8 bg-gray-900 text-white rounded-full flex items-center justify-center flex-shrink-0 text-sm font-medium">
                3
              </div>
              <div>
                <p className="font-medium text-gray-900">Spedizione</p>
                <p className="text-gray-600 text-sm">Riceverai un'email con il codice di tracciamento quando l'ordine sarà spedito.</p>
              </div>
            </div>
          </div>
        </div>

        {orderDetails && (
          <div className="bg-white border border-gray-200 rounded-xl p-6 mb-8">
            <h2 className="font-heading font-bold text-gray-900 mb-4">Riepilogo Ordine</h2>
            
            <div className="space-y-3 mb-4">
              {orderDetails.items?.map((item, index) => (
                <div key={index} className="flex gap-3 py-2 border-b border-gray-100 last:border-0">
                  {item.imageUrl && (
                    <div className="w-12 h-12 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                      <img src={item.imageUrl} alt={item.productName} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 text-sm">{item.productName}</p>
                    <p className="text-gray-500 text-xs">
                      {item.variantColor} / Tg: {item.variantSize} x {item.quantity}
                    </p>
                  </div>
                  <p className="font-medium text-gray-900">
                    €{((item.priceCents * item.quantity) / 100).toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
            
            <div className="pt-4 border-t border-gray-200">
              <div className="flex justify-between text-lg font-bold text-gray-900">
                <span>Totale Pagato</span>
                <span>€{(orderDetails.totalCents / 100).toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/shop">
            <Button variant="outline" className="w-full sm:w-auto">
              Continua lo Shopping
            </Button>
          </Link>
          <Link href="/">
            <Button className="w-full sm:w-auto bg-gray-900 text-white hover:bg-gray-800">
              Torna alla Home
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
