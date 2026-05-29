import { apiClient, setTokens } from './client';
import { LoginRequest, LoginResponse, ApiResponse } from '../types';

export interface ActiveUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

export async function login(username: string, password: string): Promise<{ user: ActiveUser }> {
  const body: LoginRequest = { username, password };
  // login doesn't go through apiClient because we need the full response before token is set
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const json: ApiResponse<LoginResponse> = await res.json();
  if (!json.success || !json.data) {
    throw new Error(json.message || '登录失败');
  }
  setTokens(json.data.accessToken, json.data.refreshToken);
  return {
    user: {
      id: json.data.user.id,
      name: json.data.user.realName || json.data.user.username,
      email: json.data.user.email,
      role: json.data.user.role,
    },
  };
}

export async function refreshToken() {
  return apiClient<LoginResponse>('/api/auth/refresh-token', { method: 'POST' });
}

export async function revokeToken() {
  return apiClient<void>('/api/auth/revoke-token', { method: 'POST' });
}

export async function changePassword(oldPassword: string, newPassword: string) {
  return apiClient<void>('/api/auth/change-password', {
    method: 'POST',
    body: JSON.stringify({ oldPassword, newPassword }),
  });
}
