import { apiClient, getToken, setTokens } from './client';
import { LoginRequest, LoginResponse, ApiResponse } from '../types';
import { resolveAvatarUrl } from '../utils/avatar';

export interface UserProfile {
  id: string;
  username: string;
  name: string;
  email: string;
  role: string;
  avatarUrl: string;
}

function mapUserDto(user: LoginResponse['user']): UserProfile {
  const name = user.realName || user.username;
  return {
    id: user.id,
    username: user.username,
    name,
    email: user.email,
    role: user.role,
    avatarUrl: resolveAvatarUrl(user.avatarUrl, name),
  };
}

export async function login(username: string, password: string): Promise<{ user: UserProfile }> {
  const body: LoginRequest = { username, password };
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
  return { user: mapUserDto(json.data.user) };
}

export async function getProfile(): Promise<UserProfile> {
  const data = await apiClient<LoginResponse['user']>('/api/auth/me');
  return mapUserDto(data);
}

export async function updateProfile(payload: { realName?: string; email?: string }): Promise<UserProfile> {
  const data = await apiClient<LoginResponse['user']>('/api/auth/profile', {
    method: 'PUT',
    body: JSON.stringify({
      realName: payload.realName,
      email: payload.email,
    }),
  });
  return mapUserDto(data);
}

export async function uploadAvatar(file: File): Promise<UserProfile> {
  const form = new FormData();
  form.append('file', file);
  const token = getToken();
  const res = await fetch('/api/auth/avatar', {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: form,
  });
  const json: ApiResponse<LoginResponse['user']> = await res.json();
  if (!json.success || !json.data) {
    throw new Error(json.message || '头像上传失败');
  }
  return mapUserDto(json.data);
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

export function profileToActiveUser(profile: UserProfile) {
  return {
    id: profile.id,
    name: profile.name,
    email: profile.email,
    avatarUrl: profile.avatarUrl,
  };
}
