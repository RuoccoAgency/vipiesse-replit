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
import { Loader2 } from "lucide-react";

const checkoutSchema = z.object({
  firstName: z.string().min(2, "Nome richiesto"),
  lastName: z.string().min(2, "Cognome richiesto"),
  address: z.string().min(5, "Indirizzo richiesto"),
  city: z.string().min(2, "Città richiesta"),
  zip: z.string().min(5, "CAP richiesto"),
  email: z.string().email("Email non valida"),
  phone: z.string().optional(),
});

export function Checkout() {
  const { items, total, subtotal, shippingCost, clearCart } = useCart();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

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

  const onSubmit = async (values: z.infer<typeof checkoutSchema>) => {
    setIsProcessing(true);
    
    try {
      const orderItems = items.map((item) => ({
        variantId: item.product.variantId,
        quantity: item.quantity
      }));

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: orderItems,
          customerEmail: values.email,
          customerName: `${values.firstName} ${values.lastName}`,
          customerPhone: values.phone || null,
          shippingAddress: `${values.address}, ${values.zip} ${values.city}`,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Errore durante la creazione dell\'ordine');
      }

      toast({
        title: "Ordine Confermato!",
        description: `Grazie ${values.firstName}, il tuo ordine #${data.orderId} è stato confermato.`,
      });
      
      clearCart();
      setLocation("/");
    } catch (error: any) {
      toast({
        title: "Errore",
        description: error.message || 'Si è verificato un errore durante il checkout',
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

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
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-3xl font-heading uppercase font-bold mb-8 border-b border-neutral-800 pb-4">Checkout</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div>
          <h2 className="text-xl font-heading mb-6">Dati di Spedizione</h2>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome</FormLabel>
                      <FormControl>
                        <Input placeholder="Mario" {...field} className="bg-neutral-900 border-neutral-800 focus:border-white transition-colors" data-testid="input-firstName" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cognome</FormLabel>
                      <FormControl>
                        <Input placeholder="Rossi" {...field} className="bg-neutral-900 border-neutral-800 focus:border-white transition-colors" data-testid="input-lastName" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="mario.rossi@email.com" {...field} className="bg-neutral-900 border-neutral-800 focus:border-white transition-colors" data-testid="input-email" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefono (opzionale)</FormLabel>
                    <FormControl>
                      <Input placeholder="+39 333 1234567" {...field} className="bg-neutral-900 border-neutral-800 focus:border-white transition-colors" data-testid="input-phone" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Indirizzo</FormLabel>
                    <FormControl>
                      <Input placeholder="Via Roma 1" {...field} className="bg-neutral-900 border-neutral-800 focus:border-white transition-colors" data-testid="input-address" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Città</FormLabel>
                      <FormControl>
                        <Input placeholder="Napoli" {...field} className="bg-neutral-900 border-neutral-800 focus:border-white transition-colors" data-testid="input-city" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="zip"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CAP</FormLabel>
                      <FormControl>
                        <Input placeholder="80100" {...field} className="bg-neutral-900 border-neutral-800 focus:border-white transition-colors" data-testid="input-zip" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Button 
                type="submit" 
                className="w-full bg-white text-black hover:bg-gray-200 font-heading uppercase font-bold tracking-widest h-12 text-lg"
                disabled={isProcessing}
                data-testid="button-submit-order"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Elaborazione...
                  </>
                ) : (
                  `Conferma Ordine - €${total.toFixed(2)}`
                )}
              </Button>
            </form>
          </Form>
        </div>

        <div className="bg-neutral-900 p-8 h-fit border border-neutral-800">
           <h3 className="font-heading text-lg mb-6 border-b border-neutral-800 pb-2">Riepilogo Ordine</h3>
           <div className="space-y-4 mb-6">
             {items.map((item) => (
               <div key={`${item.product.id}-${item.product.variantId}-${item.size}`} className="flex gap-4 text-sm" data-testid={`order-item-${item.product.variantId}`}>
                 <div className="h-16 w-12 bg-gray-800 overflow-hidden rounded">
                   <img src={item.product.image} alt={item.product.name} className="h-full w-full object-cover" />
                 </div>
                 <div className="flex-1">
                   <p className="font-medium line-clamp-1">{item.product.name}</p>
                   <p className="text-neutral-400 text-xs">
                     {item.product.color && `${item.product.color} / `}Taglia: {item.size} x {item.quantity}
                   </p>
                   {item.product.sku && (
                     <p className="text-neutral-500 text-xs">SKU: {item.product.sku}</p>
                   )}
                 </div>
                 <p className="font-medium">€{(item.product.price * item.quantity).toFixed(2)}</p>
               </div>
             ))}
           </div>
           
           <div className="space-y-2 pt-4 border-t border-neutral-800 text-sm">
             <div className="flex justify-between text-neutral-400">
               <span>Subtotale</span>
               <span>€{subtotal.toFixed(2)}</span>
             </div>
             <div className="flex justify-between text-neutral-400">
               <span>Spedizione</span>
               <span>{shippingCost === 0 ? "Gratis" : `€${shippingCost.toFixed(2)}`}</span>
             </div>
             <div className="flex justify-between text-xl font-bold text-white pt-2">
               <span>Totale</span>
               <span>€{total.toFixed(2)}</span>
             </div>
           </div>
        </div>
      </div>
    </div>
  );
}
