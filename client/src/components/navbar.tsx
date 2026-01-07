import { Link, useLocation } from "wouter";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu, Search, ShoppingBag, User } from "lucide-react";
import { useState, useEffect } from "react";
import { CartDrawer } from "./cart-drawer";
import { useCart } from "@/context/cart-context";
import { useAuth } from "@/context/auth-context";

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
          <SheetContent side="left" className="w-[300px] sm:w-[350px] bg-white text-black p-0 overflow-y-auto">
             <div className="p-6 border-b border-gray-100">
               <SheetTitle className="font-heading text-2xl tracking-tighter mb-2">VIPIESSE</SheetTitle>
               <SheetDescription className="text-gray-500">Ingrosso Calzature</SheetDescription>
             </div>
             
             <div className="flex flex-col py-4">
               {/* E-SHOP Section */}
               <div className="px-6 py-2">
                 <h3 className="font-heading text-lg mb-2">E-SHOP</h3>
                 <div className="flex flex-col space-y-2 pl-4 border-l border-gray-200">
                   <Link href="/shop/donna" onClick={closeMenu} className="text-gray-600 hover:text-black transition-colors hover:underline">Collezione Donna</Link>
                   <Link href="/shop/uomo" onClick={closeMenu} className="text-gray-600 hover:text-black transition-colors hover:underline">Collezione Uomo</Link>
                   <Link href="/shop/bambino" onClick={closeMenu} className="text-gray-600 hover:text-black transition-colors hover:underline">Collezione Bambino</Link>
                 </div>
               </div>

               {/* OUTLET Section */}
               <div className="px-6 py-4">
                 <h3 className="font-heading text-lg mb-2 text-red-600">OUTLET</h3>
                 <div className="flex flex-col space-y-2 pl-4 border-l border-red-100">
                   <Link href="/outlet/donna" onClick={closeMenu} className="text-gray-600 hover:text-red-600 transition-colors hover:underline">Collezione Donna</Link>
                   <Link href="/outlet/uomo" onClick={closeMenu} className="text-gray-600 hover:text-red-600 transition-colors hover:underline">Collezione Uomo</Link>
                   <Link href="/outlet/bambino" onClick={closeMenu} className="text-gray-600 hover:text-red-600 transition-colors hover:underline">Collezione Bambino</Link>
                 </div>
               </div>

               <div className="px-6 py-4 mt-auto border-t border-gray-100 bg-gray-50">
                  <Link href="/business" onClick={closeMenu} className="block py-2 font-medium">Area Business</Link>
                  <Link href="/help/contattaci" onClick={closeMenu} className="block py-2 text-sm text-gray-500">Serve aiuto?</Link>
               </div>
             </div>
          </SheetContent>
        </Sheet>

        {/* Center: Logo */}
        <Link href="/" className="absolute left-1/2 -translate-x-1/2">
          <span className={`font-heading text-4xl font-bold tracking-tighter cursor-pointer select-none transition-colors ${isTransparent ? 'text-white drop-shadow-md' : 'text-black'}`}>
            VIPIESSE
          </span>
        </Link>

        {/* Right: Actions */}
        <div className="flex items-center space-x-2 sm:space-x-6">
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
