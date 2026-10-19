// Server-only catalogue and blog storage.
import { getDb, nowIso, transaction } from './db.server';
import { OrderError } from './errors.server';
import type { Product, ProductGroup, ProductKind } from '@/lib/products';
import type { Article } from '@/lib/articles';
import type { AdminArticle, AdminProductGroup, ArticleInput, ProductGroupInput } from '@/lib/catalog';

type GroupRow = { slug: string; name: string; category: string; description: string; badge: string; image: string; featured: number; active: number; about: string; specs: string; kind: string; quantity_presets: string; sort_order: number; updated_at: string };
type VariantRow = { slug: string; group_slug: string; amount: string; price: number; batch: string; coa_url: string; active: number; sort_order: number };
type ArticleRow = { slug: string; title: string; meta_title: string; description: string; category: string; intro: string; date: string; read_time: number; image: string; image_alt: string; keywords: string; product_slug: string; sections: string; published: number; updated_at: string };

const parseJson = <T,>(text: string, fallback: T): T => {
  try {
    return JSON.parse(text) as T;
  } catch {
    return fallback;
  }
};

function toProduct(g: GroupRow, v: VariantRow): Product {
  return {
    slug: v.slug, group: g.slug, name: g.name, amount: v.amount, price: v.price, category: g.category, description: g.description,
    ...(g.badge ? { badge: g.badge } : {}), ...(v.batch ? { batch: v.batch } : {}), ...(v.coa_url ? { coaUrl: v.coa_url } : {}),
  };
}

const kindOf = (g: GroupRow): ProductKind => (g.kind === 'tillbehor' ? 'tillbehor' : 'peptid');
const presetsOf = (g: GroupRow) => parseJson<number[]>(g.quantity_presets, []).filter(n => Number.isInteger(n) && n > 0);

function toAdminGroup(g: GroupRow, variants: VariantRow[]): AdminProductGroup {
  return {
    slug: g.slug, name: g.name, category: g.category, description: g.description, badge: g.badge, image: g.image,
    featured: g.featured === 1, active: g.active === 1, about: parseJson<string[]>(g.about, []), specs: parseJson<[string, string][]>(g.specs, []),
    kind: kindOf(g), quantityPresets: presetsOf(g),
    sortOrder: g.sort_order, updatedAt: g.updated_at,
    variants: variants.map(v => ({ slug: v.slug, amount: v.amount, price: v.price, batch: v.batch, coaUrl: v.coa_url, active: v.active === 1 })),
  };
}

function loadGroups() {
  const db = getDb();
  const groups = db.prepare('SELECT * FROM product_groups ORDER BY sort_order, name').all() as GroupRow[];
  const variants = db.prepare('SELECT * FROM product_variants ORDER BY sort_order, rowid').all() as VariantRow[];
  return groups.map(g => ({ g, variants: variants.filter(v => v.group_slug === g.slug) }));
}

/** What the storefront shows: active products that have at least one active strength. */
export function getStorefrontCatalog(): { products: Product[]; groups: ProductGroup[] } {
  const products: Product[] = [];
  const groups: ProductGroup[] = [];
  for (const { g, variants } of loadGroups()) {
    if (g.active !== 1) continue;
    const live = variants.filter(v => v.active === 1).map(v => toProduct(g, v));
    const [first, ...rest] = live;
    if (!first) continue;
    products.push(first, ...rest);
    groups.push({
      slug: g.slug, name: g.name, category: g.category, description: g.description, ...(g.badge ? { badge: g.badge } : {}),
      image: g.image, featured: g.featured === 1, about: parseJson<string[]>(g.about, []), specs: parseJson<[string, string][]>(g.specs, []),
      kind: kindOf(g), quantityPresets: presetsOf(g),
      variants: [first, ...rest],
    });
  }
  return { products, groups };
}

export function listAdminGroups(): AdminProductGroup[] {
  return loadGroups().map(({ g, variants }) => toAdminGroup(g, variants));
}

