// Browser-safe shapes for the admin product and blog editors.
import type { Article } from './articles';
import type { ProductKind } from './products';

export type AdminVariant = { slug: string; amount: string; price: number; batch: string; coaUrl: string; active: boolean };
export type AdminProductGroup = {
  slug: string; name: string; category: string; description: string; badge: string; image: string;
  featured: boolean; active: boolean; about: string[]; specs: [string, string][]; kind: ProductKind; quantityPresets: number[]; sortOrder: number; updatedAt: string;
  variants: AdminVariant[];
};
export type ProductGroupInput = Omit<AdminProductGroup, 'sortOrder' | 'updatedAt'>;

export type AdminArticle = Omit<Article, 'productSlug'> & { productSlug: string; published: boolean; updatedAt: string };
export type ArticleInput = Omit<AdminArticle, 'updatedAt'>;

export const productCategories = ['Peptider', 'Blends', 'Tillbehör'];

/** "5, 10, 20" → [5, 10, 20]: positive whole numbers, sorted, without duplicates. */
export function parsePresets(text: string): number[] {
  return [...new Set(text.split(/[^\d]+/).filter(Boolean).map(Number).filter(n => Number.isInteger(n) && n > 0 && n <= 999))].sort((a, b) => a - b).slice(0, 6);
}

/** Rough reading time at ~200 words per minute, never below one minute. */
export function estimateReadTime(texts: string[]) {
  const words = texts.join(' ').trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}
