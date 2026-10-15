import { describe, expect, it } from 'vitest';
import { updateCart, cartTotal } from './products';
describe('Session cart', () => {
  it('combines additions of the same product', () => {
    expect(updateCart([{slug:'bpc-157-10',quantity:1}], 'bpc-157-10',2)).toEqual([{slug:'bpc-157-10',quantity:3}]);
  });
  it('removes a product when its quantity reaches zero', () => {
    expect(updateCart([{slug:'bpc-157-10',quantity:1}], 'bpc-157-10',-1)).toEqual([]);
  });
  it('calculates the concrete sample catalog total', () => {
    expect(cartTotal([{slug:'bpc-157-10',quantity:2},{slug:'retatrutide-10',quantity:1}])).toBe(1697);
  });
  it('does not add unknown products', () => {
    expect(updateCart([], 'unknown',1)).toEqual([]);
  });
});
import { productGroups, findGroup } from './products';
describe('Product groups', () => {
  it('shows each peptide once with its strengths', () => {
    expect(productGroups.map(g => g.slug)).toEqual(['retatrutide','ghk-cu','mots-c','bpc-157','bpc-157-tb-500']);
    expect(findGroup('retatrutide')?.variants.map(v => v.amount)).toEqual(['10 mg','15 mg','20 mg','30 mg','60 mg']);
  });
});
