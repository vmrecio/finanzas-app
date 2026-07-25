/**
 * Thrown for any non-2xx response from the API, after the refresh/retry
 * dance (see `http.ts`) has already been attempted where applicable.
 * Containers inspect `status` to render the API's actual error message
 * (e.g. 409 duplicate email, 401 bad credentials) instead of a generic one.
 */
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}
