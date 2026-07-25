import type { InputHTMLAttributes } from 'react';

export type InputProps = InputHTMLAttributes<HTMLInputElement>;

/** Pure presentational input — no data-fetching, props in/JSX out. */
export function Input(props: InputProps) {
  return <input {...props} />;
}
