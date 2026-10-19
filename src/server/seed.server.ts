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

  // Shorter SEO titles (2026-10): only replace a title the admin has not changed since seeding.
  if (!done('seo_titles_2026_10')) {
    db.exec('BEGIN');
    const update = db.prepare('UPDATE articles SET meta_title = ? WHERE slug = ? AND meta_title = ?');
    for (const [slug, before, after] of shortenedMetaTitles) update.run(after, slug, before);
    mark('seo_titles_2026_10');
    db.exec('COMMIT');
  }
}

const shortenedMetaTitles: [slug: string, before: string, after: string][] = [
  ['vad-ar-peptider', 'Vad är peptider? Guide om aminosyror och peptidbindningar', 'Vad är peptider? Aminosyror och bindningar'],
  ['analys-och-dokumentation', 'Så läser du en CoA – analysrapport för peptider', 'Så läser du en analysrapport (CoA)'],
  ['koncentration-i-laboratoriet', 'Räkna ut koncentration mg/ml – enkel guide för labbet', 'Räkna ut koncentration i mg/ml'],
  ['retatrutide-forskning', 'Retatrutide – forskning, struktur och fakta', 'Retatrutide – forskning och fakta'],
  ['bpc-157-forskning', 'BPC-157 – vad är det? Forskning och fakta', 'BPC-157 – forskning och fakta'],
  ['ghk-cu-kopparpeptid', 'GHK-Cu kopparpeptid – struktur och forskning', 'GHK-Cu – kopparpeptiden i forskningen'],
  ['mots-c-mitokondriell-peptid', 'MOTS-C – mitokondriell peptid, forskning och fakta', 'MOTS-C – mitokondriell peptid i forskning'],
  ['forvaring-av-peptider', 'Förvaring av peptider – temperatur, ljus och fukt', 'Förvaring av peptider: ljus, fukt, kyla'],
  ['hplc-och-masspektrometri', 'HPLC och masspektrometri – så testas peptiders renhet', 'HPLC och masspektrometri för peptider'],
  ['tb-500-thymosin-beta-4', 'TB-500 – thymosin beta-4 fragment, forskning och fakta', 'TB-500 – thymosin beta-4 i forskningen'],
];
