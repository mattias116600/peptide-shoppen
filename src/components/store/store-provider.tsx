import { createContext, useContext, useState, type ReactNode } from 'react';
import { type CartItem, type Product, type ProductGroup, updateCart } from '@/lib/products';

export type Catalog = { products: Product[]; groups: ProductGroup[] };
const StoreContext = createContext<{items: CartItem[]; change: (slug: string,delta: number) => void; clear: () => void; cartOpen: boolean; setCartOpen: (open: boolean) => void; catalog: Catalog} | null>(null);
export function StoreProvider({children, catalog}:{children: ReactNode; catalog: Catalog}) {
  const [items,setItems] = useState<CartItem[]>([]);
  const [cartOpen,setCartOpen] = useState(false);
  // Strengths removed or hidden in the admin drop out of the cart.
  const live = items.filter(i => catalog.products.some(p => p.slug === i.slug));
  return <StoreContext.Provider value={{items: live,change:(slug,delta)=>setItems(current=>updateCart(current,slug,delta,catalog.products)),clear:()=>setItems([]),cartOpen,setCartOpen,catalog}}>{children}</StoreContext.Provider>;
}
export function useStore() { const store = useContext(StoreContext); if (!store) throw new Error('Store provider is missing'); return store; }
export const useCatalog = () => useStore().catalog;
