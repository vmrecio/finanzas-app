// Money formatting/parsing lives ONLY in the web presentation layer — the
// api-client and containers pass raw integer cents around unmodified.
const CENTS_FORMATTER = new Intl.NumberFormat('de-DE', {
  style: 'currency',
  currency: 'EUR',
});

// Intl inserts a non-breaking space (U+00A0) before the currency symbol;
// normalize it to a regular space (U+0020) so callers/tests get a
// predictable, plain string. Written as a unicode escape (rather than a
// literal character) to avoid eslint's `no-irregular-whitespace` rule.
const NBSP_PATTERN = /\u00A0/g;

/** Formats integer minor-unit cents as a EUR display string, e.g. `1234` -> `"12,34 €"`. */
export function formatCents(amountCents: number): string {
  return CENTS_FORMATTER.format(amountCents / 100).replace(NBSP_PATTERN, " ");
}

/**
 * Parses a user-typed euro amount (accepting either `,` or `.` as the
 * decimal separator) into integer minor-unit cents. Returns `null` for
 * anything that isn't a valid non-negative-or-negative numeric amount.
 */
export function parseEurosToCents(input: string): number | null {
  const trimmed = input.trim();
  if (trimmed === "") {
    return null;
  }
  const normalized = trimmed.replace(",", ".");
  if (!/^-?\d+(\.\d+)?$/.test(normalized)) {
    return null;
  }
  const euros = Number(normalized);
  if (Number.isNaN(euros)) {
    return null;
  }
  return Math.round(euros * 100);
}
