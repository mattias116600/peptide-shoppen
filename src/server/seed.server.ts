// Copies the starting catalogue and blog into the database once. A settings flag records that it
// ran, so deleting every product or article in the admin does not bring the old ones back.
import type { DatabaseSync } from 'node:sqlite';
import { productGroups } from '@/lib/products';
import { seedArticles } from '@/lib/articles';

export function seedContent(db: DatabaseSync) {
  const done = (key: string) => !!db.prepare('SELECT 1 FROM settings WHERE key = ?').get(key);
  const mark = (key: string) => db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run(key, new Date().toISOString());
  const now = new Date().toISOString();

  if (!done('seeded_catalog')) {
    db.exec('BEGIN');
    const group = db.prepare(`INSERT OR IGNORE INTO product_groups (slug, name, category, description, badge, image, featured, active, about, specs, sort_order, updated_at)
                              VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?)`);
    const variant = db.prepare(`INSERT OR IGNORE INTO product_variants (slug, group_slug, amount, price, batch, coa_url, active, sort_order)
                                VALUES (?, ?, ?, ?, ?, ?, 1, ?)`);
    productGroups.forEach((g, i) => {
      group.run(g.slug, g.name, g.category, g.description, g.badge ?? '', g.image, g.featured ? 1 : 0, JSON.stringify(g.about), JSON.stringify(g.specs), i, now);
      g.variants.forEach((v, j) => variant.run(v.slug, g.slug, v.amount, v.price, v.batch ?? '', v.coaUrl ?? '', j));
    });
    mark('seeded_catalog');
    db.exec('COMMIT');
  }

  if (!done('seeded_articles')) {
    db.exec('BEGIN');
    const insert = db.prepare(`INSERT OR IGNORE INTO articles (slug, title, meta_title, description, category, intro, date, read_time, image, image_alt, keywords, product_slug, sections, published, updated_at)
                               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)`);
    for (const a of seedArticles) {
      insert.run(a.slug, a.title, a.metaTitle, a.description, a.category, a.intro, a.date, a.readTime, a.image, a.imageAlt, JSON.stringify(a.keywords), a.productSlug ?? '', JSON.stringify(a.sections), now);
    }
    mark('seeded_articles');
    db.exec('COMMIT');
  }
}
