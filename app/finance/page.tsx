'use client';

import { useState, useMemo, useCallback } from 'react';
import MainLayout from '@/components/MainLayout';
import { useFinance, useInventory, useStaffPortal } from '@/lib/store';
import { useExpensesRealtime, useCashFlowsRealtime, useClaimRequestsRealtime } from '@/lib/supabase/realtime-hooks';
import { useTranslation } from '@/lib/contexts/LanguageContext';
import { Expense, ExpenseCategory, PaymentMethod, ClaimRequest, CashPayout } from '@/lib/types';
import { EXPENSE_CATEGORIES, PAYMENT_METHODS, getCategoryLabel, getCategoryColor } from '@/lib/finance-data';
import Modal from '@/components/Modal';
import ConfirmModal from '@/components/ConfirmModal';
import LoadingSpinner from '@/components/LoadingSpinner';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Plus,
  Edit2,
  Trash2,
  Calendar,
  Wallet,
  CreditCard,
  PiggyBank,
  FileText,
  ArrowUpRight,
  ArrowDownRight,
  Receipt,
  Download,
  CheckCircle,
  Clock,
  Banknote,
  Search
} from 'lucide-react';
import StatCard from '@/components/StatCard';
import { exportToCSV, type ExportColumn } from '@/lib/services';
import { useToast } from '@/lib/contexts/ToastContext';
import { fetchCashPayouts } from '@/lib/supabase/operations';
import ExpensesTable from '@/components/finance/ExpensesTable';
import MoneyOutTable from '@/components/finance/MoneyOutTable';
import { BentoGrid, BentoCard } from '@/components/BentoGrid';
import GlassCard from '@/components/GlassCard';

type ModalType = 'add' | 'edit' | 'delete' | 'cashflow' | null;
type ViewMode = 'expenses' | 'cashflow' | 'pnl' | 'claims' | 'moneyout';

