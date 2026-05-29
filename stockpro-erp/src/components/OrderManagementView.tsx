/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo, FormEvent } from 'react';
import { 
  Search, 
  ShoppingCart, 
  Plus, 
  Clock, 
  CheckCircle2, 
  X, 
  Calendar, 
  DollarSign, 
  TrendingDown, 
  History,
  CheckCircle,
  AlertTriangle,
  FileSpreadsheet,
  Loader2
} from 'lucide-react';
import { Order, Product, Transaction } from '../types';

interface OrderManagementViewProps {
  orders: Order[];
  products: Product[];
  onCreateOrder: (order: Omit<Order, 'id' | 'date'>) => void;
  triggerToast: (msg: string, type: 'success' | 'warn' | 'error') => void;
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
}

export default function OrderManagementView({
  orders,
  products,
  onCreateOrder,
  triggerToast,
  isLoading,
  error,
  onRetry,
}: OrderManagementViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // 1. New Order state
  const [isAddOrderOpen, setIsAddOrderOpen] = useState(false);
  const [newCustomer, setNewCustomer] = useState('独立采购商 - 蔡先生');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [orderQty, setOrderQty] = useState(1);
  const [newPaymentStatus, setNewPaymentStatus] = useState<'paid' | 'partial' | 'unpaid'>('paid');

  // Filtered orders list
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const matchesSearch = order.customerName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            order.id.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesPayment = paymentFilter ? order.paymentStatus === paymentFilter : true;
      const matchesStatus = statusFilter ? order.orderStatus === statusFilter : true;
      return matchesSearch && matchesPayment && matchesStatus;
    });
  }, [orders, searchQuery, paymentFilter, statusFilter]);

  // Selected product logic for reactive order prices
  const selectedProduct = useMemo(() => {
    return products.find(p => p.id === selectedProductId) || null;
  }, [products, selectedProductId]);

  const calculatedTotal = useMemo(() => {
    if (!selectedProduct) return 0;
    return selectedProduct.price * orderQty;
  }, [selectedProduct, orderQty]);

  const handleCreateOrderSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!newCustomer.trim()) {
      triggerToast('请输入有效的客户/商户名称。', 'error');
      return;
    }
    if (!selectedProduct) {
      triggerToast('请从列表中选择一类需要销售出库的商品。', 'error');
      return;
    }
    if (orderQty <= 0) {
      triggerToast('出库预订数目需大于 0！', 'error');
      return;
    }

    // High critical check: Ensure there is enough stock available
    if (selectedProduct.available < orderQty) {
      triggerToast(`由于可用库存(只有 ${selectedProduct.available} 件)不足以供给所选数 (${orderQty} 件)，出库将被挂起，但我们已为您登记完成。请配合补仓调整！`, 'warn');
    }

    onCreateOrder({
      customerName: newCustomer,
      items: [
        {
          productId: selectedProduct.id,
          name: selectedProduct.name,
          qty: orderQty,
          price: selectedProduct.price
        }
      ],
      total: calculatedTotal,
      paymentStatus: newPaymentStatus,
      orderStatus: selectedProduct.available >= orderQty ? 'completed' : 'processing',
      type: 'sales'
    });

    setIsAddOrderOpen(false);
    // Reset fields
    setNewCustomer('独立采购商 - 苏先生');
    setSelectedProductId('');
    setOrderQty(1);
    setNewPaymentStatus('paid');
    triggerToast(`销售订单已提交，库存将随出库流程扣减。`, 'success');
  };

  const handleExportOrders = () => {
    triggerToast('订单交易数据(ORD-X)导出完毕，已自动存储到您的财务归档系统中。', 'success');
  };

  return (
    <div className="space-y-4" id="orders-view-main">
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
      
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">订单与出货管理</h2>
          <p className="text-xs text-slate-500 mt-1">
            监控和建立针对外部商户及内部领用部门的出货订单流水。
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExportOrders}
            className="flex items-center px-3.5 py-1.8 text-xs border border-slate-200 bg-white hover:bg-slate-50 font-semibold text-slate-700 rounded-lg shadow-xs cursor-pointer transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4 mr-1.5 text-slate-400" />
            导出交易报表
          </button>
          
          <button
            onClick={() => {
              if (products.length > 0) {
                setSelectedProductId(products[0].id);
              }
              setIsAddOrderOpen(true);
            }}
            className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 font-semibold text-white text-xs rounded-lg shadow-xs transition-all cursor-pointer"
            id="btn-trigger-order-modal"
          >
            <Plus className="w-4 h-4 mr-1" />
            创建订单 Buy/Sell Order
          </button>
        </div>
      </div>

      {/* Filter and Query section */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-4 flex flex-wrap gap-4 items-end shadow-xs">
        
        {/* Search */}
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-semibold text-slate-500 mb-1.5 select-none">搜索订单编号或客户商户</label>
          <div className="relative">
            <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              placeholder="输入 ORD 账号、首字母或联系公司名称..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-9 pl-9 pr-4 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white text-xs outline-hidden focus:ring-1 focus:ring-blue-600 focus:border-blue-600 transition-colors"
            />
          </div>
        </div>

        {/* Payment dropdown filter */}
        <div className="w-full sm:w-auto min-w-[140px]">
          <label className="block text-xs font-semibold text-slate-500 mb-1.5 select-none">付款属性 / Payment</label>
          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="w-full h-9 px-3 rounded-lg border border-slate-200 bg-slate-50 text-xs focus:bg-white outline-hidden cursor-pointer"
          >
            <option value="">所有付款状态</option>
            <option value="paid">已支付 (Paid)</option>
            <option value="partial">部分支付 (Partial)</option>
            <option value="unpaid">未支付 (Unpaid)</option>
            <option value="refunded">已退款 (Refunded)</option>
          </select>
        </div>

        {/* Status dropdown filter */}
        <div className="w-full sm:w-auto min-w-[140px]">
          <label className="block text-xs font-semibold text-slate-500 mb-1.5 select-none">出库交付状态 / Status</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full h-9 px-3 rounded-lg border border-slate-200 bg-slate-50 text-xs focus:bg-white outline-hidden cursor-pointer"
          >
            <option value="">所有物流状态</option>
            <option value="completed">交付完成 (Completed)</option>
            <option value="processing">出货处理中 (Processing)</option>
            <option value="pending">待备货审核 (Pending)</option>
            <option value="cancelled">备损取消 (Cancelled)</option>
          </select>
        </div>
      </div>

      {/* Orders details Grid Table */}
      <div className="bg-white border border-slate-200/80 rounded-xl shadow-xs overflow-hidden flex flex-col">
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-left border-collapse min-w-[850px]" id="orders-grid-table">
            <thead>
              <tr className="bg-slate-50/60 border-b border-slate-200 text-slate-500 text-[10px] font-semibold uppercase tracking-wider select-none h-11">
                <th className="py-2 px-4 select-none font-mono">订单号 / ERP Order ID</th>
                <th className="py-2 px-4">建立时间 / Date</th>
                <th className="py-2 px-4">采购商 / Customer</th>
                <th className="py-2 px-4">购买商品清单 (Items List)</th>
                <th className="py-2 px-4 text-right">出库数量</th>
                <th className="py-2 px-4 text-right">成交总额 ($)</th>
                <th className="py-2 px-4 text-center">资金到账</th>
                <th className="py-2 px-4 text-center">发货履约</th>
              </tr>
            </thead>
            <tbody className="text-xs font-medium text-slate-700 divide-y divide-slate-100">
              {filteredOrders.length > 0 ? (
                filteredOrders.map((ord) => {
                  return (
                    <tr key={ord.id} className="hover:bg-slate-50/40 bg-white transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-blue-600">{ord.id}</td>
                      <td className="py-3 px-4 text-slate-400 font-normal">{ord.date}</td>
                      <td className="py-3 px-4 text-slate-900 font-semibold">{ord.customerName}</td>
                      
                      {/* Items loop */}
                      <td className="py-3 px-4">
                        <div className="flex flex-col gap-1">
                          {ord.items.map((it, idx) => (
                            <span key={idx} className="text-slate-800 font-semibold block truncate max-w-[240px]" title={it.name}>
                              {it.name} <span className="text-slate-400 font-normal">(@ ${it.price.toFixed(2)})</span>
                            </span>
                          ))}
                        </div>
                      </td>

                      {/* Total Qty */}
                      <td className="py-3 px-4 text-right font-mono font-semibold">
                        {ord.items.reduce((acc, it) => acc + it.qty, 0)} 件
                      </td>

                      {/* Total cost */}
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 text-sm">
                        ${ord.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>

                      {/* Financial paymentStatus tags */}
                      <td className="py-3 px-4 text-center select-none">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border ${
                          ord.paymentStatus === 'paid' 
                            ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                            : ord.paymentStatus === 'partial'
                            ? 'bg-amber-50 text-amber-600 border-amber-100'
                            : ord.paymentStatus === 'refunded'
                            ? 'bg-pink-50 text-pink-600 border-pink-100'
                            : 'bg-red-50 text-red-600 border-red-100'
                        }`}>
                          {ord.paymentStatus === 'paid' ? '已收全款' : ord.paymentStatus === 'partial' ? '收部分预付款' : ord.paymentStatus === 'refunded' ? '已全额退款' : '挂账待核销'}
                        </span>
                      </td>

                      {/* Logistics Status tags */}
                      <td className="py-3 px-4 text-center select-none">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border ${
                          ord.orderStatus === 'completed' 
                            ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                            : ord.orderStatus === 'processing'
                            ? 'bg-purple-50 text-purple-600 border-purple-100'
                            : ord.orderStatus === 'pending'
                            ? 'bg-amber-50 text-amber-600 border-amber-100'
                            : 'bg-slate-100 text-slate-500 border-slate-200'
                        }`}>
                          {ord.orderStatus === 'completed' ? '签收完毕' : ord.orderStatus === 'processing' ? '配送中/待妥投' : ord.orderStatus === 'pending' ? '分流待审' : '订单撤单'}
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 font-normal">
                    <History className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    账架上当前无匹配的销售发货单。
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE ORDER SLIDE OVER OVERLAY FORM */}
      {isAddOrderOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-md w-full" id="add-order-dialog">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-xl">
              <div>
                <h3 className="text-sm font-bold text-slate-900">建立出库订单 / Create Sales Order</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">创建销售合同账单，成功将直接扣减库区可用实物并入账流水</p>
              </div>
              <button 
                onClick={() => setIsAddOrderOpen(false)} 
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            <form onSubmit={handleCreateOrderSubmit} className="p-5 space-y-4">
              
              {/* Customer input */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-600">往来客户/领用商户 *</label>
                <input
                  type="text"
                  required
                  value={newCustomer}
                  onChange={(e) => setNewCustomer(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:ring-1 focus:ring-blue-600 outline-none"
                  placeholder="请输入商户全名或协作部门"
                />
              </div>

              {/* Product selector option */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-600">出库商品选择 / Target Product *</label>
                <select
                  required
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg border border-slate-200 bg-slate-50 text-xs focus:bg-white outline-none cursor-pointer focus:ring-1 focus:ring-blue-600"
                >
                  <option value="">请挑选发货项目...</option>
                  {products.filter(p => p.status === 'active').map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} - ({p.sku}) [余 {p.available}件 | ${p.price}]
                    </option>
                  ))}
                </select>
              </div>

              {/* Grid: Quantity and Payment */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-600">出库货数 / Quantity *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={orderQty}
                    onChange={(e) => setOrderQty(parseInt(e.target.value) || 1)}
                    className="w-full h-9 px-3 border border-slate-200 text-xs bg-slate-50 focus:bg-white rounded-lg outline-none font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-600">款项到账状态 / Payment</label>
                  <select
                    value={newPaymentStatus}
                    onChange={(e) => setNewPaymentStatus(e.target.value as any)}
                    className="w-full h-9 px-3 border border-slate-200 bg-slate-50 text-xs focus:bg-white rounded-lg outline-none cursor-pointer"
                  >
                    <option value="paid">已结款 (Paid)</option>
                    <option value="partial">收部分保证金 (Partial)</option>
                    <option value="unpaid">挂账待付 (Unpaid)</option>
                  </select>
                </div>
              </div>

              {/* Selected Product summary block */}
              {selectedProduct && (
                <div className="p-3.5 bg-blue-50/85 border border-blue-100 rounded-lg space-y-1.5 flex flex-col">
                  <div className="flex justify-between text-xs text-blue-800 font-semibold">
                    <span>商品零售价:</span>
                    <span className="font-mono">${selectedProduct.price.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-blue-800 font-semibold">
                    <span>可用余数:</span>
                    <span className="font-mono">{selectedProduct.available} 件</span>
                  </div>
                  
                  {/* Alert if not enough stock */}
                  {selectedProduct.available < orderQty && (
                    <div className="text-[10px] text-amber-700 bg-amber-50 p-1.5 px-2 rounded flex items-center gap-1 font-semibold border border-amber-100">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      当前实际可用量不足，保存后订单自动标记为处理补货中
                    </div>
                  )}

                  <div className="h-px bg-blue-250 my-1" />
                  
                  <div className="flex justify-between items-center text-sm font-bold text-blue-900 leading-none">
                    <span>结算总值:</span>
                    <span className="font-mono text-base">${calculatedTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
              )}

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setIsAddOrderOpen(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-55 text-slate-600 font-semibold rounded-lg cursor-pointer"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-xs cursor-pointer"
                >
                  确定发货并入账 Save Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
