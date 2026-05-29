/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo } from 'react';
import { 
  TrendingUp, 
  Wallet, 
  BadgeAlert, 
  Clock, 
  HelpCircle, 
  MoreVertical, 
  ChevronRight, 
  ShoppingCart, 
  Truck,
  ArrowUpRight
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart, 
  Pie, 
  Cell,
  Legend
} from 'recharts';
import { Product, Transaction, Order } from '../types';
import { isLowStock } from '../utils/inventory';

interface DashboardViewProps {
  products: Product[];
  transactions: Transaction[];
  orders: Order[];
  onNavigateToTab: (tab: string, state?: any) => void;
  triggerToast: (msg: string, type: 'success' | 'warn' | 'error') => void;
}

export default function DashboardView({
  products,
  transactions,
  orders,
  onNavigateToTab,
  triggerToast
}: DashboardViewProps) {
  const [selectedRange, setSelectedRange] = useState<'all' | 'today' | 'week'>('all');

  // 1. Dynamic KPIs calculation
  const totalValue = useMemo(() => {
    return products.reduce((acc, p) => acc + (p.stock * p.price), 0);
  }, [products]);

  const todaySalesValue = useMemo(() => {
    // Sum of completed orders
    const completedOrders = orders.filter(o => o.orderStatus === 'completed' || o.orderStatus === 'processing');
    return completedOrders.reduce((acc, o) => acc + o.total, 0);
  }, [orders]);

  const lowStockCount = useMemo(() => {
    return products.filter(isLowStock).length;
  }, [products]);

  const pendingPurchasesCount = useMemo(() => {
    return orders.filter(o => o.type === 'purchase' && o.orderStatus === 'pending').length;
  }, [orders]);

  const monthlySalesData = useMemo(() => {
    const monthNames = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
    const buckets = new Map<number, { revenue: number; orders: number }>();

    orders
      .filter(o => o.type === 'sales' && (o.orderStatus === 'completed' || o.orderStatus === 'processing'))
      .forEach(o => {
        const month = new Date(o.date).getMonth();
        const current = buckets.get(month) ?? { revenue: 0, orders: 0 };
        current.revenue += o.total;
        current.orders += 1;
        buckets.set(month, current);
      });

    const now = new Date();
    const months: { name: string; revenue: number; orders: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const m = d.getMonth();
      const data = buckets.get(m) ?? { revenue: 0, orders: 0 };
      months.push({ name: monthNames[m], revenue: data.revenue, orders: data.orders });
    }
    return months;
  }, [orders]);

  // 3. Category Pie Chart Data
  const categoryData = useMemo(() => {
    const counts: Record<string, number> = {};
    products.forEach(p => {
      counts[p.category] = (counts[p.category] || 0) + (p.stock || 0);
    });

    const colors = ['#0057c2', '#1677ff', '#afc6ff', '#e2e2e2'];

    return Object.keys(counts).map((key, i) => ({
      name: key,
      value: counts[key],
      color: colors[i % colors.length]
    })).filter(item => item.value > 0);
  }, [products]);

  // Format currencies in Chinese notation or absolute dollars
  const formatYAxis = (value: number) => {
    if (value >= 1000) {
      return `$${(value / 1000).toFixed(0)}k`;
    }
    return `$${value}`;
  };

  const handleAlertsClick = () => {
    // Navigate with specialized filter
    onNavigateToTab('products', { filterLowStock: true });
    triggerToast('进入商品管理：已为您预先筛选出“仅显示低库存”商品。', 'success');
  };

  return (
    <div className="space-y-6" id="dashboard-view-main">
      
      {/* Page Header banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">控制台概览</h1>
          <p className="text-xs text-slate-500 mt-1">
            欢迎回来！这是您今天的业务现状和实时库存总览。 (Enterprise Inventory & Logistics)
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => onNavigateToTab('products')}
            className="flex items-center px-4 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            管理商品
          </button>
          <button
            onClick={() => onNavigateToTab('orders')}
            className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg shadow-xs transition-all cursor-pointer"
          >
            添加采购单/订单
          </button>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="kpi-cards-grid">
        
        {/* Card 1 */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 hover:shadow-xs transition-shadow flex flex-col justify-between">
          <div className="flex justify-between items-start mb-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">总库存价值 (Value)</span>
            <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900">
              ${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="flex items-center gap-1 mt-1.5 text-emerald-600 font-semibold text-xs">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>+4.5% 环比上月</span>
            </div>
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 hover:shadow-xs transition-shadow flex flex-col justify-between">
          <div className="flex justify-between items-start mb-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">今日销售额 (Sales)</span>
            <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
              <ShoppingCart className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900">
              ${todaySalesValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-xs text-slate-400 font-medium mt-1.5 flex items-center justify-between">
              <span>{orders.length} 已处理订单</span>
              <span className="text-blue-600 hover:underline cursor-pointer" onClick={() => onNavigateToTab('orders')}>查看订单</span>
            </div>
          </div>
        </div>

        {/* Card 3 */}
        <div 
          onClick={handleAlertsClick}
          className="bg-white p-5 rounded-xl border border-red-100 hover:border-red-300 bg-red-50/5 hover:shadow-xs transition-shadow flex flex-col justify-between cursor-pointer group"
        >
          <div className="flex justify-between items-start mb-3">
            <span className="text-xs font-semibold text-red-600 uppercase tracking-wider">低库存预警 (Alerts)</span>
            <div className="w-8 h-8 rounded-full bg-red-50 text-red-600 flex items-center justify-center font-bold text-xs shrink-0 group-hover:scale-105 transition-transform">
              {lowStockCount}项
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-red-600">
              {lowStockCount} 项
            </div>
            <div className="text-xs text-slate-400 font-medium mt-1.5 flex items-center gap-1">
              <span className="text-blue-600 underline font-semibold group-hover:text-blue-800 transition-colors">立即查看预警</span>
            </div>
          </div>
        </div>

        {/* Card 4 */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 hover:shadow-xs transition-shadow flex flex-col justify-between">
          <div className="flex justify-between items-start mb-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">待审核调整/采购</span>
            <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center text-amber-600 shrink-0">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900">
              {pendingPurchasesCount} 笔
            </div>
            <div className="flex items-center gap-1.5 mt-1.5 text-amber-600 font-semibold text-xs">
              <Clock className="w-3.5 h-3.5" />
              <span>待审批业务</span>
            </div>
          </div>
        </div>

      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5" id="charts-analysis-grid">
        
        {/* Bar Chart Area (Sales Flow) */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200/80 p-5 flex flex-col h-80 shadow-xs">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="font-sans font-bold text-sm text-slate-900">最近销售与流水统计 (Revenue Flow)</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">最近六个月的月度总销售额与财务流水趋势统计</p>
            </div>
            <button className="p-1 px-1.5 rounded-lg text-slate-400 hover:bg-slate-50 hover:text-slate-600">
              <MoreVertical className="w-4 h-4" />
            </button>
          </div>
          <div className="flex-1 w-full text-xs">
            {monthlySalesData && monthlySalesData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlySalesData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} tickFormatter={formatYAxis} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1e293b', 
                      borderRadius: '8px', 
                      color: '#f8fafc',
                      border: 'none',
                      fontSize: '11px',
                      padding: '8px 12px'
                    }} 
                    formatter={(value: any) => [`$${value.toLocaleString()}`, '销售总额 ($)']}
                    labelStyle={{ fontWeight: 'bold', color: '#38bdf8', marginBottom: '4px' }}
                  />
                  <Bar dataKey="revenue" fill="#0057c2" radius={[4, 4, 0, 0]} maxBarSize={45} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400">
                暂无销售流水图表数据
              </div>
            )}
          </div>
        </div>

        {/* Donut Chart Area (Distribution) */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-5 flex flex-col h-80 shadow-xs">
          <div className="flex justify-between items-center mb-3">
            <div>
              <h3 className="font-sans font-bold text-sm text-slate-900">可用库存品类占比 (Distributions)</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">不同品类（商品）在全库房中的当前实际占比</p>
            </div>
            <button className="p-1 px-1.5 rounded-lg text-slate-400 hover:bg-slate-50 hover:text-slate-600">
              <MoreVertical className="w-4 h-4" />
            </button>
          </div>
          <div className="flex-1 w-full text-xs relative flex flex-col items-center justify-center min-h-[170px]">
            {categoryData && categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="45%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1e293b', 
                      borderRadius: '8px', 
                      color: '#f8fafc',
                      border: 'none',
                      fontSize: '11px',
                      padding: '6px 10px'
                    }} 
                    formatter={(value: any) => [value, '存货数量 (件)']}
                  />
                  <Legend 
                    layout="horizontal" 
                    verticalAlign="bottom" 
                    align="center"
                    iconSize={8}
                    iconType="circle"
                    wrapperStyle={{ fontSize: '10px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-slate-400 text-center">暂无品类库存占比图表</div>
            )}
          </div>
        </div>

      </div>

      {/* Recent Transactions Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/60 leading-none">
          <div>
            <h3 className="font-sans font-bold text-sm text-slate-900">最近流水与库存调整 (Recent Transactions Log)</h3>
            <p className="text-[11px] text-slate-400 mt-1">前置商品库存出库、入库、退货以及数量盘点审核清单</p>
          </div>
          <button 
            onClick={() => onNavigateToTab('inventory')}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1 transition-all"
          >
            查看全库房
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-slate-50/20 border-b border-slate-100 text-slate-400 text-[10px] select-none font-semibold uppercase tracking-wider">
                <th className="py-3 px-4 font-mono">交易编号 / ID</th>
                <th className="py-3 px-4">操作日期 / Date</th>
                <th className="py-3 px-4">业务类型 / Type</th>
                <th className="py-3 px-4">商品名称 / Product</th>
                <th className="py-3 px-4 text-right">变化数量 / Qty</th>
                <th className="py-3 px-4 text-center">当前状态 / Status</th>
              </tr>
            </thead>
            <tbody className="text-xs font-medium text-slate-700 divide-y divide-slate-100">
              {transactions.slice(0, 5).map((trx) => {
                const isNegative = trx.amount < 0;
                
                return (
                  <tr key={trx.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-4 font-mono text-blue-600 font-semibold">{trx.id}</td>
                    <td className="py-3 px-4 text-slate-400 font-normal">{trx.date}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold leading-none ${
                        trx.type === '销售' ? 'bg-red-50 text-red-600' :
                        trx.type === '补货' ? 'bg-emerald-50 text-emerald-600' :
                        trx.type === '调整' ? 'bg-blue-50 text-blue-600' :
                        'bg-violet-50 text-violet-600'
                      }`}>
                        {trx.type}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-800 font-semibold max-w-[200px] truncate" title={trx.productName}>
                      {trx.productName}
                    </td>
                    <td className={`py-3 px-4 font-mono text-right font-bold text-sm ${isNegative ? 'text-rose-600' : 'text-emerald-600'}`}>
                      {isNegative ? '' : '+'}{trx.amount}
                    </td>
                    <td className="py-3 px-4 text-center select-none">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-[10px] font-medium border ${
                        trx.status === '已完成' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                        trx.status === '处理中' ? 'bg-purple-50 text-purple-600 border-purple-100' :
                        trx.status === '待审核' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                        'bg-slate-50 text-slate-500 border-slate-100'
                      }`}>
                        {trx.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
