import { ApiError } from './api-error';

const DEFAULT_API_URL = 'http://localhost:3001';

/**
 * Base URL for `apps/api`. `NEXT_PUBLIC_API_URL` is set in `docker-compose.yml`
 * for the containerized `web` service; falls back to the local-dev API port
 * when running `pnpm dev` outside Docker.
 */
export function getApiBaseUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL ?? DEFAULT_API_URL;
}

// In-memory only — never persisted to localStorage/sessionStorage (XSS
// exposure). Lost on a full page reload by design; `AuthProvider` restores
// it via a silent `/auth/refresh` (driven by the httpOnly refresh cookie).
let accessToken: string | null = null;

export function getAccessToken(): string | null {
  return accessToken;
}

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

export function clearAccessToken(): void {
  accessToken = null;
}

export interface RequestOptions {
  method?: string;
  body?: unknown;
  /** Attach the bearer token and participate in the 401-refresh-retry flow. Defaults to true. */
  auth?: boolean;
}

async function parseErrorMessage(response: Response): Promise<string> {
  try {
    const data = (await response.json()) as { message?: string | string[] };
    if (Array.isArray(data.message)) {
      return data.message.join(', ');
    }
    if (typeof data.message === 'string') {
      return data.message;
    }
  } catch {
    // Body wasn't JSON (or was empty) — fall through to a generic message.
  }
  return response.statusText || `Request failed with status ${response.status}`;
}

async function doFetch(path: string, options: RequestOptions): Promise<Response> {
  const auth = options.auth ?? true;
  const headers: Record<string, string> = {};
  if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }
  if (auth && accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  return fetch(`${getApiBaseUrl()}${path}`, {
    method: options.method ?? 'GET',
    headers,
    // Every request includes credentials so the browser sends/receives the
    // httpOnly refresh cookie on `/auth/*` calls; harmless elsewhere.
    credentials: 'include',
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });
}

let refreshInFlight: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      const response = await doFetch('/auth/refresh', { method: 'POST', auth: false });
      if (!response.ok) {
        clearAccessToken();
        throw new ApiError(response.status, await parseErrorMessage(response));
      }
      const data = (await response.json()) as { accessToken: string };
      setAccessToken(data.accessToken);
      return data.accessToken;
    })().finally(() => {
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
}

/**
 * Core fetch wrapper. On a 401 from an authenticated (`auth !== false`)
 * request other than `/auth/refresh` itself, attempts exactly one silent
 * refresh and retries the original request once with the new token. If the
 * refresh fails, or the retried request 401s again, the in-memory token is
 * cleared and the failure surfaces as an `ApiError` — this function never
 * redirects; that is the container layer's responsibility.
 */
export async function request<T>(path: string, options: RequestOptions = {}, isRetry = false): Promise<T> {
  const auth = options.auth ?? true;
  const response = await doFetch(path, options);

  if (response.status === 401 && auth && !isRetry && path !== '/auth/refresh') {
    try {
      await refreshAccessToken();
    } catch {
      throw new ApiError(401, 'Session expired');
    }
    return request<T>(path, options, true);
  }

  if (!response.ok) {
    if (response.status === 401 && auth) {
      clearAccessToken();
    }
    throw new ApiError(response.status, await parseErrorMessage(response));
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}
