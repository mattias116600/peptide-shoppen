// Builds sitemap.xml from the live catalogue and blog, so products and articles added in /admin
// are listed automatically. Hidden products and draft articles are left out.
import { listAdminGroups, listArticles } from './catalog.server';
import { productGroups } from '@/lib/products';
import { seedArticles } from '@/lib/articles';
import { absoluteUrl } from '@/lib/seo';

/** Indexable pages that are not products or articles. */
export const staticSitemapPages: [path: string, changefreq: string, priority: string][] = [
  ['/', 'weekly', '1.0'],
  ['/produkter', 'weekly', '0.9'],
  ['/blogg', 'weekly', '0.7'],
  ['/kalkylator', 'monthly', '0.6'],
  ['/faq', 'monthly', '0.5'],
  ['/om-oss', 'monthly', '0.5'],
  ['/kontakt', 'monthly', '0.4'],
  ['/kopvillkor', 'yearly', '0.3'],
  ['/integritetspolicy', 'yearly', '0.3'],
];

type Entry = { path: string; lastmod?: string | undefined; changefreq?: string; priority?: string };

function entries(): Entry[] {
  let products: Entry[];
  let articles: Entry[];
  try {
    products = listAdminGroups()
      .filter(g => g.active && g.variants.some(v => v.active))
      .map(g => ({ path: `/produkter/${g.slug}`, lastmod: g.updatedAt.slice(0, 10), changefreq: 'monthly', priority: '0.8' }));
    articles = listArticles().map(a => ({ path: `/blogg/${a.slug}`, lastmod: (a.updatedAt || a.date).slice(0, 10), priority: '0.6' }));
  } catch (error) {
    console.error('Sitemap: database unavailable, using starting content:', error);
    products = productGroups.map(g => ({ path: `/produkter/${g.slug}`, changefreq: 'monthly', priority: '0.8' }));
    articles = seedArticles.map(a => ({ path: `/blogg/${a.slug}`, lastmod: a.date, priority: '0.6' }));
  }
  return [...staticSitemapPages.map(([path, changefreq, priority]) => ({ path, changefreq, priority })), ...products, ...articles];
}

const escapeXml = (s: string) => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[c]!);

export function buildSitemap(): string {
  const urls = entries().map(e => [
    '  <url>',
    `    <loc>${escapeXml(absoluteUrl(e.path))}</loc>`,
    ...(e.lastmod ? [`    <lastmod>${e.lastmod}</lastmod>`] : []),
    ...(e.changefreq ? [`    <changefreq>${e.changefreq}</changefreq>`] : []),
    ...(e.priority ? [`    <priority>${e.priority}</priority>`] : []),
    '  </url>',
  ].join('\n'));
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`;
}
