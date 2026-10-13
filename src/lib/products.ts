export type Product = { slug: string; name: string; amount: string; price: number; category: string; description: string; badge?: string };
export const products: Product[] = [
  {slug:'retatrutide',name:'Retatrutide',amount:'10 mg',price:799,category:'Peptider',description:'Peptid för studier inom metabol forskning.',badge:'POPULÄR'},
  {slug:'bpc-157',name:'BPC-157',amount:'10 mg',price:399,category:'Peptider',description:'Pentadekapeptid för laboratoriestudier.',badge:'UTVALD'},
  {slug:'ghk-cu',name:'GHK-Cu',amount:'50 mg',price:399,category:'Peptider',description:'Koppartripeptid för forskning inom hudbiologi.'},
  {slug:'ipamorelin-cjc',name:'Ipamorelin + CJC-1295',amount:'5 mg + 5 mg',price:649,category:'Blends',description:'En kombination av två forskningspeptider.',badge:'BLEND'},
  {slug:'tb-500',name:'TB-500',amount:'10 mg',price:399,category:'Peptider',description:'Peptid för studier av cellulära processer.'},
  {slug:'mots-c',name:'MOTS-C',amount:'10 mg',price:339,category:'Peptider',description:'Mitokondriell peptid för metabol forskning.'},
];
export const formatPrice = (value: number) => `${new Intl.NumberFormat('sv-SE').format(value)} kr`;
export type CartItem = { slug: string; quantity: number };
export function updateCart(items: CartItem[], slug: string, delta: number): CartItem[] {
  const existing = items.find(item => item.slug === slug);
  if (!existing) return delta > 0 && products.some(p => p.slug === slug) ? [...items, {slug,quantity:delta}] : items;
  return items.map(item => item.slug === slug ? {...item,quantity:item.quantity + delta} : item).filter(item => item.quantity > 0);
}
export function cartTotal(items: CartItem[]) { return items.reduce((total,item) => total + (products.find(p => p.slug === item.slug)?.price ?? 0) * item.quantity,0); }
