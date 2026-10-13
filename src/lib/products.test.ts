import { describe, expect, it } from 'vitest';
import { updateCart, cartTotal } from './products';
describe('Session cart', () => {
  it('combines additions of the same product', () => {
    expect(updateCart([{slug:'bpc-157',quantity:1}], 'bpc-157',2)).toEqual([{slug:'bpc-157',quantity:3}]);
  });
  it('removes a product when its quantity reaches zero', () => {
    expect(updateCart([{slug:'bpc-157',quantity:1}], 'bpc-157',-1)).toEqual([]);
  });
  it('calculates the concrete sample catalog total', () => {
    expect(cartTotal([{slug:'bpc-157',quantity:2},{slug:'retatrutide',quantity:1}])).toBe(1597);
  });
  it('does not add unknown products', () => {
    expect(updateCart([], 'unknown',1)).toEqual([]);
  });
});