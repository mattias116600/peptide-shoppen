import { Link } from '@tanstack/react-router';
import { Plus, ArrowUpRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { type Product, formatPrice } from '@/lib/products';
import { useStore } from './store-provider';
import vial from '@/assets/peptide-vial.jpg';
export function ProductCard({product}:{product:Product}) {
 const {change,setCartOpen} = useStore();
 return <article className="product-card"><Link to="/produkter/$slug" params={{slug:product.slug}} className="product-photo" aria-label={`Visa ${product.name}`}><img src={vial} width={1024} height={1024} alt={`${product.name} forskningspeptid`} loading="lazy" />{product.badge && <span className="product-badge">{product.badge}</span>}<span className="photo-arrow"><ArrowUpRight size={18}/></span><span className="amount-tag">{product.amount}</span></Link><div className="product-info"><div className="product-title"><Link to="/produkter/$slug" params={{slug:product.slug}}><h3>{product.name}</h3></Link><span>{product.amount}</span></div><p>{product.description}</p><div className="product-bottom"><span>{formatPrice(product.price)}</span><Button variant="outline" size="sm" onClick={()=>{change(product.slug,1);setCartOpen(true)}} aria-label={`Lägg ${product.name} i varukorg`}>Lägg i korg <Plus/></Button></div></div></article>
}
