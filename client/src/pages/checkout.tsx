import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useCart } from "@/context/cart-context";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { Loader2, Building2, ExternalLink, CreditCard } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

const checkoutSchema = z.object({
  firstName: z.string().min(2, "Nome richiesto"),
  lastName: z.string().min(2, "Cognome richiesto"),
  address: z.string().min(5, "Indirizzo richiesto"),
  city: z.string().min(2, "Città richiesta"),
  zip: z.string().min(5, "CAP richiesto"),
  email: z.string().email("Email non valida"),
  phone: z.string().optional(),
});

type PaymentMethod = "paypal_me" | "bank_transfer" | null;

interface PaymentConfig {
  paypalMeUrl: string;
  bankIban: string;
  bankAccountName: string;
  bankName: string;
}

type CheckoutStep = "form" | "paypal_pending" | "bank_confirmed";

export function Checkout() {
  const { items, total, subtotal, shippingCost, clearCart } = useCart();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(null);
  const [paymentConfig, setPaymentConfig] = useState<PaymentConfig | null>(null);
  const [step, setStep] = useState<CheckoutStep>("form");
  const [confirmedOrderId, setConfirmedOrderId] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/payment-config")
      .then(res => res.json())
      .then(data => setPaymentConfig(data))
      .catch(() => {});
  }, []);

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
  });

  const isFormValid = form.formState.isValid;
  const canSubmit = isFormValid && paymentMethod !== null;

  const createOrder = async (values: z.infer<typeof checkoutSchema>, status: string = "pending") => {
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
        customerName: `${values.firstName} ${values.lastName}`,
        customerPhone: values.phone || null,
        shippingAddress: `${values.address}, ${values.zip} ${values.city}`,
        status: status,
        paymentMethod: paymentMethod,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Errore durante la creazione dell\'ordine');
    }
    return data;
  };

  const handlePayPalMe = async () => {
    const values = form.getValues();
    if (!form.formState.isValid) {
      form.trigger();
      return;
    }

    if (!paymentConfig?.paypalMeUrl) {
      toast({
        title: "Errore",
        description: "PayPal non è configurato. Contatta il negozio.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    try {
      const data = await createOrder(values, "pending");
      setConfirmedOrderId(data.orderId);
      
      const paypalUrl = `${paymentConfig.paypalMeUrl}/${total.toFixed(2)}EUR`;
      window.open(paypalUrl, '_blank');
      
      setStep("paypal_pending");
      clearCart();
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

  const handleBankTransfer = async () => {
    const values = form.getValues();
    if (!form.formState.isValid) {
      form.trigger();
      return;
    }

    setIsProcessing(true);
    try {
      const data = await createOrder(values, "pending_bank_transfer");
      setConfirmedOrderId(data.orderId);
      setStep("bank_confirmed");
      clearCart();
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

  const handleSubmit = async () => {
    if (paymentMethod === "paypal_me") {
      await handlePayPalMe();
    } else if (paymentMethod === "bank_transfer") {
      await handleBankTransfer();
    }
  };

  // PayPal pending payment screen
  if (step === "paypal_pending") {
    return (
      <div className="container mx-auto px-4 py-12 pt-24 max-w-2xl">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-8 text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CreditCard className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-2xl font-heading font-bold text-gray-900 mb-4">Pagamento PayPal</h1>
          <p className="text-gray-600 mb-6">
            Si è aperta una nuova finestra per completare il pagamento su PayPal.
            <br />
            Il tuo ordine <span className="font-bold">#{confirmedOrderId}</span> è stato registrato.
          </p>
          
          <div className="bg-white border border-blue-200 rounded-lg p-6 text-left mb-6">
            <h3 className="font-heading font-bold text-gray-900 mb-3">Istruzioni:</h3>
            <ol className="list-decimal list-inside space-y-2 text-gray-600">
              <li>Completa il pagamento di <span className="font-bold">€{total.toFixed(2)}</span> su PayPal</li>
              <li>Nella nota, inserisci: <span className="font-mono bg-gray-100 px-2 py-1 rounded">Ordine #{confirmedOrderId}</span></li>
              <li>Dopo aver pagato, torna qui</li>
            </ol>
          </div>
          
          <p className="text-sm text-gray-500 mb-6">
            Riceverai una conferma via email appena il pagamento sarà verificato.
          </p>
          
          <div className="flex gap-4 justify-center flex-wrap">
            <Button 
              onClick={() => window.open(`${paymentConfig?.paypalMeUrl}/${total.toFixed(2)}EUR`, '_blank')}
              className="bg-[#003087] hover:bg-[#001f5c] text-white"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Apri PayPal
            </Button>
            <Link href="/">
              <Button variant="outline">
                Ho pagato - Torna alla Home
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Bank transfer confirmation screen
  if (step === "bank_confirmed") {
    return (
      <div className="container mx-auto px-4 py-12 pt-24 max-w-2xl">
        <div className="bg-green-50 border border-green-200 rounded-lg p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-heading font-bold text-gray-900 mb-4">Ordine Confermato!</h1>
          <p className="text-gray-600 mb-6">
            Il tuo ordine <span className="font-bold">#{confirmedOrderId}</span> è stato registrato con successo.
          </p>
          
          <div className="bg-white border border-gray-200 rounded-lg p-6 text-left mb-6">
            <h3 className="font-heading font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Dati per il Bonifico
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between flex-wrap gap-2">
                <span className="text-gray-500">Intestatario:</span>
                <span className="font-medium">{paymentConfig?.bankAccountName || "VIPIESSE"}</span>
              </div>
              <div className="flex justify-between flex-wrap gap-2">
                <span className="text-gray-500">IBAN:</span>
                <span className="font-mono font-medium text-sm">{paymentConfig?.bankIban || "Contattaci"}</span>
              </div>
              <div className="flex justify-between flex-wrap gap-2">
                <span className="text-gray-500">Banca:</span>
                <span className="font-medium">{paymentConfig?.bankName || "-"}</span>
              </div>
              <div className="flex justify-between flex-wrap gap-2 pt-2 border-t border-gray-200">
                <span className="text-gray-500">Causale:</span>
                <span className="font-bold font-mono bg-yellow-100 px-2 py-1 rounded">ORDINE #{confirmedOrderId}</span>
              </div>
              <div className="flex justify-between flex-wrap gap-2">
                <span className="text-gray-500">Importo:</span>
                <span className="font-bold text-lg text-green-600">€{total.toFixed(2)}</span>
              </div>
            </div>
          </div>
          
          <p className="text-sm text-gray-500 mb-6">
            Riceverai una conferma via email appena il pagamento sarà verificato.
          </p>
          
          <Link href="/">
            <Button className="bg-gray-900 text-white hover:bg-gray-800">
              Torna alla Home
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-heading mb-4">Il tuo carrello è vuoto</h1>
        <Link href="/shop">
          <Button>Torna allo shopping</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 pt-24">
      <h1 className="text-3xl font-heading uppercase font-bold mb-8 border-b border-gray-200 pb-4 text-gray-900">Checkout</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* LEFT COLUMN - Shipping Form */}
        <div>
          <h2 className="text-lg font-heading font-bold mb-4 text-gray-900">Dati di Spedizione</h2>
          <Form {...form}>
            <form className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Nome *</FormLabel>
                      <FormControl>
                        <Input placeholder="Mario" {...field} className="bg-white border-gray-300 focus:border-gray-900 h-9 text-sm" data-testid="input-firstName" />
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
                      <FormLabel className="text-xs">Cognome *</FormLabel>
                      <FormControl>
                        <Input placeholder="Rossi" {...field} className="bg-white border-gray-300 focus:border-gray-900 h-9 text-sm" data-testid="input-lastName" />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Email *</FormLabel>
                      <FormControl>
                        <Input placeholder="mario@email.com" {...field} className="bg-white border-gray-300 focus:border-gray-900 h-9 text-sm" data-testid="input-email" />
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
                      <FormLabel className="text-xs">Telefono (opzionale)</FormLabel>
                      <FormControl>
                        <Input placeholder="+39 333 1234567" {...field} className="bg-white border-gray-300 focus:border-gray-900 h-9 text-sm" data-testid="input-phone" />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Indirizzo *</FormLabel>
                    <FormControl>
                      <Input placeholder="Via Roma 1" {...field} className="bg-white border-gray-300 focus:border-gray-900 h-9 text-sm" data-testid="input-address" />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Città *</FormLabel>
                      <FormControl>
                        <Input placeholder="Napoli" {...field} className="bg-white border-gray-300 focus:border-gray-900 h-9 text-sm" data-testid="input-city" />
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
                      <FormLabel className="text-xs">CAP *</FormLabel>
                      <FormControl>
                        <Input placeholder="80100" {...field} className="bg-white border-gray-300 focus:border-gray-900 h-9 text-sm" data-testid="input-zip" />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />
              </div>
            </form>
          </Form>
        </div>

        {/* RIGHT COLUMN - Payment + Order Summary */}
        <div className="space-y-6">
          {/* Payment Methods */}
          <div className="bg-gray-50 p-6 border border-gray-200 rounded-lg">
            <h3 className="font-heading font-bold text-gray-900 mb-4">Metodo di Pagamento</h3>
            
            <RadioGroup 
              value={paymentMethod || ""} 
              onValueChange={(value) => setPaymentMethod(value as PaymentMethod)}
              className="space-y-3"
            >
              <div className={`flex items-center space-x-3 p-3 border rounded-lg cursor-pointer transition-all ${paymentMethod === "paypal_me" ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300"}`}>
                <RadioGroupItem value="paypal_me" id="paypal_me" />
                <Label htmlFor="paypal_me" className="flex items-center gap-2 cursor-pointer flex-1">
                  <div className="w-8 h-8 bg-[#003087] rounded flex items-center justify-center">
                    <span className="text-white text-xs font-bold">PP</span>
                  </div>
                  <span className="font-medium">PayPal / Carta (PayPal)</span>
                </Label>
              </div>
              
              <div className={`flex items-center space-x-3 p-3 border rounded-lg cursor-pointer transition-all ${paymentMethod === "bank_transfer" ? "border-green-500 bg-green-50" : "border-gray-200 hover:border-gray-300"}`}>
                <RadioGroupItem value="bank_transfer" id="bank_transfer" />
                <Label htmlFor="bank_transfer" className="flex items-center gap-2 cursor-pointer flex-1">
                  <Building2 className="w-6 h-6 text-gray-600" />
                  <span className="font-medium">Bonifico Bancario</span>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Order Summary */}
          <div className="bg-gray-50 p-6 border border-gray-200 rounded-lg">
            <h3 className="font-heading font-bold mb-4 border-b border-gray-200 pb-2 text-gray-900">Riepilogo Ordine</h3>
            <div className="space-y-3 mb-4 max-h-48 overflow-y-auto">
              {items.map((item) => (
                <div key={`${item.product.id}-${item.product.variantId}-${item.size}`} className="flex gap-3 text-sm" data-testid={`order-item-${item.product.variantId}`}>
                  <div className="h-12 w-10 bg-gray-200 overflow-hidden rounded flex-shrink-0">
                    <img src={item.product.image} alt={item.product.name} className="h-full w-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium line-clamp-1 text-gray-900 text-xs">{item.product.name}</p>
                    <p className="text-gray-500 text-xs">
                      {item.product.color && `${item.product.color} / `}Tg: {item.size} x {item.quantity}
                    </p>
                  </div>
                  <p className="font-medium text-gray-900 text-sm">€{(item.product.price * item.quantity).toFixed(2)}</p>
                </div>
              ))}
            </div>
            
            <div className="space-y-1 pt-3 border-t border-gray-200 text-sm">
              <div className="flex justify-between text-gray-500">
                <span>Subtotale</span>
                <span>€{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-500">
                <span>Spedizione</span>
                <span>{shippingCost === 0 ? "Gratis" : `€${shippingCost.toFixed(2)}`}</span>
              </div>
              <div className="flex justify-between text-lg font-bold text-gray-900 pt-2">
                <span>Totale</span>
                <span>€{total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <Button 
            type="button"
            onClick={handleSubmit}
            className="w-full bg-gray-900 text-white hover:bg-gray-800 font-heading uppercase font-bold tracking-widest h-12 text-base disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!canSubmit || isProcessing}
            data-testid="button-submit-order"
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Elaborazione...
              </>
            ) : paymentMethod === "paypal_me" ? (
              <>
                <ExternalLink className="w-4 h-4 mr-2" />
                Paga ora - €{total.toFixed(2)}
              </>
            ) : paymentMethod === "bank_transfer" ? (
              "Conferma Ordine"
            ) : (
              "Seleziona metodo di pagamento"
            )}
          </Button>
          
          {!paymentMethod && (
            <p className="text-xs text-center text-gray-500">
              Seleziona un metodo di pagamento per continuare
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
