export type Product = { slug: string; group: string; name: string; amount: string; price: number; category: string; description: string; badge?: string };
export const products: Product[] = [
  {slug:'retatrutide-10',group:'retatrutide',name:'Retatrutide',amount:'10 mg',price:899,category:'Peptider',description:'Peptid för studier inom metabol forskning.',badge:'POPULÄR'},
  {slug:'retatrutide-15',group:'retatrutide',name:'Retatrutide',amount:'15 mg',price:1199,category:'Peptider',description:'Peptid för studier inom metabol forskning.'},
  {slug:'retatrutide-20',group:'retatrutide',name:'Retatrutide',amount:'20 mg',price:1499,category:'Peptider',description:'Peptid för studier inom metabol forskning.'},
  {slug:'retatrutide-30',group:'retatrutide',name:'Retatrutide',amount:'30 mg',price:2099,category:'Peptider',description:'Peptid för studier inom metabol forskning.'},
  {slug:'retatrutide-60',group:'retatrutide',name:'Retatrutide',amount:'60 mg',price:3799,category:'Peptider',description:'Peptid för studier inom metabol forskning.'},
  {slug:'ghk-cu-50',group:'ghk-cu',name:'GHK-Cu',amount:'50 mg',price:399,category:'Peptider',description:'Koppartripeptid för forskning inom hudbiologi.',badge:'UTVALD'},
  {slug:'ghk-cu-100',group:'ghk-cu',name:'GHK-Cu',amount:'100 mg',price:699,category:'Peptider',description:'Koppartripeptid för forskning inom hudbiologi.'},
  {slug:'mots-c-40',group:'mots-c',name:'MOTS-C',amount:'40 mg',price:649,category:'Peptider',description:'Mitokondriell peptid för metabol forskning.'},
  {slug:'bpc-157-10',group:'bpc-157',name:'BPC-157',amount:'10 mg',price:399,category:'Peptider',description:'Pentadekapeptid för laboratoriestudier.'},
  {slug:'bpc-157-20',group:'bpc-157',name:'BPC-157',amount:'20 mg',price:649,category:'Peptider',description:'Pentadekapeptid för laboratoriestudier.'},
  {slug:'bpc-157-tb-500-20',group:'bpc-157-tb-500',name:'BPC-157 + TB-500',amount:'20 mg',price:799,category:'Blends',description:'En kombination av två forskningspeptider.',badge:'BLEND'},
];
export type ProductGroup = { slug: string; name: string; category: string; description: string; badge?: string | undefined; variants: [Product, ...Product[]] };
export const productGroups: ProductGroup[] = products.reduce<ProductGroup[]>((groups, p) => {
  const g = groups.find(x => x.slug === p.group);
  if (g) { g.variants.push(p); if (p.badge && !g.badge) g.badge = p.badge; }
  else groups.push({ slug: p.group, name: p.name, category: p.category, description: p.description, badge: p.badge, variants: [p] });
  return groups;
}, []);
export const findGroup = (slug: string) => productGroups.find(g => g.slug === slug);
export const formatPrice = (value: number) => `${new Intl.NumberFormat('sv-SE').format(value)} kr`;
export type CartItem = { slug: string; quantity: number };
export function updateCart(items: CartItem[], slug: string, delta: number): CartItem[] {
  const existing = items.find(item => item.slug === slug);
  if (!existing) return delta > 0 && products.some(p => p.slug === slug) ? [...items, {slug,quantity:delta}] : items;
  return items.map(item => item.slug === slug ? {...item,quantity:item.quantity + delta} : item).filter(item => item.quantity > 0);
}
export function cartTotal(items: CartItem[]) { return items.reduce((total,item) => total + (products.find(p => p.slug === item.slug)?.price ?? 0) * item.quantity,0); }
