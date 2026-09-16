import type { InputHTMLAttributes } from 'react';

export type InputProps = InputHTMLAttributes<HTMLInputElement>;

// Exported so `<select>` elements across the CRUD forms (which don't go
// through this `Input` atom) can share the exact same field styling.
export const INPUT_CLASSES =
  'w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-body-md ' +
  'text-on-surface placeholder:text-on-surface-variant focus:border-primary focus:outline-none ' +
  'focus:ring-[3px] focus:ring-primary-fixed';

/** Pure presentational input — no data-fetching, props in/JSX out. */
export function Input({ className = '', ...props }: InputProps) {
  return <input className={`${INPUT_CLASSES} ${className}`} {...props} />;
}
