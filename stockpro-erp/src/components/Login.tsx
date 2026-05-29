/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, FormEvent } from 'react';
import { User, Lock, Warehouse, Loader2, AlertCircle } from 'lucide-react';
import { useI18n } from '../i18n/I18nContext';

interface LoginProps {
  onLoginSuccess: (username: string, password: string) => Promise<void>;
}

export default function Login({ onLoginSuccess }: LoginProps) {
  const { t } = useI18n();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    if (!username.trim() || !password.trim()) {
      setErrorMsg('如果您想要登录，请输入有效的用户名和密码！');
      setLoading(false);
      return;
    }

    try {
      await onLoginSuccess(username, password);
    } catch (e: any) {
      setErrorMsg(e.message || '登录失败，请检查用户名和密码');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 relative overflow-hidden" style={{
      background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)'
    }} id="login-container">
      
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 rounded-full bg-blue-400/10 blur-3xl" />
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 rounded-full bg-green-400/10 blur-3xl" />

      <div className="w-full max-w-md bg-white rounded-xl shadow-lg border border-slate-200/80 p-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-[5px] bg-blue-600" />

        <div className="text-center mb-8 mt-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-50 text-blue-600 mb-3" id="login-logo-holder">
            <Warehouse className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center justify-center gap-2">
            {t('login.title')}
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1 uppercase tracking-wider">
            {t('login.subtitle')}
          </p>
        </div>

        {errorMsg && (
          <div 
            className="flex items-start gap-2.5 bg-red-50 text-red-800 text-xs p-3.5 rounded-lg border border-red-200/60 mb-5"
            id="login-error-alert"
          >
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
            <div>
              <p className="font-semibold">{t('login.error')}</p>
              <p className="text-[11px] mt-0.5 text-red-700/90">{errorMsg}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5" id="loginForm">
          
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700" htmlFor="username">
              {t('login.username')}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <User className="w-4.5 h-4.5" />
              </div>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="block w-full pl-10 pr-3 py-2 border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg text-sm text-slate-800 bg-slate-50 focus:bg-white placeholder-slate-400 outline-hidden transition-all"
                placeholder="admin"
              />
            </div>
            <p className="text-[10px] text-slate-400 leading-none">{t('login.placeholder.user')}</p>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700" htmlFor="password">
              {t('login.password')}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4.5 h-4.5" />
              </div>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="block w-full pl-10 pr-3 py-2 border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg text-sm text-slate-800 bg-slate-50 focus:bg-white placeholder-slate-400 outline-hidden transition-all"
                placeholder="••••••••"
              />
            </div>
            <p className="text-[10px] text-slate-400 leading-none">{t('login.placeholder.pass')}</p>
          </div>

          <div className="flex items-center justify-between text-xs pt-1">
            <label className="flex items-center text-slate-600 font-medium cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 mr-2 cursor-pointer"
              />
              {t('login.remember')}
            </label>
            <a 
              href="#" 
              onClick={(e) => {
                e.preventDefault();
                setErrorMsg('重置密码码已发送至您的注册邮箱。请配合系统维护人员。');
              }}
              className="font-semibold text-blue-600 hover:text-blue-700"
            >
              {t('login.forgot')}
            </a>
          </div>

          <button
            id="loginBtn"
            type="submit"
            disabled={loading}
            className="w-full h-10 mt-2 flex items-center justify-center rounded-lg shadow-sm font-semibold text-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-4.5 h-4.5 animate-spin mr-2" />
                {t('login.loading')}
              </>
            ) : t('login.submit')}
          </button>
        </form>

        <div className="mt-8 text-center border-t border-slate-100 pt-4 text-[11px] text-slate-400 font-medium">
          <p>© 2026 进销存管理系统. 保权所有.</p>
          <p className="text-[9px] mt-0.5 tracking-wider uppercase text-slate-300">SYSTEMATIC ENTERPRISE ERP SUITE</p>
        </div>
      </div>
    </div>
  );
}
