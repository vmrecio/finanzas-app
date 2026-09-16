export interface ErrorMessageProps {
  message: string;
}

/** Pure presentational error text, announced to assistive tech via `role="alert"`. */
export function ErrorMessage({ message }: ErrorMessageProps) {
  return (
    <p role="alert" className="rounded-lg border border-tertiary-fixed bg-tertiary-fixed px-3 py-2 text-body-sm text-on-tertiary-fixed-variant">
      {message}
    </p>
  );
}
