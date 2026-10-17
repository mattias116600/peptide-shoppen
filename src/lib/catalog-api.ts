// Server functions for the catalogue and blog: public reads for the storefront, admin-only writes.
import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { productGroups, products } from './products';
import { seedArticles, type Article } from './articles';
import { isImageKey } from './media';
import {
  deleteArticle, deleteGroup, getAdminGroup, getArticle, getStorefrontCatalog, listAdminGroups, listArticles, moveGroup, saveArticle, saveGroup,
  setGroupActive, toPublicArticle,
} from '@/server/catalog.server';
import { attempt, requireAdmin } from '@/server/request.server';

// If the database cannot be opened (e.g. a preview without Node 22.13+), the storefront still renders
// the starting content instead of failing every page.
function withFallback<T>(read: () => T, fallback: () => T): T {
  try {
    return read();
  } catch (error) {
    console.error('Catalogue database unavailable, showing starting content:', error);
    return fallback();
  }
}

// ---------- Storefront ----------

export const getCatalogFn = createServerFn({ method: 'GET' }).handler(() =>
  withFallback(getStorefrontCatalog, () => ({ products, groups: productGroups })),
);

export const listArticlesFn = createServerFn({ method: 'GET' }).handler((): Article[] =>
  withFallback(() => listArticles().map(toPublicArticle), () => seedArticles),
);

export const getArticleFn = createServerFn({ method: 'GET' })
  .validator(z.object({ slug: z.string().max(80) }))
  .handler(({ data }): Article | null =>
    withFallback(
      () => {
        const a = getArticle(data.slug);
        return a ? toPublicArticle(a) : null;
      },
      () => seedArticles.find(a => a.slug === data.slug) ?? null,
    ),
  );

// ---------- Admin: products ----------

const imageSchema = z.string().max(200).refine(isImageKey, 'Ogiltig bild');
const productSchema = z.object({
  slug: z.string().trim().max(60),
  name: z.string().trim().min(1, 'Ange ett namn').max(80),
  category: z.string().trim().min(1).max(40),
  description: z.string().trim().max(400),
  badge: z.string().trim().max(20),
  image: imageSchema,
  featured: z.boolean(),
  active: z.boolean(),
  about: z.array(z.string().trim().min(1).max(2000)).max(10),
  specs: z.array(z.tuple([z.string().trim().min(1).max(60), z.string().trim().min(1).max(200)])).max(20),
  variants: z.array(z.object({
    slug: z.string().max(80),
    amount: z.string().trim().min(1, 'Ange styrka').max(30),
    price: z.number().int().min(1).max(1_000_000),
    batch: z.string().trim().max(40),
    coaUrl: z.union([z.literal(''), z.string().trim().url().max(300)]),
    active: z.boolean(),
  })).min(1).max(20),
});

export const listAdminProductsFn = createServerFn({ method: 'GET' }).handler(() => {
  requireAdmin();
  return listAdminGroups();
});

export const getAdminProductFn = createServerFn({ method: 'GET' })
  .validator(z.object({ slug: z.string().max(60) }))
  .handler(({ data }) => {
    requireAdmin();
    return getAdminGroup(data.slug);
  });

export const saveProductFn = createServerFn({ method: 'POST' })
  .validator(z.object({ product: productSchema, isNew: z.boolean() }))
  .handler(({ data }) => {
    requireAdmin();
    return attempt(() => saveGroup(data.product, data.isNew));
  });

export const setProductActiveFn = createServerFn({ method: 'POST' })
  .validator(z.object({ slug: z.string().max(60), active: z.boolean() }))
  .handler(({ data }) => {
    requireAdmin();
    setGroupActive(data.slug, data.active);
    return { ok: true };
  });

export const moveProductFn = createServerFn({ method: 'POST' })
  .validator(z.object({ slug: z.string().max(60), direction: z.union([z.literal(-1), z.literal(1)]) }))
  .handler(({ data }) => {
    requireAdmin();
    moveGroup(data.slug, data.direction);
    return { ok: true };
  });

export const deleteProductFn = createServerFn({ method: 'POST' })
  .validator(z.object({ slug: z.string().max(60) }))
  .handler(({ data }) => {
    requireAdmin();
    deleteGroup(data.slug);
    return { ok: true };
  });

// ---------- Admin: blog ----------

const articleSchema = z.object({
  slug: z.string().trim().max(80),
  title: z.string().trim().min(1, 'Ange en rubrik').max(160),
  metaTitle: z.string().trim().max(160),
  description: z.string().trim().max(300),
  category: z.string().trim().max(60),
  intro: z.string().trim().max(600),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Ogiltigt datum'),
  readTime: z.number().int().min(1).max(120),
  image: z.union([z.literal(''), imageSchema]),
  imageAlt: z.string().trim().max(200),
  keywords: z.array(z.string().trim().min(1).max(40)).max(20),
  productSlug: z.string().max(60),
  sections: z.array(z.object({ title: z.string().trim().min(1, 'Varje avsnitt behöver en rubrik').max(160), text: z.string().trim().min(1).max(8000) })).max(30),
  published: z.boolean(),
});

export const listAdminArticlesFn = createServerFn({ method: 'GET' }).handler(() => {
  requireAdmin();
  return listArticles(true);
});

export const getAdminArticleFn = createServerFn({ method: 'GET' })
  .validator(z.object({ slug: z.string().max(80) }))
  .handler(({ data }) => {
    requireAdmin();
    return getArticle(data.slug, true);
  });

export const saveArticleFn = createServerFn({ method: 'POST' })
  .validator(z.object({ article: articleSchema, isNew: z.boolean() }))
  .handler(({ data }) => {
    requireAdmin();
    return attempt(() => saveArticle(data.article, data.isNew));
  });

export const deleteArticleFn = createServerFn({ method: 'POST' })
  .validator(z.object({ slug: z.string().max(80) }))
  .handler(({ data }) => {
    requireAdmin();
    deleteArticle(data.slug);
    return { ok: true };
  });

/** Product page data: the product plus up to three articles, its own first. */
export const getProductPageFn = createServerFn({ method: 'GET' })
  .validator(z.object({ slug: z.string().max(60) }))
  .handler(({ data }) => {
    const catalog = withFallback(getStorefrontCatalog, () => ({ products, groups: productGroups }));
    const group = catalog.groups.find(g => g.slug === data.slug) ?? null;
    const all = withFallback(() => listArticles().map(toPublicArticle), () => seedArticles);
    const related = [...all].sort((a, b) => Number(b.productSlug === data.slug) - Number(a.productSlug === data.slug)).slice(0, 3)
      .map(a => ({ slug: a.slug, title: a.title, category: a.category }));
    return { group, related };
  });
