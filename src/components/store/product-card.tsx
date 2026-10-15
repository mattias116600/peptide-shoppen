import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { Plus, ArrowUpRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { type ProductGroup, formatPrice } from '@/lib/products';
import { useStore } from './store-provider';
import vial from '@/assets/peptide-vial.webp.asset.json';

export function ProductCard({ product }: { product: ProductGroup }) {
  const { change, setCartOpen } = useStore();
  const [selected, setSelected] = useState(product.variants[0].slug);
  const variant = product.variants.find(v => v.slug === selected) ?? product.variants[0];
  const link = { to: '/produkter/$slug' as const, params: { slug: product.slug }, search: { styrka: variant.slug } };
  return (
    <article className="product-card">
      <Link {...link} className="product-photo" aria-label={`Visa ${product.name}`}>
        <img src={vial.url} width={1024} height={1024} alt={`${product.name} forskningspeptid`} loading="lazy" />
        {product.badge && <span className="product-badge">{product.badge}</span>}
        <span className="photo-arrow"><ArrowUpRight size={18} /></span>
        <span className="amount-tag">{variant.amount}</span>
      </Link>
      <div className="product-info">
        <div className="product-title"><Link {...link}><h3>{product.name}</h3></Link></div>
        <p>{product.description}</p>
        <div className="strength-options" role="radiogroup" aria-label={`Välj styrka för ${product.name}`}>
          {product.variants.map(v => (
            <Button variant="outline" key={v.slug} type="button" role="radio" aria-checked={v.slug === variant.slug} className="strength-chip" data-active={v.slug === variant.slug} onClick={() => setSelected(v.slug)}>{v.amount}</Button>
          ))}
        </div>
        <div className="product-bottom">
          <span>{formatPrice(variant.price)}</span>
          <Button variant="outline" size="sm" onClick={() => { change(variant.slug, 1); setCartOpen(true); }} aria-label={`Lägg ${product.name} ${variant.amount} i varukorg`}>Lägg i korg <Plus /></Button>
        </div>
      </div>
    </article>
  );
}
