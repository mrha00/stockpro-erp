/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Search, Bell, HelpCircle, Menu, PlusCircle, Languages } from 'lucide-react';
import { useI18n } from '../i18n/I18nContext';

interface HeaderProps {
  globalSearch: string;
  setGlobalSearch: (val: string) => void;
  onCreateOrderClick: () => void;
  setMobileOpen: (open: boolean) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  user: { name: string; avatarUrl: string } | null;
  notificationCount: number;
  triggerNotificationPanel: () => void;
}

export default function Header({
  globalSearch,
  setGlobalSearch,
  onCreateOrderClick,
  setMobileOpen,
  activeTab,
  setActiveTab,
  user,
  notificationCount,
  triggerNotificationPanel
}: HeaderProps) {
  const { locale, setLocale, t } = useI18n();

  return (
    <header className="h-16 border-b border-slate-200 bg-white sticky top-0 z-30 px-6 flex items-center justify-between shrink-0" id="top-nav-bar">
      
      {/* Left: Mobile Menu Toggler + Desktop Navigation Links */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => setMobileOpen(true)}
          className="p-1 px-1.5 text-slate-500 hover:bg-slate-100 rounded-lg md:hidden transition-colors"
          title="Toggle Menu"
          id="header-mobile-menu-btn"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="hidden md:flex items-center gap-6 h-full">
          <nav className="flex items-center gap-6 text-sm font-medium h-16">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`h-full border-b-2 flex items-center px-1 transition-all ${
                activeTab === 'dashboard' 
                  ? 'border-blue-600 text-blue-600 font-semibold' 
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              {locale === 'zh' ? '控制台概览' : 'Dashboard'}
            </button>
            <button
              onClick={() => setActiveTab('products')}
              className={`h-full border-b-2 flex items-center px-1 transition-all ${
                activeTab === 'products' 
                  ? 'border-blue-600 text-blue-600 font-semibold' 
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              {locale === 'zh' ? '商品与统计' : 'Products'}
            </button>
          </nav>
        </div>
      </div>

      {/* Middle: Search */}
      <div className="flex-1 max-w-sm mx-4 hidden sm:block">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder={t('header.search')}
            value={globalSearch}
            onChange={(e) => setGlobalSearch(e.target.value)}
            className="w-full h-9 pl-9 pr-4 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white text-xs text-slate-700 outline-hidden focus:ring-1 focus:ring-blue-600 focus:border-blue-600 transition-all"
            id="global-search-input"
          />
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-3">
        {/* Language Toggle */}
        <button
          onClick={() => setLocale(locale === 'zh' ? 'en' : 'zh')}
          className="p-1 px-1.5 rounded-lg hover:bg-slate-50 text-slate-500 hover:text-slate-800 transition-all cursor-pointer flex items-center gap-1"
          title="Switch Language"
        >
          <Languages className="w-4 h-4" />
          <span className="text-[10px] font-bold">{locale === 'zh' ? 'EN' : '中'}</span>
        </button>

        {/* Quick Order Button */}
        <button
          onClick={onCreateOrderClick}
          className="hidden sm:flex items-center gap-1.5 h-8 px-3 rounded-lg bg-blue-600 text-white hover:bg-blue-700 font-medium text-xs shadow-xs focus:ring-2 focus:ring-blue-600 focus:ring-offset-1 transition-all cursor-pointer"
          id="header-create-order-btn"
        >
          <PlusCircle className="w-4 h-4" />
          {locale === 'zh' ? '创建新订单' : 'New Order'}
        </button>

        <button
          onClick={onCreateOrderClick}
          className="p-1 px-1.5 block sm:hidden rounded-lg hover:bg-slate-50 text-blue-600 transition-all cursor-pointer"
          title="New Order"
        >
          <PlusCircle className="w-5 h-5" />
        </button>

        <div className="h-6 w-px bg-slate-200 hidden sm:block" />

        <button
          onClick={triggerNotificationPanel}
          className="p-1 px-1.5 rounded-full hover:bg-slate-50 text-slate-500 hover:text-slate-800 relative transition-all"
          title="Low Stock Alerts"
          id="header-bell"
        >
          <Bell className="w-5 h-5" />
          {notificationCount > 0 && (
            <span className="absolute top-1 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full select-none" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('help')}
          className="p-1 px-1.5 rounded-full hover:bg-slate-50 text-slate-500 hover:text-slate-800 transition-all hidden sm:block"
          title="Help"
        >
          <HelpCircle className="w-5 h-5" />
        </button>

        {user && (
          <div 
            onClick={() => setActiveTab('settings')}
            className="flex items-center gap-2 cursor-pointer group"
          >
            <div className="h-8 w-8 rounded-full overflow-hidden border border-slate-200 group-hover:opacity-95 transition-opacity bg-slate-100 shrink-0">
              <img
                src={user.avatarUrl}
                alt={user.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = `https://api.dicebear.com/7.x/adventurer/svg?seed=${user.name}`;
                }}
              />
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
