/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback } from 'react';
import {
  Bell,
  HelpCircle,
  Settings as SettingsIcon,
  Check,
  X,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  FileText,
  Warehouse,
  Info
} from 'lucide-react';

import { Product, Transaction, Order, SupplierOrContact } from './types';
import { isLowStock } from './utils/inventory';

import * as authApi from './api/auth';
import * as productsApi from './api/products';
import * as inventoryApi from './api/inventory';
import * as ordersApi from './api/orders';
import * as contactsApi from './api/contacts';
import { setAuthExpiredHandler, clearTokens } from './api/client';

import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Login from './components/Login';
import DashboardView from './components/DashboardView';
import ProductManagementView from './components/ProductManagementView';
import OrderManagementView from './components/OrderManagementView';
import InventoryView from './components/InventoryView';
import ContactsView from './components/ContactsView';
import ProfileSettings from './components/ProfileSettings';

interface ActiveUser {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
}

// 从 localStorage 恢复用户状态
function loadSavedUser(): ActiveUser | null {
  try {
    const saved = localStorage.getItem('stockpro_user');
    if (saved) {
      return JSON.parse(saved);
    }
  } catch { /* ignore */ }
  return null;
}

export default function App() {
  // --- 1. Authentication State ---
  const [currentUser, setCurrentUser] = useState<ActiveUser | null>(loadSavedUser);

  // --- 2. Data State ---
  const [products, setProducts] = useState<Product[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [contacts, setContacts] = useState<SupplierOrContact[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);

  // --- 3. Loading & Error State ---
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(false);
  const [isLoadingContacts, setIsLoadingContacts] = useState(false);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [errorProducts, setErrorProducts] = useState<string | null>(null);
  const [errorTransactions, setErrorTransactions] = useState<string | null>(null);
  const [errorContacts, setErrorContacts] = useState<string | null>(null);
  const [errorOrders, setErrorOrders] = useState<string | null>(null);

  // --- 4. UI State ---
  const [activeTab, setActiveTab] = useState('dashboard');
  const [globalSearch, setGlobalSearch] = useState('');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [showNotificationPanel, setShowNotificationPanel] = useState(false);
  const [isCompactMode, setIsCompactMode] = useState(false);
  const [passedRouteParams, setPassedRouteParams] = useState<any>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'warn' | 'error' } | null>(null);

  // ========== Helpers ==========

  const triggerToast = (message: string, type: 'success' | 'warn' | 'error') => {
    setToast({ message, type });
  };

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // ========== Data Loading ==========

  const loadAllData = useCallback(async () => {
    setIsLoadingProducts(true);
    setIsLoadingOrders(true);
    setIsLoadingContacts(true);
    setIsLoadingTransactions(true);
    setErrorProducts(null);
    setErrorOrders(null);
    setErrorContacts(null);
    setErrorTransactions(null);

    try {
      const [prodRes, txRes, ordRes, cntRes, cats] = await Promise.all([
        productsApi.getProducts({ pageSize: 1000 }).catch(e => { throw e; }),
        inventoryApi.getTransactions({ pageSize: 1000 }).catch(e => { throw e; }),
        ordersApi.getAllOrders({ pageSize: 1000 }).catch(e => { throw e; }),
        contactsApi.getAllContacts({ pageSize: 1000 }).catch(e => { throw e; }),
        productsApi.getCategoryOptions().catch(() => []),
      ]);
      setProducts(prodRes.items);
      setTransactions(txRes.items);
      setOrders(ordRes.items);
      setContacts(cntRes);
      setCategories(cats);
    } catch (e: any) {
      setErrorProducts(e.message || '加载商品失败');
      setErrorOrders(e.message || '加载订单失败');
      setErrorContacts(e.message || '加载联系人失败');
      setErrorTransactions(e.message || '加载交易流水失败');
    } finally {
      setIsLoadingProducts(false);
      setIsLoadingOrders(false);
      setIsLoadingContacts(false);
      setIsLoadingTransactions(false);
    }
  }, []);

  // Load data after login
  useEffect(() => {
    if (currentUser) {
      loadAllData();
    }
  }, [currentUser, loadAllData]);

  // Auth expired handler
  useEffect(() => {
    const handler = () => {
      setCurrentUser(null);
      clearTokens();
      triggerToast('登录凭证已过期，请重新登录', 'warn');
    };
    setAuthExpiredHandler(handler);
    return () => setAuthExpiredHandler(null);
  }, []);

  // ========== Auth Handlers ==========

  const handleLoginSuccess = async (username: string, password: string) => {
    try {
      const { user } = await authApi.login(username, password);
      const activeUser = authApi.profileToActiveUser(user);
      setCurrentUser(activeUser);
      localStorage.setItem('stockpro_user', JSON.stringify(activeUser));
      triggerToast(`登录成功！欢迎来到 StockPro ERP 进销存后台，${user.name}。`, 'success');
    } catch (e: any) {
      throw e;
    }
  };

  const handleUserUpdate = (user: ActiveUser) => {
    setCurrentUser(user);
    localStorage.setItem('stockpro_user', JSON.stringify(user));
  };

  const handleLogout = async () => {
    try {
      await authApi.revokeToken();
    } catch { /* ignore */ }
    clearTokens();
    localStorage.removeItem('stockpro_user');
    setCurrentUser(null);
    setProducts([]);
    setTransactions([]);
    setContacts([]);
    setOrders([]);
    triggerToast('您已成功退出登录办公后台。', 'success');
  };

  // ========== Mutation Handlers ==========

  const handleAddProduct = async (newProduct: Omit<Product, 'id'>) => {
    try {
      const created = await productsApi.createProduct(newProduct, newProduct.categoryId);
      setProducts(prev => [created, ...prev]);
      triggerToast('商品添加成功', 'success');
    } catch (e: any) {
      triggerToast(e.message || '添加商品失败', 'error');
    }
  };

  const handleUpdateProduct = async (updated: Product) => {
    try {
      const result = await productsApi.updateProduct(updated.id, updated, updated.categoryId);
      setProducts(prev => prev.map(p => p.id === result.id ? result : p));
      triggerToast('商品更新成功', 'success');
    } catch (e: any) {
      triggerToast(e.message || '更新商品失败', 'error');
    }
  };

  const handleDeleteProduct = async (id: string) => {
    try {
      await productsApi.deleteProduct(id);
      setProducts(prev => prev.filter(p => p.id !== id));
      triggerToast('商品已移除', 'success');
    } catch (e: any) {
      triggerToast(e.message || '删除商品失败', 'error');
    }
  };

  const handleCreateOrder = async (newOrder: Omit<Order, 'id' | 'date'>) => {
    try {
      // Find or use first customer as fallback (backend requires customerId)
      const customers = await contactsApi.getAllContacts();
      const customer = customers.find(c => c.role === 'customer') || customers[0];
      if (!customer) {
        triggerToast('请先创建客户', 'error');
        return;
      }

      const itemRequests = newOrder.items.map(i => ({
        productId: i.productId,
        unitPrice: i.price,
        quantity: i.qty,
      }));

      const created = await ordersApi.createAndFulfillSalesOrder(customer.id, itemRequests);
      setOrders(prev => [created, ...prev]);

      const prodRes = await productsApi.getProducts({ pageSize: 1000 });
      setProducts(prodRes.items);

      triggerToast('订单已创建并完成出库，库存已扣减', 'success');
    } catch (e: any) {
      triggerToast(e.message || '创建订单失败', 'error');
    }
  };

  const handleAdjustStock = async (
    productId: string,
    qty: number,
    actionType: string,
    location: string,
    reason: string
  ) => {
    try {
      const adjustTypeMap: Record<string, string> = {
        'to_frozen': 'Freeze',
        'to_available': 'Unfreeze',
        'replenish': 'Inbound',
        'deprecate': 'Outbound',
      };
      const adjustType = adjustTypeMap[actionType] || 'Inbound';

      await inventoryApi.adjustInventory({
        productId,
        quantity: qty,
        adjustType,
        reason: `${reason} [位置: ${location}]`,
      });

      // Reload data
      const [prodRes, txRes] = await Promise.all([
        productsApi.getProducts({ pageSize: 1000 }),
        inventoryApi.getTransactions({ pageSize: 1000 }),
      ]);
      setProducts(prodRes.items);
      setTransactions(txRes.items);

      triggerToast('库存调整成功', 'success');
    } catch (e: any) {
      triggerToast(e.message || '库存调整失败', 'error');
    }
  };

  const handleAddContact = async (newContact: Omit<SupplierOrContact, 'id'>) => {
    try {
      let created: SupplierOrContact;
      if (newContact.role === 'supplier') {
        created = await contactsApi.createSupplier({
          name: newContact.name,
          code: `S-${Date.now()}`,
          contactPerson: newContact.name,
          phone: newContact.phone,
          email: newContact.email,
        });
      } else {
        created = await contactsApi.createCustomer({
          name: newContact.name,
          code: `C-${Date.now()}`,
          contactPerson: newContact.name,
          phone: newContact.phone,
          email: newContact.email,
        });
      }
      setContacts(prev => [created, ...prev]);
      triggerToast('联系人添加成功', 'success');
    } catch (e: any) {
      triggerToast(e.message || '添加联系人失败', 'error');
    }
  };

  const handleResetDatabases = async () => {
    await loadAllData();
    triggerToast('数据已从服务器重新加载。', 'success');
  };

  // Navigate helper
  const handleNavigateWithTabState = (tab: string, state?: any) => {
    setActiveTab(tab);
    setPassedRouteParams(state ?? null);
  };

  const lowStockProductsList = products.filter(isLowStock);

  // ========== RENDER ==========

  if (!currentUser) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden text-slate-800 font-sans antialiased" id="erplayout-frame">

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-bounce duration-500 max-w-sm pointer-events-auto" id="system-toast">
          <div className={`p-4 rounded-xl border flex items-start gap-3 shadow-lg ${
            toast.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
            toast.type === 'warn' ? 'bg-amber-50 text-amber-800 border-amber-200' :
            'bg-red-50 text-red-800 border-red-200'
          }`}>
            <div className="shrink-0 mt-0.5">
              {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> :
               toast.type === 'warn' ? <AlertTriangle className="w-5 h-5 text-amber-500" /> :
               <X className="w-5 h-5 text-red-650" />}
            </div>
            <div className="flex-1 text-xs">
              <p className="font-bold leading-normal">
                {toast.type === 'success' ? '审核成功 (Success)' :
                 toast.type === 'warn' ? '物流警报 (Logistics alerts)' : '业务异常错误 Alert'}
              </p>
              <p className="text-[11px] leading-relaxed text-slate-600/95 mt-1">{toast.message}</p>
            </div>
            <button onClick={() => setToast(null)} className="p-0.5 hover:bg-slate-200/50 rounded-md text-slate-500/80 cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <Sidebar
        activeTab={activeTab}
        setActiveTab={handleNavigateWithTabState}
        user={currentUser}
        onLogout={handleLogout}
        mobileOpen={mobileSidebarOpen}
        setMobileOpen={setMobileSidebarOpen}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden" id="viewport-box">
        <Header
          globalSearch={globalSearch}
          setGlobalSearch={setGlobalSearch}
          onCreateOrderClick={() => {
            setActiveTab('orders');
            triggerToast('请填写以下客户及购买数量表格，即可完成备料出库订单登记！', 'success');
          }}
          setMobileOpen={setMobileSidebarOpen}
          activeTab={activeTab}
          setActiveTab={handleNavigateWithTabState}
          user={currentUser}
          notificationCount={lowStockProductsList.length}
          triggerNotificationPanel={() => setShowNotificationPanel(!showNotificationPanel)}
        />

        {/* Notification Panel */}
        {showNotificationPanel && (
          <div className="absolute top-16 right-6 w-80 bg-white shadow-xl border border-slate-200 rounded-xl z-40 overflow-hidden" id="bells-dropdown">
            <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center h-11 leading-none select-none">
              <span className="text-xs font-bold text-slate-900 flex items-center gap-1">
                <Bell className="w-4 h-4 text-red-500 animate-pulse" />
                低库存账面警告 ({lowStockProductsList.length})
              </span>
              <button onClick={() => setShowNotificationPanel(false)} className="text-xs font-semibold text-blue-600 hover:underline hover:text-blue-700 cursor-pointer">关闭</button>
            </div>
            <div className="max-h-64 overflow-y-auto divide-y divide-slate-100 font-medium">
              {lowStockProductsList.length > 0 ? (
                lowStockProductsList.map((p) => (
                  <div key={p.id} onClick={() => { handleNavigateWithTabState('products', { filterLowStock: true }); setShowNotificationPanel(false); }} className="p-3 hover:bg-slate-50 cursor-pointer flex items-start gap-2.5 text-xs transition-colors">
                    <AlertTriangle className="w-4.5 h-4.5 text-red-500 mt-0.5 shrink-0" />
                    <div>
                      <p className="font-semibold text-slate-800 leading-normal">{p.name}</p>
                      <p className="text-[10px] text-slate-400 mt-1">货仓货号: <span className="font-mono">{p.sku}</span> | 当前总余: <span className="text-red-500 font-bold font-mono">{p.stock}</span> 件</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center text-xs text-slate-400 font-normal">库区非常健康！没有发现任何低库存警告。</div>
              )}
            </div>
          </div>
        )}

        <main className="flex-1 overflow-y-auto p-6 bg-slate-15/4 scrollbar-thin">

          {activeTab === 'dashboard' && (
            <DashboardView
              products={products}
              transactions={transactions}
              orders={orders}
              onNavigateToTab={handleNavigateWithTabState}
              triggerToast={triggerToast}
            />
          )}

          {activeTab === 'products' && (
            <ProductManagementView
              products={products}
              categories={categories}
              onAddProduct={handleAddProduct}
              onUpdateProduct={handleUpdateProduct}
              onDeleteProduct={handleDeleteProduct}
              triggerToast={triggerToast}
              globalSearch={globalSearch}
              initialFilterLowStock={passedRouteParams?.filterLowStock || false}
              isLoading={isLoadingProducts}
              error={errorProducts}
              onRetry={loadAllData}
            />
          )}

          {activeTab === 'orders' && (
            <OrderManagementView
              orders={orders}
              products={products}
              onCreateOrder={handleCreateOrder}
              triggerToast={triggerToast}
              isLoading={isLoadingOrders}
              error={errorOrders}
              onRetry={loadAllData}
            />
          )}

          {activeTab === 'inventory' && (
            <InventoryView
              products={products}
              transactions={transactions}
              onAdjustStock={handleAdjustStock}
              triggerToast={triggerToast}
              isLoading={isLoadingProducts}
              error={errorProducts}
              onRetry={loadAllData}
            />
          )}

          {activeTab === 'contacts' && (
            <ContactsView
              contacts={contacts}
              onAddContact={handleAddContact}
              triggerToast={triggerToast}
              isLoading={isLoadingContacts}
              error={errorContacts}
              onRetry={loadAllData}
            />
          )}

          {/* Settings */}
          {activeTab === 'settings' && (
            <div className="space-y-8" id="settings-frame">
              <ProfileSettings
                user={currentUser}
                onUserUpdate={handleUserUpdate}
                triggerToast={triggerToast}
              />

              <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">系统数据维护</h2>
                <p className="text-xs text-slate-500 mt-1">管理和维护您的企业级 StockPro ERP 云账册，清理系统缓存，以及改变数据渲染选项。</p>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl max-w-2xl divide-y divide-slate-100 shadow-xs">
                <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5 leading-none">
                      <SettingsIcon className="w-4 h-4 text-slate-400" />复归重置全仓库账
                    </h3>
                    <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">从服务器重新加载所有数据，刷新当前页面缓存。</p>
                  </div>
                  <button onClick={handleResetDatabases} className="flex items-center gap-1 px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 text-xs font-bold rounded-lg border border-red-200/50 shrink-0 cursor-pointer select-none transition-colors">
                    <RotateCcw className="w-3.5 h-3.5" />重新加载数据
                  </button>
                </div>

                <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 leading-none">自适应压缩紧凑模式 Layout density</h3>
                    <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">开启后，商品列表和账目监控表格单元行高度会被自适应压缩，有利于大型显示媒介或资深财务经理同屏审阅庞杂数据。</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={isCompactMode} onChange={(e) => { setIsCompactMode(e.target.checked); triggerToast(e.target.checked ? '紧凑布局视图已启用，同屏数据行增加。' : '默认舒适布局视图已还原。', 'success'); }} className="sr-only peer" />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600" />
                  </label>
                </div>

                <div className="p-5">
                  <h3 className="text-sm font-bold text-slate-900 leading-none mb-3">系统账套技术规格 Metadata Specs</h3>
                  <div className="grid grid-cols-2 gap-4 text-xs font-semibold text-slate-600 font-mono">
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                      <p className="text-[10px] text-slate-400 font-sans uppercase">SYSTEM SUITE VERSION</p>
                      <p className="text-slate-800 font-bold mt-1">v4.1.2-enterprise-stable</p>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                      <p className="text-[10px] text-slate-400 font-sans uppercase">ACTIVE AUTH ENTITY</p>
                      <p className="text-blue-600 font-extrabold mt-1 truncate">{currentUser.email}</p>
                    </div>
                  </div>
                </div>
              </div>
              </div>
            </div>
          )}

          {/* Help */}
          {activeTab === 'help' && (
            <div className="space-y-6" id="faq-frame">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">帮助中心 & 学堂 (FAQ)</h2>
                <p className="text-xs text-slate-500 mt-1">全面指引您如何安全且精细地协调划线库存、资金往来与交付活动。</p>
              </div>
              <div className="bg-white border border-slate-200 rounded-xl max-w-2xl p-6 space-y-6 shadow-xs leading-relaxed">
                <div className="space-y-2">
                  <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5 leading-none">
                    <CheckCircle2 className="w-4.5 h-4.5 text-blue-605 shrink-0" />什么是"可出库"与"锁定/冻结"？
                  </h3>
                  <ul className="text-xs text-slate-500 list-disc list-inside space-y-1.5 pl-2 font-medium">
                    <li><strong>安全可用 (Available):</strong> 指当前在货库架上，且未被任何已经开启或预定的订单合约、物料交付表单所锁定分配的实物。</li>
                    <li><strong>备料锁定 (Frozen):</strong> 指被挂起或预留给指定批发大商户的实物备料，属于禁止直接发货清关的状态。</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5 leading-none">
                    <FileText className="w-4.5 h-4.5 text-blue-650 shrink-0" />怎样进行手动损益大追加或损坏报销核除？
                  </h3>
                  <p className="text-xs text-slate-600">点击右上角的<strong>"快速库存调节"</strong>，选择对应操作类型。</p>
                </div>
                <div className="space-y-2">
                  <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5 leading-none">
                    <Warehouse className="w-4.5 h-4.5 text-blue-650 shrink-0" />数据存储在哪里？
                  </h3>
                  <p className="text-xs text-slate-600 font-medium">所有数据存储在 SQL Server 数据库，通过 .NET 后端 API 访问。每次操作实时同步。</p>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
