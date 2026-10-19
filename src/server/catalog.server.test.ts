// @vitest-environment node
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { getDb, resetDbForTests } from './db.server';
import {
  deleteArticle, deleteGroup, getAdminGroup, getArticle, getStorefrontCatalog, listAdminGroups, listArticles, moveGroup, saveArticle, saveGroup, setGroupActive,
} from './catalog.server';
import { placeOrder } from './shop.server';
import { readUpload, saveUpload, sniffImage } from './uploads.server';
import { productGroups } from '@/lib/products';
import { seedArticles } from '@/lib/articles';
import type { ArticleInput, ProductGroupInput } from '@/lib/catalog';

const customer = { name: 'Test', email: 't@example.se', phone: '0701234567', address: 'Gatan 1', zip: '12345', city: 'Sthlm' };
beforeEach(() => resetDbForTests());

describe('seeding', () => {
  it('copies the starting catalogue and blog once', () => {
    const { groups, products } = getStorefrontCatalog();
    expect(groups.map(g => g.slug)).toEqual([...productGroups.map(g => g.slug), 'insulinspruta-u100']);
    expect(products).toHaveLength(12);
    expect(groups.find(g => g.slug === 'bpc-157')?.specs).toContainEqual(['CAS-nummer', '137525-51-0']);
    expect(groups.filter(g => g.featured).map(g => g.slug)).toEqual(['retatrutide', 'ghk-cu', 'mots-c', 'bpc-157-tb-500']);
    expect(listArticles()).toHaveLength(seedArticles.length);
    expect(getArticle('vad-ar-peptider')?.image).toBe('bundled:peptider');
  });

  it('does not bring deleted content back after a restart', () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'psw-'));
    const file = path.join(dir, 'db.sqlite');
    resetDbForTests(file);
    for (const g of listAdminGroups()) deleteGroup(g.slug);
    deleteArticle('vad-ar-peptider');
    resetDbForTests(file); // reopen the same file, as a restart would
    expect(listAdminGroups()).toHaveLength(0);
    expect(getArticle('vad-ar-peptider', true)).toBeNull();
    resetDbForTests();
    rmSync(dir, { recursive: true, force: true });
  });
});

describe('accessories', () => {
  it('adds the insulin syringe as an accessory with quick-pick quantities', () => {
    const g = getStorefrontCatalog().groups.find(x => x.slug === 'insulinspruta-u100')!;
    expect(g).toMatchObject({ kind: 'tillbehor', category: 'Tillbehör', quantityPresets: [5, 10, 20], image: 'bundled:insulinspruta' });
    expect(g.variants.map(v => [v.slug, v.price])).toEqual([['insulinspruta-u100-1ml-29g', 5]]);
    expect(getStorefrontCatalog().groups.filter(x => x.kind === 'peptid')).toHaveLength(5);
  });

  it('prices any quantity up to 999 per line', () => {
    expect(placeOrder(customer, [{ slug: 'insulinspruta-u100-1ml-29g', quantity: 20 }]).subtotal).toBe(100);
    expect(placeOrder(customer, [{ slug: 'insulinspruta-u100-1ml-29g', quantity: 999 }]).subtotal).toBe(4995);
    expect(() => placeOrder(customer, [{ slug: 'insulinspruta-u100-1ml-29g', quantity: 1000 }])).toThrow(/Ogiltig/);
  });

  it('lets the admin change type and quick-picks', () => {
    const g = getAdminGroup('insulinspruta-u100')!;
    saveGroup({ ...g, quantityPresets: [10, 50, 100] }, false);
    expect(getAdminGroup('insulinspruta-u100')!.quantityPresets).toEqual([10, 50, 100]);
    const bpc = getAdminGroup('bpc-157')!;
    expect(bpc).toMatchObject({ kind: 'peptid', quantityPresets: [] });
  });

  it('is added once to shops seeded before accessories existed', () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'psw-acc-'));
    const file = path.join(dir, 'db.sqlite');
    resetDbForTests(file);
    deleteGroup('insulinspruta-u100');
    getDb().prepare("DELETE FROM settings WHERE key = 'seeded_accessories_2026_10'").run();
    resetDbForTests(file);
    expect(getAdminGroup('insulinspruta-u100')?.kind).toBe('tillbehor');
    deleteGroup('insulinspruta-u100');
    resetDbForTests(file);
    expect(getAdminGroup('insulinspruta-u100')).toBeNull();
    resetDbForTests();
    rmSync(dir, { recursive: true, force: true });
  });
});

