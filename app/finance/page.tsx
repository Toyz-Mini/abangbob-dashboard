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
  Banknote
} from 'lucide-react';
import StatCard from '@/components/StatCard';
import { exportToCSV, type ExportColumn } from '@/lib/services';
import { useToast } from '@/lib/contexts/ToastContext';
import { fetchCashPayouts } from '@/lib/supabase/operations';
import ExpensesTable from '@/components/finance/ExpensesTable';
import MoneyOutTable from '@/components/finance/MoneyOutTable';


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
    console.log('[Realtime] Expenses change detected, refreshing...');
    refreshExpenses();
  }, [refreshExpenses]);

  const handleCashFlowsChange = useCallback(() => {
    console.log('[Realtime] Cash flows change detected, refreshing...');
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

  // Load cash payouts when viewing moneyout tab
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

  // Filter payouts by month
  const filteredPayouts = useMemo(() => {
    return cashPayouts.filter(p => p.createdAt.startsWith(filterMonth))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [cashPayouts, filterMonth]);

  // Approved Claims (Ready for Payout)
  const approvedClaims = useMemo(() => {
    return claimRequests?.filter(c => c.status === 'approved') || [];
  }, [claimRequests]);

  const paidClaimsHistory = useMemo(() => {
    return claimRequests?.filter(c => c.status === 'paid' && c.createdAt.startsWith(filterMonth)) || [];
  }, [claimRequests, filterMonth]);

  // Calculate totals
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

  // Calculate P&L
  const calculatePnL = useMemo(() => {
    const monthExpenses = getMonthlyExpenses(filterMonth);
    const revenue = monthlyRevenue;

    const expenseBreakdown: Record<string, number> = {};
    monthExpenses.forEach(e => {
      expenseBreakdown[e.category] = (expenseBreakdown[e.category] || 0) + e.amount;
    });

    // Waste Loss
    const monthlyWasteLogs = wasteLogs.filter(log => log.createdAt.startsWith(filterMonth));
    const stockWasteLoss = monthlyWasteLogs.reduce((sum, log) => sum + (log.totalLoss || 0), 0);

    const totalOperatingExpenses = monthExpenses.reduce((sum, e) => sum + e.amount, 0);
    const estimatedCOGS = expenseBreakdown['ingredients'] || 0;

    // Total Expenses = Operating Expenses + Waste Loss
    // Note: COGS is already part of totalOperatingExpenses if 'ingredients' is in expenses array.
    // However, P&L usually separates COGS. 
    // Here, let's treat totalExpenses as the SUM of everything out.
    const totalExpenses = totalOperatingExpenses + stockWasteLoss;

    const grossProfit = revenue - estimatedCOGS;
    // Net Profit = Revenue - Total Expenses
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
      // Load existing today's record
      setCashFlowData({
        openingCash: today.openingCash,
        salesCash: today.salesCash,
        salesCard: today.salesCard,
        salesEwallet: today.salesEwallet,
        expensesCash: today.expensesCash,
      });
    } else {
      // No record for today - find yesterday/last record's closing balance as today's opening
      const sortedFlows = [...cashFlows].sort((a, b) =>
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      const lastRecord = sortedFlows[0];
      const openingFromYesterday = lastRecord?.closingCash ?? 500; // Default to 500 if no history

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

    // Use confirmation modal instead of direct delete
    setConfirmationData({
      isOpen: true,
      title: 'Hapus Perbelanjaan',
      message: 'Adakah anda pasti ingin menghapus perbelanjaan ini? Tindakan ini tidak boleh dibatalkan.',
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

  const handlePayClaim = async (claim: ClaimRequest) => {
    setConfirmationData({
      isOpen: true,
      title: 'Sahkan Pembayaran',
      message: `Sahkan pembayaran tuntutan RM${claim.amount} kepada ${claim.staffName}?`,
      onConfirm: async () => {
        setIsProcessing(true);

        // 1. Mark as Paid
        await markClaimAsPaid(claim.id);

        // 2. Add to Expenses automatically
        await addExpense({
          date: new Date().toISOString().split('T')[0],
          category: 'wages', // Corrected from 'salary' to matches ExpenseCategory
          amount: claim.amount,
          description: `Tuntutan: ${claim.description} (${claim.staffName})`,
          paymentMethod: 'cash', // Default to cash payout
        });

        showToast('Tuntutan berjaya dibayar & direkod dalam Perbelanjaan', 'success');
        setIsProcessing(false);
        setConfirmationData(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  // Export Handlers
  const handleExportCSV = async () => {
    setIsExporting(true);
    try {
      let data: any[] = [];
      let columns: ExportColumn[] = [];
      let filename = '';

      if (viewMode === 'expenses') {
        data = filteredExpenses.map(e => ({
          date: e.date,
          category: t(`finance.expenseCategories.${e.category}`),
          description: e.description,
          amount: e.amount,
          vendor: e.vendor || '-',
          paymentMethod: e.paymentMethod
        }));
        columns = [
          { key: 'date', label: t('finance.expenses.table.date') },
          { key: 'category', label: t('finance.expenses.table.category') },
          { key: 'description', label: t('finance.expenses.table.description') },
          { key: 'amount', label: t('finance.expenses.table.amount'), format: 'currency' },
          { key: 'vendor', label: t('finance.expenses.table.vendor') },
          { key: 'paymentMethod', label: t('finance.expenses.table.payment') }
        ];
        filename = `expenses_${filterMonth}`;
      } else if (viewMode === 'cashflow') {
        data = cashFlows.slice(0, 30).map(c => ({
          date: c.date.split('T')[0],
          opening: c.openingCash,
          salesCash: c.salesCash,
          salesCard: c.salesCard,
          expenses: c.expensesCash,
          closing: c.closingCash
        }));
        columns = [
          { key: 'date', label: t('finance.cashflow.table.date') },
          { key: 'opening', label: t('finance.cashflow.table.opening'), format: 'currency' },
          { key: 'salesCash', label: t('finance.cashflow.table.salesCash'), format: 'currency' },
          { key: 'salesCard', label: t('finance.cashflow.table.salesCard'), format: 'currency' },
          { key: 'expenses', label: t('finance.cashflow.table.expenses'), format: 'currency' },
          { key: 'closing', label: t('finance.cashflow.table.closing'), format: 'currency' }
        ];
        filename = `cashflow_${filterMonth}`;
      } else if (viewMode === 'pnl') {
        const pnl = calculatePnL;
        data = [
          { item: t('finance.pnl.statement.revenue'), amount: pnl.revenue },
          { item: t('finance.pnl.statement.cogs'), amount: -pnl.estimatedCOGS },
          { item: t('finance.pnl.statement.grossProfit'), amount: pnl.grossProfit },
          ...Object.entries(pnl.expenses).filter(([k]) => k !== 'ingredients').map(([k, v]) => ({
            item: `${t('finance.pnl.statement.operatingExpenses')}: ${t(`finance.expenseCategories.${k}`)}`, amount: -(v as number)
          })),
          { item: t('finance.pnl.statement.totalExpenses'), amount: -pnl.totalExpenses },
          { item: t('finance.pnl.statement.netProfit'), amount: pnl.netProfit },
          { item: t('finance.pnl.statement.margin'), amount: pnl.profitMargin }
        ];
        columns = [
          { key: 'item', label: t('finance.pnl.statement.item') || 'Item' }, // Assuming 'Item' key exists or fallback
          { key: 'amount', label: t('finance.pnl.statement.amount') || 'Amount', format: 'currency' }
        ];
        filename = `pnl_${filterMonth}`;
      }

      if (data.length > 0) {
        exportToCSV({ filename, columns, data, includeTimestamp: true });
        showToast(t('finance.toast.exportSuccess'), 'success');
      }
    } catch (e) {
      console.error(e);
      showToast(t('finance.toast.exportError'), 'error');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      const jsPDF = (await import('jspdf')).default;
      const autoTable = (await import('jspdf-autotable')).default;
      const doc = new jsPDF();

      doc.setFontSize(18);
      const title = viewMode === 'pnl' ? t('finance.pnl.title')
        : viewMode === 'cashflow' ? t('finance.cashflow.title')
          : t('finance.expenses.title');
      doc.text(title, 14, 20);

      doc.setFontSize(12);
      doc.text(`${t('common.month') || 'Month'}: ${filterMonth}`, 14, 30);
      doc.text(`${t('common.printed') || 'Printed'}: ${new Date().toLocaleString()}`, 14, 36);

      if (viewMode === 'expenses') {
        autoTable(doc, {
          startY: 45,
          head: [[
            t('finance.expenses.table.date'),
            t('finance.expenses.table.category'),
            t('finance.expenses.table.description'),
            t('finance.expenses.table.amount'),
            t('finance.expenses.table.vendor')
          ]],
          body: filteredExpenses.map(e => [
            e.date,
            t(`finance.expenseCategories.${e.category}`),
            e.description,
            `BND ${e.amount.toFixed(2)}`,
            e.vendor || '-'
          ]),
          foot: [['', '', t('finance.expenses.summary.total'), `BND ${monthlyExpenseTotal.toFixed(2)}`, '']],
        });
      } else if (viewMode === 'cashflow') {
        autoTable(doc, {
          startY: 45,
          head: [[
            t('finance.cashflow.table.date'),
            t('finance.cashflow.table.opening'),
            t('finance.cashflow.table.salesCash'),
            t('finance.cashflow.table.salesCard'),
            t('finance.cashflow.table.expenses'),
            t('finance.cashflow.table.closing')
          ]],
          body: cashFlows.slice(0, 14).map(c => [
            c.date.split('T')[0],
            c.openingCash.toFixed(2),
            c.salesCash.toFixed(2),
            c.salesCard.toFixed(2),
            c.expensesCash.toFixed(2),
            c.closingCash.toFixed(2)
          ])
        });
      } else if (viewMode === 'pnl') {
        const pnl = calculatePnL;
        autoTable(doc, {
          startY: 45,
          head: [[t('finance.pnl.statement.item') || 'Item', t('finance.pnl.statement.amount') || 'Amount (BND)']],
          body: [
            [t('finance.pnl.statement.revenue'), pnl.revenue.toFixed(2)],
            [`(-) ${t('finance.pnl.statement.cogs')}`, pnl.estimatedCOGS.toFixed(2)],
            [`= ${t('finance.pnl.statement.grossProfit')}`, pnl.grossProfit.toFixed(2)],
            [{ content: `${t('finance.pnl.statement.operatingExpenses')}:`, colSpan: 2, styles: { fillColor: [240, 240, 240], fontStyle: 'bold' } }],
            ...Object.entries(pnl.expenses).filter(([k]) => k !== 'ingredients').map(([k, v]) => [
              `   ${t(`finance.expenseCategories.${k}`)}`, (v as number).toFixed(2)
            ]),
            [`(-) ${t('finance.pnl.statement.totalExpenses')}`, pnl.totalExpenses.toFixed(2)],
            [`= ${t('finance.pnl.statement.netProfit')}`, { content: pnl.netProfit.toFixed(2), styles: { fontStyle: 'bold', textColor: pnl.netProfit >= 0 ? [0, 128, 0] : [255, 0, 0] } }],
            [t('finance.pnl.statement.margin'), `${pnl.profitMargin.toFixed(1)}%`]
          ]
        });
      }

      doc.save(`finance_report_${viewMode}_${filterMonth}.pdf`);
      showToast(t('finance.toast.exportSuccess'), 'success');

    } catch (e) {
      console.error(e);
      showToast(t('finance.toast.exportError'), 'error');
    } finally {
      setIsExporting(false);
    }
  }; // Close handleExportPDF

  if (!isInitialized) {
    return (
      <MainLayout>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
          <LoadingSpinner />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="animate-fade-in">
        <div className="page-header">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h1 className="page-title" style={{ marginBottom: '0.5rem' }}>
                {t('finance.title')}
              </h1>
              <p className="page-subtitle">
                {t('finance.subtitle')}
              </p>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <div style={{ display: 'flex', gap: '0.25rem', marginRight: '0.5rem' }}>
                <button
                  className="btn btn-sm btn-outline"
                  onClick={handleExportCSV}
                  disabled={isExporting}
                >
                  <Download size={16} /> {t('finance.actions.csv')}
                </button>
                <button
                  className="btn btn-sm btn-outline"
                  onClick={handleExportPDF}
                  disabled={isExporting}
                >
                  <FileText size={16} /> {t('finance.actions.pdf')}
                </button>
              </div>
              <button className="btn btn-outline" onClick={openCashFlowModal}>
                <Wallet size={18} />
                {t('finance.cashFlowToday')}
              </button>
              <button className="btn btn-primary" onClick={openAddModal}>
                <Plus size={18} />
                {t('finance.addExpense')}
              </button>
            </div>
          </div>
        </div>

        {/* View Mode Tabs */}
        <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '0.5rem', borderBottom: '2px solid var(--gray-200)', paddingBottom: '0.5rem', overflowX: 'auto', whiteSpace: 'nowrap' }}>
          <button
            onClick={() => setViewMode('expenses')}
            className={`btn btn-sm ${viewMode === 'expenses' ? 'btn-primary' : 'btn-outline'}`}
          >
            <TrendingDown size={16} />
            {t('finance.tabs.expenses')}
          </button>
          <button
            onClick={() => setViewMode('cashflow')}
            className={`btn btn-sm ${viewMode === 'cashflow' ? 'btn-primary' : 'btn-outline'}`}
          >
            <Wallet size={16} />
            {t('finance.tabs.cashflow')}
          </button>
          <button
            onClick={() => setViewMode('pnl')}
            className={`btn btn-sm ${viewMode === 'pnl' ? 'btn-primary' : 'btn-outline'}`}
          >
            <FileText size={16} />
            {t('finance.tabs.pnl')}
          </button>
          <button
            onClick={() => { setViewMode('moneyout'); loadPayouts(); }}
            className={`btn btn-sm ${viewMode === 'moneyout' ? 'btn-primary' : 'btn-outline'}`}
          >
            <Banknote size={16} />
            {t('finance.tabs.moneyOut')}
          </button>
        </div>

        {/* Stats Cards */}
        <div className="content-grid cols-4 mb-lg">
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
            change={calculatePnL.netProfit >= 0 ? t('finance.stats.change.profit') : t('finance.stats.change.loss')}
            changeType={calculatePnL.netProfit >= 0 ? "positive" : "negative"}
            icon={calculatePnL.netProfit >= 0 ? TrendingUp : TrendingDown}
            gradient="primary"
          />
          <StatCard
            label={t('finance.stats.margin')}
            value={`${calculatePnL.profitMargin.toFixed(1)}%`}
            change={calculatePnL.profitMargin >= 20 ? t('finance.stats.change.healthy') : calculatePnL.profitMargin >= 10 ? t('finance.stats.change.moderate') : t('finance.stats.change.low')}
            changeType={calculatePnL.profitMargin >= 20 ? "positive" : calculatePnL.profitMargin >= 10 ? "neutral" : "negative"}
            icon={PiggyBank}
          />
        </div>

        {/* Expenses View */}
        {viewMode === 'expenses' && (
          <div className="grid grid-cols-1 lg:grid-cols-3" style={{ gap: '1.5rem' }}>
            {/* Expense List */}
            <div className="lg:col-span-2">
              <div className="card">
                <div className="card-header">
                  <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <DollarSign size={20} />
                    {t('finance.expenses.title')}
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <input
                      type="month"
                      className="form-input"
                      value={filterMonth}
                      onChange={(e) => setFilterMonth(e.target.value)}
                      style={{ width: 'auto' }}
                    />
                    <select
                      className="form-select"
                      value={filterCategory}
                      onChange={(e) => setFilterCategory(e.target.value as ExpenseCategory | 'all')}
                      style={{ width: 'auto' }}
                    >
                      <option value="all">{t('finance.expenses.allCategories')}</option>
                      {EXPENSE_CATEGORIES.map(cat => (
                        <option key={cat.value} value={cat.value}>{t(`finance.expenseCategories.${cat.value}`)}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <ExpensesTable
                  expenses={filteredExpenses}
                  onEdit={openEditModal}
                  onDelete={openDeleteModal}
                  totalAmount={monthlyExpenseTotal}
                />
              </div>
            </div>

            {/* Expense by Category */}
            <div>
              <div className="card">
                <div className="card-header">
                  <div className="card-title">{t('finance.expenses.byCategory')}</div>
                  <div className="card-subtitle">{filterMonth}</div>
                </div>
                {expenseByCategory.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {expenseByCategory.map(({ category, amount }) => {
                      const percentage = (amount / monthlyExpenseTotal) * 100;
                      return (
                        <div key={category}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                            <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>
                              {t(`finance.expenseCategories.${category}`)}
                            </span>
                            <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>
                              BND {amount.toFixed(2)}
                            </span>
                          </div>
                          <div style={{
                            width: '100%',
                            height: '8px',
                            background: 'var(--gray-200)',
                            borderRadius: 'var(--radius-sm)',
                            overflow: 'hidden'
                          }}>
                            <div style={{
                              width: `${percentage}%`,
                              height: '100%',
                              background: getCategoryColor(category as ExpenseCategory),
                              borderRadius: 'var(--radius-sm)',
                              transition: 'width 0.3s'
                            }} />
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                            {percentage.toFixed(1)}%
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '1rem' }}>
                    {t('finance.expenses.empty')}
                  </p>
                )}
              </div>

              {/* Today's Summary */}
              <div className="card" style={{ marginTop: '1.5rem' }}>
                <div className="card-header">
                  <div className="card-title">{t('finance.expenses.today.title')}</div>
                  <div className="card-subtitle">{new Date().toLocaleDateString('ms-MY')}</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>{t('finance.expenses.today.expenses')}</span>
                    <span style={{ fontWeight: 600, color: 'var(--danger)' }}>
                      BND {todayExpenseTotal.toFixed(2)}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>{t('finance.expenses.today.cashBalance')}</span>
                    <span style={{ fontWeight: 600, color: 'var(--success)' }}>
                      BND {(todayCashFlow?.closingCash || 0).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Cash Flow View */}
        {viewMode === 'cashflow' && (
          <div className="grid grid-cols-1 lg:grid-cols-2" style={{ gap: '1.5rem' }}>
            <div className="card">
              <div className="card-header">
                <div className="card-title">{t('finance.cashflow.title')}</div>
                <div className="card-subtitle">{t('finance.cashflow.subtitle')}</div>
              </div>
              <div className="table-responsive">
                <table className="table">
                  <thead>
                    <tr>
                      <th>{t('finance.cashflow.table.date')}</th>
                      <th>{t('finance.cashflow.table.opening')}</th>
                      <th>{t('finance.cashflow.table.salesCash')}</th>
                      <th>{t('finance.cashflow.table.salesCard')}</th>
                      <th>{t('finance.cashflow.table.expenses')}</th>
                      <th>{t('finance.cashflow.table.closing')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cashFlows.slice(0, 7).map(cf => (
                      <tr key={cf.id}>
                        <td style={{ fontWeight: 600 }}>
                          {new Date(cf.date).toLocaleDateString('ms-MY', { weekday: 'short', day: 'numeric', month: 'short' })}
                        </td>
                        <td>BND {cf.openingCash.toFixed(2)}</td>
                        <td style={{ color: 'var(--success)' }}>+{cf.salesCash.toFixed(2)}</td>
                        <td style={{ color: 'var(--primary)' }}>+{cf.salesCard.toFixed(2)}</td>
                        <td style={{ color: 'var(--danger)' }}>-{cf.expensesCash.toFixed(2)}</td>
                        <td style={{ fontWeight: 700 }}>BND {cf.closingCash.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="card">
              <div className="card-header">
                <div className="card-title">{t('finance.cashflow.summary.title')}</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ padding: '1rem', background: 'var(--gray-100)', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                    {t('finance.cashflow.summary.salesCash')}
                  </div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--success)' }}>
                    BND {cashFlows.slice(0, 7).reduce((sum, cf) => sum + cf.salesCash, 0).toFixed(2)}
                  </div>
                </div>
                <div style={{ padding: '1rem', background: 'var(--gray-100)', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                    {t('finance.cashflow.summary.salesCard')}
                  </div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--primary)' }}>
                    BND {cashFlows.slice(0, 7).reduce((sum, cf) => sum + cf.salesCard + cf.salesEwallet, 0).toFixed(2)}
                  </div>
                </div>
                <div style={{ padding: '1rem', background: 'var(--gray-100)', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                    {t('finance.cashflow.summary.expensesCash')}
                  </div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--danger)' }}>
                    BND {cashFlows.slice(0, 7).reduce((sum, cf) => sum + cf.expensesCash, 0).toFixed(2)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* P&L View */}
        {viewMode === 'pnl' && (
          <div className="grid grid-cols-1 lg:grid-cols-2" style={{ gap: '1.5rem' }}>
            <div className="card">
              <div className="card-header">
                <div className="card-title">{t('finance.pnl.title')}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Calendar size={16} />
                  <input
                    type="month"
                    className="form-input"
                    value={filterMonth}
                    onChange={(e) => setFilterMonth(e.target.value)}
                    style={{ width: 'auto' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {/* Revenue */}
                <div style={{ padding: '1rem', background: '#d1fae5', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 600, color: '#065f46' }}>{t('finance.pnl.revenue')}</span>
                    <span style={{ fontSize: '1.25rem', fontWeight: 700, color: '#065f46' }}>
                      BND {calculatePnL.revenue.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* COGS */}
                <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--gray-200)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>{t('finance.pnl.cogs')}</span>
                    <span style={{ color: 'var(--danger)' }}>- BND {calculatePnL.estimatedCOGS.toFixed(2)}</span>
                  </div>
                </div>

                {/* Gross Profit */}
                <div style={{ padding: '0.75rem 1rem', background: 'var(--gray-100)', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: 600 }}>{t('finance.pnl.grossProfit')}</span>
                    <span style={{ fontWeight: 700 }}>BND {calculatePnL.grossProfit.toFixed(2)}</span>
                  </div>
                </div>

                {/* Operating Expenses */}
                <div style={{ marginTop: '0.5rem' }}>
                  <div style={{ fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>
                    {t('finance.pnl.operatingExpenses')}
                  </div>
                  {Object.entries(calculatePnL.expenses)
                    .filter(([cat]) => cat !== 'ingredients')
                    .map(([category, amount]) => (
                      <div key={category} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 1rem' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>{t(`finance.expenseCategories.${category}`)}</span>
                        <span style={{ color: 'var(--danger)' }}>- BND {amount.toFixed(2)}</span>
                      </div>
                    ))}
                </div>

                {/* Total Expenses */}
                <div style={{ padding: '0.75rem 1rem', borderTop: '1px solid var(--gray-200)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: 600 }}>{t('finance.pnl.totalExpenses')}</span>
                    <span style={{ fontWeight: 600, color: 'var(--danger)' }}>
                      BND {calculatePnL.totalExpenses.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Net Profit */}
                <div style={{
                  padding: '1rem',
                  background: calculatePnL.netProfit >= 0 ? '#dbeafe' : '#fee2e2',
                  borderRadius: 'var(--radius-md)',
                  marginTop: '0.5rem'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 700, color: calculatePnL.netProfit >= 0 ? '#1e40af' : '#991b1b' }}>
                      {t('finance.pnl.netProfit')}
                    </span>
                    <span style={{ fontSize: '1.5rem', fontWeight: 700, color: calculatePnL.netProfit >= 0 ? '#1e40af' : '#991b1b' }}>
                      BND {calculatePnL.netProfit.toFixed(2)}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.875rem', marginTop: '0.5rem', color: 'var(--text-secondary)' }}>
                    {t('finance.pnl.margin')}: {calculatePnL.profitMargin.toFixed(1)}%
                  </div>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <div className="card-title">{t('finance.pnl.analysis.title')}</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {calculatePnL.netProfit >= 0 ? (
                  <div className="alert alert-success">
                    {t('finance.pnl.analysis.profitAlert', { amount: calculatePnL.netProfit.toFixed(2) })}
                  </div>
                ) : (
                  <div className="alert alert-danger">
                    {t('finance.pnl.analysis.lossAlert', { amount: Math.abs(calculatePnL.netProfit).toFixed(2) })}
                  </div>
                )}

                <div style={{ padding: '1rem', background: 'var(--gray-100)', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ fontWeight: 600, marginBottom: '0.75rem' }}>{t('finance.pnl.analysis.recommendations')}</div>
                  <ul style={{ paddingLeft: '1.25rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                    {calculatePnL.profitMargin < 20 && (
                      <li style={{ marginBottom: '0.5rem' }}>
                        {t('finance.pnl.analysis.lowMargin')}
                      </li>
                    )}
                    {calculatePnL.estimatedCOGS / calculatePnL.revenue > 0.4 && (
                      <li style={{ marginBottom: '0.5rem' }}>
                        {t('finance.pnl.analysis.highCogs', { percentage: ((calculatePnL.estimatedCOGS / calculatePnL.revenue) * 100).toFixed(0) })}
                      </li>
                    )}
                    <li>
                      {t('finance.pnl.analysis.trackExpenses')}
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Money Out View */}
        {viewMode === 'moneyout' && (
          <div className="card">
            <div className="card-header">
              <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Banknote size={20} />
                Rekod Pengeluaran Tunai (Money Out)
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <input
                  type="month"
                  className="form-input"
                  value={filterMonth}
                  onChange={(e) => setFilterMonth(e.target.value)}
                  style={{ width: 'auto' }}
                />
                <button
                  className="btn btn-sm btn-outline"
                  onClick={loadPayouts}
                  disabled={payoutsLoading}
                >
                  {payoutsLoading ? 'Loading...' : 'Refresh'}
                </button>
              </div>
            </div>

            <MoneyOutTable
              payouts={filteredPayouts}
              loading={payoutsLoading}
            />
          </div>
        )}
      </div>

      {/* Add/Edit Expense Modal */}
      <Modal
        isOpen={modalType === 'add' || modalType === 'edit'}
        onClose={closeModal}
        title={modalType === 'add' ? t('finance.modals.addExpense') : t('finance.modals.editExpense')}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label className="form-label">{t('finance.modals.labels.date')}</label>
            <input
              type="date"
              className="form-input"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            />
          </div>
          <div>
            <label className="form-label">{t('finance.modals.labels.category')}</label>
            <select
              className="form-select"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value as ExpenseCategory })}
            >
              {EXPENSE_CATEGORIES.map(cat => (
                <option key={cat.value} value={cat.value}>{t(`finance.expenseCategories.${cat.value}`)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="form-label">{t('finance.modals.labels.amount')}</label>
            <input
              type="number"
              className="form-input"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
              placeholder={t('finance.modals.placeholders.amount')}
              step="0.01"
            />
          </div>
          <div>
            <label className="form-label">{t('finance.modals.labels.paymentMethod')}</label>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {PAYMENT_METHODS.map(method => (
                <button
                  key={method.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, paymentMethod: method.value as PaymentMethod })}
                  style={{
                    padding: '0.5rem 1rem',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--gray-300)',
                    background: formData.paymentMethod === method.value ? 'var(--primary)' : 'white',
                    color: formData.paymentMethod === method.value ? 'white' : 'var(--text-primary)',
                    cursor: 'pointer',
                    fontSize: '0.875rem'
                  }}
                >
                  {method.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="form-label">{t('finance.modals.labels.description')}</label>
            <input
              type="text"
              className="form-input"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder={t('finance.modals.placeholders.description')}
            />
          </div>
          <div>
            <label className="form-label">{t('finance.modals.labels.vendor')}</label>
            <input
              type="text"
              className="form-input"
              value={formData.vendor}
              onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
              placeholder={t('finance.modals.placeholders.vendor')}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
            <button
              className="btn btn-outline"
              onClick={closeModal}
              disabled={isProcessing}
            >
              {t('finance.actions.cancel')}
            </button>
            <button
              className="btn btn-primary"
              onClick={modalType === 'add' ? handleAddExpense : handleEditExpense}
              disabled={isProcessing}
            >
              {isProcessing ? t('finance.actions.processing') : (modalType === 'add' ? t('finance.actions.add') : t('finance.actions.save'))}
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={modalType === 'delete'}
        onClose={closeModal}
        onConfirm={handleDeleteExpense}
        title={t('finance.modals.deleteExpense')}
        message={
          <span dangerouslySetInnerHTML={{ __html: t('finance.modals.deleteConfirm', { description: selectedExpense?.description || '' }) }} />
        }
        confirmText={t('finance.actions.delete')}
        cancelText={t('finance.actions.cancel')}
        type="danger"
      />

      {/* Cash Flow Modal */}
      <Modal
        isOpen={modalType === 'cashflow'}
        onClose={closeModal}
        title={t('finance.modals.cashFlow')}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="form-group mb-4">
            <label className="form-label">{t('finance.modals.labels.openingCash')}</label>
            <div className="input-group">
              <span className="input-group-text">BND</span>
              <input
                type="number"
                className="form-input"
                value={cashFlowData.openingCash}
                onChange={(e) => setCashFlowData({ ...cashFlowData, openingCash: parseFloat(e.target.value) || 0 })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="form-group">
              <label className="form-label">{t('finance.modals.labels.salesCash')}</label>
              <div className="input-group">
                <span className="input-group-text">BND</span>
                <input
                  type="number"
                  className="form-input"
                  value={cashFlowData.salesCash}
                  onChange={(e) => setCashFlowData({ ...cashFlowData, salesCash: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">{t('finance.modals.labels.salesCard')}</label>
              <div className="input-group">
                <span className="input-group-text">BND</span>
                <input
                  type="number"
                  className="form-input"
                  value={cashFlowData.salesCard}
                  onChange={(e) => setCashFlowData({ ...cashFlowData, salesCard: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="form-group">
              <label className="form-label">{t('finance.modals.labels.salesEwallet')}</label>
              <div className="input-group">
                <span className="input-group-text">BND</span>
                <input
                  type="number"
                  className="form-input"
                  value={cashFlowData.salesEwallet}
                  onChange={(e) => setCashFlowData({ ...cashFlowData, salesEwallet: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">{t('finance.modals.labels.expensesCash')}</label>
              <div className="input-group">
                <span className="input-group-text">BND</span>
                <input
                  type="number"
                  className="form-input"
                  value={cashFlowData.expensesCash}
                  onChange={(e) => setCashFlowData({ ...cashFlowData, expensesCash: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <small className="text-secondary">{t('finance.modals.labels.pettyCashNote')}</small>
            </div>
          </div>

          <div className="p-4 bg-gray-50 rounded-lg mb-6">
            <div className="flex justify-between items-center mb-2">
              <span>{t('finance.modals.labels.closingCash')}</span>
              <span className="text-xl font-bold text-success">
                BND {(cashFlowData.openingCash + cashFlowData.salesCash - cashFlowData.expensesCash).toFixed(2)}
              </span>
            </div>
            <small className="text-secondary">{t('finance.modals.labels.closingNote')}</small>
          </div>

          <div className="flex justify-end gap-2">
            <button className="btn btn-ghost" onClick={closeModal} disabled={isProcessing}>
              {t('finance.actions.cancel')}
            </button>
            <button className="btn btn-primary" onClick={handleSaveCashFlow} disabled={isProcessing}>
              {isProcessing ? <LoadingSpinner size="sm" color="white" /> : t('finance.actions.save')}
            </button>
          </div>
        </div>
      </Modal>

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
