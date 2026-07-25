import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from './api-error';
import { clearAccessToken, getAccessToken, request, setAccessToken } from './http';

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

describe('api-client http', () => {
  beforeEach(() => {
    clearAccessToken();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('attaches the bearer token to authenticated requests', async () => {
    setAccessToken('token-123');
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(200, { ok: true }));
    vi.stubGlobal('fetch', fetchMock);

    await request('/accounts');

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const headers = init.headers as Record<string, string>;
    expect(headers.Authorization).toBe('Bearer token-123');
    expect(init.credentials).toBe('include');
  });

  it('retries once after a successful silent refresh on 401', async () => {
    setAccessToken('expired-token');
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(401, { message: 'Unauthorized' }))
      .mockResolvedValueOnce(jsonResponse(200, { accessToken: 'new-token' }))
      .mockResolvedValueOnce(jsonResponse(200, [{ id: 'acc-1' }]));
    vi.stubGlobal('fetch', fetchMock);

    const result = await request<Array<{ id: string }>>('/accounts');

    expect(result).toEqual([{ id: 'acc-1' }]);
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(fetchMock.mock.calls[1]?.[0]).toContain('/auth/refresh');
    expect(getAccessToken()).toBe('new-token');
  });

  it('gives up and clears the token if the refresh also fails', async () => {
    setAccessToken('expired-token');
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(401, { message: 'Unauthorized' }))
      .mockResolvedValueOnce(jsonResponse(401, { message: 'Invalid refresh token' }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(request('/accounts')).rejects.toBeInstanceOf(ApiError);
    expect(getAccessToken()).toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('does not retry more than once even if the retried request 401s again', async () => {
    setAccessToken('expired-token');
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(401, { message: 'Unauthorized' }))
      .mockResolvedValueOnce(jsonResponse(200, { accessToken: 'new-token' }))
      .mockResolvedValueOnce(jsonResponse(401, { message: 'Still unauthorized' }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(request('/accounts')).rejects.toBeInstanceOf(ApiError);
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(getAccessToken()).toBeNull();
  });

  it('does not attempt a silent refresh for unauthenticated requests', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(401, { message: 'Invalid credentials' }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(
      request('/auth/login', { method: 'POST', body: { email: 'a@b.com', password: 'x' }, auth: false }),
    ).rejects.toBeInstanceOf(ApiError);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('propagates the API error message for a non-401 failure', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(409, { message: 'Email already in use' }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(
      request('/auth/register', { method: 'POST', body: {}, auth: false }),
    ).rejects.toMatchObject({ status: 409, message: 'Email already in use' });
  });
});