describe('products', () => {
  const product = (over: Partial<ProductGroupInput> = {}): ProductGroupInput => ({
    slug: '', name: 'TB-500', category: 'Peptider', description: 'Test', badge: 'NYHET', image: 'bundled:vial', featured: false, active: true,
    about: ['Stycke'], specs: [['CAS-nummer', '77591-33-4']], kind: 'peptid', quantityPresets: [],
    variants: [{ slug: '', amount: '5 mg', price: 499, batch: '', coaUrl: '', active: true }, { slug: '', amount: '10 mg', price: 799, batch: 'B1', coaUrl: 'https://example.com/coa', active: true }],
    ...over,
  });

  it('creates a product with generated slugs and shows it in the storefront', () => {
    const slug = saveGroup(product(), true);
    expect(slug).toBe('tb-500');
    const g = getStorefrontCatalog().groups.find(x => x.slug === 'tb-500')!;
    expect(g.variants.map(v => [v.slug, v.amount, v.price])).toEqual([['tb-500-5', '5 mg', 499], ['tb-500-10', '10 mg', 799]]);
    expect(g.badge).toBe('NYHET');
    expect(() => saveGroup(product(), true)).toThrow(/finns redan/);
  });

  it('keeps strength slugs when editing and removes dropped strengths', () => {
    saveGroup(product(), true);
    const saved = getAdminGroup('tb-500')!;
    saveGroup({ ...saved, name: 'TB-500 Fragment', variants: [{ ...saved.variants[1]!, price: 899 }, { slug: '', amount: '20 mg', price: 1299, batch: '', coaUrl: '', active: true }] }, false);
    const after = getAdminGroup('tb-500')!;
    expect(after.name).toBe('TB-500 Fragment');
    expect(after.variants.map(v => [v.slug, v.price])).toEqual([['tb-500-10', 899], ['tb-500-20', 1299]]);
  });

  it('prices orders from the database and refuses hidden products', () => {
    const bpc = getAdminGroup('bpc-157')!;
    saveGroup({ ...bpc, variants: bpc.variants.map(v => ({ ...v, price: v.slug === 'bpc-157-10' ? 450 : v.price })) }, false);
    expect(placeOrder(customer, [{ slug: 'bpc-157-10', quantity: 2 }]).subtotal).toBe(900);
    setGroupActive('bpc-157', false);
    expect(getStorefrontCatalog().groups.some(g => g.slug === 'bpc-157')).toBe(false);
    expect(() => placeOrder(customer, [{ slug: 'bpc-157-10', quantity: 1 }])).toThrow(/Ogiltig/);
  });

  it('hides a product whose strengths are all switched off', () => {
    const g = getAdminGroup('mots-c')!;
    saveGroup({ ...g, variants: g.variants.map(v => ({ ...v, active: false })) }, false);
    expect(getStorefrontCatalog().groups.some(x => x.slug === 'mots-c')).toBe(false);
  });

  it('reorders products', () => {
    moveGroup('ghk-cu', -1);
    expect(listAdminGroups().slice(0, 2).map(g => g.slug)).toEqual(['ghk-cu', 'retatrutide']);
  });
});

describe('articles', () => {
  const article = (over: Partial<ArticleInput> = {}): ArticleInput => ({
    slug: '', title: 'Ny guide: Förvaring av lyofiliserade peptider', metaTitle: '', description: 'd', category: 'Guider', intro: 'i', date: '2026-10-17',
    readTime: 2, image: '', imageAlt: '', keywords: ['förvaring'], productSlug: 'bpc-157', sections: [{ title: 'Del 1', text: 'Text' }], published: false, ...over,
  });

  it('keeps drafts out of the public blog until published', () => {
    const slug = saveArticle(article(), true);
    expect(slug).toBe('ny-guide-forvaring-av-lyofiliserade-peptider');
    expect(getArticle(slug)).toBeNull();
    expect(getArticle(slug, true)?.title).toMatch(/Ny guide/);
    saveArticle({ ...article(), slug, published: true }, false);
    expect(listArticles()[0]?.slug).toBe(slug);
  });

  it('edits an existing seeded article', () => {
    const a = getArticle('bpc-157-forskning', true)!;
    saveArticle({ ...a, title: 'BPC-157: uppdaterad', sections: [...a.sections, { title: 'Nytt', text: 'Ny text' }] }, false);
    const after = getArticle('bpc-157-forskning')!;
    expect(after.title).toBe('BPC-157: uppdaterad');
    expect(after.sections.at(-1)).toEqual({ title: 'Nytt', text: 'Ny text' });
  });
});

describe('uploads', () => {
  let dir = '';
  beforeEach(() => { dir = mkdtempSync(path.join(tmpdir(), 'psw-up-')); process.env['UPLOADS_DIR'] = dir; });
  afterEach(() => { rmSync(dir, { recursive: true, force: true }); delete process.env['UPLOADS_DIR']; });

  it('accepts real images only and serves them back by name', () => {
    const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1, 2, 3]);
    expect(sniffImage(png)).toBe('png');
    const url = saveUpload(png);
    expect(url).toMatch(/^\/media\/[a-z0-9]+-[a-f0-9]{12}\.png$/);
    expect(readUpload(url.slice(7))?.type).toBe('image/png');
    expect(() => saveUpload(new TextEncoder().encode('<svg onload=alert(1)>'))).toThrow(/WebP-, PNG-/);
    expect(readUpload('../db.sqlite')).toBeNull();
    expect(getDb()).toBeTruthy();
  });
});
