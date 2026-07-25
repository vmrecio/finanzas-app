import { getCurrentMonthRange } from './reporting-period';

describe('getCurrentMonthRange', () => {
  it('returns the first and last instant of the given month (mid-month reference)', () => {
    const { start, end } = getCurrentMonthRange(new Date('2026-07-15T12:34:56.000Z'));

    expect(start.toISOString()).toBe('2026-07-01T00:00:00.000Z');
    expect(end.toISOString()).toBe('2026-07-31T23:59:59.999Z');
  });

  it('handles a reference date on the first day of the month', () => {
    const { start, end } = getCurrentMonthRange(new Date('2026-02-01T00:00:00.000Z'));

    expect(start.toISOString()).toBe('2026-02-01T00:00:00.000Z');
    expect(end.toISOString()).toBe('2026-02-28T23:59:59.999Z');
  });

  it('handles a leap-year February correctly', () => {
    const { start, end } = getCurrentMonthRange(new Date('2028-02-10T00:00:00.000Z'));

    expect(start.toISOString()).toBe('2028-02-01T00:00:00.000Z');
    expect(end.toISOString()).toBe('2028-02-29T23:59:59.999Z');
  });

  it('handles a reference date on the last day of the month', () => {
    const { start, end } = getCurrentMonthRange(new Date('2026-12-31T23:00:00.000Z'));

    expect(start.toISOString()).toBe('2026-12-01T00:00:00.000Z');
    expect(end.toISOString()).toBe('2026-12-31T23:59:59.999Z');
  });
});
