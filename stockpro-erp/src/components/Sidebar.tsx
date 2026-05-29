/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Users, 
  Warehouse, 
  Settings, 
  HelpCircle, 
  LogOut,
  User
} from 'lucide-react';
import { useI18n } from '../i18n/I18nContext';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  user: { name: string; email: string; avatarUrl: string } | null;
  onLogout: () => void;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

export default function Sidebar({
  activeTab,
  setActiveTab,
  user,
  onLogout,
  mobileOpen,
  setMobileOpen,
}: SidebarProps) {
  const { locale, t } = useI18n();

  const navItems = [
    { id: 'dashboard', icon: LayoutDashboard },
    { id: 'products', icon: Package },
    { id: 'orders', icon: ShoppingCart },
    { id: 'contacts', icon: Users },
    { id: 'inventory', icon: Warehouse },
  ];

  const handleTabClick = (id: string) => {
    setActiveTab(id);
    setMobileOpen(false);
  };

  return (
    <>
      {mobileOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside className={`
        fixed inset-y-0 left-0 z-50 md:sticky md:z-20
        flex flex-col h-screen py-5 w-60 border-r border-slate-200 bg-white
        transition-transform duration-300 ease-in-out
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `} id="sidebar">
        
        <div className="px-6 mb-6">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-8 h-8 rounded bg-blue-600 text-white font-bold text-lg">
              SP
            </div>
            <div>
              <h1 className="font-sans font-bold text-xl tracking-tight text-slate-900 leading-none">
                StockPro ERP
              </h1>
              <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold mt-1">
                Enterprise Inventory
              </p>
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 space-y-1 scrollbar-thin">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleTabClick(item.id)}
                className={`
                  w-full flex items-center px-4 py-2.5 rounded-lg text-left transition-all group
                  ${isActive 
                    ? 'font-semibold text-blue-600 bg-blue-50 border-r-4 border-blue-600' 
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }
                `}
                id={`sidebar-nav-${item.id}`}
              >
                <Icon className={`w-5 h-5 mr-3 shrink-0 ${isActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'}`} />
                <span className="text-sm font-medium leading-tight">{t(`nav.${item.id}`)}</span>
              </button>
            );
          })}
        </nav>

        <div className="mt-auto px-3 pt-4 border-t border-slate-100 flex flex-col gap-1">
          <button
            onClick={() => handleTabClick('settings')}
            className={`
              w-full flex items-center px-4 py-2 rounded-lg text-left transition-all text-slate-600 hover:bg-slate-50 hover:text-slate-900
              ${activeTab === 'settings' ? 'font-semibold text-blue-600 bg-blue-50 border-r-4 border-blue-600' : ''}
            `}
            id="sidebar-nav-settings"
          >
            <Settings className="w-4 h-4 mr-3 text-slate-400 shrink-0" />
            <span className="text-sm font-medium">{t('nav.settings')}</span>
          </button>

          <button
            onClick={() => handleTabClick('help')}
            className={`
              w-full flex items-center px-4 py-2 rounded-lg text-left transition-all text-slate-600 hover:bg-slate-50 hover:text-slate-900
              ${activeTab === 'help' ? 'font-semibold text-blue-600 bg-blue-50 border-r-4 border-blue-600' : ''}
            `}
            id="sidebar-nav-help"
          >
            <HelpCircle className="w-4 h-4 mr-3 text-slate-400 shrink-0" />
            <span className="text-sm font-medium">{t('nav.help')}</span>
          </button>

          {user && (
            <div className="mt-4 p-3 bg-slate-50 rounded-xl flex items-center justify-between border border-slate-100">
              <div className="flex items-center gap-2.5 min-w-0">
                <img
                  referrerPolicy="no-referrer"
                  src={user.avatarUrl}
                  alt={user.name}
                  className="w-8 h-8 rounded-full border border-slate-200 object-cover shrink-0"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = `https://api.dicebear.com/7.x/adventurer/svg?seed=${user.name}`;
                  }}
                />
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-slate-800 truncate leading-tight">
                    {user.name}
                  </div>
                  <div className="text-[10px] text-slate-400 truncate leading-none mt-0.5">
                    {user.email}
                  </div>
                </div>
              </div>
              <button
                onClick={onLogout}
                className="p-1 px-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-all shrink-0"
                title={t('nav.logout')}
                id="sidebar-logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