export function getAdminGroup(slug: string): AdminProductGroup | null {
  const entry = loadGroups().find(e => e.g.slug === slug);
  return entry ? toAdminGroup(entry.g, entry.variants) : null;
}

const slugify = (text: string) =>
  text.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\+/g, ' ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60);

/** Creates or updates a product and its strengths. Strength slugs stay fixed once created so carts and links keep working. */
export function saveGroup(input: ProductGroupInput, isNew: boolean): string {
  return transaction(db => {
    const slug = isNew ? slugify(input.slug || input.name) : input.slug;
    if (!slug) throw new OrderError('Ange ett namn eller en adress (slug) för produkten.');
    const exists = !!db.prepare('SELECT 1 FROM product_groups WHERE slug = ?').get(slug);
    if (isNew && exists) throw new OrderError(`Det finns redan en produkt med adressen ${slug}.`);
    if (!isNew && !exists) throw new OrderError('Produkten finns inte.');
    if (!input.variants.length) throw new OrderError('Lägg till minst en styrka.');
    const now = nowIso();
    if (isNew) {
      const { n } = db.prepare('SELECT COALESCE(MAX(sort_order), -1) + 1 AS n FROM product_groups').get() as { n: number };
      db.prepare(`INSERT INTO product_groups (slug, name, category, description, badge, image, featured, active, about, specs, kind, quantity_presets, sort_order, updated_at)
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
        .run(slug, input.name, input.category, input.description, input.badge, input.image, input.featured ? 1 : 0, input.active ? 1 : 0, JSON.stringify(input.about), JSON.stringify(input.specs), input.kind, JSON.stringify(input.quantityPresets), n, now);
    } else {
      db.prepare(`UPDATE product_groups SET name = ?, category = ?, description = ?, badge = ?, image = ?, featured = ?, active = ?, about = ?, specs = ?, kind = ?, quantity_presets = ?, updated_at = ? WHERE slug = ?`)
        .run(input.name, input.category, input.description, input.badge, input.image, input.featured ? 1 : 0, input.active ? 1 : 0, JSON.stringify(input.about), JSON.stringify(input.specs), input.kind, JSON.stringify(input.quantityPresets), now, slug);
    }
    const existing = db.prepare('SELECT slug FROM product_variants WHERE group_slug = ?').all(slug) as { slug: string }[];
    const kept = new Set<string>();
    input.variants.forEach((v, i) => {
      let vslug = v.slug && existing.some(e => e.slug === v.slug) ? v.slug : '';
      if (!vslug) {
        const base = `${slug}-${slugify(v.amount).replace(/-?mg$/, '') || 'variant'}`;
        vslug = base;
        for (let n = 2; db.prepare('SELECT 1 FROM product_variants WHERE slug = ?').get(vslug) || kept.has(vslug); n++) vslug = `${base}-${n}`;
        db.prepare('INSERT INTO product_variants (slug, group_slug, amount, price, batch, coa_url, active, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
          .run(vslug, slug, v.amount, v.price, v.batch, v.coaUrl, v.active ? 1 : 0, i);
      } else {
        db.prepare('UPDATE product_variants SET amount = ?, price = ?, batch = ?, coa_url = ?, active = ?, sort_order = ? WHERE slug = ?')
          .run(v.amount, v.price, v.batch, v.coaUrl, v.active ? 1 : 0, i, vslug);
      }
      kept.add(vslug);
    });
    for (const e of existing) if (!kept.has(e.slug)) db.prepare('DELETE FROM product_variants WHERE slug = ?').run(e.slug);
    return slug;
  });
}

export function setGroupActive(slug: string, active: boolean) {
  getDb().prepare('UPDATE product_groups SET active = ?, updated_at = ? WHERE slug = ?').run(active ? 1 : 0, nowIso(), slug);
}

/** Moves a product one step up or down in the storefront order. */
export function moveGroup(slug: string, direction: -1 | 1) {
  transaction(db => {
    const rows = db.prepare('SELECT slug FROM product_groups ORDER BY sort_order, name').all() as { slug: string }[];
    const i = rows.findIndex(r => r.slug === slug);
    const j = i + direction;
    if (i < 0 || j < 0 || j >= rows.length) return;
    [rows[i], rows[j]] = [rows[j]!, rows[i]!];
    rows.forEach((r, n) => db.prepare('UPDATE product_groups SET sort_order = ? WHERE slug = ?').run(n, r.slug));
  });
}

export function deleteGroup(slug: string) {
  getDb().prepare('DELETE FROM product_groups WHERE slug = ?').run(slug);
}

// ---------- Articles ----------

function toArticle(r: ArticleRow): AdminArticle {
  return {
    slug: r.slug, title: r.title, metaTitle: r.meta_title, description: r.description, category: r.category, intro: r.intro, date: r.date,
    readTime: r.read_time, image: r.image, imageAlt: r.image_alt, keywords: parseJson<string[]>(r.keywords, []),
    productSlug: r.product_slug, sections: parseJson<Article['sections']>(r.sections, []), published: r.published === 1, updatedAt: r.updated_at,
  };
}

export const toPublicArticle = (a: AdminArticle): Article => ({
  slug: a.slug, title: a.title, metaTitle: a.metaTitle || a.title, description: a.description, category: a.category, intro: a.intro, date: a.date,
  readTime: a.readTime, image: a.image, imageAlt: a.imageAlt, keywords: a.keywords, sections: a.sections, updatedAt: a.updatedAt, ...(a.productSlug ? { productSlug: a.productSlug } : {}),
});

export function listArticles(includeDrafts = false): AdminArticle[] {
  const rows = getDb().prepare(`SELECT * FROM articles ${includeDrafts ? '' : 'WHERE published = 1'} ORDER BY date DESC, rowid DESC`).all() as ArticleRow[];
  return rows.map(toArticle);
}

export function getArticle(slug: string, includeDrafts = false): AdminArticle | null {
  const row = getDb().prepare(`SELECT * FROM articles WHERE slug = ? ${includeDrafts ? '' : 'AND published = 1'}`).get(slug) as ArticleRow | undefined;
  return row ? toArticle(row) : null;
}

export function saveArticle(input: ArticleInput, isNew: boolean): string {
  const db = getDb();
  const slug = isNew ? slugify(input.slug || input.title) : input.slug;
  if (!slug) throw new OrderError('Ange en rubrik eller en adress (slug) för artikeln.');
  const exists = !!db.prepare('SELECT 1 FROM articles WHERE slug = ?').get(slug);
  if (isNew && exists) throw new OrderError(`Det finns redan en artikel med adressen ${slug}.`);
  if (!isNew && !exists) throw new OrderError('Artikeln finns inte.');
  const values = [input.title, input.metaTitle, input.description, input.category, input.intro, input.date, input.readTime, input.image, input.imageAlt,
    JSON.stringify(input.keywords), input.productSlug, JSON.stringify(input.sections), input.published ? 1 : 0, nowIso()] as const;
  if (isNew) {
    db.prepare(`INSERT INTO articles (title, meta_title, description, category, intro, date, read_time, image, image_alt, keywords, product_slug, sections, published, updated_at, slug)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(...values, slug);
  } else {
    db.prepare(`UPDATE articles SET title = ?, meta_title = ?, description = ?, category = ?, intro = ?, date = ?, read_time = ?, image = ?, image_alt = ?,
                keywords = ?, product_slug = ?, sections = ?, published = ?, updated_at = ? WHERE slug = ?`).run(...values, slug);
  }
  return slug;
}

export function deleteArticle(slug: string) {
  getDb().prepare('DELETE FROM articles WHERE slug = ?').run(slug);
}
