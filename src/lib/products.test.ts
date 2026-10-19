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
import { products } from './products';
describe('Analyserapporter per styrka', () => {
  it('links every Retatrutide strength to its own batch report', () => {
    const coa = Object.fromEntries(
      products.filter(p => p.group === 'retatrutide').map(p => [p.amount, p.coaUrl]),
    );
    expect(coa).toEqual({
      '10 mg': 'https://polypeptide.io/tests/201465-Retatrutide_10mg',
      '15 mg': 'https://polypeptide.io/tests/204643-Retatrutide_15mg',
      '20 mg': 'https://polypeptide.io/tests/201565-Retatrutide_20mg',
      '30 mg': 'https://polypeptide.io/tests/201265-Retatrutide_30mg',
      '60 mg': 'https://polypeptide.io/tests/201435-Retatrutide_60mg',
    });
  });
});
import { shippingFee, shippingInfo } from './products';
describe('Leveransvillkor', () => {
  it('names the carrier and the delivery time shown across the site', () => {
    expect(shippingInfo.carrier).toBe('PostNord');
    expect(shippingInfo.leadTime).toBe('1–3 arbetsdagar');
    expect(shippingInfo.summary).toBe('Skickas med PostNord. Leverans 1–3 arbetsdagar.');
  });
  it('charges 62 kr shipping below 2 000 kr and ships free from there', () => {
    expect(shippingFee(1999)).toBe(62);
    expect(shippingFee(2000)).toBe(0);
  });
});
import { supportInfo } from './products';
describe('Supportkanal', () => {
  it('links every support button to the Telegram handle the owner supplied', () => {
    expect(supportInfo.handle).toBe('@peptideswedenn');
    expect(supportInfo.url).toBe('https://t.me/peptideswedenn');
    expect(supportInfo.url).toBe(`https://t.me/${supportInfo.handle.replace('@','')}`);
  });
});
import { isValidPhone, normalizePhone } from './products';
describe('Telefonnummer i kassan', () => {
  it('accepts Swedish numbers written with spaces, dashes or +46', () => {
    expect(isValidPhone('070 123 45 67')).toBe(true);
    expect(isValidPhone('+46 70 123 45 67')).toBe(true);
    expect(isValidPhone('08-12 34 56')).toBe(true);
  });
  it('rejects empty, foreign or badly formatted numbers', () => {
    expect(isValidPhone('')).toBe(false);
    expect(isValidPhone('1234')).toBe(false);
    expect(isValidPhone('+1 202 555 0173')).toBe(false);
    expect(isValidPhone('070-abc')).toBe(false);
    expect(isValidPhone('070123456789012345')).toBe(false);
  });
  it('strips separators before checking the number', () => {
    expect(normalizePhone('+46 70-123 45 67')).toBe('+46701234567');
    expect(normalizePhone('070 123 45 67')).toBe('0701234567');
  });
});
