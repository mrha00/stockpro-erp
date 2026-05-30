/**
 * 默认头像（DiceBear）与 URL 解析
 */

export function getDefaultAvatarUrl(name: string): string {
  return `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(name || 'user')}`;
}

export function resolveAvatarUrl(avatarUrl?: string | null, fallbackName?: string): string {
  if (avatarUrl?.trim()) return avatarUrl;
  return getDefaultAvatarUrl(fallbackName || 'user');
}
