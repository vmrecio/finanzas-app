export type Currency = 'EUR' | 'USD';

const DEFAULT_CURRENCY: Currency = 'EUR';

/**
 * Immutable money value object. Amounts are always represented as integer
 * minor units (cents) to avoid floating-point drift. All arithmetic returns
 * a new instance; existing instances are never mutated.
 */
export class Money {
  private constructor(
    public readonly amountCents: number,
    public readonly currency: Currency,
  ) {}

  static fromCents(amountCents: number, currency: Currency = DEFAULT_CURRENCY): Money {
    if (!Number.isInteger(amountCents)) {
      throw new Error('Money amountCents must be an integer (minor units, no floats)');
    }

    return new Money(amountCents, currency);
  }

  add(other: Money): Money {
    this.assertSameCurrency(other);

    return Money.fromCents(this.amountCents + other.amountCents, this.currency);
  }

  subtract(other: Money): Money {
    this.assertSameCurrency(other);

    return Money.fromCents(this.amountCents - other.amountCents, this.currency);
  }

  negate(): Money {
    return Money.fromCents(-this.amountCents, this.currency);
  }

  equals(other: Money): boolean {
    return this.amountCents === other.amountCents && this.currency === other.currency;
  }

  private assertSameCurrency(other: Money): void {
    if (this.currency !== other.currency) {
      throw new Error(`Money currency mismatch: ${this.currency} vs ${other.currency}`);
    }
  }
}
