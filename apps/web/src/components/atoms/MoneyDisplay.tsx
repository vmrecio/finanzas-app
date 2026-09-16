import { formatCents } from './money';

export interface MoneyDisplayProps {
  amountCents: number;
  className?: string;
}

/**
 * Renders raw integer cents as a formatted EUR amount. Pure, no
 * data-fetching. `tabular-nums` per DESIGN.md's "Financial Data
 * Implementation" so digits align vertically in tables/lists — a CSS-only
 * change, the formatting logic in `formatCents` is untouched.
 */
export function MoneyDisplay({ amountCents, className = '' }: MoneyDisplayProps) {
  return <span className={`tabular-nums ${className}`}>{formatCents(amountCents)}</span>;
}
