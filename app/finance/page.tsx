'use client';

import { useState, useMemo, useCallback } from 'react';
import MainLayout from '@/components/MainLayout';
import { useFinance, useInventory, useStaffPortal } from '@/lib/store';
import { useExpensesRealtime, useCashFlowsRealtime, useClaimRequestsRealtime } from '@/lib/supabase/realtime-hooks';
import { useTranslation } from '@/lib/contexts/LanguageContext';
import { Expense, ExpenseCategory, PaymentMethod, ClaimRequest } from '@/lib/types';
import { EXPENSE_CATEGORIES, PAYMENT_METHODS, getCategoryLabel, getCategoryColor } from '@/lib/finance-data';
import Modal from '@/components/Modal';
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
  Clock
} from 'lucide-react';
import StatCard from '@/components/StatCard';
import { exportToCSV, type ExportColumn } from '@/lib/services';
import { useToast } from '@/lib/contexts/ToastContext';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

type ModalType = 'add' | 'edit' | 'delete' | 'cashflow' | null;
type ViewMode = 'expenses' | 'cashflow' | 'pnl' | 'claims';

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
    isInitialized
  } = useFinance();
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

  const closeModal = () => {
    setModalType(null);
    setSelectedExpense(null);
    setIsProcessing(false);
  };

  const handleAddExpense = async () => {
    if (!formData.description.trim() || formData.amount <= 0) {
      alert('Sila masukkan keterangan dan jumlah yang sah');
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
  };

  const handleEditExpense = async () => {
    if (!selectedExpense || !formData.description.trim() || formData.amount <= 0) {
      alert('Sila masukkan keterangan dan jumlah yang sah');
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
  };

  const handleDeleteExpense = async () => {
    if (!selectedExpense) return;

    setIsProcessing(true);
    await new Promise(resolve => setTimeout(resolve, 500));

    deleteExpense(selectedExpense.id);
    closeModal();
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
  };

  const handlePayClaim = async (claim: ClaimRequest) => {
    if (confirm(`Sahkan pembayaran tuntutan RM${claim.amount} kepada ${claim.staffName}?`)) {
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
    }
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
          category: getCategoryLabel(e.category),
          description: e.description,
          amount: e.amount,
          vendor: e.vendor || '-',
          paymentMethod: e.paymentMethod
        }));
        columns = [
          { key: 'date', label: 'Tarikh' },
          { key: 'category', label: 'Kategori' },
          { key: 'description', label: 'Keterangan' },
          { key: 'amount', label: 'Jumlah (BND)', format: 'currency' },
          { key: 'vendor', label: 'Vendor' },
          { key: 'paymentMethod', label: 'Bayaran' }
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
          { key: 'date', label: 'Tarikh' },
          { key: 'opening', label: 'Buka (BND)', format: 'currency' },
          { key: 'salesCash', label: 'Jualan Tunai (BND)', format: 'currency' },
          { key: 'salesCard', label: 'Jualan Kad (BND)', format: 'currency' },
          { key: 'expenses', label: 'Belanja (BND)', format: 'currency' },
          { key: 'closing', label: 'Tutup (BND)', format: 'currency' }
        ];
        filename = `cashflow_${filterMonth}`;
      } else if (viewMode === 'pnl') {
        const pnl = calculatePnL;
        data = [
          { item: 'Hasil Jualan', amount: pnl.revenue },
          { item: 'Kos Bahan Mentah (COGS)', amount: -pnl.estimatedCOGS },
          { item: 'Untung Kasar', amount: pnl.grossProfit },
          ...Object.entries(pnl.expenses).filter(([k]) => k !== 'ingredients').map(([k, v]) => ({
            item: `Belanja: ${getCategoryLabel(k as ExpenseCategory)}`, amount: -(v as number)
          })),
          { item: 'Jumlah Perbelanjaan', amount: -pnl.totalExpenses },
          { item: 'Untung/Rugi Bersih', amount: pnl.netProfit },
          { item: 'Margin Keuntungan (%)', amount: pnl.profitMargin }
        ];
        columns = [
          { key: 'item', label: 'Perkara' },
          { key: 'amount', label: 'Jumlah (BND)', format: 'currency' }
        ];
        filename = `pnl_${filterMonth}`;
      }

      if (data.length > 0) {
        exportToCSV({ filename, columns, data, includeTimestamp: true });
        showToast('Berjaya export CSV', 'success');
      }
    } catch (e) {
      console.error(e);
      showToast('Gagal export CSV', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportPDF = () => {
    setIsExporting(true);
    try {
      const doc = new jsPDF();

      doc.setFontSize(18);
      doc.text(viewMode === 'pnl' ? 'Penyata Untung & Rugi' : viewMode === 'cashflow' ? 'Laporan Aliran Tunai' : 'Laporan Perbelanjaan', 14, 20);
      doc.setFontSize(12);
      doc.text(`Bulan: ${filterMonth}`, 14, 30);
      doc.text(`Dicetak: ${new Date().toLocaleString()}`, 14, 36);

      if (viewMode === 'expenses') {
        autoTable(doc, {
          startY: 45,
          head: [['Tarikh', 'Kategori', 'Keterangan', 'Jumlah', 'Vendor']],
          body: filteredExpenses.map(e => [
            e.date,
            getCategoryLabel(e.category),
            e.description,
            `BND ${e.amount.toFixed(2)}`,
            e.vendor || '-'
          ]),
          foot: [['', '', 'JUMLAH', `BND ${monthlyExpenseTotal.toFixed(2)}`, '']],
        });
      } else if (viewMode === 'cashflow') {
        autoTable(doc, {
          startY: 45,
          head: [['Tarikh', 'Buka', 'Jualan Tunai', 'Jualan Kad', 'Belanja', 'Tutup']],
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
          head: [['Perkara', 'Jumlah (BND)']],
          body: [
            ['Hasil Jualan', pnl.revenue.toFixed(2)],
            ['(-) Kos Bahan Mentah', pnl.estimatedCOGS.toFixed(2)],
            ['= Untung Kasar', pnl.grossProfit.toFixed(2)],
            [{ content: 'Perbelanjaan Operasi:', colSpan: 2, styles: { fillColor: [240, 240, 240], fontStyle: 'bold' } }],
            ...Object.entries(pnl.expenses).filter(([k]) => k !== 'ingredients').map(([k, v]) => [
              `   ${getCategoryLabel(k as ExpenseCategory)}`, (v as number).toFixed(2)
            ]),
            ['(-) Jumlah Perbelanjaan', pnl.totalExpenses.toFixed(2)],
            ['= Untung/Rugi Bersih', { content: pnl.netProfit.toFixed(2), styles: { fontStyle: 'bold', textColor: pnl.netProfit >= 0 ? [0, 128, 0] : [255, 0, 0] } }],
            ['Margin Keuntungan', `${pnl.profitMargin.toFixed(1)}%`]
          ]
        });
      }

      doc.save(`finance_report_${viewMode}_${filterMonth}.pdf`);
      showToast('Berjaya export PDF', 'success');

    } catch (e) {
      console.error(e);
      showToast('Gagal export PDF', 'error');
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
                  <Download size={16} /> CSV
                </button>
                <button
                  className="btn btn-sm btn-outline"
                  onClick={handleExportPDF}
                  disabled={isExporting}
                >
                  <FileText size={16} /> PDF
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
            Perbelanjaan
          </button>
          <button
            onClick={() => setViewMode('cashflow')}
            className={`btn btn-sm ${viewMode === 'cashflow' ? 'btn-primary' : 'btn-outline'}`}
          >
            <Wallet size={16} />
            Cash Flow
          </button>
          <button
            onClick={() => setViewMode('pnl')}
            className={`btn btn-sm ${viewMode === 'pnl' ? 'btn-primary' : 'btn-outline'}`}
          >
            <FileText size={16} />
            P&L Statement
          </button>
        </div>

        {/* Stats Cards */}
        <div className="content-grid cols-4 mb-lg">
          <StatCard
            label="Jualan Bulan Ini"
            value={`BND ${monthlyRevenue.toFixed(2)}`}
            change="pendapatan keseluruhan"
            changeType="positive"
            icon={TrendingUp}
            gradient="sunset"
          />
          <StatCard
            label="Perbelanjaan Bulan Ini"
            value={`BND ${monthlyExpenseTotal.toFixed(2)}`}
            change="kos operasi"
            changeType="neutral"
            icon={Receipt}
            gradient="warning"
          />
          <StatCard
            label="Untung/Rugi Bersih"
            value={`BND ${calculatePnL.netProfit.toFixed(2)}`}
            change={calculatePnL.netProfit >= 0 ? "keuntungan" : "kerugian"}
            changeType={calculatePnL.netProfit >= 0 ? "positive" : "negative"}
            icon={calculatePnL.netProfit >= 0 ? TrendingUp : TrendingDown}
            gradient="primary"
          />
          <StatCard
            label="Margin Keuntungan"
            value={`${calculatePnL.profitMargin.toFixed(1)}%`}
            change={calculatePnL.profitMargin >= 20 ? "sihat" : calculatePnL.profitMargin >= 10 ? "sederhana" : "rendah"}
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
                    Senarai Perbelanjaan
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
                      <option value="all">Semua Kategori</option>
                      {EXPENSE_CATEGORIES.map(cat => (
                        <option key={cat.value} value={cat.value}>{cat.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {filteredExpenses.length > 0 ? (
                  <div style={{ overflowX: 'auto', maxWidth: '100%' }}>
                    <table className="table" style={{ minWidth: '600px' }}>
                      <thead>
                        <tr>
                          <th>Tarikh</th>
                          <th>Kategori</th>
                          <th>Keterangan</th>
                          <th>Jumlah</th>
                          <th>Bayaran</th>
                          <th>Tindakan</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredExpenses.map(expense => (
                          <tr key={expense.id}>
                            <td style={{ fontSize: '0.875rem' }}>
                              {new Date(expense.date).toLocaleDateString('ms-MY')}
                            </td>
                            <td>
                              <span
                                style={{
                                  padding: '0.25rem 0.5rem',
                                  borderRadius: 'var(--radius-sm)',
                                  fontSize: '0.75rem',
                                  fontWeight: 600,
                                  background: `${getCategoryColor(expense.category)}20`,
                                  color: getCategoryColor(expense.category),
                                }}
                              >
                                {getCategoryLabel(expense.category)}
                              </span>
                            </td>
                            <td>
                              <div style={{ fontWeight: 600 }}>{expense.description}</div>
                              {expense.vendor && (
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                  {expense.vendor}
                                </div>
                              )}
                            </td>
                            <td style={{ fontWeight: 700, color: 'var(--danger)' }}>
                              BND {expense.amount.toFixed(2)}
                            </td>
                            <td style={{ fontSize: '0.875rem', textTransform: 'capitalize' }}>
                              {PAYMENT_METHODS.find(p => p.value === expense.paymentMethod)?.label}
                            </td>
                            <td>
                              <div style={{ display: 'flex', gap: '0.25rem' }}>
                                <button
                                  className="btn btn-sm btn-outline"
                                  onClick={() => openEditModal(expense)}
                                  style={{ padding: '0.25rem 0.5rem' }}
                                >
                                  <Edit2 size={14} />
                                </button>
                                <button
                                  className="btn btn-sm btn-outline"
                                  onClick={() => openDeleteModal(expense)}
                                  style={{ padding: '0.25rem 0.5rem', color: 'var(--danger)' }}
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem' }}>
                    Tiada perbelanjaan untuk bulan ini
                  </p>
                )}

                {filteredExpenses.length > 0 && (
                  <div style={{
                    marginTop: '1rem',
                    paddingTop: '1rem',
                    borderTop: '2px solid var(--gray-200)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <span style={{ fontWeight: 600 }}>Jumlah:</span>
                    <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--danger)' }}>
                      BND {monthlyExpenseTotal.toFixed(2)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Expense by Category */}
            <div>
              <div className="card">
                <div className="card-header">
                  <div className="card-title">Mengikut Kategori</div>
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
                              {getCategoryLabel(category as ExpenseCategory)}
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
                            {percentage.toFixed(1)}% daripada jumlah
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '1rem' }}>
                    Tiada data
                  </p>
                )}
              </div>

              {/* Today's Summary */}
              <div className="card" style={{ marginTop: '1.5rem' }}>
                <div className="card-header">
                  <div className="card-title">Hari Ini</div>
                  <div className="card-subtitle">{new Date().toLocaleDateString('ms-MY')}</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Perbelanjaan</span>
                    <span style={{ fontWeight: 600, color: 'var(--danger)' }}>
                      BND {todayExpenseTotal.toFixed(2)}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Baki Tunai</span>
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
                <div className="card-title">Cash Flow Harian</div>
                <div className="card-subtitle">7 hari terakhir</div>
              </div>
              <div className="table-responsive">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Tarikh</th>
                      <th>Pembukaan</th>
                      <th>Jualan Tunai</th>
                      <th>Jualan Kad</th>
                      <th>Perbelanjaan</th>
                      <th>Penutup</th>
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
                <div className="card-title">Ringkasan Aliran Tunai</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ padding: '1rem', background: 'var(--gray-100)', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                    Jumlah Jualan Tunai (7 hari)
                  </div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--success)' }}>
                    BND {cashFlows.slice(0, 7).reduce((sum, cf) => sum + cf.salesCash, 0).toFixed(2)}
                  </div>
                </div>
                <div style={{ padding: '1rem', background: 'var(--gray-100)', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                    Jumlah Jualan Kad/E-Wallet (7 hari)
                  </div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--primary)' }}>
                    BND {cashFlows.slice(0, 7).reduce((sum, cf) => sum + cf.salesCard + cf.salesEwallet, 0).toFixed(2)}
                  </div>
                </div>
                <div style={{ padding: '1rem', background: 'var(--gray-100)', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                    Jumlah Perbelanjaan Tunai (7 hari)
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
                <div className="card-title">Penyata Untung Rugi</div>
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
                    <span style={{ fontWeight: 600, color: '#065f46' }}>Hasil Jualan</span>
                    <span style={{ fontSize: '1.25rem', fontWeight: 700, color: '#065f46' }}>
                      BND {calculatePnL.revenue.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* COGS */}
                <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--gray-200)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Kos Bahan Mentah (COGS)</span>
                    <span style={{ color: 'var(--danger)' }}>- BND {calculatePnL.estimatedCOGS.toFixed(2)}</span>
                  </div>
                </div>

                {/* Gross Profit */}
                <div style={{ padding: '0.75rem 1rem', background: 'var(--gray-100)', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: 600 }}>Untung Kasar</span>
                    <span style={{ fontWeight: 700 }}>BND {calculatePnL.grossProfit.toFixed(2)}</span>
                  </div>
                </div>

                {/* Operating Expenses */}
                <div style={{ marginTop: '0.5rem' }}>
                  <div style={{ fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>
                    Perbelanjaan Operasi:
                  </div>
                  {Object.entries(calculatePnL.expenses)
                    .filter(([cat]) => cat !== 'ingredients')
                    .map(([category, amount]) => (
                      <div key={category} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 1rem' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>{getCategoryLabel(category as ExpenseCategory)}</span>
                        <span style={{ color: 'var(--danger)' }}>- BND {amount.toFixed(2)}</span>
                      </div>
                    ))}
                </div>

                {/* Total Expenses */}
                <div style={{ padding: '0.75rem 1rem', borderTop: '1px solid var(--gray-200)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: 600 }}>Jumlah Perbelanjaan</span>
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
                      Untung/Rugi Bersih
                    </span>
                    <span style={{ fontSize: '1.5rem', fontWeight: 700, color: calculatePnL.netProfit >= 0 ? '#1e40af' : '#991b1b' }}>
                      BND {calculatePnL.netProfit.toFixed(2)}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.875rem', marginTop: '0.5rem', color: 'var(--text-secondary)' }}>
                    Margin: {calculatePnL.profitMargin.toFixed(1)}%
                  </div>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <div className="card-title">Analisis</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {calculatePnL.netProfit >= 0 ? (
                  <div className="alert alert-success">
                    Tahniah! Kedai anda untung BND {calculatePnL.netProfit.toFixed(2)} bulan ini.
                  </div>
                ) : (
                  <div className="alert alert-danger">
                    Perhatian! Kedai anda rugi BND {Math.abs(calculatePnL.netProfit).toFixed(2)} bulan ini.
                  </div>
                )}

                <div style={{ padding: '1rem', background: 'var(--gray-100)', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ fontWeight: 600, marginBottom: '0.75rem' }}>Cadangan:</div>
                  <ul style={{ paddingLeft: '1.25rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                    {calculatePnL.profitMargin < 20 && (
                      <li style={{ marginBottom: '0.5rem' }}>
                        Margin keuntungan rendah. Pertimbangkan untuk naikkan harga atau kurangkan kos.
                      </li>
                    )}
                    {calculatePnL.estimatedCOGS / calculatePnL.revenue > 0.4 && (
                      <li style={{ marginBottom: '0.5rem' }}>
                        Kos bahan mentah tinggi ({((calculatePnL.estimatedCOGS / calculatePnL.revenue) * 100).toFixed(0)}% daripada jualan). Cari supplier lebih murah.
                      </li>
                    )}
                    <li>
                      Track semua perbelanjaan dengan teliti untuk analisis yang lebih tepat.
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Add/Edit Expense Modal */}
        <Modal
          isOpen={modalType === 'add' || modalType === 'edit'}
          onClose={closeModal}
          title={modalType === 'add' ? 'Tambah Perbelanjaan' : 'Edit Perbelanjaan'}
          maxWidth="500px"
        >
          <div className="form-group">
            <label className="form-label">Tarikh *</label>
            <input
              type="date"
              className="form-input"
              value={formData.date}
              onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-2" style={{ gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Kategori *</label>
              <select
                className="form-select"
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value as ExpenseCategory }))}
              >
                {EXPENSE_CATEGORIES.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Cara Bayaran *</label>
              <select
                className="form-select"
                value={formData.paymentMethod}
                onChange={(e) => setFormData(prev => ({ ...prev, paymentMethod: e.target.value as PaymentMethod }))}
              >
                {PAYMENT_METHODS.map(pm => (
                  <option key={pm.value} value={pm.value}>{pm.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Jumlah (BND) *</label>
            <input
              type="number"
              className="form-input"
              value={formData.amount}
              onChange={(e) => setFormData(prev => ({ ...prev, amount: Number(e.target.value) }))}
              min="0"
              step="0.01"
              placeholder="0.00"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Keterangan *</label>
            <input
              type="text"
              className="form-input"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Contoh: Ayam 10kg"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Vendor/Supplier (Optional)</label>
            <input
              type="text"
              className="form-input"
              value={formData.vendor}
              onChange={(e) => setFormData(prev => ({ ...prev, vendor: e.target.value }))}
              placeholder="Contoh: Supplier Ali"
            />
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.5rem' }}>
            <button className="btn btn-outline" onClick={closeModal} disabled={isProcessing} style={{ flex: 1 }}>
              Batal
            </button>
            <button
              className="btn btn-primary"
              onClick={modalType === 'add' ? handleAddExpense : handleEditExpense}
              disabled={isProcessing}
              style={{ flex: 1 }}
            >
              {isProcessing ? <><LoadingSpinner size="sm" /> Memproses...</> : modalType === 'add' ? 'Tambah' : 'Simpan'}
            </button>
          </div>
        </Modal>

        {/* Delete Confirmation Modal */}
        <Modal
          isOpen={modalType === 'delete'}
          onClose={closeModal}
          title="Padam Perbelanjaan"
          maxWidth="400px"
        >
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <div style={{
              width: '60px',
              height: '60px',
              background: '#fee2e2',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem'
            }}>
              <Trash2 size={28} color="var(--danger)" />
            </div>
            <p style={{ color: 'var(--text-secondary)' }}>
              Anda pasti mahu padam perbelanjaan <strong>{selectedExpense?.description}</strong>?
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn btn-outline" onClick={closeModal} disabled={isProcessing} style={{ flex: 1 }}>
              Batal
            </button>
            <button className="btn btn-danger" onClick={handleDeleteExpense} disabled={isProcessing} style={{ flex: 1 }}>
              {isProcessing ? <><LoadingSpinner size="sm" /> Memproses...</> : 'Padam'}
            </button>
          </div>
        </Modal>

        {/* Cash Flow Modal */}
        <Modal
          isOpen={modalType === 'cashflow'}
          onClose={closeModal}
          title="Cash Flow Hari Ini"
          subtitle={new Date().toLocaleDateString('ms-MY')}
          maxWidth="450px"
        >
          <div className="form-group">
            <label className="form-label">Tunai Pembukaan (BND)</label>
            <input
              type="number"
              className="form-input"
              value={cashFlowData.openingCash}
              onChange={(e) => setCashFlowData(prev => ({ ...prev, openingCash: Number(e.target.value) }))}
              min="0"
              step="0.01"
            />
          </div>

          <div className="grid grid-cols-2" style={{ gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Jualan Tunai (BND)</label>
              <input
                type="number"
                className="form-input"
                value={cashFlowData.salesCash}
                onChange={(e) => setCashFlowData(prev => ({ ...prev, salesCash: Number(e.target.value) }))}
                min="0"
                step="0.01"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Jualan Kad (BND)</label>
              <input
                type="number"
                className="form-input"
                value={cashFlowData.salesCard}
                onChange={(e) => setCashFlowData(prev => ({ ...prev, salesCard: Number(e.target.value) }))}
                min="0"
                step="0.01"
              />
            </div>
          </div>

          <div className="grid grid-cols-2" style={{ gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Jualan E-Wallet (BND)</label>
              <input
                type="number"
                className="form-input"
                value={cashFlowData.salesEwallet}
                onChange={(e) => setCashFlowData(prev => ({ ...prev, salesEwallet: Number(e.target.value) }))}
                min="0"
                step="0.01"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Perbelanjaan Tunai (BND)</label>
              <input
                type="number"
                className="form-input"
                value={cashFlowData.expensesCash}
                onChange={(e) => setCashFlowData(prev => ({ ...prev, expensesCash: Number(e.target.value) }))}
                min="0"
                step="0.01"
              />
            </div>
          </div>

          <div style={{
            padding: '1rem',
            background: 'var(--gray-100)',
            borderRadius: 'var(--radius-md)',
            marginTop: '1rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 600 }}>Tunai Penutup:</span>
              <span style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--success)' }}>
                BND {(cashFlowData.openingCash + cashFlowData.salesCash - cashFlowData.expensesCash).toFixed(2)}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.5rem' }}>
            <button className="btn btn-outline" onClick={closeModal} disabled={isProcessing} style={{ flex: 1 }}>
              Batal
            </button>
            <button className="btn btn-primary" onClick={handleSaveCashFlow} disabled={isProcessing} style={{ flex: 1 }}>
              {isProcessing ? <><LoadingSpinner size="sm" /> Menyimpan...</> : 'Simpan'}
            </button>
          </div>
        </Modal>
      </div>
    </MainLayout>
  );
}

