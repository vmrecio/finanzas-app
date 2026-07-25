import type { ButtonHTMLAttributes } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'danger';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

const BASE_CLASSES =
  'inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-body-sm font-semibold ' +
  'transition-colors disabled:cursor-not-allowed disabled:opacity-60';

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  // Primary: solid brand blue, high-contrast — per DESIGN.md "Primary" button rule.
  primary: 'bg-primary text-on-primary hover:bg-on-primary-fixed-variant',
  // Secondary: ghost style with a neutral border — per DESIGN.md "Secondary" button rule.
  secondary: 'bg-transparent border border-outline-variant text-on-surface hover:bg-surface-container-low',
  // Danger: reserved for terminal/destructive actions (e.g. delete) per DESIGN.md.
  danger: 'bg-transparent border border-tertiary-fixed text-tertiary hover:bg-tertiary-fixed',
};

/** Pure presentational button — no data-fetching, props in/JSX out. */
export function Button({ type = 'button', variant = 'primary', className = '', ...rest }: ButtonProps) {
  return <button type={type} className={`${BASE_CLASSES} ${VARIANT_CLASSES[variant]} ${className}`} {...rest} />;
}
