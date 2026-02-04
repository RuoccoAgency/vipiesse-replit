import { useEffect, useState } from "react";
import { useSearch, useLocation } from "wouter";
import { CheckCircle, Loader2, XCircle, Home } from "lucide-react";
import { useCart } from "@/context/cart-context";
import { useToast } from "@/hooks/use-toast";

export function OrderSuccess() {
  const search = useSearch();
  const params = new URLSearchParams(search);
  const orderNumber = params.get("order");
  const sessionId = params.get("session_id");
  
  const { clearCart } = useCart();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [loading, setLoading] = useState(true);
  const [confirmedOrderNumber, setConfirmedOrderNumber] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(5);

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
          
          toast({
            title: "Pagamento completato con successo!",
            description: `Il tuo ordine ${confirmData.orderNumber} è stato confermato.`,
          });
        } else if (orderNumber) {
          setConfirmedOrderNumber(orderNumber);
          toast({
            title: "Ordine confermato!",
            description: `Il tuo ordine ${orderNumber} è stato registrato.`,
          });
        }
      } catch (err: any) {
        console.error('Order processing error:', err);
        setError(err.message || 'Si è verificato un errore');
      } finally {
        setLoading(false);
      }
    };

    processOrder();
  }, [orderNumber, sessionId, clearCart, toast]);

  useEffect(() => {
    if (!loading && !error && confirmedOrderNumber) {
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            navigate('/');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [loading, error, confirmedOrderNumber, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white pt-24 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-16 h-16 animate-spin text-green-600 mx-auto mb-4" />
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
        <div className="container mx-auto px-4 py-12 max-w-md">
          <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <XCircle className="w-10 h-10 text-red-600" />
            </div>
            <h1 className="text-2xl font-heading font-bold text-gray-900 mb-4">
              Errore nel Pagamento
            </h1>
            <p className="text-gray-600 mb-6">{error}</p>
            <button 
              onClick={() => navigate('/checkout')}
              className="w-full bg-gray-900 text-white py-3 px-6 rounded-lg font-medium hover:bg-gray-800 transition-colors"
            >
              Riprova
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pt-24">
      <div className="container mx-auto px-4 py-12 max-w-md">
        <div className="bg-green-50 border border-green-200 rounded-xl p-8 text-center">
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
            <CheckCircle className="w-14 h-14 text-green-600" />
          </div>
          
          <h1 className="text-3xl font-heading font-bold text-gray-900 mb-3">
            Pagamento Completato!
          </h1>
          
          <p className="text-gray-600 text-lg mb-4">
            Grazie per il tuo acquisto!
          </p>
          
          {confirmedOrderNumber && (
            <div className="bg-white rounded-lg p-4 mb-6 border border-green-200">
              <p className="text-sm text-gray-500 mb-1">Numero Ordine</p>
              <p className="text-xl font-mono font-bold text-gray-900">{confirmedOrderNumber}</p>
            </div>
          )}

          <p className="text-gray-500 text-sm mb-6">
            Riceverai una email di conferma con tutti i dettagli.
          </p>

          <div className="flex items-center justify-center gap-2 text-gray-600 mb-4">
            <Home className="w-4 h-4" />
            <span>Reindirizzamento alla home in <strong>{countdown}</strong> secondi...</span>
          </div>

          <button 
            onClick={() => navigate('/')}
            className="w-full bg-gray-900 text-white py-3 px-6 rounded-lg font-medium hover:bg-gray-800 transition-colors"
          >
            Vai alla Home Adesso
          </button>
        </div>
      </div>
    </div>
  );
}
