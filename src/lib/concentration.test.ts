import { describe, expect, it } from 'vitest';
import { calculateConcentration, parseDecimal } from './concentration';
describe('Laboratory concentration', () => {
  it('divides mass in mg by volume in ml', () => { expect(calculateConcentration(10, 2)).toBe(5); });
  it('supports fractional mass and volume', () => { expect(calculateConcentration(2.5, 0.5)).toBe(5); });
  it('rejects zero volume instead of dividing by zero', () => { expect(calculateConcentration(10, 0)).toBeNull(); });
  it('rejects negative or missing mass and volume', () => {
    expect(calculateConcentration(-10, 2)).toBeNull();
    expect(calculateConcentration(10, -2)).toBeNull();
    expect(calculateConcentration(0, 2)).toBeNull();
    expect(calculateConcentration(NaN, 2)).toBeNull();
    expect(calculateConcentration(10, Infinity)).toBeNull();
  });
  it('reads Swedish decimal commas', () => { expect(parseDecimal('2,5')).toBe(2.5); });
  it('does not partially parse malformed inputs', () => { expect(parseDecimal('2 ml')).toBeNaN(); expect(parseDecimal('')).toBeNaN(); });
});
