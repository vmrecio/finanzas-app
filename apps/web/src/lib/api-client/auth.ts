import { clearAccessToken, request, setAccessToken } from './http';
import type { LoginInput, LoginResult, MeResult, RegisterInput, RegisterResult } from './types';

export async function register(input: RegisterInput): Promise<RegisterResult> {
  return request<RegisterResult>('/auth/register', { method: 'POST', body: input, auth: false });
}

export async function login(input: LoginInput): Promise<LoginResult> {
  const result = await request<LoginResult>('/auth/login', {
    method: 'POST',
    body: input,
    auth: false,
  });
  setAccessToken(result.accessToken);
  return result;
}

export async function logout(): Promise<void> {
  try {
    await request<{ success: true }>('/auth/logout', { method: 'POST', auth: false });
  } finally {
    clearAccessToken();
  }
}

export async function me(): Promise<MeResult> {
  return request<MeResult>('/auth/me');
}
