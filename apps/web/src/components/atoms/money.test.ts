import { describe, expect, it } from 'vitest';
import { formatCents, parseEurosToCents } from './money';

describe('formatCents', () => {
  it('formats positive cents as a EUR amount', () => {
    expect(formatCents(1234)).toBe('12,34 €');
  });

  it('formats zero cents', () => {
    expect(formatCents(0)).toBe('0,00 €');
  });

  it('formats negative cents with a minus sign', () => {
    expect(formatCents(-500)).toBe('-5,00 €');
  });
});

describe('parseEurosToCents', () => {
  it('parses a comma-decimal euro string into integer cents', () => {
    expect(parseEurosToCents('12,34')).toBe(1234);
  });

  it('parses a dot-decimal euro string into integer cents', () => {
    expect(parseEurosToCents('12.34')).toBe(1234);
  });

  it('parses a whole-euro string into integer cents', () => {
    expect(parseEurosToCents('5')).toBe(500);
  });

  it('returns null for a non-numeric input', () => {
    expect(parseEurosToCents('abc')).toBeNull();
  });

  it('returns null for an empty input', () => {
    expect(parseEurosToCents('')).toBeNull();
  });
});
