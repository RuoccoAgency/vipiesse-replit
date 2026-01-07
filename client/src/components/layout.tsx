import { Navbar } from "./navbar";
import { Footer } from "./footer";
import { AuthProvider } from "@/context/auth-context";
import { CartProvider } from "@/context/cart-context";
import { Toaster } from "@/components/ui/toaster";

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <CartProvider>
        <div className="min-h-screen flex flex-col bg-black text-white font-sans selection:bg-white selection:text-black">
          <Navbar />
          <main className="flex-grow">
            {children}
          </main>
          <Footer />
        </div>
        <Toaster />
      </CartProvider>
    </AuthProvider>
  );
}
