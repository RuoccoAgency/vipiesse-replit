import { Link, useLocation } from "wouter";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu, Search, ShoppingBag, User } from "lucide-react";
import { useState, useEffect } from "react";
import { CartDrawer } from "./cart-drawer";
import { useCart } from "@/context/cart-context";
import { useAuth } from "@/context/auth-context";

import logoImage from "@assets/image_1767806762450.png";

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [location] = useLocation();
  const { itemsCount } = useCart();
  const { user } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);

  // Scroll listener for sticky/transparent behavior
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 40);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const closeMenu = () => setIsOpen(false);
  const isHome = location === "/";

  // Transparent behavior only on Home, otherwise always sticky white
  const isTransparent = isHome && !isScrolled;

  return (
    <nav className={`fixed top-0 z-50 w-full transition-all duration-300 ${
      isTransparent 
        ? "bg-transparent text-white border-transparent" 
        : "bg-white text-black border-b border-gray-100 shadow-sm"
    }`}>
      <div className="w-full px-6 md:px-8 h-20 flex items-center justify-between">
        {/* Left: Mobile Menu */}
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className={`hover:bg-white/10 ${isTransparent ? 'text-white' : 'text-black'}`}>
              <Menu className="h-8 w-8" strokeWidth={1.5} /> {/* Increased size */}
              <span className="sr-only">Menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[320px] sm:w-[380px] bg-white text-black p-0 overflow-y-auto border-r border-gray-100">
             <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-10">
               <div>
                 <img src={logoImage} alt="VIPIESSE" className="h-12 w-auto object-contain" />
                 <SheetDescription className="text-gray-400 text-xs uppercase tracking-widest mt-1">Ingrosso Calzature</SheetDescription>
               </div>
               {/* Close button is auto-added by SheetContent usually, but we can customize if needed. Default is fine. */}
             </div>
             
             <div className="flex flex-col py-6 space-y-8">
               
               {/* 1) E-SHOP */}
               <div className="px-8">
                 <h3 className="font-heading text-xl mb-4 font-bold border-b border-gray-100 pb-2">E-SHOP</h3>
                 <div className="flex flex-col space-y-3 pl-2">
                   <Link href="/shop/donna" onClick={closeMenu} className="text-gray-600 hover:text-black hover:translate-x-1 transition-all text-lg font-medium">Collezione Donna</Link>
                   <Link href="/shop/uomo" onClick={closeMenu} className="text-gray-600 hover:text-black hover:translate-x-1 transition-all text-lg font-medium">Collezione Uomo</Link>
                   <Link href="/shop/bambino" onClick={closeMenu} className="text-gray-600 hover:text-black hover:translate-x-1 transition-all text-lg font-medium">Collezione Bambino</Link>
                 </div>
               </div>

               {/* 2) OUTLET */}
               <div className="px-8">
                 <h3 className="font-heading text-xl mb-4 font-bold text-red-600 border-b border-red-100 pb-2">OUTLET</h3>
                 <div className="flex flex-col space-y-3 pl-2">
                   <Link href="/outlet/donna" onClick={closeMenu} className="text-gray-500 hover:text-red-600 hover:translate-x-1 transition-all text-lg font-medium">Collezione Donna</Link>
                   <Link href="/outlet/uomo" onClick={closeMenu} className="text-gray-500 hover:text-red-600 hover:translate-x-1 transition-all text-lg font-medium">Collezione Uomo</Link>
                   <Link href="/outlet/bambino" onClick={closeMenu} className="text-gray-500 hover:text-red-600 hover:translate-x-1 transition-all text-lg font-medium">Collezione Bambino</Link>
                 </div>
               </div>

               {/* 3) AREA BUSINESS */}
               <div className="px-8 bg-gray-50 py-6 mx-4 rounded-xl">
                 <h3 className="font-heading text-lg mb-4 font-bold text-gray-900">AREA BUSINESS</h3>
                 <div className="flex flex-col space-y-3">
                    <Link href="/login" onClick={closeMenu} className="text-gray-600 hover:text-black text-base flex items-center gap-2">
                      <User className="h-4 w-4" /> Accedi / Registrati
                    </Link>
                    <Link href="/business" onClick={closeMenu} className="text-gray-600 hover:text-black text-base font-medium">
                      Diventa Rivenditore
                    </Link>
                 </div>
               </div>

               {/* 4) SERVE AIUTO? */}
               <div className="px-8">
                 <h3 className="font-heading text-lg mb-4 font-bold text-gray-900">SERVE AIUTO?</h3>
                 <div className="grid grid-cols-1 gap-3 text-sm text-gray-500">
                    <Link href="/help/contattaci" onClick={closeMenu} className="hover:text-black transition-colors">Contattaci</Link>
                    <Link href="/help/taglie" onClick={closeMenu} className="hover:text-black transition-colors">Aiuto Taglie</Link>
                    <Link href="/help/condizioni" onClick={closeMenu} className="hover:text-black transition-colors">Condizioni di Vendita</Link>
                    <Link href="/help/pagamenti" onClick={closeMenu} className="hover:text-black transition-colors">Come Pagare</Link>
                    <Link href="/help/spedizioni-resi" onClick={closeMenu} className="hover:text-black transition-colors">Spedizioni e Resi</Link>
                 </div>
               </div>

               {/* 5) ALTRE SEZIONI */}
               <div className="px-8 pb-8 pt-4 mt-auto border-t border-gray-100">
                  <div className="flex flex-col space-y-2 text-xs text-gray-400 uppercase tracking-widest font-medium">
                    <Link href="/" onClick={closeMenu} className="hover:text-black transition-colors">La Nostra Storia</Link>
                    <Link href="/" onClick={closeMenu} className="hover:text-black transition-colors">Marchi</Link>
                  </div>
               </div>
             </div>
          </SheetContent>
        </Sheet>

        {/* Center: Logo */}
        <Link href="/" className="absolute left-1/2 -translate-x-1/2">
          <img 
            src={logoImage} 
            alt="VIPIESSE" 
            className={`h-30 w-auto object-contain transition-all duration-300 ${isTransparent ? 'brightness-0 invert' : ''}`}
          />
        </Link>

        {/* Right: Actions */}
        <div className="flex items-center space-x-2 sm:space-x-6">
          <Link href="/" className={`hidden md:block text-sm font-medium hover:underline ${isTransparent ? 'text-white' : 'text-black'}`}>
            Home
          </Link>
          <Link href="/business" className={`hidden md:block text-sm font-medium hover:underline ${isTransparent ? 'text-white' : 'text-black'}`}>
            Area Business
          </Link>
          
          <Link href={user ? "/account" : "/login"}>
             <Button variant="ghost" size="icon" className={`hover:bg-white/10 ${isTransparent ? 'text-white' : 'text-black'}`}>
               <User className="h-6 w-6" strokeWidth={1.5} />
             </Button>
          </Link>

          {/* Cart Trigger needs to handle color change internally or passed prop, 
              but CartDrawer trigger button is inside the component. 
              Let's pass className to CartDrawer to style the trigger. */}
          <div className={isTransparent ? 'text-white' : 'text-black'}>
            <CartDrawer triggerClassName={`hover:bg-white/10 ${isTransparent ? 'text-white' : 'text-black'}`} />
          </div>
        </div>
      </div>
    </nav>
  );
}
