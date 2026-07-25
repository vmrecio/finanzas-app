export interface ErrorMessageProps {
  message: string;
}

/** Pure presentational error text, announced to assistive tech via `role="alert"`. */
export function ErrorMessage({ message }: ErrorMessageProps) {
  return <p role="alert">{message}</p>;
}
