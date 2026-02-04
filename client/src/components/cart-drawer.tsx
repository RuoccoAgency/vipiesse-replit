import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetFooter, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ShoppingBag, X, Plus, Minus, Trash2 } from "lucide-react";
import { useCart } from "@/context/cart-context";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Link, useLocation } from "wouter";
import { useState } from "react";

export function CartDrawer({ triggerClassName }: { triggerClassName?: string }) {
  const { items, removeFromCart, updateQuantity, subtotal, shippingCost, total, itemsCount } = useCart();
  const [open, setOpen] = useState(false);
  const [, setLocation] = useLocation();

  const handleCheckout = () => {
    setOpen(false);
    setLocation("/checkout");
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className={`relative ${triggerClassName || 'hover:bg-gray-100 text-black'}`}>
          <ShoppingBag className="h-6 w-6" strokeWidth={1.5} />
          {itemsCount > 0 && (
            <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-600 text-white text-[10px] flex items-center justify-center rounded-full font-bold">
              {itemsCount}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:w-[400px] flex flex-col bg-white text-black p-0 border-l border-gray-200">
        <SheetHeader className="px-6 py-4 border-b border-gray-100">
          <SheetTitle className="font-heading text-xl">Il tuo Carrello ({itemsCount})</SheetTitle>
          <SheetDescription className="sr-only">Visualizza e modifica gli articoli nel tuo carrello</SheetDescription>
        </SheetHeader>
        
        <ScrollArea className="flex-1 px-6">
          {items.length === 0 ? (
            <div className="h-[50vh] flex flex-col items-center justify-center text-center space-y-4">
              <ShoppingBag className="h-12 w-12 text-gray-300" />
              <p className="text-gray-500">Il carrello è vuoto</p>
              <Button onClick={() => setOpen(false)} variant="outline" className="text-black border-black hover:bg-black hover:text-white">
                Inizia lo shopping
              </Button>
            </div>
          ) : (
            <div className="py-6 space-y-6">
              {items.map((item) => (
                <div key={`${item.product.id}-${item.product.variantId}-${item.size}`} className="flex gap-4">
                  <div className="h-24 w-20 flex-shrink-0 overflow-hidden rounded-sm bg-gray-100">
                    <img 
                      src={item.product.image} 
                      alt={item.product.name} 
                      className="h-full w-full object-cover object-center"
                    />
                  </div>
                  <div className="flex flex-1 flex-col justify-between">
                    <div>
                      <div className="flex justify-between text-base font-medium">
                        <h3 className="line-clamp-2 pr-4 text-sm uppercase tracking-wide">{item.product.name}</h3>
                        <p className="ml-4">€{(item.product.price * item.quantity).toFixed(2)}</p>
                      </div>
                      <p className="mt-1 text-sm text-gray-500">
                        {item.product.color && <span>{item.product.color} / </span>}
                        Taglia: {item.size}
                      </p>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center border border-gray-200 rounded-sm">
                        <button 
                          onClick={() => updateQuantity(item.product.id, item.size, item.quantity - 1, item.product.variantId)}
                          className="p-1 hover:bg-gray-100 disabled:opacity-50"
                          disabled={item.quantity <= 1}
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="w-8 text-center">{item.quantity}</span>
                        <button 
                          onClick={() => updateQuantity(item.product.id, item.size, item.quantity + 1, item.product.variantId)}
                          className="p-1 hover:bg-gray-100"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                      <button 
                        onClick={() => removeFromCart(item.product.id, item.size, item.product.variantId)}
                        className="font-medium text-red-500 hover:text-red-600 flex items-center text-xs uppercase"
                      >
                        Rimuovi
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {items.length > 0 && (
          <div className="border-t border-gray-100 bg-gray-50 p-6 space-y-4">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-gray-600">
                <p>Subtotale</p>
                <p>€{subtotal.toFixed(2)}</p>
              </div>
              <div className="flex justify-between text-gray-600">
                <p>Spedizione</p>
                <p>{shippingCost === 0 ? <span className="text-green-600 font-bold">GRATIS</span> : `€${shippingCost.toFixed(2)}`}</p>
              </div>
              <div className="flex justify-between text-base font-bold text-black border-t border-gray-200 pt-2">
                <p>Totale</p>
                <p>€{total.toFixed(2)}</p>
              </div>
            </div>
            <p className="text-xs text-gray-500 italic text-center">
              {shippingCost > 0 
                ? `Aggiungi altri €${(50 - subtotal).toFixed(2)} per la spedizione gratuita!`
                : "Spedizione gratuita applicata!"}
            </p>
            <Button onClick={handleCheckout} className="w-full bg-gray-900 hover:bg-gray-800 text-white font-heading uppercase tracking-widest h-12">
              Procedi al Checkout
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
