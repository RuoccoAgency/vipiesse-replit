import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useCart } from "@/context/cart-context";
import { Link, useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect, useRef } from "react";
import { Loader2, Building2, CreditCard, Check, AlertCircle } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

declare global {
  interface Window {
    paypal?: any;
  }
}

const checkoutSchema = z.object({
  firstName: z.string().min(2, "Nome richiesto"),
  lastName: z.string().min(2, "Cognome richiesto"),
  address: z.string().min(5, "Indirizzo richiesto"),
  city: z.string().min(2, "Città richiesta"),
  zip: z.string().min(5, "CAP richiesto"),
  email: z.string().email("Email non valida"),
  phone: z.string().optional(),
});

type PaymentMethod = "paypal" | "bank_transfer" | null;

interface PaymentConfig {
  paypalEnabled: boolean;
  paypalClientId: string;
  bankIban: string;
  bankAccountName: string;
  bankName: string;
}

export function Checkout() {
  const { items, total, subtotal, shippingCost, clearCart } = useCart();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(null);
  const [paymentConfig, setPaymentConfig] = useState<PaymentConfig | null>(null);
  const [paypalLoaded, setPaypalLoaded] = useState(false);
  const [paypalError, setPaypalError] = useState<string | null>(null);
  const paypalContainerRef = useRef<HTMLDivElement>(null);
  const paypalButtonsRendered = useRef(false);

  useEffect(() => {
    fetch("/api/payment-config")
      .then(res => res.json())
      .then(data => setPaymentConfig(data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (paymentMethod === "paypal" && paymentConfig?.paypalEnabled && paymentConfig?.paypalClientId) {
      loadPayPalScript();
    }
  }, [paymentMethod, paymentConfig]);

  const loadPayPalScript = () => {
    if (window.paypal && typeof window.paypal.Buttons === 'function') {
      setPaypalLoaded(true);
      return;
    }

    const existingScript = document.getElementById("paypal-sdk");
    if (existingScript) {
      // Wait for existing script to load
      const checkPayPal = setInterval(() => {
        if (window.paypal && typeof window.paypal.Buttons === 'function') {
          clearInterval(checkPayPal);
          setPaypalLoaded(true);
        }
      }, 100);
      setTimeout(() => clearInterval(checkPayPal), 10000);
      return;
    }

    const script = document.createElement("script");
    script.id = "paypal-sdk";
    script.src = `https://www.paypal.com/sdk/js?client-id=${paymentConfig?.paypalClientId}&currency=EUR&intent=capture&components=buttons`;
    script.async = true;
    script.onload = () => {
      // Wait for PayPal to fully initialize
      const checkPayPal = setInterval(() => {
        if (window.paypal && typeof window.paypal.Buttons === 'function') {
          clearInterval(checkPayPal);
          setPaypalLoaded(true);
        }
      }, 100);
      setTimeout(() => {
        clearInterval(checkPayPal);
        if (!window.paypal || typeof window.paypal.Buttons !== 'function') {
          setPaypalError("PayPal non è stato caricato correttamente");
        }
      }, 5000);
    };
    script.onerror = () => setPaypalError("Errore nel caricamento di PayPal");
    document.body.appendChild(script);
  };

  useEffect(() => {
    if (paypalLoaded && paypalContainerRef.current && !paypalButtonsRendered.current && window.paypal && typeof window.paypal.Buttons === 'function') {
      paypalButtonsRendered.current = true;
      
      try {
        window.paypal.Buttons({
        style: {
          layout: 'vertical',
          color: 'gold',
          shape: 'rect',
          label: 'paypal',
          height: 45
        },
        createOrder: async () => {
          const values = form.getValues();
          const validation = await form.trigger();
          if (!validation) {
            throw new Error("Compila tutti i campi richiesti");
          }

          const response = await fetch("/paypal/order", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              items: items.map(item => ({
                variantId: item.product.variantId,
                quantity: item.quantity,
                name: item.product.name,
                priceCents: Math.round(item.product.price * 100)
              })),
              customerEmail: values.email,
              customerName: values.firstName,
              customerSurname: values.lastName,
              customerPhone: values.phone || null,
              shippingAddress: values.address,
              shippingCity: values.city,
              shippingCap: values.zip
            })
          });

          const data = await response.json();
          if (!response.ok) {
            throw new Error(data.error || "Errore nella creazione dell'ordine");
          }

          sessionStorage.setItem("pendingOrderNumber", data.orderNumber);
          return data.paypalOrderId;
        },
        onApprove: async (data: { orderID: string }) => {
          setIsProcessing(true);
          try {
            const response = await fetch(`/paypal/order/${data.orderID}/capture`, {
              method: "POST",
              headers: { "Content-Type": "application/json" }
            });

            const result = await response.json();
            if (!response.ok) {
              throw new Error(result.error || "Errore nella conferma del pagamento");
            }

            clearCart();
            navigate(`/order/success?order=${result.orderNumber}`);
          } catch (error: any) {
            toast({
              title: "Errore",
              description: error.message || "Errore nella conferma del pagamento",
              variant: "destructive"
            });
          } finally {
            setIsProcessing(false);
          }
        },
        onError: (err: any) => {
          console.error("PayPal Error:", err);
          toast({
            title: "Errore PayPal",
            description: "Si è verificato un errore con PayPal. Riprova.",
            variant: "destructive"
          });
        },
        onCancel: () => {
          toast({
            title: "Pagamento annullato",
            description: "Hai annullato il pagamento PayPal.",
          });
        }
      }).render(paypalContainerRef.current).catch((err: any) => {
          console.error("PayPal render error:", err);
          setPaypalError("Errore nel caricamento dei pulsanti PayPal");
        });
      } catch (err: any) {
        console.error("PayPal Buttons error:", err);
        setPaypalError("Errore nell'inizializzazione di PayPal");
      }
    }
  }, [paypalLoaded, items, clearCart, navigate, toast]);

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
          {/* LEFT COLUMN - Shipping Form */}
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

          {/* RIGHT COLUMN - Payment + Order Summary */}
          <div className="space-y-6">
            {/* Order Summary */}
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

            {/* Payment Methods */}
            <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
              <h3 className="font-heading font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span className="w-6 h-6 bg-gray-900 text-white rounded-full flex items-center justify-center text-sm">3</span>
                Metodo di Pagamento
              </h3>
              
              <RadioGroup 
                value={paymentMethod || ""} 
                onValueChange={(value) => {
                  setPaymentMethod(value as PaymentMethod);
                  paypalButtonsRendered.current = false;
                }}
                className="space-y-3"
              >
                {paymentConfig?.paypalEnabled && (
                  <div 
                    className={`flex items-center space-x-3 p-4 border rounded-lg cursor-pointer transition-all ${
                      paymentMethod === "paypal" 
                        ? "border-blue-500 bg-blue-50" 
                        : "border-gray-200 hover:border-gray-300 bg-white"
                    }`}
                    onClick={() => {
                      setPaymentMethod("paypal");
                      paypalButtonsRendered.current = false;
                    }}
                  >
                    <RadioGroupItem value="paypal" id="paypal" />
                    <Label htmlFor="paypal" className="flex items-center gap-3 cursor-pointer flex-1">
                      <div className="w-10 h-10 bg-[#003087] rounded-lg flex items-center justify-center">
                        <CreditCard className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <span className="font-medium block">PayPal o Carta</span>
                        <span className="text-xs text-gray-500">Paga in sicurezza con PayPal</span>
                      </div>
                    </Label>
                  </div>
                )}
                
                <div 
                  className={`flex items-center space-x-3 p-4 border rounded-lg cursor-pointer transition-all ${
                    paymentMethod === "bank_transfer" 
                      ? "border-green-500 bg-green-50" 
                      : "border-gray-200 hover:border-gray-300 bg-white"
                  }`}
                  onClick={() => setPaymentMethod("bank_transfer")}
                >
                  <RadioGroupItem value="bank_transfer" id="bank_transfer" />
                  <Label htmlFor="bank_transfer" className="flex items-center gap-3 cursor-pointer flex-1">
                    <div className="w-10 h-10 bg-gray-700 rounded-lg flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <span className="font-medium block">Bonifico Bancario</span>
                      <span className="text-xs text-gray-500">Riceverai i dati dopo la conferma</span>
                    </div>
                  </Label>
                </div>
              </RadioGroup>

              {/* PayPal Buttons Container */}
              {paymentMethod === "paypal" && paymentConfig?.paypalEnabled && (
                <div className="mt-6 pt-4 border-t border-gray-200">
                  {!isFormValid && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-yellow-600" />
                      <span className="text-sm text-yellow-700">Compila tutti i campi richiesti per procedere</span>
                    </div>
                  )}
                  {paypalError ? (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                      <AlertCircle className="w-6 h-6 text-red-500 mx-auto mb-2" />
                      <p className="text-red-700">{paypalError}</p>
                    </div>
                  ) : !paypalLoaded ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-gray-400 mr-2" />
                      <span className="text-gray-500">Caricamento PayPal...</span>
                    </div>
                  ) : (
                    <div ref={paypalContainerRef} className="min-h-[50px]" />
                  )}
                </div>
              )}

              {/* Bank Transfer Button */}
              {paymentMethod === "bank_transfer" && (
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <Button 
                    type="button"
                    onClick={handleBankTransfer}
                    className="w-full bg-gray-900 text-white hover:bg-gray-800 font-heading uppercase font-bold tracking-widest h-12 text-base disabled:opacity-50"
                    disabled={!isFormValid || isProcessing}
                    data-testid="button-confirm-bank"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Elaborazione...
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        Conferma Ordine - €{total.toFixed(2)}
                      </>
                    )}
                  </Button>
                </div>
              )}

              {!paymentMethod && (
                <p className="text-sm text-center text-gray-500 mt-4">
                  Seleziona un metodo di pagamento per continuare
                </p>
              )}
            </div>

            {isProcessing && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                <div className="bg-white p-8 rounded-lg shadow-xl text-center">
                  <Loader2 className="w-12 h-12 animate-spin text-gray-900 mx-auto mb-4" />
                  <p className="text-lg font-medium">Elaborazione pagamento...</p>
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
