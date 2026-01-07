import React, { createContext, useContext, useState, useMemo } from 'react';
import { Product, SHIPPING_COST, SHIPPING_THRESHOLD } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';

export interface CartItem {
  product: Product;
  size: string;
  quantity: number;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product, size: string) => void;
  removeFromCart: (productId: string, size: string) => void;
  updateQuantity: (productId: string, size: string, quantity: number) => void;
  clearCart: () => void;
  itemsCount: number;
  subtotal: number;
  shippingCost: number;
  total: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const { toast } = useToast();

  const addToCart = (product: Product, size: string) => {
    setItems((prev) => {
      const existing = prev.find((item) => item.product.id === product.id && item.size === size);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id && item.size === size
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, size, quantity: 1 }];
    });
    toast({
      title: "Aggiunto al carrello",
      description: `${product.name} (Taglia ${size})`,
    });
  };

  const removeFromCart = (productId: string, size: string) => {
    setItems((prev) => prev.filter((item) => !(item.product.id === productId && item.size === size)));
  };

  const updateQuantity = (productId: string, size: string, quantity: number) => {
    if (quantity < 1) return;
    setItems((prev) =>
      prev.map((item) =>
        item.product.id === productId && item.size === size
          ? { ...item, quantity }
          : item
      )
    );
  };

  const clearCart = () => setItems([]);

  const itemsCount = useMemo(() => items.reduce((acc, item) => acc + item.quantity, 0), [items]);
  
  const subtotal = useMemo(() => 
    items.reduce((acc, item) => acc + item.product.price * item.quantity, 0), 
  [items]);

  const shippingCost = subtotal > 0 && subtotal < SHIPPING_THRESHOLD ? SHIPPING_COST : 0;
  
  const total = subtotal + shippingCost;

  return (
    <CartContext.Provider value={{ 
      items, 
      addToCart, 
      removeFromCart, 
      updateQuantity, 
      clearCart,
      itemsCount,
      subtotal,
      shippingCost,
      total
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
