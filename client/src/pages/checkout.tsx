import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useCart } from "@/context/cart-context";
import { Link, useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

const checkoutSchema = z.object({
  firstName: z.string().min(2, "Nome richiesto"),
  lastName: z.string().min(2, "Cognome richiesto"),
  address: z.string().min(5, "Indirizzo richiesto"),
  city: z.string().min(2, "Città richiesta"),
  zip: z.string().min(5, "CAP richiesto"),
  email: z.string().email("Email non valida"),
  card: z.string().min(16, "Numero carta incompleto").max(16, "Numero carta troppo lungo"),
});

export function Checkout() {
  const { items, total, subtotal, shippingCost, clearCart } = useCart();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof checkoutSchema>>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      address: "",
      city: "",
      zip: "",
      email: "",
      card: "",
    },
  });

  const onSubmit = (values: z.infer<typeof checkoutSchema>) => {
    // Mock processing
    setTimeout(() => {
      toast({
        title: "Ordine Confermato!",
        description: `Grazie ${values.firstName}, il tuo ordine è in arrivo.`,
      });
      clearCart();
      setLocation("/");
    }, 1500);
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
        {/* FORM */}
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
                        <Input placeholder="Mario" {...field} className="bg-neutral-900 border-neutral-800 focus:border-white transition-colors" />
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
                        <Input placeholder="Rossi" {...field} className="bg-neutral-900 border-neutral-800 focus:border-white transition-colors" />
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
                      <Input placeholder="mario.rossi@email.com" {...field} className="bg-neutral-900 border-neutral-800 focus:border-white transition-colors" />
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
                      <Input placeholder="Via Roma 1" {...field} className="bg-neutral-900 border-neutral-800 focus:border-white transition-colors" />
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
                        <Input placeholder="Napoli" {...field} className="bg-neutral-900 border-neutral-800 focus:border-white transition-colors" />
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
                        <Input placeholder="80100" {...field} className="bg-neutral-900 border-neutral-800 focus:border-white transition-colors" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="pt-6 border-t border-neutral-800">
                <h2 className="text-xl font-heading mb-6">Pagamento</h2>
                <div className="bg-neutral-900 p-4 rounded mb-4 border border-neutral-800">
                  <p className="text-sm text-neutral-400 mb-2">Simulazione Pagamento</p>
                  <FormField
                    control={form.control}
                    name="card"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Numero Carta</FormLabel>
                        <FormControl>
                          <Input placeholder="0000 0000 0000 0000" maxLength={16} {...field} className="bg-black border-neutral-700 focus:border-white transition-colors" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <Button type="submit" className="w-full bg-white text-black hover:bg-gray-200 font-heading uppercase font-bold tracking-widest h-12 text-lg">
                Conferma Ordine - €{total.toFixed(2)}
              </Button>
            </form>
          </Form>
        </div>

        {/* ORDER SUMMARY */}
        <div className="bg-neutral-900 p-8 h-fit border border-neutral-800">
           <h3 className="font-heading text-lg mb-6 border-b border-neutral-800 pb-2">Riepilogo Ordine</h3>
           <div className="space-y-4 mb-6">
             {items.map((item) => (
               <div key={`${item.product.id}-${item.size}`} className="flex gap-4 text-sm">
                 <div className="h-16 w-12 bg-gray-800 overflow-hidden">
                   <img src={item.product.image} alt={item.product.name} className="h-full w-full object-cover" />
                 </div>
                 <div className="flex-1">
                   <p className="font-medium line-clamp-1">{item.product.name}</p>
                   <p className="text-neutral-400">Taglia: {item.size} x {item.quantity}</p>
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
