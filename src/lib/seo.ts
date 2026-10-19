// Shared search and social tags. Every page builds its head through `seoHead`, so titles, absolute
// canonical URLs, Open Graph/Twitter tags and structured data stay consistent.
import { supportInfo } from './products';

export const SITE_URL = ((import.meta.env['VITE_SITE_URL'] as string | undefined) || 'https://peptidesweden.com').replace(/\/+$/, '');
export const SITE_NAME = 'Peptidesweden';
export const DEFAULT_DESCRIPTION = 'Peptider för laboratorieforskning med analysrapport per batch. Skickas diskret med PostNord, leverans 1–3 arbetsdagar.';
export const DEFAULT_SHARE_IMAGE: ShareImage = { url: '/og-image.jpg', width: 1200, height: 630, alt: 'Peptidesweden – peptider för laboratorieforskning' };

export type ShareImage = { url: string; width?: number; height?: number; alt: string };
type Meta = Record<string, unknown>;

export const absoluteUrl = (pathOrUrl: string) => (/^https?:\/\//.test(pathOrUrl) ? pathOrUrl : `${SITE_URL}${pathOrUrl.startsWith('/') ? '' : '/'}${pathOrUrl}`);

/** "Title | Peptidesweden" when it fits in ~60 characters (Google's display limit), otherwise the title alone. */
export function pageTitle(title: string) {
  const full = `${title} | ${SITE_NAME}`;
  return full.length <= 60 ? full : title;
}

/** Shortens text at a word boundary so search snippets are not cut mid-word. */
export function clip(text: string, max = 160) {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max - 1);
  return `${cut.slice(0, Math.max(cut.lastIndexOf(' '), max * 0.6)).replace(/[\s,.;:–-]+$/, '')}…`;
}

export function seoHead(opts: {
  title: string;
  description: string;
  path: string;
  type?: 'website' | 'article' | 'product';
  image?: ShareImage;
  noindex?: boolean;
  jsonLd?: object[];
  extraMeta?: Meta[];
}) {
  const title = pageTitle(opts.title);
  const description = clip(opts.description);
  const url = absoluteUrl(opts.path);
  const image = opts.image ?? DEFAULT_SHARE_IMAGE;
  const meta: Meta[] = [
    { title },
    { name: 'description', content: description },
    ...(opts.noindex ? [{ name: 'robots', content: 'noindex, follow' }] : []),
    { property: 'og:type', content: opts.type ?? 'website' },
    { property: 'og:title', content: title },
    { property: 'og:description', content: description },
    { property: 'og:url', content: url },
    { property: 'og:image', content: absoluteUrl(image.url) },
    { property: 'og:image:alt', content: image.alt },
    ...(image.width && image.height ? [{ property: 'og:image:width', content: String(image.width) }, { property: 'og:image:height', content: String(image.height) }] : []),
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: title },
    { name: 'twitter:description', content: description },
    { name: 'twitter:image', content: absoluteUrl(image.url) },
    { name: 'twitter:image:alt', content: image.alt },
    ...(opts.extraMeta ?? []),
    ...(opts.jsonLd ?? []).map(data => ({ 'script:ld+json': { '@context': 'https://schema.org', ...data } })),
  ];
  return { meta, links: opts.noindex ? [] : [{ rel: 'canonical', href: url }] };
}

// ---------- Structured data ----------

export const organizationLd = () => ({
  '@type': 'Organization',
  '@id': `${SITE_URL}/#organization`,
  name: SITE_NAME,
  url: `${SITE_URL}/`,
  logo: { '@type': 'ImageObject', url: absoluteUrl('/icon-512.png'), width: 512, height: 512 },
  sameAs: [supportInfo.url],
});

export const websiteLd = () => ({
  '@type': 'WebSite',
  '@id': `${SITE_URL}/#website`,
  name: SITE_NAME,
  url: `${SITE_URL}/`,
  inLanguage: 'sv-SE',
  publisher: { '@id': `${SITE_URL}/#organization` },
});

export const breadcrumbLd = (items: [name: string, path: string][]) => ({
  '@type': 'BreadcrumbList',
  itemListElement: items.map(([name, path], i) => ({ '@type': 'ListItem', position: i + 1, name, item: absoluteUrl(path) })),
});

// ---------- Page-specific helpers ----------

/** A search snippet for a product that names its strengths and starting price, not just the one-line blurb. */
export function productDescription(p: { name: string; description: string; kind?: string; variants: { amount: string; price: number }[] }, formatPrice: (n: number) => string) {
  const min = Math.min(...p.variants.map(v => v.price));
  const amounts = p.variants.map(v => v.amount).join(', ');
  if (p.kind === 'tillbehor') return `${p.description.replace(/\.?$/, '.')} ${formatPrice(min)} per styck – välj antal själv. Leverans med PostNord 1–3 dagar.`;
  return `${p.description.replace(/\.?$/, '.')} ${p.name} finns i ${amounts} från ${formatPrice(min)}. Analysrapport per batch, leverans med PostNord 1–3 dagar. Endast för forskning.`;
}
