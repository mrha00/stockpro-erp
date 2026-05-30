/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo, FormEvent } from 'react';
import { 
  SlidersHorizontal, 
  Warehouse, 
  AlertTriangle, 
  ArrowLeftRight, 
  Activity, 
  CheckCircle, 
  Plus, 
  Layers, 
  Package, 
  CornerDownRight, 
  ShieldAlert,
  Archive,
  Info,
  Loader2
} from 'lucide-react';
import { Product, Transaction } from '../types';
import { useI18n } from '../i18n/I18nContext';
import { getCurrencySymbol, formatCurrency } from '../utils/inventory';

interface InventoryViewProps {
  products: Product[];
  transactions: Transaction[];
  onAdjustStock: (productId: string, qty: number, actionType: string, location: string, reason: string) => void;
  triggerToast: (msg: string, type: 'success' | 'warn' | 'error') => void;
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
}

export default function InventoryView({
  products,
  transactions,
  onAdjustStock,
  triggerToast,
  isLoading,
  error,
  onRetry,
}: InventoryViewProps) {
  const { locale } = useI18n();
  const currencySymbol = getCurrencySymbol(locale);
  // Adjustment Tools Form Panel State
  const [showAdjustmentTool, setShowAdjustmentTool] = useState(false);
  
  // Form fields
  const [targetProductId, setTargetProductId] = useState('');
  const [adjustQty, setAdjustQty] = useState(5);
  const [adjustmentAction, setAdjustmentAction] = useState('to_frozen'); // to_frozen, to_available, replenish, deprecate
  const [targetLocation, setTargetLocation] = useState('WH-A (Zone 2)');
  const [reason, setReason] = useState('实物例行盘点校验');

  // Selected item summaries
  const targetProduct = useMemo(() => {
    return products.find(p => p.id === targetProductId) || null;
  }, [products, targetProductId]);

  // Static/calculated warehouse summaries
  const warehouseSummaries = useMemo(() => {
    const summary: Record<string, { total: number; available: number; frozen: number; cost: number; count: number }> = {};
    
    products.forEach(p => {
      // Grouping by high-level site: WH-A, WH-B, STORE-1, WH-D
      let site = 'WH-A 综合仓';
      if (p.location.includes('WH-B')) site = 'WH-B 核心仓';
      else if (p.location.includes('STORE-1')) site = 'STORE-1 零售店';
      else if (p.location.includes('WH-D')) site = 'WH-D 国际货区';

      if (!summary[site]) {
        summary[site] = { total: 0, available: 0, frozen: 0, cost: 0, count: 0 };
      }
      summary[site].total += p.stock;
      summary[site].available += p.available;
      summary[site].frozen += p.frozen;
      summary[site].cost += p.cost * p.stock;
      summary[site].count += 1;
    });

    return Object.entries(summary).map(([name, data]) => ({
      name,
      ...data
    }));
  }, [products]);

  const handleAdjustSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!targetProductId) {
      triggerToast('请先挑选需要执行调整的货位商品！', 'error');
      return;
    }
    if (adjustQty <= 0) {
      triggerToast('调整货品数目需大于 0！', 'error');
      return;
    }
    if (!targetProduct) return;

    // Check pre-conditions for safety
    if (adjustmentAction === 'to_frozen' && targetProduct.available < adjustQty) {
      triggerToast(`由于该货品可用数目只有 ${targetProduct.available} 件，因此无法执行将 ${adjustQty} 件可用账面锁定。`, 'error');
      return;
    }

    if (adjustmentAction === 'to_available' && targetProduct.frozen < adjustQty) {
      triggerToast(`由于该货品锁定/冻结数目只有 ${targetProduct.frozen} 件，无法解锁划转。`, 'error');
      return;
    }

    if (adjustmentAction === 'deprecate' && targetProduct.available < adjustQty) {
      triggerToast(`可用出库货品严重不足，损报清空失败！`, 'error');
      return;
    }

    onAdjustStock(targetProductId, adjustQty, adjustmentAction, targetLocation, reason);
    
    // Reset forms
    setReason('本月实物盘点');
    setAdjustQty(5);
    triggerToast('全账库房即时重置核销调整成功。已登账最近流水。', 'success');
  };

  return (
    <div className="space-y-4 shadow-3xs" id="inventory-view">
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">库区与库存调节</h2>
          <p className="text-xs text-slate-500 mt-1">
            监控大型物理库区(WH-A/B/D, STORE)货位健康，并执行锁定/划拨调节，应对随时变化的多渠道交付。
          </p>
        </div>
        <button
          onClick={() => {
            if (products.length > 0) {
              setTargetProductId(products[0].id);
            }
            setShowAdjustmentTool(!showAdjustmentTool);
          }}
          className={`flex items-center px-4 py-2 text-xs font-semibold rounded-lg shadow-xs transition-all cursor-pointer ${
            showAdjustmentTool 
              ? 'bg-slate-700 hover:bg-slate-800 text-white' 
              : 'border border-blue-600/30 text-blue-600 bg-blue-50 hover:bg-blue-100'
          }`}
          id="btn-stock-adjustment-trigger"
        >
          <SlidersHorizontal className="w-4 h-4 mr-1.5" />
          {showAdjustmentTool ? '关闭调节工具' : '快速库存调节 Stock Adjustment'}
        </button>
      </div>

      {/* EXPANDABLE QUICK ADJUSTMENT FORM PANEL */}
      {showAdjustmentTool && (
        <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-5" id="stock-adjust-form-panel">
          <div className="flex items-start gap-3.5 border-b border-slate-100 pb-3 mb-4 leading-none">
            <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
              <ArrowLeftRight className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">库存划拨调节工具 / Stock Management console</h3>
              <p className="text-[10px] text-slate-400 mt-1">选择目标货号并提供调拨、追加或锁定动作</p>
            </div>
          </div>

          <form onSubmit={handleAdjustSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            
            {/* Product Selector */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-500">挑选目标商品 *</label>
              <select
                required
                value={targetProductId}
                onChange={(e) => setTargetProductId(e.target.value)}
                className="w-full h-9 px-3 border border-slate-200 bg-slate-50 text-xs focus:bg-white rounded-lg outline-none cursor-pointer focus:ring-1 focus:ring-blue-600"
              >
                <option value="">挑货...</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>{p.name} - ({p.sku}) [余:{p.stock}]</option>
                ))}
              </select>
            </div>

            {/* Action selector */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-500">业务划分动作 / Action *</label>
              <select
                value={adjustmentAction}
                onChange={(e) => setAdjustmentAction(e.target.value)}
                className="w-full h-9 px-3 border border-slate-200 bg-slate-50 text-xs focus:bg-white rounded-lg outline-none cursor-pointer focus:ring-1 focus:ring-blue-600"
              >
                <option value="to_frozen">划转 锁定/冻结 (Lock Available)</option>
                <option value="to_available">解除 锁定划转 (Release Frozen)</option>
                <option value="replenish">货物 补货入库 (+ Inbound)</option>
                <option value="deprecate">盘亏 亏损除账 (- Outbound)</option>
              </select>
            </div>

            {/* Qty and location */}
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-500">货数 Qty</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={adjustQty}
                  onChange={(e) => setAdjustQty(parseInt(e.target.value) || 1)}
                  className="w-full h-9 px-3 border border-slate-200 bg-slate-50 text-xs focus:bg-white rounded-lg outline-none font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-500">目标物理库位</label>
                <input
                  type="text"
                  required
                  value={targetLocation}
                  onChange={(e) => setTargetLocation(e.target.value)}
                  className="w-full h-9 px-3 border border-slate-200 bg-slate-50 text-xs focus:bg-white rounded-lg font-mono"
                />
              </div>
            </div>

            {/* Reasons + Submit */}
            <div className="flex gap-2 items-center">
              <div className="flex-1 space-y-1">
                <label className="block text-xs font-semibold text-slate-500">备注原因 / Notes</label>
                <input
                  type="text"
                  required
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full h-9 px-3 border border-slate-200 bg-slate-50 text-xs focus:bg-white rounded-lg text-slate-700"
                  placeholder="例: 实物盘点"
                />
              </div>

              <button
                type="submit"
                className="h-9 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow-xs shrink-0 cursor-pointer transition-colors"
                id="btn-confirm-stock-adjustment"
              >
                执行划转
              </button>
            </div>

          </form>

          {/* Target Product Summary status inside form */}
          {targetProduct && (
            <div className="mt-3.5 p-3.5 bg-slate-50 border border-slate-200/60 rounded-lg flex flex-wrap gap-6 text-xs text-slate-600 z-10 font-medium">
              <div>
                可用实物数 Available: <span className="font-mono font-bold text-slate-900 text-sm ml-1">{targetProduct.available} 件</span>
              </div>
              <div className="h-4 w-px bg-slate-200 self-center hidden sm:block" />
              <div>
                锁定冻结数 Frozen: <span className="font-mono font-bold text-amber-600 text-sm ml-1">{targetProduct.frozen} 件</span>
              </div>
              <div className="h-4 w-px bg-slate-200 self-center hidden sm:block" />
              <div>
                物理货位 Site spot: <span className="font-mono font-bold text-slate-700 ml-1">{targetProduct.location}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Warehouse Summary Dashboard cards */}
      <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest leading-none pt-2">物理分库状况 / Active Warehouses</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="warehouse-cards-row">
        {warehouseSummaries.map((wh, idx) => (
          <div key={idx} className="bg-white p-5 rounded-xl border border-slate-200/80 hover:shadow-xs transition-shadow flex flex-col justify-between">
            <div className="flex justify-between items-start mb-3">
              <span className="text-xs font-semibold text-slate-800 tracking-tight flex items-center gap-1.5 leading-none">
                <Warehouse className="w-4 h-4 text-slate-500" />
                {wh.name}
              </span>
              <span className="text-[10px] font-bold text-slate-400 bg-slate-100 rounded p-1 py-0.5 leading-none">{wh.count} 款品类</span>
            </div>
            
            <div className="space-y-1 mt-2">
              <div className="flex justify-between text-xs text-slate-500">
                <span>总备货实数 / Total:</span>
                <span className="font-mono font-bold text-slate-900">{wh.total} 件</span>
              </div>
              <div className="flex justify-between text-xs text-slate-500">
                <span>安全可配 / Available:</span>
                <span className="font-mono font-semibold text-emerald-600">{wh.available} 件</span>
              </div>
              <div className="flex justify-between text-xs text-slate-500">
                <span>锁定预留 / Locked:</span>
                <span className="font-mono font-semibold text-amber-600">{wh.frozen} 件</span>
              </div>
              <div className="h-px bg-slate-100 my-1" />
              <div className="flex justify-between text-[11px] font-bold text-slate-800 leading-none">
                <span>对应存货资金额:</span>
                <span className="font-mono">{formatCurrency(wh.cost, locale, { maximumFractionDigits: 0 })}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Detailed Stock placement table section */}
      <div className="bg-white border border-slate-200/80 rounded-xl shadow-xs overflow-hidden flex flex-col">
        <div className="p-4 border-b border-slate-100 bg-slate-55/4 flex justify-between items-center h-12 leading-none select-none">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-widest">{locale === 'zh' ? '货位与存量实时监控' : 'Site spot monitoring'}</span>
          <span className="text-[10px] text-slate-400 font-semibold uppercase">{locale === 'zh' ? '总货品数' : 'Total items'}: {products.length}</span>
        </div>

        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-left border-collapse min-w-[750px]">
            <thead>
              <tr className="bg-slate-50/60 border-b border-slate-200 text-slate-500 text-[10px] font-semibold uppercase tracking-wider select-none h-11">
                <th className="py-2 px-4">{locale === 'zh' ? '货品名' : 'Product Name'}</th>
                <th className="py-2 px-4">{locale === 'zh' ? '类目编号' : 'Catalog'}</th>
                <th className="py-2 px-4">{locale === 'zh' ? '物理仓位' : 'Location'}</th>
                <th className="py-2 px-4 text-right">{locale === 'zh' ? '可售余数' : 'Available'}</th>
                <th className="py-2 px-4 text-right">{locale === 'zh' ? '调拨冻结' : 'Frozen'}</th>
                <th className="py-2 px-4 text-right">{locale === 'zh' ? '物理总库存' : 'Total Stock'}</th>
                <th className="py-2 px-4 text-center">{locale === 'zh' ? '风险评估' : 'Status'}</th>
              </tr>
            </thead>
            <tbody className="text-xs font-medium text-slate-700 divide-y divide-slate-100">
              {products.map(p => {
                const total = p.available + p.frozen;
                const isCritical = total < 15;
                const isOut = total === 0;

                return (
                  <tr key={p.id} className="hover:bg-slate-50/50 bg-white transition-colors">
                    <td className="py-3 px-4 font-semibold text-slate-900">{p.name}</td>
                    <td className="py-3 px-4 text-slate-400 font-mono font-normal uppercase text-[10px]">{p.sku}</td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-700">{p.location}</td>
                    <td className="py-3 px-4 text-right font-mono text-emerald-600 font-bold">{p.available} 件</td>
                    <td className="py-3 px-4 text-right font-mono text-amber-500 font-bold">{p.frozen} 件</td>
                    <td className="py-3 px-4 text-right font-mono font-extrabold text-slate-800 text-sm">{total} 件</td>
                    <td className="py-3 px-4 text-center select-none">
                      {isOut ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-600 border border-red-200">
                          <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                          已脱销
                        </span>
                      ) : isCritical ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-600 border border-amber-200">
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0 animate-pulse" />
                          极低库存
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-600 border border-emerald-200">
                          <CheckCircle className="w-3.5 h-3.5 shrink-0" />
                          库存充足
                        </span>
                      )}
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
