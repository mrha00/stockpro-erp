/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useRef, FormEvent, ChangeEvent } from 'react';
import { Camera, KeyRound, Loader2, Save, User as UserIcon } from 'lucide-react';
import * as authApi from '../api/auth';
import { getDefaultAvatarUrl } from '../utils/avatar';

export interface ProfileUser {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
}

interface ProfileSettingsProps {
  user: ProfileUser;
  onUserUpdate: (user: ProfileUser) => void;
  triggerToast: (message: string, type: 'success' | 'warn' | 'error') => void;
}

export default function ProfileSettings({ user, onUserUpdate, triggerToast }: ProfileSettingsProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [realName, setRealName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [avatarPreview, setAvatarPreview] = useState(user.avatarUrl);
  const [savingProfile, setSavingProfile] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  const handleSaveProfile = async (e: FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const profile = await authApi.updateProfile({ realName: realName.trim(), email: email.trim() });
      const updated = authApi.profileToActiveUser(profile);
      onUserUpdate(updated);
      triggerToast('个人资料已保存', 'success');
    } catch (err: any) {
      triggerToast(err.message || '保存资料失败', 'error');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleAvatarChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      triggerToast('头像文件不能超过 2MB', 'error');
      return;
    }

    setUploadingAvatar(true);
    try {
      const profile = await authApi.uploadAvatar(file);
      const updated = authApi.profileToActiveUser(profile);
      setAvatarPreview(updated.avatarUrl);
      onUserUpdate(updated);
      triggerToast('头像已更新', 'success');
    } catch (err: any) {
      triggerToast(err.message || '头像上传失败', 'error');
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleChangePassword = async (e: FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      triggerToast('两次输入的新密码不一致', 'error');
      return;
    }
    setChangingPassword(true);
    try {
      await authApi.changePassword(oldPassword, newPassword);
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      triggerToast('密码修改成功，请妥善保管新密码', 'success');
    } catch (err: any) {
      triggerToast(err.message || '密码修改失败', 'error');
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">个人中心</h2>
        <p className="text-xs text-slate-500 mt-1">管理头像、基本资料与登录密码。</p>
      </div>

      {/* Avatar */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs max-w-2xl">
        <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Camera className="w-4 h-4 text-slate-400" />
          头像
        </h3>
        <div className="flex items-center gap-5">
          <div className="relative h-20 w-20 rounded-full overflow-hidden border-2 border-slate-200 bg-slate-100 shrink-0">
            <img
              src={avatarPreview}
              alt={user.name}
              className="w-full h-full object-cover"
              onError={(ev) => {
                (ev.currentTarget as HTMLImageElement).src = getDefaultAvatarUrl(user.name);
              }}
            />
            {uploadingAvatar && (
              <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
              </div>
            )}
          </div>
          <div className="space-y-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              className="hidden"
              onChange={handleAvatarChange}
            />
            <button
              type="button"
              disabled={uploadingAvatar}
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 text-xs font-bold rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 cursor-pointer"
            >
              上传新头像
            </button>
            <p className="text-[11px] text-slate-400">支持 JPG / PNG / GIF / WEBP，最大 2MB</p>
          </div>
        </div>
      </div>

      {/* Profile */}
      <form onSubmit={handleSaveProfile} className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs max-w-2xl space-y-4">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <UserIcon className="w-4 h-4 text-slate-400" />
          基本资料
        </h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">显示名称</label>
            <input
              type="text"
              value={realName}
              onChange={(e) => setRealName(e.target.value)}
              className="w-full h-9 px-3 rounded-lg border border-slate-200 text-sm focus:ring-1 focus:ring-blue-600 outline-hidden"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">邮箱</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full h-9 px-3 rounded-lg border border-slate-200 text-sm focus:ring-1 focus:ring-blue-600 outline-hidden"
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={savingProfile}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50 cursor-pointer"
        >
          {savingProfile ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
          保存资料
        </button>
      </form>

      {/* Password */}
      <form onSubmit={handleChangePassword} className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs max-w-2xl space-y-4">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <KeyRound className="w-4 h-4 text-slate-400" />
          修改密码
        </h3>
        <p className="text-[11px] text-slate-400 -mt-2">
          新密码至少 6 位，且需包含大小写字母、数字和特殊字符（如 Admin@123）
        </p>
        <div className="grid sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">当前密码</label>
            <input
              type="password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              required
              className="w-full h-9 px-3 rounded-lg border border-slate-200 text-sm focus:ring-1 focus:ring-blue-600 outline-hidden"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">新密码</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              className="w-full h-9 px-3 rounded-lg border border-slate-200 text-sm focus:ring-1 focus:ring-blue-600 outline-hidden"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">确认新密码</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full h-9 px-3 rounded-lg border border-slate-200 text-sm focus:ring-1 focus:ring-blue-600 outline-hidden"
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={changingPassword}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-50 cursor-pointer"
        >
          {changingPassword ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <KeyRound className="w-3.5 h-3.5" />}
          更新密码
        </button>
      </form>
    </div>
  );
}
