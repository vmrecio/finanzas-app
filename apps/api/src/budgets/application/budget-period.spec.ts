import { getMonthRangeForPeriod } from './budget-period';

describe('getMonthRangeForPeriod', () => {
  it('returns the first and last instant of the given UTC calendar month', () => {
    const { start, end } = getMonthRangeForPeriod('2026-07');

    expect(start.toISOString()).toBe('2026-07-01T00:00:00.000Z');
    expect(end.toISOString()).toBe('2026-07-31T23:59:59.999Z');
  });

  it('handles December correctly (year rollover)', () => {
    const { start, end } = getMonthRangeForPeriod('2026-12');

    expect(start.toISOString()).toBe('2026-12-01T00:00:00.000Z');
    expect(end.toISOString()).toBe('2026-12-31T23:59:59.999Z');
  });

  it('handles February in a leap year correctly', () => {
    const { start, end } = getMonthRangeForPeriod('2028-02');

    expect(start.toISOString()).toBe('2028-02-01T00:00:00.000Z');
    expect(end.toISOString()).toBe('2028-02-29T23:59:59.999Z');
  });

  it('rejects a malformed periodMonth', () => {
    expect(() => getMonthRangeForPeriod('2026-7')).toThrow('periodMonth must be in YYYY-MM format');
  });
});
