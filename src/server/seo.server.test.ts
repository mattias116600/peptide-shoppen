// @vitest-environment node
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import { getDb, resetDbForTests } from './db.server';
import { getAdminGroup, saveArticle, saveGroup, setGroupActive } from './catalog.server';
import { buildSitemap } from './sitemap.server';
import { absoluteUrl, clip, pageTitle, productDescription, seoHead } from '@/lib/seo';
import { formatPrice, productGroups, seedAccessoryGroups } from '@/lib/products';
import { seedArticles } from '@/lib/articles';

const metaOf = (head: ReturnType<typeof seoHead>, key: string) =>
  (head.meta.find(m => m['name'] === key || m['property'] === key) as { content?: string } | undefined)?.content;

describe('seoHead', () => {
  it('builds absolute canonical, Open Graph and Twitter tags with a default share image', () => {
    const head = seoHead({ title: 'Vanliga frågor', description: 'Svar.', path: '/faq' });
    expect(head.meta[0]).toEqual({ title: 'Vanliga frågor | Peptidesweden' });
    expect(head.links).toEqual([{ rel: 'canonical', href: 'https://peptidesweden.com/faq' }]);
    expect(metaOf(head, 'og:url')).toBe('https://peptidesweden.com/faq');
    expect(metaOf(head, 'og:image')).toBe('https://peptidesweden.com/og-image.jpg');
    expect(metaOf(head, 'og:image:width')).toBe('1200');
    expect(metaOf(head, 'twitter:card')).toBe('summary_large_image');
    expect(metaOf(head, 'twitter:image')).toBe('https://peptidesweden.com/og-image.jpg');
  });

  it('marks private pages noindex without a canonical', () => {
    const head = seoHead({ title: 'Kassa', description: 'x', path: '/kassa', noindex: true });
    expect(metaOf(head, 'robots')).toBe('noindex, follow');
    expect(head.links).toEqual([]);
  });

  it('adds structured data with a schema.org context', () => {
    const head = seoHead({ title: 'x', description: 'y', path: '/', jsonLd: [{ '@type': 'WebSite' }] });
    expect(head.meta.at(-1)).toEqual({ 'script:ld+json': { '@context': 'https://schema.org', '@type': 'WebSite' } });
  });

  it('keeps titles within ~60 characters and clips descriptions at a word', () => {
    expect(pageTitle('Kort')).toBe('Kort | Peptidesweden');
    const long = 'En väldigt lång rubrik som inte får plats med suffixet';
    expect(pageTitle(long)).toBe(long);
    const clipped = clip('ord '.repeat(60), 160);
    expect(clipped.length).toBeLessThanOrEqual(160);
    expect(clipped.endsWith('ord…')).toBe(true);
    expect(absoluteUrl('https://example.com/x')).toBe('https://example.com/x');
  });

  it('gives every seeded product a description long enough for search snippets', () => {
    for (const g of productGroups) {
      const d = clip(productDescription(g, formatPrice));
      expect(d.length, g.slug).toBeGreaterThanOrEqual(110);
      expect(d.length, g.slug).toBeLessThanOrEqual(160);
    }
  });

  it('describes accessories without research or CoA wording', () => {
    const d = productDescription(seedAccessoryGroups[0]!, formatPrice);
    expect(d).toContain('5 kr per styck');
    expect(d).not.toMatch(/Analysrapport|forskning/i);
  });

  it('keeps every seeded article title within the display limit', () => {
    for (const a of seedArticles) expect(pageTitle(a.metaTitle), a.slug).toMatch(/\| Peptidesweden$/);
  });
});

describe('sitemap', () => {
  beforeEach(() => resetDbForTests());
  const locs = () => [...buildSitemap().matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]!.replace('https://peptidesweden.com', ''));

  it('lists static pages, visible products and published articles from the database', () => {
    expect(buildSitemap()).toMatch(/^<\?xml version="1.0"/);
    const all = locs();
    expect(all).toEqual(expect.arrayContaining(['/', '/produkter', '/blogg', '/kopvillkor', '/integritetspolicy', '/produkter/bpc-157', '/blogg/vad-ar-peptider']));
    expect(all.some(l => l.startsWith('/kassa') || l.startsWith('/admin'))).toBe(false);
  });

  it('follows admin changes: new and hidden products, drafts', () => {
    const bpc = getAdminGroup('bpc-157')!;
    saveGroup({ ...bpc, slug: '', name: 'TB-500', variants: [{ slug: '', amount: '5 mg', price: 499, batch: '', coaUrl: '', active: true }] }, true);
    setGroupActive('mots-c', false);
    saveArticle({ slug: '', title: 'Utkast', metaTitle: '', description: '', category: '', intro: '', date: '2026-10-19', readTime: 1, image: '', imageAlt: '', keywords: [], productSlug: '', sections: [], published: false }, true);
    const all = locs();
    expect(all).toContain('/produkter/tb-500');
    expect(all).not.toContain('/produkter/mots-c');
    expect(all).not.toContain('/blogg/utkast');
  });
});

describe('shorter SEO titles for existing databases', () => {
  it('replaces untouched seeded titles and keeps titles the admin changed', () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'psw-seo-'));
    const file = path.join(dir, 'db.sqlite');
    resetDbForTests(file);
    const db = getDb();
    // Recreate the state of a shop seeded before this change.
    db.prepare("UPDATE articles SET meta_title = 'Vad är peptider? Guide om aminosyror och peptidbindningar' WHERE slug = 'vad-ar-peptider'").run();
    db.prepare("UPDATE articles SET meta_title = 'Min egen titel' WHERE slug = 'bpc-157-forskning'").run();
    db.prepare("DELETE FROM settings WHERE key = 'seo_titles_2026_10'").run();
    resetDbForTests(file);
    const title = (slug: string) => (getDb().prepare('SELECT meta_title FROM articles WHERE slug = ?').get(slug) as { meta_title: string }).meta_title;
    expect(title('vad-ar-peptider')).toBe('Vad är peptider? Aminosyror och bindningar');
    expect(title('bpc-157-forskning')).toBe('Min egen titel');
    resetDbForTests();
    rmSync(dir, { recursive: true, force: true });
  });
});

describe('icons', () => {
  it('ships the flag icons instead of the template logo', () => {
    const ico = readFileSync(path.resolve('public/favicon.ico'));
    expect(ico.readUInt16LE(4)).toBe(3); // 16, 32 and 48 px
    for (const f of ['icon.svg', 'icon-192.png', 'icon-512.png', 'icon-maskable-512.png', 'apple-touch-icon.png', 'og-image.jpg', 'manifest.webmanifest']) {
      expect(readFileSync(path.resolve('public', f)).length, f).toBeGreaterThan(100);
    }
    expect(JSON.parse(readFileSync(path.resolve('public/manifest.webmanifest'), 'utf8')).icons).toHaveLength(3);
  });
});
