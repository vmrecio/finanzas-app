import type { ButtonHTMLAttributes } from 'react';

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement>;

/** Pure presentational button — no data-fetching, props in/JSX out. */
export function Button({ type = 'button', ...rest }: ButtonProps) {
  return <button type={type} {...rest} />;
}
