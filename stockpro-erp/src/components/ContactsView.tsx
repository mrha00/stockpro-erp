/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, FormEvent } from 'react';
import { Search, User, Phone, Mail, Building, UserPlus, Info, Loader2, AlertTriangle } from 'lucide-react';
import { SupplierOrContact } from '../types';

interface ContactsViewProps {
  contacts: SupplierOrContact[];
  onAddContact: (contact: Omit<SupplierOrContact, 'id'>) => void;
  triggerToast: (msg: string, type: 'success' | 'warn' | 'error') => void;
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
}

export default function ContactsView({
  contacts,
  onAddContact,
  triggerToast,
  isLoading,
  error,
  onRetry,
}: ContactsViewProps) {
  const [search, setSearch] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);
  
  // Fields for adding new contact
  const [name, setName] = useState('');
  const [role, setRole] = useState<'admin' | 'salesman' | 'warehouse' | 'purchaser'>('purchaser');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [company, setCompany] = useState('');

  const filteredContacts = contacts.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    c.company.toLowerCase().includes(search.toLowerCase())
  );

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      triggerToast('请输入合规的代表姓名！', 'error');
      return;
    }

    onAddContact({
      name,
      role,
      email: email || 'contact@stockpro.com',
      phone: phone || '13800000000',
      company: company || 'StockPro Partner Corp'
    });

    setIsAddOpen(false);
    setName('');
    setEmail('');
    setPhone('');
    setCompany('');
    triggerToast(`商户联系代表 ${name} 已保存到通讯录中。`, 'success');
  };

  return (
    <div className="space-y-4 shadow-3xs" id="contacts-panel">
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
          <span className="ml-3 text-sm text-slate-500">加载中...</span>
        </div>
      )}
      {error && !isLoading && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
          <p className="text-sm text-red-700 flex-1">{error}</p>
          {onRetry && <button onClick={onRetry} className="px-3 py-1 text-xs font-semibold bg-red-600 text-white rounded hover:bg-red-700 cursor-pointer">重试</button>}
        </div>
      )}
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">往来与代表管理</h2>
          <p className="text-xs text-slate-500 mt-1">
            监控和建立针对外部商户提供协作代表以及内部执行角色的对应联系卡。 (Business Stakeholder Directory)
          </p>
        </div>
        <button
          onClick={() => setIsAddOpen(true)}
          className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg shadow-xs transition-all cursor-pointer"
        >
          <UserPlus className="w-4 h-4 mr-1.5" />
          添加入账代表 (New Supplier/Client)
        </button>
      </div>

      {/* Query Bar */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-4 flex flex-wrap gap-4 items-end shadow-xs">
        <div className="flex-1 min-w-[240px]">
          <label className="block text-xs font-semibold text-slate-500 mb-1.5 select-none">按名称或关联企业过滤</label>
          <div className="relative">
            <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              placeholder="输入姓名拼音首字母、电子邮箱、合作商代表公司..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-9 pl-9 pr-4 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white text-xs outline-hidden focus:ring-1 focus:ring-blue-600 focus:border-blue-600"
            />
          </div>
        </div>
      </div>

      {/* Grid stakeholder cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4" id="contacts-grid">
        {filteredContacts.length > 0 ? (
          filteredContacts.map(c => {
            return (
              <div key={c.id} className="bg-white border border-slate-200/80 rounded-xl p-5 hover:shadow-xs transition-shadow flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-full bg-slate-50 flex items-center justify-center text-slate-600 border border-slate-100">
                        <User className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 leading-snug">{c.name}</h4>
                        <span className="text-[10px] text-slate-400 uppercase tracking-widest font-mono select-none">{c.id}</span>
                      </div>
                    </div>
                    
                    {/* Badge tags mapped exactly to CSS stylesheet mappings in mockups! */}
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold leading-none select-none uppercase tracking-wider ${
                      c.role === 'admin' ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' :
                      c.role === 'purchaser' ? 'bg-cyan-50 text-cyan-700 border border-cyan-100' :
                      c.role === 'warehouse' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                      'bg-pink-50 text-pink-700 border border-pink-100'
                    }`}>
                      {c.role === 'admin' ? '超级管理员 Admin' : 
                       c.role === 'purchaser' ? '采购专员 Purchaser' : 
                       c.role === 'warehouse' ? '仓储调度 Warehouse' : '分流销售员 Sales'}
                    </span>
                  </div>

                  <div className="space-y-2 text-xs font-semibold text-slate-600 pt-1 border-t border-slate-100 mt-2">
                    <div className="flex items-center gap-2">
                      <Building className="w-4 h-4 text-slate-400" />
                      <span className="truncate">{c.company}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-slate-400" />
                      <span className="font-mono">{c.phone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-slate-400" />
                      <span className="font-mono text-slate-500 truncate">{c.email}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-full bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-400 font-normal">
            <Info className="w-8 h-8 mx-auto text-slate-300 mb-2" />
            没有找到当前的协作或业务往来代表。
          </div>
        )}
      </div>

      {/* POPUP MODAL DIALOG TO ADD STAKEHOLDER */}
      {isAddOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-sm w-full p-6 text-left">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3 mb-4 leading-none">添加入账代表 / New Stakeholder</h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-600">姓名 *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full h-9 px-3 border border-slate-200 rounded-lg text-xs outline-none bg-slate-50 focus:bg-white focus:ring-1 focus:ring-blue-600"
                  placeholder="蔡代表"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-600">角色 *</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as any)}
                  className="w-full h-9 px-3 border border-slate-200 rounded-lg text-xs outline-none cursor-pointer"
                >
                  <option value="purchaser">采购协作商 Purchaser</option>
                  <option value="salesman">销售代表 Salesman</option>
                  <option value="warehouse">仓房操作员 Warehouse</option>
                  <option value="admin">管理员 Administrator</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-600">手机号码 *</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full h-9 px-3 border border-slate-200 rounded-lg text-xs outline-none bg-slate-50 focus:bg-white focus:ring-1 focus:ring-blue-600 font-mono"
                  placeholder="13800001234"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-600">电子邮箱</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-9 px-3 border border-slate-200 rounded-lg text-xs outline-none bg-slate-50 focus:bg-white focus:ring-1 focus:ring-blue-600 font-mono"
                  placeholder="caihaifeng203@gmail.com"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-600">公司所属合作商</label>
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  className="w-full h-9 px-3 border border-slate-200 rounded-lg text-xs outline-none bg-slate-50 focus:bg-white focus:ring-1 focus:ring-blue-600"
                  placeholder="蔡先生代表集团"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 font-semibold rounded-lg cursor-pointer animate-none"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-xs cursor-pointer"
                >
                  入档保存 Add Representative
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
