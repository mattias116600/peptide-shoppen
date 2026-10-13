import { createContext, useContext, useState, type ReactNode } from 'react';
import { type CartItem, updateCart } from '@/lib/products';
const StoreContext = createContext<{items: CartItem[]; change: (slug: string,delta: number) => void; cartOpen: boolean; setCartOpen: (open: boolean) => void} | null>(null);
export function StoreProvider({children}:{children: ReactNode}) {
  const [items,setItems] = useState<CartItem[]>([]);
  const [cartOpen,setCartOpen] = useState(false);
  return <StoreContext.Provider value={{items,change:(slug,delta)=>setItems(current=>updateCart(current,slug,delta)),cartOpen,setCartOpen}}>{children}</StoreContext.Provider>;
}
export function useStore() { const store = useContext(StoreContext); if (!store) throw new Error('Store provider is missing'); return store; }