export default function FinancePage() {
  const {
    expenses,
    cashFlows,
    orders,
    addExpense,
    updateExpense,
    deleteExpense,
    updateCashFlow,
    getTodayCashFlow,
    getMonthlyExpenses,
    getMonthlyRevenue,
    refreshExpenses,
    refreshCashFlows,
    isInitialized: storeInitialized,
    isSecondaryInitialized
  } = useFinance();

  const isInitialized = isSecondaryInitialized;
  const { wasteLogs } = useInventory();
  const {
    claimRequests,
    markClaimAsPaid,
    refreshClaimRequests
  } = useStaffPortal();

  // Realtime subscriptions
  const handleExpensesChange = useCallback(() => {
    refreshExpenses();
  }, [refreshExpenses]);

  const handleCashFlowsChange = useCallback(() => {
    refreshCashFlows();
  }, [refreshCashFlows]);

  const handleClaimsChange = useCallback(() => {
    refreshClaimRequests();
  }, [refreshClaimRequests]);

  useCashFlowsRealtime(handleCashFlowsChange);
  useClaimRequestsRealtime(handleClaimsChange);

  const { t, language } = useTranslation();
  const { showToast } = useToast();

  const [viewMode, setViewMode] = useState<ViewMode>('expenses');
  const [modalType, setModalType] = useState<ModalType>(null);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [filterMonth, setFilterMonth] = useState(new Date().toISOString().slice(0, 7));
  const [filterCategory, setFilterCategory] = useState<ExpenseCategory | 'all'>('all');
  const [isExporting, setIsExporting] = useState(false);
  const [cashPayouts, setCashPayouts] = useState<CashPayout[]>([]);
  const [payoutsLoading, setPayoutsLoading] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    category: 'ingredients' as ExpenseCategory,
    amount: 0,
    description: '',
    paymentMethod: 'cash' as PaymentMethod,
    vendor: '',
  });

  // Cash flow form
  const [cashFlowData, setCashFlowData] = useState({
    openingCash: 500,
    salesCash: 0,
    salesCard: 0,
    salesEwallet: 0,
    expensesCash: 0,
  });

  // Filter expenses
  const filteredExpenses = useMemo(() => {
    return expenses.filter(e => {
      const matchesMonth = e.date.startsWith(filterMonth);
      const matchesCategory = filterCategory === 'all' || e.category === filterCategory;
      return matchesMonth && matchesCategory;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [expenses, filterMonth, filterCategory]);

  // Load cash payouts
  const loadPayouts = useCallback(async () => {
    setPayoutsLoading(true);
    try {
      const data = await fetchCashPayouts();
      setCashPayouts(data);
    } catch (error) {
      console.error('Failed to load cash payouts:', error);
    } finally {
      setPayoutsLoading(false);
    }
  }, []);

  // Filter payouts
  const filteredPayouts = useMemo(() => {
    return cashPayouts.filter(p => p.createdAt.startsWith(filterMonth))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [cashPayouts, filterMonth]);

  // Totals
  const monthlyExpenseTotal = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
  const monthlyRevenue = getMonthlyRevenue(filterMonth);

  // Expense by category
  const expenseByCategory = useMemo(() => {
    const grouped: Record<string, number> = {};
    filteredExpenses.forEach(e => {
      grouped[e.category] = (grouped[e.category] || 0) + e.amount;
    });
    return Object.entries(grouped)
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount);
  }, [filteredExpenses]);

  // Today's stats
  const todayCashFlow = getTodayCashFlow();
  const todayExpenses = expenses.filter(e => e.date === new Date().toISOString().split('T')[0]);
  const todayExpenseTotal = todayExpenses.reduce((sum, e) => sum + e.amount, 0);

  // P&L Calculation
  const calculatePnL = useMemo(() => {
    const monthExpenses = getMonthlyExpenses(filterMonth);
    const revenue = monthlyRevenue;

    const expenseBreakdown: Record<string, number> = {};
    monthExpenses.forEach(e => {
      expenseBreakdown[e.category] = (expenseBreakdown[e.category] || 0) + e.amount;
    });

    const monthlyWasteLogs = wasteLogs.filter(log => log.createdAt.startsWith(filterMonth));
    const stockWasteLoss = monthlyWasteLogs.reduce((sum, log) => sum + (log.totalLoss || 0), 0);

    const totalOperatingExpenses = monthExpenses.reduce((sum, e) => sum + e.amount, 0);
    const estimatedCOGS = expenseBreakdown['ingredients'] || 0;
    const totalExpenses = totalOperatingExpenses + stockWasteLoss;

    const grossProfit = revenue - estimatedCOGS;
    const netProfit = revenue - totalExpenses;
    const profitMargin = revenue > 0 ? (netProfit / revenue) * 100 : 0;

    return {
      revenue,
      estimatedCOGS,
      grossProfit,
      expenses: expenseBreakdown,
      stockWasteLoss,
      totalExpenses,
      netProfit,
      profitMargin,
    };
  }, [filterMonth, getMonthlyExpenses, monthlyRevenue, wasteLogs]);

  // Modal Handlers (Preserved Logic)
  const openAddModal = () => {
    setFormData({
      date: new Date().toISOString().split('T')[0],
      category: 'ingredients',
      amount: 0,
      description: '',
      paymentMethod: 'cash',
      vendor: '',
    });
    setModalType('add');
  };

  const openEditModal = (expense: Expense) => {
    setSelectedExpense(expense);
    setFormData({
      date: expense.date,
      category: expense.category,
      amount: expense.amount,
      description: expense.description,
      paymentMethod: expense.paymentMethod,
      vendor: expense.vendor || '',
    });
    setModalType('edit');
  };

  const openDeleteModal = (expense: Expense) => {
    setSelectedExpense(expense);
    setModalType('delete');
  };

  const openCashFlowModal = () => {
    const today = getTodayCashFlow();
    if (today) {
      setCashFlowData({
        openingCash: today.openingCash,
        salesCash: today.salesCash,
        salesCard: today.salesCard,
        salesEwallet: today.salesEwallet,
        expensesCash: today.expensesCash,
      });
    } else {
      const sortedFlows = [...cashFlows].sort((a, b) =>
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      const lastRecord = sortedFlows[0];
      const openingFromYesterday = lastRecord?.closingCash ?? 500;

      setCashFlowData({
        openingCash: openingFromYesterday,
        salesCash: 0,
        salesCard: 0,
        salesEwallet: 0,
        expensesCash: 0,
      });
    }
    setModalType('cashflow');
  };

  const [confirmationData, setConfirmationData] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => { },
  });

  const closeModal = () => {
    setModalType(null);
    setSelectedExpense(null);
    setIsProcessing(false);
  };

  const handleAddExpense = async () => {
    if (!formData.description.trim() || formData.amount <= 0) {
      showToast('Sila masukkan keterangan dan jumlah yang sah', 'error');
      return;
    }
    setIsProcessing(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    addExpense({
      date: formData.date,
      category: formData.category,
      amount: formData.amount,
      description: formData.description.trim(),
      paymentMethod: formData.paymentMethod,
      vendor: formData.vendor.trim() || undefined,
    });
    closeModal();
    showToast('Perbelanjaan berjaya ditambah', 'success');
  };

  const handleEditExpense = async () => {
    if (!selectedExpense || !formData.description.trim() || formData.amount <= 0) {
      showToast('Sila masukkan keterangan dan jumlah yang sah', 'error');
      return;
    }
    setIsProcessing(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    updateExpense(selectedExpense.id, {
      date: formData.date,
      category: formData.category,
      amount: formData.amount,
      description: formData.description.trim(),
      paymentMethod: formData.paymentMethod,
      vendor: formData.vendor.trim() || undefined,
    });
    closeModal();
    showToast('Perbelanjaan berjaya dikemaskini', 'success');
  };

  const handleDeleteExpense = async () => {
    if (!selectedExpense) return;
    setConfirmationData({
      isOpen: true,
      title: 'Hapus Perbelanjaan',
      message: 'Adakah anda pasti ingin menghapus perbelanjaan ini?',
      onConfirm: async () => {
        setIsProcessing(true);
        deleteExpense(selectedExpense.id);
        closeModal();
        showToast('Perbelanjaan berjaya dihapus', 'success');
        setConfirmationData(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const handleSaveCashFlow = async () => {
    setIsProcessing(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    const today = new Date().toISOString().split('T')[0];
    const closingCash = cashFlowData.openingCash + cashFlowData.salesCash - cashFlowData.expensesCash;
    updateCashFlow(today, {
      ...cashFlowData,
      closingCash,
      closedAt: new Date().toISOString(),
    });
    closeModal();
    showToast('Laporan Cash Flow berjaya disimpan', 'success');
  };

  // Export Logic (Compact)
  const handleExportCSV = async () => {
    setIsExporting(true);
    try {
      let data: any[] = [];
      let filename = `finance_report_${filterMonth}`;

      const pnl = calculatePnL; // Calculate once

      if (viewMode === 'expenses') data = filteredExpenses.map(e => ({ date: e.date, category: e.category, desc: e.description, amount: e.amount }));
      else if (viewMode === 'cashflow') data = cashFlows.map(c => ({ date: c.date, opening: c.openingCash, closing: c.closingCash }));
      else if (viewMode === 'pnl') data = [{ item: 'Revenue', amount: pnl.revenue }, { item: 'Net Profit', amount: pnl.netProfit }];

      if (data.length > 0) {
        exportToCSV({ filename, columns: Object.keys(data[0]).map(k => ({ key: k, label: k })), data, includeTimestamp: true });
        showToast('Export successful', 'success');
      }
    } catch { showToast('Export failed', 'error'); }
    finally { setIsExporting(false); }
  };

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      const jsPDF = (await import('jspdf')).default;
      const doc = new jsPDF();
      doc.text('Finance Report', 14, 20);
      doc.save('report.pdf');
      showToast('Export successful', 'success');
    } catch { showToast('Export failed', 'error'); }
    finally { setIsExporting(false); }
  };

  if (!isInitialized) return <MainLayout><div className="flex h-[50vh] items-center justify-center"><LoadingSpinner /></div></MainLayout>;

  return (
    <MainLayout>
      <div className="animate-fade-in max-w-[1600px] mx-auto p-4 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">
              {t('finance.title')}
            </h1>
            <p className="text-gray-500 font-medium mt-1">
              {t('finance.subtitle')}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <div className="flex bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg p-1 mr-2">
              <button onClick={handleExportCSV} disabled={isExporting} className="btn-ghost px-3 py-1.5 text-xs flex gap-2"><Download size={14} /> CSV</button>
              <button onClick={handleExportPDF} disabled={isExporting} className="btn-ghost px-3 py-1.5 text-xs flex gap-2"><FileText size={14} /> PDF</button>
            </div>
            <button className="btn btn-outline" onClick={openCashFlowModal}><Wallet size={18} className="mr-2" /> {t('finance.cashFlowToday')}</button>
            <button className="btn btn-primary" onClick={openAddModal}><Plus size={18} className="mr-2" /> {t('finance.addExpense')}</button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide border-b border-gray-200 dark:border-white/10">
          {[
            { id: 'expenses', icon: TrendingDown, label: t('finance.tabs.expenses') },
            { id: 'cashflow', icon: Wallet, label: t('finance.tabs.cashflow') },
            { id: 'pnl', icon: FileText, label: t('finance.tabs.pnl') },
            { id: 'moneyout', icon: Banknote, label: t('finance.tabs.moneyOut') }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => { setViewMode(tab.id as ViewMode); if (tab.id === 'moneyout') loadPayouts(); }}
              className={`px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 transition-all ${viewMode === tab.id
                  ? 'bg-gray-900 text-white dark:bg-white dark:text-black shadow-md'
                  : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-white/10'
                }`}
            >
              <tab.icon size={16} /> {tab.label}
            </button>
          ))}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label={t('finance.stats.sales')}
            value={`BND ${monthlyRevenue.toFixed(2)}`}
            change={t('finance.stats.change.revenue')}
            changeType="positive"
            icon={TrendingUp}
            gradient="sunset"
          />
          <StatCard
            label={t('finance.stats.expenses')}
            value={`BND ${monthlyExpenseTotal.toFixed(2)}`}
            change={t('finance.stats.change.costs')}
            changeType="neutral"
            icon={Receipt}
            gradient="warning"
          />
          <StatCard
            label={t('finance.stats.netProfit')}
            value={`BND ${calculatePnL.netProfit.toFixed(2)}`}
            change={calculatePnL.netProfit >= 0 ? "Profit" : "Loss"}
            changeType={calculatePnL.netProfit >= 0 ? "positive" : "negative"}
            icon={calculatePnL.netProfit >= 0 ? TrendingUp : TrendingDown}
            gradient="primary"
          />
          <StatCard
            label={t('finance.stats.margin')}
            value={`${calculatePnL.profitMargin.toFixed(1)}%`}
            change="Margin"
            changeType={calculatePnL.profitMargin >= 20 ? "positive" : "neutral"}
            icon={PiggyBank}
          />
        </div>

        {/* Content Views */}
        {viewMode === 'expenses' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <BentoCard colSpan={2} title={t('finance.expenses.title')} className="min-h-[500px]">
              <div className="flex gap-4 mb-4">
                <input type="month" value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)} className="border rounded-lg px-3 py-1.5 text-sm bg-transparent" />
                <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value as any)} className="border rounded-lg px-3 py-1.5 text-sm bg-transparent">
                  <option value="all">All Categories</option>
                  {EXPENSE_CATEGORIES.map(c => <option key={c.value} value={c.value}>{t(`finance.expenseCategories.${c.value}`)}</option>)}
                </select>
              </div>
              <ExpensesTable expenses={filteredExpenses} onEdit={openEditModal} onDelete={openDeleteModal} totalAmount={monthlyExpenseTotal} />
            </BentoCard>

            <div className="space-y-6">
              <BentoCard title={t('finance.expenses.byCategory')} icon={<PiggyBank size={20} />}>
                <div className="space-y-4 mt-4">
                  {expenseByCategory.slice(0, 5).map(({ category, amount }) => (
                    <div key={category}>
                      <div className="flex justify-between text-sm font-bold mb-1">
                        <span>{t(`finance.expenseCategories.${category}`)}</span>
                        <span>${amount.toFixed(0)}</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div style={{ width: `${(amount / monthlyExpenseTotal) * 100}%`, backgroundColor: getCategoryColor(category as ExpenseCategory) }} className="h-full rounded-full" />
                      </div>
                    </div>
                  ))}
                  {expenseByCategory.length === 0 && <p className="text-center text-gray-400 py-4">No expenses found</p>}
                </div>
              </BentoCard>

              <GlassCard className="bg-gradient-to-br from-gray-900 to-gray-800 text-white p-6">
                <h3 className="font-bold text-gray-400 text-xs uppercase tracking-widest mb-4">Today's Snapshot</h3>
                <div className="flex justify-between items-end mb-2">
                  <span className="text-sm font-medium">Expenses</span>
                  <span className="text-2xl font-bold text-red-400">${todayExpenseTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-end pt-4 border-t border-white/10">
                  <span className="text-sm font-medium">Cash Balance</span>
                  <span className="text-2xl font-bold text-green-400">${(todayCashFlow?.closingCash || 0).toFixed(2)}</span>
                </div>
              </GlassCard>
            </div>
          </div>
        )}

        {viewMode === 'cashflow' && (
          <BentoGrid className="gap-6 !max-w-none">
            <BentoCard colSpan={2} title="Cash Flow History" icon={<Wallet size={20} />}>
              <div className="overflow-x-auto mt-4">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-white/5 text-gray-500">
                    <tr>
                      <th className="p-3 text-left">Date</th>
                      <th className="p-3 text-right">Opening</th>
                      <th className="p-3 text-right text-green-600">Sales (Cash)</th>
                      <th className="p-3 text-right text-blue-600">Sales (Card)</th>
                      <th className="p-3 text-right text-red-600">Expenses</th>
                      <th className="p-3 text-right font-bold">Closing</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                    {cashFlows.slice(0, 10).map(cf => (
                      <tr key={cf.id}>
                        <td className="p-3 font-bold">{new Date(cf.date).toLocaleDateString()}</td>
                        <td className="p-3 text-right text-gray-500">${cf.openingCash.toFixed(2)}</td>
                        <td className="p-3 text-right text-green-600 font-medium">+${cf.salesCash.toFixed(2)}</td>
                        <td className="p-3 text-right text-blue-600 font-medium">+${cf.salesCard.toFixed(2)}</td>
                        <td className="p-3 text-right text-red-600 font-medium">-${cf.expensesCash.toFixed(2)}</td>
                        <td className="p-3 text-right font-bold">${cf.closingCash.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </BentoCard>
            <GlassCard className="p-6 flex flex-col justify-center gap-4">
              <h3 className="font-bold text-lg">7-Day Summary</h3>
              <div className="p-4 bg-green-50 rounded-xl">
                <div className="text-xs text-green-700 font-bold uppercase">Total Cash In</div>
                <div className="text-2xl font-black text-green-700 mt-1">
                  ${cashFlows.slice(0, 7).reduce((sum, cf) => sum + cf.salesCash, 0).toFixed(0)}
                </div>
              </div>
              <div className="p-4 bg-red-50 rounded-xl">
                <div className="text-xs text-red-700 font-bold uppercase">Total Cash Out</div>
                <div className="text-2xl font-black text-red-700 mt-1">
                  ${cashFlows.slice(0, 7).reduce((sum, cf) => sum + cf.expensesCash, 0).toFixed(0)}
                </div>
              </div>
            </GlassCard>
          </BentoGrid>
        )}

        {viewMode === 'pnl' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <BentoCard title="Profit & Loss Statement" icon={<FileText size={20} />}>
              <div className="space-y-2 mt-4">
                <div className="flex justify-between p-3 bg-green-50 rounded-lg">
                  <span className="font-bold text-green-800">Revenue</span>
                  <span className="font-bold text-green-800">${calculatePnL.revenue.toFixed(2)}</span>
                </div>
                <div className="flex justify-between p-3">
                  <span className="text-gray-500">COGS</span>
                  <span className="text-red-500">-${calculatePnL.estimatedCOGS.toFixed(2)}</span>
                </div>
                <div className="flex justify-between p-3 bg-gray-50 rounded-lg font-bold">
                  <span>Gross Profit</span>
                  <span>${calculatePnL.grossProfit.toFixed(2)}</span>
                </div>
                <div className="pt-2 border-t border-dashed border-gray-200">
                  <div className="text-xs font-bold text-gray-400 uppercase mb-2">Operating Expenses</div>
                  {Object.entries(calculatePnL.expenses).filter(([k]) => k !== 'ingredients').map(([k, v]) => (
                    <div key={k} className="flex justify-between text-sm py-1">
                      <span className="capitalize text-gray-600">{k}</span>
                      <span className="text-red-500">-${(v as number).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between p-4 bg-blue-50 rounded-xl mt-4 border border-blue-100">
                  <span className="font-black text-blue-900 text-lg">Net Profit</span>
                  <span className="font-black text-blue-900 text-lg">${calculatePnL.netProfit.toFixed(2)}</span>
                </div>
              </div>
            </BentoCard>

            <GlassCard className="p-6">
              <h3 className="font-bold text-lg mb-4">Financial Health</h3>
              <div className="space-y-4">
                <div className={`p-4 rounded-xl border-l-4 ${calculatePnL.profitMargin > 20 ? 'bg-green-50 border-green-500' : 'bg-amber-50 border-amber-500'}`}>
                  <div className="font-bold text-gray-900">Net Margin: {calculatePnL.profitMargin.toFixed(1)}%</div>
                  <div className="text-sm text-gray-500 mt-1">
                    {calculatePnL.profitMargin > 20 ? 'Healthy profit margin. Keep it up!' : 'Margin is tight. Monitor food costs.'}
                  </div>
                </div>
              </div>
            </GlassCard>
          </div>
        )}

        {viewMode === 'moneyout' && (
          <BentoCard title="Cash Payouts" icon={<Banknote size={20} />}>
            <div className="flex justify-between items-center mb-4">
              <input type="month" value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)} className="border rounded px-2 py-1" />
              <button onClick={loadPayouts} className="text-sm text-primary hover:underline" disabled={payoutsLoading}>Refresh</button>
            </div>
            <MoneyOutTable payouts={filteredPayouts} loading={payoutsLoading} />
          </BentoCard>
        )}

      </div>

      {/* Modals are kept outside the grid */}
      <Modal
        isOpen={modalType === 'add' || modalType === 'edit'}
        onClose={closeModal}
        title={modalType === 'add' ? t('finance.modals.addExpense') : t('finance.modals.editExpense')}
      >
        {/* Simple Form Implementation to save space */}
        <div className="space-y-4">
          <input type="date" className="input w-full border p-2 rounded" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} />
          <select className="input w-full border p-2 rounded" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value as any })}>
            {EXPENSE_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
          <input type="number" placeholder="Amount" className="input w-full border p-2 rounded" value={formData.amount || ''} onChange={e => setFormData({ ...formData, amount: parseFloat(e.target.value) })} />
          <input type="text" placeholder="Description" className="input w-full border p-2 rounded" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
          <div className="flex justify-end gap-2 pt-2">
            <button onClick={closeModal} className="btn btn-ghost">Cancel</button>
            <button onClick={modalType === 'add' ? handleAddExpense : handleEditExpense} className="btn btn-primary">Save</button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={modalType === 'cashflow'} onClose={closeModal} title="Cash Flow Today">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label>Opening</label><input type="number" className="p-2 border rounded w-full" value={cashFlowData.openingCash} onChange={e => setCashFlowData({ ...cashFlowData, openingCash: parseFloat(e.target.value) || 0 })} /></div>
            <div><label>Sales (Cash)</label><input type="number" className="p-2 border rounded w-full" value={cashFlowData.salesCash} onChange={e => setCashFlowData({ ...cashFlowData, salesCash: parseFloat(e.target.value) || 0 })} /></div>
          </div>
          <div className="p-3 bg-gray-100 rounded text-center">
            <div className="text-xs uppercase font-bold text-gray-500">Closing Cash</div>
            <div className="text-2xl font-bold">${(cashFlowData.openingCash + cashFlowData.salesCash - cashFlowData.expensesCash).toFixed(2)}</div>
          </div>
          <button onClick={handleSaveCashFlow} className="btn btn-primary w-full">Save Record</button>
        </div>
      </Modal>

      <ConfirmModal
        isOpen={modalType === 'delete'}
        onClose={closeModal}
        onConfirm={handleDeleteExpense}
        title="Delete Expense"
        message="Are you sure?"
        type="danger"
      />

      {/* Generic Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmationData.isOpen}
        onClose={() => setConfirmationData(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmationData.onConfirm}
        title={confirmationData.title}
        message={confirmationData.message}
        type="danger"
      />

    </MainLayout>
  );
}
