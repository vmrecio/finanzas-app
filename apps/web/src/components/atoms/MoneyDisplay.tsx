import { formatCents } from './money';

export interface MoneyDisplayProps {
  amountCents: number;
}

/** Renders raw integer cents as a formatted EUR amount. Pure, no data-fetching. */
export function MoneyDisplay({ amountCents }: MoneyDisplayProps) {
  return <span>{formatCents(amountCents)}</span>;
}
