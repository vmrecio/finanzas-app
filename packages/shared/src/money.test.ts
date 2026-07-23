import { describe, expect, it } from 'vitest';
import { Money } from './money';

describe('Money', () => {
  describe('fromCents', () => {
    it('creates a Money with the given integer amount and default EUR currency', () => {
      const money = Money.fromCents(1050);

      expect(money.amountCents).toBe(1050);
      expect(money.currency).toBe('EUR');
    });

    it('creates a Money with zero cents', () => {
      const money = Money.fromCents(0);

      expect(money.amountCents).toBe(0);
    });

    it('rejects a non-integer amount (no floats end-to-end)', () => {
      expect(() => Money.fromCents(10.5)).toThrow('Money amountCents must be an integer');
    });
  });

  describe('add', () => {
    it('adds two Money amounts and returns a new instance', () => {
      const a = Money.fromCents(1000);
      const b = Money.fromCents(250);

      const result = a.add(b);

      expect(result.amountCents).toBe(1250);
      // immutability: originals are untouched
      expect(a.amountCents).toBe(1000);
      expect(b.amountCents).toBe(250);
    });

    it('adds a negative amount correctly (different inputs than the first case)', () => {
      const a = Money.fromCents(500);
      const b = Money.fromCents(-200);

      const result = a.add(b);

      expect(result.amountCents).toBe(300);
    });

    it('rejects adding Money of a different currency', () => {
      const a = Money.fromCents(1000, 'EUR');
      const b = Money.fromCents(1000, 'USD');

      expect(() => a.add(b)).toThrow('Money currency mismatch: EUR vs USD');
    });
  });

  describe('subtract', () => {
    it('subtracts one Money amount from another', () => {
      const a = Money.fromCents(1000);
      const b = Money.fromCents(250);

      const result = a.subtract(b);

      expect(result.amountCents).toBe(750);
    });

    it('subtracting a larger amount produces a negative result', () => {
      const a = Money.fromCents(100);
      const b = Money.fromCents(400);

      const result = a.subtract(b);

      expect(result.amountCents).toBe(-300);
    });
  });

  describe('negate', () => {
    it('negates a positive amount', () => {
      const money = Money.fromCents(500);

      expect(money.negate().amountCents).toBe(-500);
    });

    it('negates a negative amount back to positive', () => {
      const money = Money.fromCents(-750);

      expect(money.negate().amountCents).toBe(750);
    });
  });

  describe('equals', () => {
    it('returns true for two Money with the same amount and currency', () => {
      const a = Money.fromCents(1234);
      const b = Money.fromCents(1234);

      expect(a.equals(b)).toBe(true);
    });

    it('returns false for Money with different amounts', () => {
      const a = Money.fromCents(1234);
      const b = Money.fromCents(4321);

      expect(a.equals(b)).toBe(false);
    });
  });
});
