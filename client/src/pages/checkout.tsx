import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useCart } from "@/context/cart-context";
import { Link, useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Loader2, Building2, CreditCard, AlertCircle } from "lucide-react";

const checkoutSchema = z.object({
  firstName: z.string().min(2, "Nome richiesto"),
  lastName: z.string().min(2, "Cognome richiesto"),
  address: z.string().min(5, "Indirizzo richiesto"),
  city: z.string().min(2, "Città richiesta"),
  zip: z.string().min(5, "CAP richiesto"),
  email: z.string().email("Email non valida"),
  phone: z.string().optional(),
});

type PaymentMethod = 'card' | 'bank';

export function Checkout() {
  const { items, total, subtotal, shippingCost, clearCart } = useCart();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');

  const form = useForm<z.infer<typeof checkoutSchema>>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      address: "",
      city: "",
      zip: "",
      email: "",
      phone: "",
    },
    mode: "onChange"
  });

  const isFormValid = form.formState.isValid;

  const handleStripeCheckout = async () => {
    const values = form.getValues();
    const validation = await form.trigger();
    if (!validation) return;

    setIsProcessing(true);
    try {
      const stripeItems = items.map((item) => ({
        variantId: item.product.variantId,
        quantity: item.quantity,
        name: item.product.name + (item.product.color ? ` - ${item.product.color}` : '') + ` (Tg. ${item.size})`,
        description: `SKU: ${item.product.sku || 'N/A'}`,
        priceCents: Math.round(item.product.price * 100),
      }));

      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: stripeItems,
          customerEmail: values.email,
          customerName: values.firstName,
          customerSurname: values.lastName,
          customerPhone: values.phone || '',
          shippingAddress: values.address,
          shippingCity: values.city,
          shippingCap: values.zip,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Errore durante la creazione del pagamento');
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error: any) {
      toast({
        title: "Errore",
        description: error.message || "Si è verificato un errore",
        variant: "destructive",
      });
      setIsProcessing(false);
    }
  };

  const handleBankTransfer = async () => {
    const values = form.getValues();
    const validation = await form.trigger();
    if (!validation) return;

    setIsProcessing(true);
    try {
      const orderItems = items.map((item) => ({
        variantId: item.product.variantId,
        quantity: item.quantity
      }));

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: orderItems,
          customerEmail: values.email,
          customerName: values.firstName,
          customerSurname: values.lastName,
          customerPhone: values.phone || null,
          shippingAddress: values.address,
          shippingCity: values.city,
          shippingCap: values.zip,
          status: "awaiting_bank",
          paymentMethod: "bank_transfer",
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Errore durante la creazione dell\'ordine');
      }

      clearCart();
      navigate(`/order/bank?order=${data.orderNumber}&total=${(data.totalCents / 100).toFixed(2)}`);
    } catch (error: any) {
      toast({
        title: "Errore",
        description: error.message || "Si è verificato un errore",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSubmit = () => {
    if (paymentMethod === 'card') {
      handleStripeCheckout();
    } else {
      handleBankTransfer();
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-white pt-24">
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-2xl font-heading mb-4 text-gray-900">Il tuo carrello è vuoto</h1>
          <Link href="/shop">
            <Button className="bg-gray-900 text-white hover:bg-gray-800">Torna allo shopping</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pt-20">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-heading uppercase font-bold mb-8 border-b border-gray-200 pb-4 text-gray-900">
          Checkout
        </h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
              <h2 className="text-lg font-heading font-bold mb-4 text-gray-900 flex items-center gap-2">
                <span className="w-6 h-6 bg-gray-900 text-white rounded-full flex items-center justify-center text-sm">1</span>
                Dati di Spedizione
              </h2>
              <Form {...form}>
                <form className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm text-gray-700">Nome *</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Mario" 
                              {...field} 
                              className="bg-white border-gray-300 focus:border-gray-900 h-10" 
                              data-testid="input-firstName" 
                            />
                          </FormControl>
                          <FormMessage className="text-xs" />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm text-gray-700">Cognome *</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Rossi" 
                              {...field} 
                              className="bg-white border-gray-300 focus:border-gray-900 h-10" 
                              data-testid="input-lastName" 
                            />
                          </FormControl>
                          <FormMessage className="text-xs" />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm text-gray-700">Email *</FormLabel>
                        <FormControl>
                          <Input 
                            type="email"
                            placeholder="mario@email.com" 
                            {...field} 
                            className="bg-white border-gray-300 focus:border-gray-900 h-10" 
                            data-testid="input-email" 
                          />
                        </FormControl>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm text-gray-700">Telefono</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="+39 333 1234567" 
                            {...field} 
                            className="bg-white border-gray-300 focus:border-gray-900 h-10" 
                            data-testid="input-phone" 
                          />
                        </FormControl>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm text-gray-700">Indirizzo *</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Via Roma 1" 
                            {...field} 
                            className="bg-white border-gray-300 focus:border-gray-900 h-10" 
                            data-testid="input-address" 
                          />
                        </FormControl>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm text-gray-700">Città *</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Napoli" 
                              {...field} 
                              className="bg-white border-gray-300 focus:border-gray-900 h-10" 
                              data-testid="input-city" 
                            />
                          </FormControl>
                          <FormMessage className="text-xs" />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="zip"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm text-gray-700">CAP *</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="80100" 
                              {...field} 
                              className="bg-white border-gray-300 focus:border-gray-900 h-10" 
                              data-testid="input-zip" 
                            />
                          </FormControl>
                          <FormMessage className="text-xs" />
                        </FormItem>
                      )}
                    />
                  </div>
                </form>
              </Form>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
              <h3 className="font-heading font-bold mb-4 text-gray-900 flex items-center gap-2">
                <span className="w-6 h-6 bg-gray-900 text-white rounded-full flex items-center justify-center text-sm">2</span>
                Riepilogo Ordine
              </h3>
              <div className="space-y-3 mb-4 max-h-60 overflow-y-auto">
                {items.map((item) => (
                  <div key={`${item.product.id}-${item.product.variantId}-${item.size}`} className="flex gap-3" data-testid={`order-item-${item.product.variantId}`}>
                    <div className="h-16 w-14 bg-gray-200 overflow-hidden rounded flex-shrink-0">
                      <img src={item.product.image} alt={item.product.name} className="h-full w-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium line-clamp-1 text-gray-900 text-sm">{item.product.name}</p>
                      <p className="text-gray-500 text-xs">
                        {item.product.color && `${item.product.color} / `}Tg: {item.size} x {item.quantity}
                      </p>
                      <p className="font-medium text-gray-900 text-sm mt-1">€{(item.product.price * item.quantity).toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="space-y-2 pt-4 border-t border-gray-200">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotale</span>
                  <span>€{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Spedizione</span>
                  <span className={shippingCost === 0 ? "text-green-600 font-medium" : ""}>
                    {shippingCost === 0 ? "Gratis" : `€${shippingCost.toFixed(2)}`}
                  </span>
                </div>
                {shippingCost > 0 && (
                  <p className="text-xs text-gray-500">
                    Spedizione gratuita per ordini sopra €50
                  </p>
                )}
                <div className="flex justify-between text-xl font-bold text-gray-900 pt-2 border-t border-gray-200">
                  <span>Totale</span>
                  <span>€{total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
              <h3 className="font-heading font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span className="w-6 h-6 bg-gray-900 text-white rounded-full flex items-center justify-center text-sm">3</span>
                Metodo di Pagamento
              </h3>
              
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('card')}
                  className={`w-full flex items-center space-x-3 p-4 border rounded-lg transition-all ${
                    paymentMethod === 'card' 
                      ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  data-testid="payment-method-card"
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    paymentMethod === 'card' ? 'bg-blue-600' : 'bg-gray-400'
                  }`}>
                    <CreditCard className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-left">
                    <span className="font-medium block">Carta di Credito / Debito</span>
                    <span className="text-xs text-gray-500">Pagamento sicuro con Stripe</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('bank')}
                  className={`w-full flex items-center space-x-3 p-4 border rounded-lg transition-all ${
                    paymentMethod === 'bank' 
                      ? 'border-green-500 bg-green-50 ring-2 ring-green-200' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  data-testid="payment-method-bank"
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    paymentMethod === 'bank' ? 'bg-green-600' : 'bg-gray-400'
                  }`}>
                    <Building2 className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-left">
                    <span className="font-medium block">Bonifico Bancario</span>
                    <span className="text-xs text-gray-500">Riceverai i dati bancari dopo la conferma</span>
                  </div>
                </button>
              </div>

              <div className="mt-6 pt-4 border-t border-gray-200">
                {!isFormValid && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-yellow-600" />
                    <span className="text-sm text-yellow-700">Compila tutti i campi richiesti per procedere</span>
                  </div>
                )}
                <Button 
                  type="button"
                  onClick={handleSubmit}
                  className={`w-full font-heading uppercase font-bold tracking-widest h-12 text-base disabled:opacity-50 ${
                    paymentMethod === 'card' 
                      ? 'bg-blue-600 text-white hover:bg-blue-700' 
                      : 'bg-gray-900 text-white hover:bg-gray-800'
                  }`}
                  disabled={!isFormValid || isProcessing}
                  data-testid="button-confirm-order"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Elaborazione...
                    </>
                  ) : paymentMethod === 'card' ? (
                    <>
                      <CreditCard className="w-4 h-4 mr-2" />
                      Paga con Carta - €{total.toFixed(2)}
                    </>
                  ) : (
                    <>
                      <Building2 className="w-4 h-4 mr-2" />
                      Conferma Ordine - €{total.toFixed(2)}
                    </>
                  )}
                </Button>
                <p className="text-xs text-center text-gray-500 mt-3">
                  {paymentMethod === 'card' 
                    ? 'Verrai reindirizzato alla pagina di pagamento sicuro Stripe'
                    : "L'ordine sarà confermato dopo la ricezione del bonifico bancario"
                  }
                </p>
              </div>
            </div>

            {isProcessing && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                <div className="bg-white p-8 rounded-lg shadow-xl text-center">
                  <Loader2 className="w-12 h-12 animate-spin text-gray-900 mx-auto mb-4" />
                  <p className="text-lg font-medium">
                    {paymentMethod === 'card' ? 'Reindirizzamento a Stripe...' : 'Creazione ordine...'}
                  </p>
                  <p className="text-gray-500 text-sm">Non chiudere questa pagina</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
