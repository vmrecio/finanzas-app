import type { Money } from '@finanzas/shared';

const PERIOD_MONTH_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;

export interface CreateBudgetProps {
  id: string;
  userId: string;
  categoryId: string;
  periodMonth: string;
  limit: Money;
}

/**
 * Domain entity for a fixed monthly per-category spending limit (see
 * design.md "Domain Model"). Framework-free: knows nothing about Prisma or
 * HTTP. The cross-aggregate invariant "budgets only on expense categories"
 * is NOT enforced here — validating it requires loading the referenced
 * Category (I/O), which is an application-layer concern (see
 * `CreateBudgetUseCase`), mirroring how Transaction's "type matches
 * category.kind" check lives in the application layer rather than the
 * domain entity. Uniqueness of (userId, categoryId, periodMonth) is
 * likewise an application-layer concern (requires querying existing
 * records), mirroring Category's own duplicate-name+kind check.
 */
export class Budget {
  private constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly categoryId: string,
    public readonly periodMonth: string,
    public readonly limit: Money,
  ) {}

  static create(props: CreateBudgetProps): Budget {
    if (!PERIOD_MONTH_PATTERN.test(props.periodMonth)) {
      throw new Error('Budget periodMonth must be in YYYY-MM format');
    }

    if (props.limit.amountCents <= 0) {
      throw new Error('Budget limit must be a positive number of cents');
    }

    return new Budget(props.id, props.userId, props.categoryId, props.periodMonth, props.limit);
  }
}
