/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo, useEffect, FormEvent } from 'react';
import { 
  Search, 
  Download, 
  Plus, 
  Edit2, 
  Trash2, 
  Image as ImageIcon, 
  ChevronLeft, 
  ChevronRight, 
  RotateCcw,
  AlertTriangle,
  X,
  PlusCircle,
  Eye,
  Info,
  Loader2
} from 'lucide-react';
import { Product } from '../types';
import { isLowStock, getCurrencySymbol, formatCurrency } from '../utils/inventory';
import { useI18n } from '../i18n/I18nContext';

interface ProductManagementViewProps {
  products: Product[];
  categories: { id: string; name: string }[];
  onAddProduct: (product: Omit<Product, 'id'>) => void;
  onUpdateProduct: (product: Product) => void;
  onDeleteProduct: (id: string) => void;
  triggerToast: (msg: string, type: 'success' | 'warn' | 'error') => void;
  initialFilterLowStock?: boolean;
  globalSearch: string;
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
}

export default function ProductManagementView({
  products,
  categories,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
  triggerToast,
  initialFilterLowStock = false,
  globalSearch,
  isLoading,
  error,
  onRetry,
}: ProductManagementViewProps) {
  const { locale } = useI18n();
  const currencySymbol = getCurrencySymbol(locale);
  // 1. Core State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [onlyLowStock, setOnlyLowStock] = useState(initialFilterLowStock);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Sync global search from parent
  useEffect(() => {
    if (globalSearch) {
      setSearchQuery(globalSearch);
    }
  }, [globalSearch]);

  // Sync initial state toggle
  useEffect(() => {
    if (initialFilterLowStock) {
      setOnlyLowStock(true);
    }
  }, [initialFilterLowStock]);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Form Fields State
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formSku, setFormSku] = useState('');
  const [formCategory, setFormCategory] = useState('electronics');
  const [formCost, setFormCost] = useState('0');
  const [formPrice, setFormPrice] = useState('0');
  const [formAvailable, setFormAvailable] = useState('0');
  const [formFrozen, setFormFrozen] = useState('0');
  const [formStatus, setFormStatus] = useState<'active' | 'draft' | 'inactive'>('active');
  const [formLocation, setFormLocation] = useState('WH-A (Zone 1)');

  // 2. Data Filtering logic
  const filteredProducts = useMemo(() => {
    let result = [...products];

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        p => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)
      );
    }

    // Category
    if (selectedCategory) {
      result = result.filter(p => p.categoryId === selectedCategory);
    }

    // Status
    if (selectedStatus) {
      result = result.filter(p => p.status === selectedStatus);
    }

    // Low stock toggle (< 20)
    if (onlyLowStock) {
      result = result.filter(isLowStock);
    }

    return result;
  }, [products, searchQuery, selectedCategory, selectedStatus, onlyLowStock]);

  // 3. Pagination calculation
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage) || 1;
  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredProducts.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredProducts, currentPage]);

  // Adjust page number if it slips out of index
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [filteredProducts, totalPages, currentPage]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('');
    setSelectedStatus('');
    setOnlyLowStock(false);
    setCurrentPage(1);
    triggerToast('筛选条件已重置为默认值。', 'success');
  };

  // 4. Modal Triggers
  const openAddModal = () => {
    setFormName('');
    setFormDescription('');
    setFormSku('SKU-' + Date.now().toString().slice(-6));
    setFormCategory(categories[0]?.id ?? '');
    setFormCost('20');
    setFormPrice('45');
    setFormAvailable('50');
    setFormFrozen('0');
    setFormStatus('active');
    setFormLocation('WH-A (Zone 1)');
    setIsAddModalOpen(true);
  };

  const openEditModal = (prod: Product) => {
    setSelectedProduct(prod);
    setFormName(prod.name);
    setFormDescription(prod.description);
    setFormSku(prod.sku);
    setFormCategory(prod.categoryId);
    setFormCost(prod.cost.toString());
    setFormPrice(prod.price.toString());
    setFormAvailable(prod.available.toString());
    setFormFrozen(prod.frozen.toString());
    setFormStatus(prod.status);
    setFormLocation(prod.location);
    setIsEditModalOpen(true);
  };

  const openDeleteModal = (prod: Product) => {
    setSelectedProduct(prod);
    setIsDeleteConfirmOpen(true);
  };

  // 5. Submit handlers
  const handleAddSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formSku.trim()) {
      triggerToast('请输入有效的商品名称与货号SKU。', 'error');
      return;
    }

    const costNum = parseFloat(formCost) || 0;
    const priceNum = parseFloat(formPrice) || 0;
    const availNum = parseInt(formAvailable) || 0;
    const frozNum = parseInt(formFrozen) || 0;

    onAddProduct({
      name: formName,
      description: formDescription,
      sku: formSku,
      category: categories.find(c => c.id === formCategory)?.name ?? '',
      categoryId: formCategory,
      cost: costNum,
      price: priceNum,
      stock: availNum + frozNum,
      available: availNum,
      frozen: frozNum,
      minStock: 0,
      status: formStatus,
      location: formLocation,
      lastInbound: new Date().toISOString().replace('T', ' ').slice(0, 16),
    });

    setIsAddModalOpen(false);
    triggerToast(`新增商品成功: ${formName}`, 'success');
  };

  const handleEditSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    if (!formName.trim() || !formSku.trim()) {
      triggerToast('请输入商品名称和SKU！', 'error');
      return;
    }

    const costNum = parseFloat(formCost) || 0;
    const priceNum = parseFloat(formPrice) || 0;
    const availNum = parseInt(formAvailable) || 0;
    const frozNum = parseInt(formFrozen) || 0;

    onUpdateProduct({
      id: selectedProduct.id,
      name: formName,
      description: formDescription,
      sku: formSku,
      category: categories.find(c => c.id === formCategory)?.name ?? selectedProduct.category,
      categoryId: formCategory,
      cost: costNum,
      price: priceNum,
      stock: availNum + frozNum,
      available: availNum,
      frozen: frozNum,
      minStock: selectedProduct.minStock,
      status: formStatus,
      location: formLocation,
      lastInbound: selectedProduct.lastInbound
    });

    setIsEditModalOpen(false);
    triggerToast(`商品属性更新成功: ${formName}`, 'success');
  };

  const handleDeleteConfirm = () => {
    if (!selectedProduct) return;
    onDeleteProduct(selectedProduct.id);
    setIsDeleteConfirmOpen(false);
    triggerToast(`商品已移出仓库：${selectedProduct.name}`, 'success');
  };

  const handleExport = () => {
    try {
      // 1. 准备表头
      const headers = [
        '商品名称',
        'SKU',
        '分类',
        '成本价',
        '销售价',
        '库存数量',
        '可用库存',
        '冻结库存',
        '最低库存',
        '状态',
        '仓库位置',
        '最近入库'
      ];

      // 2. 状态映射
      const statusMap: Record<string, string> = {
        'active': '上架中',
        'draft': '草稿',
        'inactive': '已下架'
      };

      // 3. 转换数据行
      const rows = filteredProducts.map(p => [
        p.name,
        p.sku,
        p.category,
        formatCurrency(p.cost, locale),
        formatCurrency(p.price, locale),
        p.stock.toString(),
        p.available.toString(),
        p.frozen.toString(),
        p.minStock.toString(),
        statusMap[p.status] || p.status,
        p.location,
        p.lastInbound
      ]);

      // 4. 生成 CSV 内容
      const escapeCsvCell = (cell: string) => {
        if (cell.includes(',') || cell.includes('"') || cell.includes('\n')) {
          return `"${cell.replace(/"/g, '""')}"`;
        }
        return cell;
      };

      const csvContent = [
        headers.map(escapeCsvCell).join(','),
        ...rows.map(row => row.map(escapeCsvCell).join(','))
      ].join('\n');

      // 5. 创建 Blob 并下载
      const blob = new Blob(['\ufeff' + csvContent], { 
        type: 'text/csv;charset=utf-8;' 
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `商品清单_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      triggerToast(`成功导出 ${filteredProducts.length} 条商品记录`, 'success');
    } catch (error) {
      console.error('导出失败:', error);
      triggerToast('导出失败，请稍后重试', 'error');
    }
  };

  return (
    <div className="space-y-4" id="products-view">
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
          <h2 className="text-2xl font-bold text-slate-900">商品列表</h2>
          <p className="text-xs text-slate-500 mt-1">
            全面管理您的货品信息目录、订价标准、初始成本、可出库货数及业务活动属性。
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={handleExport}
            className="flex items-center px-3.5 py-1.8 text-xs border border-slate-200 bg-white hover:bg-slate-50 font-semibold text-slate-700 rounded-lg shadow-xs transition-colors cursor-pointer"
            id="product-export-btn"
          >
            <Download className="w-4 h-4 mr-1.5" />
            导出数据
          </button>
          
          <button 
            onClick={openAddModal}
            className="flex items-center px-4 py-2 text-xs bg-blue-600 hover:bg-blue-700 font-semibold text-white rounded-lg shadow-xs transition-all cursor-pointer"
            id="product-add-btn"
          >
            <Plus className="w-4 h-4 mr-1" />
            新增商品 (Make Product)
          </button>
        </div>
      </div>

      {/* Filter Bar Controls */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-4 flex flex-wrap gap-4 items-end shadow-xs" id="product-filter-bar">
        
        {/* Search */}
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-semibold text-slate-500 mb-1.5 select-none">全局搜索 / Query</label>
          <div className="relative">
            <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              placeholder="货品名称或 SKU 编号货号..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full h-9 pl-9 pr-4 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white text-xs outline-hidden focus:ring-1 focus:ring-blue-600 focus:border-blue-600 transition-colors"
            />
          </div>
        </div>

        {/* Category Select */}
        <div className="w-full sm:w-auto min-w-[150px]">
          <label className="block text-xs font-semibold text-slate-500 mb-1.5 select-none">类目选择 / Category</label>
          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full h-9 px-3 rounded-lg border border-slate-200 bg-slate-50 text-xs focus:bg-white outline-hidden cursor-pointer focus:ring-1 focus:ring-blue-600 focus:border-blue-600"
          >
            <option value="">所有品类 (All)</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>

        {/* Status select options */}
        <div className="w-full sm:w-auto min-w-[130px]">
          <label className="block text-xs font-semibold text-slate-500 mb-1.5 select-none">业务状态 / Status</label>
          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full h-9 px-3 rounded-lg border border-slate-200 bg-slate-50 text-xs focus:bg-white outline-hidden cursor-pointer focus:ring-1 focus:ring-blue-600 focus:border-blue-600"
          >
            <option value="">所有状态</option>
            <option value="active">启用 (Active)</option>
            <option value="draft">草稿 (Draft)</option>
            <option value="inactive">禁用 (Inactive)</option>
          </select>
        </div>

        {/* Toggle switch: Only show low stock */}
        <div className="flex items-center h-9 ml-2 bg-slate-50 border border-slate-200/50 p-2 px-3 rounded-lg">
          <label className="relative inline-flex items-center cursor-pointer select-none">
            <input
              type="checkbox"
              checked={onlyLowStock}
              onChange={(e) => {
                setOnlyLowStock(e.target.checked);
                setCurrentPage(1);
              }}
              className="sr-only peer"
            />
            <div className="w-8 h-4.5 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-red-500" />
            <span className="ml-2.5 text-xs text-slate-600 font-semibold flex items-center gap-1">
              仅显示低库存
              <AlertTriangle className={`w-3.5 h-3.5 shrink-0 transition-colors ${onlyLowStock ? 'text-red-500 animate-pulse' : 'text-slate-400'}`} />
            </span>
          </label>
        </div>

        {/* Reset */}
        <button
          onClick={handleResetFilters}
          className="h-9 px-3 border border-slate-200 text-slate-600 hover:text-slate-800 hover:bg-slate-50 bg-slate-50 rounded-lg text-xs font-semibold shrink-0 cursor-pointer flex items-center gap-1.5 transition-colors focus:ring-1 focus:ring-blue-500"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          重置
        </button>
      </div>

      {/* Main Table Card Layout */}
      <div className="bg-white border border-slate-200/80 rounded-xl shadow-xs overflow-hidden flex flex-col" id="products-table-box">
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-left border-collapse min-w-[950px]">
            <thead>
              <tr className="bg-slate-50/60 border-b border-slate-200 text-slate-500 text-[10px] font-semibold uppercase tracking-wider select-none h-11">
                <th className="py-2 px-4 w-12 text-center">
                  <input
                    type="checkbox"
                    className="h-3.5 w-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th className="py-2 px-4 text-center w-16">{locale === 'zh' ? '首图' : 'Image'}</th>
                <th className="py-2 px-4">{locale === 'zh' ? '商品名称与描述' : 'Product Name'}</th>
                <th className="py-2 px-4">{locale === 'zh' ? '货号' : 'SKU'}</th>
                <th className="py-2 px-4">{locale === 'zh' ? '品类' : 'Category'}</th>
                <th className="py-2 px-4 text-right">{locale === 'zh' ? '初始成本' : 'Cost'} ({currencySymbol})</th>
                <th className="py-2 px-4 text-right">{locale === 'zh' ? '对外销售价' : 'Price'} ({currencySymbol})</th>
                <th className="py-2 px-4 text-right">{locale === 'zh' ? '总货仓库存' : 'Stock'}</th>
                <th className="py-2 px-4 text-center">{locale === 'zh' ? '业务状态' : 'Status'}</th>
                <th className="py-2 px-4 text-right w-24 pr-6">{locale === 'zh' ? '操作' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="text-xs font-medium text-slate-700 divide-y divide-slate-100">
              {paginatedProducts.length > 0 ? (
                paginatedProducts.map((p) => {
                  const isLow = p.stock < 20;
                  const formattedCategory = p.category;

                  return (
                    <tr 
                      key={p.id} 
                      className="hover:bg-slate-55/10 bg-white transition-colors group"
                    >
                      {/* Checkbox */}
                      <td className="py-3 px-4 text-center">
                        <input
                          type="checkbox"
                          className="h-3.5 w-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>

                      {/* Image Icon placeholder */}
                      <td className="py-2.5 px-4 text-center">
                        <div className="w-10 h-10 rounded border border-slate-200 bg-slate-50 flex items-center justify-center shrink-0 mx-auto">
                          <ImageIcon className="w-5 h-5 text-slate-400 opacity-60" />
                        </div>
                      </td>

                      {/* Name / Description */}
                      <td className="py-3 px-4 max-w-[220px]">
                        <div className="font-semibold text-slate-900 leading-tight truncate" title={p.name}>
                          {p.name}
                        </div>
                        <div className="text-[10px] text-slate-400 font-normal leading-normal mt-0.5 max-w-[200px] truncate" title={p.description}>
                          {p.description}
                        </div>
                      </td>

                      {/* SKU */}
                      <td className="py-3 px-4 font-mono text-slate-500 text-xs">
                        {p.sku}
                      </td>

                      {/* Category */}
                      <td className="py-3 px-4 text-slate-600">
                        {formattedCategory}
                      </td>

                      {/* Cost */}
                      <td className="py-3 px-4 text-right font-mono text-slate-500">
                        {formatCurrency(p.cost, locale)}
                      </td>

                      {/* Sale price */}
                      <td className="py-3 px-4 text-right font-mono text-slate-900 font-semibold">
                        {formatCurrency(p.price, locale)}
                      </td>

                      {/* Stock Level Warning */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex flex-col items-end">
                          <span className={`font-mono font-bold text-sm leading-none ${isLow ? 'text-red-600 animate-pulse' : 'text-slate-800'}`}>
                            {p.stock}
                          </span>
                          <span className="text-[9px] text-slate-400 font-normal mt-1 block">
                            可用: {p.available} | 冻结: {p.frozen}
                          </span>
                        </div>
                      </td>

                      {/* Status label */}
                      <td className="py-3 px-4 text-center select-none">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border ${
                          p.status === 'active' 
                            ? 'bg-blue-50 text-blue-600 border-blue-100' 
                            : p.status === 'draft'
                            ? 'bg-slate-50 text-slate-500 border-slate-100'
                            : 'bg-red-50 text-red-500 border-red-100'
                        }`}>
                          {p.status === 'active' ? '启用' : p.status === 'draft' ? '草稿' : '禁用'}
                        </span>
                      </td>

                      {/* Desktop actions on Hover */}
                      <td className="py-3 px-4 text-right pr-6">
                        <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => openEditModal(p)}
                            className="p-1 text-slate-400 hover:text-blue-600 hover:bg-slate-50 rounded transition-all cursor-pointer"
                            title="编辑商品"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => openDeleteModal(p)}
                            className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-all cursor-pointer"
                            title="移下架"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400 font-normal">
                    <Info className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    没有找到符合当前的商品记录。请尝试清除或更改筛选参数。
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Dynamic Pagination controls */}
        <div className="px-5 py-3 border-t border-slate-200 bg-slate-50/40 flex items-center justify-between">
          <div className="text-[11px] text-slate-500 select-none">
            显示第 <span className="font-semibold text-slate-900">{(currentPage - 1) * itemsPerPage + 1}</span> 到{' '}
            <span className="font-semibold text-slate-900">
              {Math.min(currentPage * itemsPerPage, filteredProducts.length)}
            </span>{' '}
            条，共 <span className="font-semibold text-slate-900">{filteredProducts.length}</span> 条货品纪录
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="p-1 rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
              title="上一页"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                  currentPage === page 
                    ? 'bg-blue-600 text-white shadow-xs' 
                    : 'border border-slate-200 bg-white hover:bg-slate-50 text-slate-600'
                }`}
              >
                {page}
              </button>
            ))}

            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="p-1 rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
              title="下一页"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>

      {/* REUSABLE PRODUCT DIALOGS */}
      {/* 1. Add Product Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/45 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto" id="add-product-dialog">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-xl">
              <div>
                <h3 className="text-sm font-bold text-slate-900">新增商品 / New Product</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">登记一件货品并发布在全线仓库库存目录体系下</p>
              </div>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-md hover:bg-slate-100">
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2 space-y-1">
                  <label className="block text-xs font-semibold text-slate-600">商品全名 / Product Name *</label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full h-9 px-3 rounded-lg border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:ring-1 focus:ring-blue-600 outline-none"
                    placeholder="例如: Mechanical Keyboard Cherry MX Black"
                  />
                </div>

                <div className="sm:col-span-2 space-y-1">
                  <label className="block text-xs font-semibold text-slate-600">说明描述 / Description</label>
                  <textarea
                    rows={2}
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:ring-1 focus:ring-blue-600 outline-none"
                    placeholder="描述商品的关键细节、包装、适用场景..."
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-600">货号编号 / SKU *</label>
                  <input
                    type="text"
                    required
                    value={formSku}
                    onChange={(e) => setFormSku(e.target.value)}
                    className="w-full h-9 px-3 border border-slate-200 text-xs bg-slate-50 focus:bg-white rounded-lg outline-none font-mono focus:ring-1 focus:ring-blue-600"
                    placeholder="KB-KEY-MX-001"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-600">业务类目 / Category</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full h-9 px-3 border border-slate-200 text-xs bg-slate-50 focus:bg-white rounded-lg outline-none cursor-pointer"
                  >
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-600">{locale === 'zh' ? '初始成本平均价' : 'Avg Cost'} ({currencySymbol}) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formCost}
                    onChange={(e) => setFormCost(e.target.value)}
                    className="w-full h-9 px-3 border border-slate-200 text-xs bg-slate-50 focus:bg-white rounded-lg outline-none font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-600">{locale === 'zh' ? '销售标价' : 'Sale Price'} ({currencySymbol}) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formPrice}
                    onChange={(e) => setFormPrice(e.target.value)}
                    className="w-full h-9 px-3 border border-slate-200 text-xs bg-slate-50 focus:bg-white rounded-lg outline-none font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-600">可用货数 / Available Qty *</label>
                  <input
                    type="number"
                    min="0"
                    value={formAvailable}
                    onChange={(e) => setFormAvailable(e.target.value)}
                    className="w-full h-9 px-3 border border-slate-200 text-xs bg-slate-50 focus:bg-white rounded-lg outline-none font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-600">冻结锁定/ Frozen Qty *</label>
                  <input
                    type="number"
                    min="0"
                    value={formFrozen}
                    onChange={(e) => setFormFrozen(e.target.value)}
                    className="w-full h-9 px-3 border border-slate-200 text-xs bg-slate-50 focus:bg-white rounded-lg outline-none font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-600">首选放置地 / Primary Location</label>
                  <input
                    type="text"
                    value={formLocation}
                    onChange={(e) => setFormLocation(e.target.value)}
                    className="w-full h-9 px-3 border border-slate-200 text-xs bg-slate-50 focus:bg-white rounded-lg outline-none"
                    placeholder="WH-A (Zone 1)"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-600">业务状态 / Status</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as any)}
                    className="w-full h-9 px-3 border border-slate-200 text-xs bg-slate-50 focus:bg-white rounded-lg outline-none cursor-pointer"
                  >
                    <option value="active">启用 (Active)</option>
                    <option value="draft">草稿 (Draft)</option>
                    <option value="inactive">禁用 (Inactive)</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 font-semibold text-xs rounded-lg cursor-pointer"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg shadow-xs cursor-pointer"
                >
                  登记并入库清单 Catalog Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Edit Product Modal */}
      {isEditModalOpen && selectedProduct && (
        <div className="fixed inset-0 bg-slate-900/45 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto" id="edit-product-dialog">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-xl">
              <div>
                <h3 className="text-sm font-bold text-slate-900">编辑商品 / Update Product Properties</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">修改货品基本属性参数，更新将保持即时全仓更新同步</p>
              </div>
              <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-md hover:bg-slate-100">
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2 space-y-1">
                  <label className="block text-xs font-semibold text-slate-600">商品名称 / Product Name *</label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full h-9 px-3 border border-slate-200 text-xs bg-slate-50 focus:bg-white rounded-lg outline-none"
                  />
                </div>

                <div className="sm:col-span-2 space-y-1">
                  <label className="block text-xs font-semibold text-slate-600">描述信息 / Description</label>
                  <textarea
                    rows={2}
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 text-xs bg-slate-50 focus:bg-white rounded-lg outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-600">条码/ SKU *</label>
                  <input
                    type="text"
                    required
                    value={formSku}
                    onChange={(e) => setFormSku(e.target.value)}
                    className="w-full h-9 px-3 border border-slate-200 text-xs bg-slate-50 focus:bg-white rounded-lg font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-600">业务类目 / Category</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full h-9 px-3 border border-slate-200 text-xs bg-slate-50 focus:bg-white rounded-lg outline-none"
                  >
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-600">初成本 / Avg Cost ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formCost}
                    onChange={(e) => setFormCost(e.target.value)}
                    className="w-full h-9 px-3 border border-slate-200 text-xs bg-slate-50 focus:bg-white rounded-lg font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-600">标价 / Sale Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formPrice}
                    onChange={(e) => setFormPrice(e.target.value)}
                    className="w-full h-9 px-3 border border-slate-200 text-xs bg-slate-50 focus:bg-white rounded-lg font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-600">可用数量 / Available</label>
                  <input
                    type="number"
                    value={formAvailable}
                    onChange={(e) => setFormAvailable(e.target.value)}
                    className="w-full h-9 px-3 border border-slate-200 text-xs bg-slate-50 focus:bg-white rounded-lg font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-600">锁定锁定 / Frozen</label>
                  <input
                    type="number"
                    value={formFrozen}
                    onChange={(e) => setFormFrozen(e.target.value)}
                    className="w-full h-9 px-3 border border-slate-200 text-xs bg-slate-50 focus:bg-white rounded-lg font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-600">主要放置区 / Area</label>
                  <input
                    type="text"
                    value={formLocation}
                    onChange={(e) => setFormLocation(e.target.value)}
                    className="w-full h-9 px-3 border border-slate-200 text-xs bg-slate-50 focus:bg-white rounded-lg"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-600">业务活动状态 / Status</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as any)}
                    className="w-full h-9 px-3 border border-slate-200 text-xs bg-slate-50 focus:bg-white rounded-lg cursor-pointer"
                  >
                    <option value="active">启用 (Active)</option>
                    <option value="draft">草稿 (Draft)</option>
                    <option value="inactive">禁用 (Inactive)</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 font-semibold text-xs rounded-lg cursor-pointer"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg shadow-xs cursor-pointer"
                >
                  确认保存变更 Apply Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Delete Confirmation Dialog */}
      {isDeleteConfirmOpen && selectedProduct && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-sm w-full p-6 text-center" id="delete-product-dialog">
            <div className="w-12 h-12 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-6 h-6 animate-bounce" />
            </div>
            <h3 className="text-base font-bold text-slate-900 leading-snug">确定要把该货品下架注销并移出账册吗？</h3>
            <p className="text-xs text-slate-400 mt-2">
              您正在进行的货品删除下架操作的对象为：<br />
              <span className="font-semibold text-slate-700 font-mono mt-1 block">{selectedProduct.name} ({selectedProduct.sku})</span>
              <span className="text-red-500 font-bold block mt-1 leading-normal text-[10px]">⚠️ 警告：本操作将清除此商品的所有实物可用货数和账目流水，在没有确认之前请谨慎考虑。</span>
            </p>

            <div className="mt-6 flex justify-center gap-3">
              <button
                onClick={() => setIsDeleteConfirmOpen(false)}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-100 text-slate-600 font-semibold text-xs rounded-lg cursor-pointer"
              >
                保留货品 (Keep)
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold text-xs rounded-lg shadow-xs cursor-pointer"
              >
                确定清除销账 Deprecate
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
