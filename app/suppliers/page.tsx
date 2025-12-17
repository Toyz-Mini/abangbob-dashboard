'use client';

import { useState, useMemo, useEffect } from 'react';
import MainLayout from '@/components/MainLayout';
import { useSuppliers } from '@/lib/store';
import { useSuppliersRealtime } from '@/lib/supabase/realtime-hooks';
import { useCallback } from 'react';
import { Supplier, PurchaseOrder, PurchaseOrderItem, SupplierAccountNumber } from '@/lib/types';
import Modal from '@/components/Modal';
import LoadingSpinner from '@/components/LoadingSpinner';
import {
  Boxes,
  Plus,
  Edit2,
  Trash2,
  FileText,
  Phone,
  Mail,
  Star,
  Clock,
  ShoppingCart,
  AlertTriangle,
  CheckCircle,
  Send,
  CreditCard,
  X,
  Printer,
} from 'lucide-react';

type ModalType = 'add-supplier' | 'edit-supplier' | 'delete-supplier' | 'create-po' | 'view-po' | null;
type ViewMode = 'suppliers' | 'orders' | 'reorder';

const PAYMENT_TERMS = [
  { value: 'cod', label: 'COD (Cash on Delivery)' },
  { value: 'net7', label: 'Net 7 Hari' },
  { value: 'net14', label: 'Net 14 Hari' },
  { value: 'net30', label: 'Net 30 Hari' },
];

export default function SuppliersPage() {
  const {
    suppliers,
    purchaseOrders,
    inventory,
    addSupplier,
    updateSupplier,
    deleteSupplier,
    addPurchaseOrder,
    updatePurchaseOrderStatus,
    refreshSuppliers,
    refreshPurchaseOrders,
    isInitialized
  } = useSuppliers();

  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);



  const handleSuppliersChange = useCallback(() => {
    refreshSuppliers();
    refreshPurchaseOrders();
  }, [refreshSuppliers, refreshPurchaseOrders]);

  useSuppliersRealtime(handleSuppliersChange);

  const [viewMode, setViewMode] = useState<ViewMode>('suppliers');
  const [modalType, setModalType] = useState<ModalType>(null);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Supplier form
  const [supplierForm, setSupplierForm] = useState({
    name: '',
    contactPerson: '',
    phone: '',
    email: '',
    address: '',
    accountNumbers: [] as SupplierAccountNumber[],
    paymentTerms: 'cod' as 'cod' | 'net7' | 'net14' | 'net30',
    leadTimeDays: 1,
    status: 'active' as 'active' | 'inactive',
    notes: '',
  });

  // PO form
  const [poForm, setPoForm] = useState({
    supplierId: '',
    items: [] as { stockItemId: string; stockItemName: string; quantity: number; unit: string; unitPrice: number }[],
    notes: '',
    expectedDelivery: '',
  });

  // Get low stock items for reorder suggestions
  const lowStockItems = useMemo(() => {
    return (inventory || []).filter(item => item?.currentQuantity <= item?.minQuantity);
  }, [inventory]);

  // Filter suppliers
  const filteredSuppliers = (suppliers || []).filter(s =>
    (s?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s?.contactPerson || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Filter POs by status
  const pendingPOs = (purchaseOrders || []).filter(po => ['draft', 'sent', 'confirmed'].includes(po?.status));
  const completedPOs = (purchaseOrders || []).filter(po => po?.status === 'received');

  const openAddSupplierModal = () => {
    setSupplierForm({
      name: '',
      contactPerson: '',
      phone: '',
      email: '',
      address: '',
      accountNumbers: [],
      paymentTerms: 'cod',
      leadTimeDays: 1,
      status: 'active',
      notes: '',
    });
    setModalType('add-supplier');
  };

  const openEditSupplierModal = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setSupplierForm({
      name: supplier.name,
      contactPerson: supplier.contactPerson,
      phone: supplier.phone,
      email: supplier.email || '',
      address: supplier.address || '',
      accountNumbers: supplier.accountNumbers || [],
      paymentTerms: supplier.paymentTerms,
      leadTimeDays: supplier.leadTimeDays,
      status: supplier.status,
      notes: supplier.notes || '',
    });
    setModalType('edit-supplier');
  };

  const openDeleteSupplierModal = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setModalType('delete-supplier');
  };

  const openCreatePOModal = (supplierId?: string) => {
    const firstSupplierId = (suppliers && suppliers.length > 0) ? suppliers[0]?.id : '';
    setPoForm({
      supplierId: supplierId || firstSupplierId || '',
      items: [],
      notes: '',
      expectedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    });
    setModalType('create-po');
  };

  const openViewPOModal = (po: PurchaseOrder) => {
    setSelectedPO(po);
    setModalType('view-po');
  };

  const closeModal = () => {
    setModalType(null);
    setSelectedSupplier(null);
    setSelectedPO(null);
    setIsProcessing(false);
  };

  const handlePrintPO = (po: PurchaseOrder) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>PO #${po.poNumber}</title>
          <style>
            body { font-family: sans-serif; padding: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            .header { margin-bottom: 30px; }
            .total { margin-top: 20px; text-align: right; font-weight: bold; font-size: 1.2em; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Purchase Order</h1>
            <p><strong>PO Number:</strong> ${po.poNumber}</p>
            <p><strong>Supplier:</strong> ${po.supplierName}</p>
            <p><strong>Date:</strong> ${new Date(po.createdAt).toLocaleDateString()}</p>
            <p><strong>Status:</strong> ${po.status.toUpperCase()}</p>
          </div>
          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th>Quantity</th>
                <th>Unit Price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${po.items.map(item => `
                <tr>
                  <td>${item.stockItemName}</td>
                  <td>${item.quantity} ${item.unit}</td>
                  <td>BND ${item.unitPrice.toFixed(2)}</td>
                  <td>BND ${item.totalPrice.toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div class="total">
            TOTAL: BND ${po.total.toFixed(2)}
          </div>
          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleWhatsAppPO = (po: PurchaseOrder) => {
    const supplier = (suppliers || []).find(s => s.id === po.supplierId);
    if (!supplier) return;

    const message = `*PURCHASE ORDER #${po.poNumber}*
    
Hi ${supplier.contactPerson},

I would like to place an order:

${(po.items || []).map(i => `- ${i.stockItemName}: ${i.quantity} ${i.unit}`).join('\n')}

*Total Amount: BND ${(po.total || 0).toFixed(2)}*

Please confirm. Thank you!`;

    const encodedMessage = encodeURIComponent(message);
    const phone = (supplier.phone || '').replace(/\D/g, ''); // Remove non-digits
    window.open(`https://wa.me/${phone}?text=${encodedMessage}`, '_blank');
  };

  const handleEmailPO = (po: PurchaseOrder) => {
    const supplier = (suppliers || []).find(s => s.id === po.supplierId);
    if (!supplier?.email) {
      alert('Tiada email untuk supplier ini');
      return;
    }

    const subject = `Purchase Order - ${po.poNumber}`;
    const body = `Hi ${supplier.contactPerson},

Please find our purchase order details below:

PO Number: ${po.poNumber}
Total Amount: BND ${po.total.toFixed(2)}

Items:
${po.items.map(i => `- ${i.stockItemName}: ${i.quantity} ${i.unit} @ BND ${i.unitPrice}`).join('%0D%0A')}

Thank you.`;

    window.open(`mailto:${supplier.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
  };

  const handleAddSupplier = async () => {
    if (!supplierForm.name.trim() || !supplierForm.phone.trim()) {
      alert('Sila masukkan nama dan nombor telefon');
      return;
    }

    setIsProcessing(true);
    await new Promise(resolve => setTimeout(resolve, 500));

    addSupplier({
      name: supplierForm.name.trim(),
      contactPerson: supplierForm.contactPerson.trim(),
      phone: supplierForm.phone.trim(),
      email: supplierForm.email.trim() || undefined,
      address: supplierForm.address.trim() || undefined,
      accountNumbers: supplierForm.accountNumbers.length > 0 ? supplierForm.accountNumbers : undefined,
      paymentTerms: supplierForm.paymentTerms,
      leadTimeDays: supplierForm.leadTimeDays,
      status: supplierForm.status,
      notes: supplierForm.notes.trim() || undefined,
    });

    closeModal();
  };

  const handleEditSupplier = async () => {
    if (!selectedSupplier || !supplierForm.name.trim()) return;

    setIsProcessing(true);
    await new Promise(resolve => setTimeout(resolve, 500));

    updateSupplier(selectedSupplier.id, {
      name: supplierForm.name.trim(),
      contactPerson: supplierForm.contactPerson.trim(),
      phone: supplierForm.phone.trim(),
      email: supplierForm.email.trim() || undefined,
      address: supplierForm.address.trim() || undefined,
      accountNumbers: supplierForm.accountNumbers.length > 0 ? supplierForm.accountNumbers : undefined,
      paymentTerms: supplierForm.paymentTerms,
      leadTimeDays: supplierForm.leadTimeDays,
      status: supplierForm.status,
      notes: supplierForm.notes.trim() || undefined,
    });

    closeModal();
  };

  const handleDeleteSupplier = async () => {
    if (!selectedSupplier) return;

    setIsProcessing(true);
    await new Promise(resolve => setTimeout(resolve, 500));

    deleteSupplier(selectedSupplier.id);
    closeModal();
  };

  const addItemToPO = (stockItem: { id: string; name: string; unit: string; cost: number }) => {
    const existing = poForm.items.find(i => i.stockItemId === stockItem.id);
    if (existing) {
      setPoForm(prev => ({
        ...prev,
        items: prev.items.map(i =>
          i.stockItemId === stockItem.id
            ? { ...i, quantity: i.quantity + 1 }
            : i
        )
      }));
    } else {
      // Price Watch: Check if price has increased
      if (stockItem.cost > 0 && stockItem.cost * 1.1 < stockItem.cost) { // Wait, logic should be: if new cost > old cost * 1.1
        // Actually, the `stockItem` passed here IS the inventory item with the old cost. 
        // But `addItemToPO` uses `stockItem.cost` as the default `unitPrice` for the PO.
        // So a warning only makes sense if the USER changes the price manually later, OR if we had a separate "Supplier Price List" which we don't.
        // However, the user might be manually setting the price in the form? No, `addItemToPO` takes `cost`.

        // Let's refine: The requirement is "If new price is > 10% higher than last collected cost". 
        // Since `addItemToPO` defaults to current `stockItem.cost`, the variance happens if the user EDITS the price in the form.
        // So I should add the warning in the RENDER logic of the table row in the modal.
      }

      setPoForm(prev => ({
        ...prev,
        items: [...prev.items, {
          stockItemId: stockItem.id,
          stockItemName: stockItem.name,
          quantity: 1,
          unit: stockItem.unit,
          unitPrice: stockItem.cost,
        }]
      }));
    }
  };

  const removeItemFromPO = (stockItemId: string) => {
    setPoForm(prev => ({
      ...prev,
      items: prev.items.filter(i => i.stockItemId !== stockItemId)
    }));
  };

  const updatePOItemQuantity = (stockItemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItemFromPO(stockItemId);
    } else {
      setPoForm(prev => ({
        ...prev,
        items: prev.items.map(i =>
          i.stockItemId === stockItemId ? { ...i, quantity } : i
        )
      }));
    }
  };

  const handleAutoFill = () => {
    if (!poForm.supplierId) {
      alert('Sila pilih supplier dahulu');
      return;
    }

    const selectedSupplier = (suppliers || []).find(s => s.id === poForm.supplierId);
    if (!selectedSupplier) return;

    const supplierItems = (inventory || []).filter(item =>
      // Filter by supplier name since StockItem only has 'supplier' string field
      // We match it against the selected supplier's name
      item?.supplier === selectedSupplier.name
    );

    const itemsToOrder = supplierItems.filter(item => item?.currentQuantity <= item?.minQuantity)
      .map(item => ({
        stockItemId: item.id,
        stockItemName: item.name,
        quantity: Math.max((item?.minQuantity || 1) * 2 - (item?.currentQuantity || 0), item?.minQuantity || 1), // Order enough to reach 2x min
        unit: item.unit,
        unitPrice: item?.cost || 0,
      }));

    if (itemsToOrder.length === 0) {
      alert('Tiada item dari supplier ini yang perlu di-restock.');
      return;
    }

    setPoForm(prev => ({
      ...prev,
      items: itemsToOrder
    }));
  };

  const handleCreatePO = async () => {
    if (!poForm.supplierId || poForm.items.length === 0) {
      alert('Sila pilih supplier dan tambah sekurang-kurangnya satu item');
      return;
    }

    setIsProcessing(true);
    await new Promise(resolve => setTimeout(resolve, 500));

    const supplier = (suppliers || []).find(s => s.id === poForm.supplierId);
    const items: PurchaseOrderItem[] = poForm.items.map(i => ({
      stockItemId: i.stockItemId,
      stockItemName: i.stockItemName,
      quantity: i.quantity,
      unit: i.unit,
      unitPrice: i.unitPrice,
      totalPrice: i.quantity * i.unitPrice,
    }));
    const subtotal = items.reduce((sum, i) => sum + i.totalPrice, 0);

    addPurchaseOrder({
      supplierId: poForm.supplierId,
      supplierName: supplier?.name || 'Unknown',
      items,
      subtotal,
      tax: 0,
      total: subtotal,
      status: 'draft',
      expectedDelivery: poForm.expectedDelivery || undefined,
      notes: poForm.notes.trim() || undefined,
    });

    closeModal();
  };

  const renderStarRating = (rating: number) => {
    return (
      <div style={{ display: 'flex', gap: '2px' }}>
        {[1, 2, 3, 4, 5].map(star => (
          <Star
            key={star}
            size={14}
            fill={star <= rating ? 'var(--warning)' : 'none'}
            color={star <= rating ? 'var(--warning)' : 'var(--gray-300)'}
          />
        ))}
      </div>
    );
  };

  if (!isMounted) return null;

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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem' }}>
              Pengurusan Supplier
            </h1>
            <p style={{ color: 'var(--text-secondary)' }}>
              Urus supplier dan purchase orders
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn btn-outline" onClick={() => openCreatePOModal()}>
              <ShoppingCart size={18} />
              Buat PO
            </button>
            <button className="btn btn-primary" onClick={openAddSupplierModal}>
              <Plus size={18} />
              Tambah Supplier
            </button>
          </div>
        </div>

        {/* Financial Dashboard Widgets */}
        <div className="grid grid-cols-1 md:grid-cols-3" style={{ gap: '1rem', marginBottom: '2rem' }}>
          {/* Total Spend This Month */}
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <div style={{ padding: '0.5rem', background: 'var(--primary-light)', borderRadius: '50%', color: 'var(--primary)' }}>
                <CreditCard size={20} />
              </div>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', fontWeight: 600 }}>BELANJA BULAN INI</div>
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>
              BND {useMemo(() => {
                const now = new Date();
                return (purchaseOrders || [])
                  .filter(po => {
                    if (!po?.createdAt) return false;
                    const d = new Date(po.createdAt);
                    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear() && po.status !== 'cancelled';
                  })
                  .reduce((sum, po) => sum + (po?.total || 0), 0)
                  .toFixed(2);
              }, [purchaseOrders])}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
              {(purchaseOrders || []).filter(po => po?.status === 'received' && po?.createdAt && new Date(po.createdAt).getMonth() === new Date().getMonth()).length} order diterima
            </div>
          </div>

          {/* Pending Payments (Net Terms) */}
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <div style={{ padding: '0.5rem', background: '#fee2e2', borderRadius: '50%', color: 'var(--danger)' }}>
                <Clock size={20} />
              </div>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', fontWeight: 600 }}>BAYARAN TERTUNGGAK</div>
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>
              BND {useMemo(() => {
                return (purchaseOrders || [])
                  .filter(po => po?.status === 'received') // Assuming received = invoice accepted
                  // In a real app we'd check if it's actually PAID. For now we just show total received "payable" value
                  // Or we can filter by terms logic
                  .reduce((sum, po) => sum + (po?.total || 0), 0)
                  .toFixed(2);
              }, [purchaseOrders])}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
              Items Received, Payment Pending
            </div>
          </div>

          {/* Top Supplier */}
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <div style={{ padding: '0.5rem', background: '#fef3c7', borderRadius: '50%', color: '#d97706' }}>
                <Star size={20} />
              </div>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', fontWeight: 600 }}>TOP SUPPLIER</div>
            </div>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {useMemo(() => {
                const spendBySupplier: Record<string, number> = {};
                (purchaseOrders || []).forEach(po => {
                  if (po?.status !== 'cancelled') {
                    spendBySupplier[po.supplierName] = (spendBySupplier[po.supplierName] || 0) + (po.total || 0);
                  }
                });
                const top = Object.entries(spendBySupplier).sort((a, b) => b[1] - a[1])[0];
                return top ? top[0] : '-';
              }, [purchaseOrders])}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
              Highest volume this month
            </div>
          </div>
        </div>

        {/* View Mode Tabs */}
        <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '0.5rem', borderBottom: '2px solid var(--gray-200)', paddingBottom: '0.5rem' }}>
          <button
            onClick={() => setViewMode('suppliers')}
            className={`btn btn-sm ${viewMode === 'suppliers' ? 'btn-primary' : 'btn-outline'}`}
          >
            <Boxes size={16} />
            Supplier ({suppliers.length})
          </button>
          <button
            onClick={() => setViewMode('orders')}
            className={`btn btn-sm ${viewMode === 'orders' ? 'btn-primary' : 'btn-outline'}`}
          >
            <FileText size={16} />
            Purchase Orders ({purchaseOrders.length})
          </button>
          <button
            onClick={() => setViewMode('reorder')}
            className={`btn btn-sm ${viewMode === 'reorder' ? 'btn-primary' : 'btn-outline'}`}
          >
            <AlertTriangle size={16} />
            Perlu Reorder ({lowStockItems.length})
          </button>
        </div>

        {/* Suppliers View */}
        {viewMode === 'suppliers' && (
          <>
            <div style={{ marginBottom: '1.5rem' }}>
              <input
                type="text"
                className="form-input"
                placeholder="Cari supplier..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ maxWidth: '300px' }}
              />
            </div>

            {filteredSuppliers.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3" style={{ gap: '1rem' }}>
                {filteredSuppliers.map(supplier => (
                  <div key={supplier.id} className="card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '0.25rem' }}>
                          {supplier.name}
                        </div>
                        <span className={`badge ${supplier.status === 'active' ? 'badge-success' : 'badge-warning'}`}>
                          {supplier.status === 'active' ? 'Aktif' : 'Tidak Aktif'}
                        </span>
                      </div>
                      {renderStarRating(supplier.rating)}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem', fontSize: '0.875rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Phone size={14} color="var(--text-secondary)" />
                        <span>{supplier.phone}</span>
                      </div>
                      {supplier.email && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <Mail size={14} color="var(--text-secondary)" />
                          <span>{supplier.email}</span>
                        </div>
                      )}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Clock size={14} color="var(--text-secondary)" />
                        <span>Lead time: {supplier.leadTimeDays} hari</span>
                      </div>
                    </div>

                    <div style={{
                      padding: '0.75rem',
                      background: 'var(--gray-100)',
                      borderRadius: 'var(--radius-sm)',
                      marginBottom: '1rem',
                      fontSize: '0.875rem'
                    }}>
                      <div><strong>Contact:</strong> {supplier.contactPerson}</div>
                      <div><strong>Terms:</strong> {PAYMENT_TERMS.find(t => t.value === supplier.paymentTerms)?.label}</div>
                      {supplier.accountNumbers && supplier.accountNumbers.length > 0 && (
                        <div style={{ marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid var(--gray-200)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginBottom: '0.25rem' }}>
                            <CreditCard size={12} color="var(--text-secondary)" />
                            <strong>Bank Accounts:</strong>
                          </div>
                          {supplier.accountNumbers.map((acc, idx) => (
                            <div key={idx} style={{ fontSize: '0.8rem', marginLeft: '1rem', color: 'var(--text-secondary)' }}>
                              {acc.bankName}: {acc.accountNumber}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        className="btn btn-sm btn-outline"
                        onClick={() => openCreatePOModal(supplier.id)}
                        style={{ flex: 1 }}
                      >
                        <ShoppingCart size={14} />
                        Order
                      </button>
                      <button
                        className="btn btn-sm btn-outline"
                        onClick={() => openEditSupplierModal(supplier)}
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        className="btn btn-sm btn-outline"
                        onClick={() => openDeleteSupplierModal(supplier)}
                        style={{ color: 'var(--danger)' }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
                <Boxes size={48} color="var(--gray-400)" style={{ marginBottom: '1rem' }} />
                <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                  {searchTerm ? 'Tiada supplier dijumpai' : 'Belum ada supplier'}
                </p>
                <button className="btn btn-primary" onClick={openAddSupplierModal}>
                  <Plus size={18} />
                  Tambah Supplier Pertama
                </button>
              </div>
            )}
          </>
        )}

        {/* Purchase Orders View */}
        {viewMode === 'orders' && (
          <div className="grid grid-cols-1 lg:grid-cols-2" style={{ gap: '1.5rem' }}>
            <div className="card">
              <div className="card-header">
                <div className="card-title">PO Aktif</div>
                <div className="card-subtitle">{pendingPOs.length} orders</div>
              </div>
              {pendingPOs.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {pendingPOs.map(po => (
                    <div
                      key={po.id}
                      style={{
                        padding: '1rem',
                        border: '1px solid var(--gray-200)',
                        borderRadius: 'var(--radius-md)',
                        cursor: 'pointer'
                      }}
                      onClick={() => openViewPOModal(po)}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <strong>{po.poNumber}</strong>
                        <span className={`badge ${po.status === 'draft' ? 'badge-warning' :
                          po.status === 'sent' ? 'badge-info' :
                            'badge-success'
                          }`}>
                          {po.status}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                        {po.supplierName}
                      </div>
                      <div style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>
                        <strong>BND {po.total.toFixed(2)}</strong> • {po.items.length} item
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem' }}>
                  Tiada PO aktif
                </p>
              )}
            </div>

            <div className="card">
              <div className="card-header">
                <div className="card-title">PO Selesai</div>
                <div className="card-subtitle">{completedPOs.length} orders</div>
              </div>
              {completedPOs.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {completedPOs.slice(0, 5).map(po => (
                    <div
                      key={po.id}
                      style={{
                        padding: '1rem',
                        border: '1px solid var(--gray-200)',
                        borderRadius: 'var(--radius-md)',
                        cursor: 'pointer',
                        opacity: 0.8
                      }}
                      onClick={() => openViewPOModal(po)}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <strong>{po.poNumber}</strong>
                        <CheckCircle size={16} color="var(--success)" />
                      </div>
                      <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                        {po.supplierName} • BND {po.total.toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem' }}>
                  Tiada PO selesai
                </p>
              )}
            </div>
          </div>
        )}

        {/* Reorder Suggestions View */}
        {viewMode === 'reorder' && (
          <div className="card">
            <div className="card-header">
              <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <AlertTriangle size={20} color="var(--warning)" />
                Item Perlu Reorder
              </div>
              <div className="card-subtitle">Stok di bawah paras minimum</div>
            </div>

            {lowStockItems.length > 0 ? (
              <table className="table">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Kategori</th>
                    <th>Stok Semasa</th>
                    <th>Minimum</th>
                    <th>Perlu Order</th>
                    <th>Supplier</th>
                    <th>Tindakan</th>
                  </tr>
                </thead>
                <tbody>
                  {lowStockItems.map(item => {
                    const suggestedOrder = Math.max(item.minQuantity * 2 - item.currentQuantity, item.minQuantity);
                    return (
                      <tr key={item.id}>
                        <td style={{ fontWeight: 600 }}>{item.name}</td>
                        <td>{item.category}</td>
                        <td style={{ color: 'var(--danger)', fontWeight: 600 }}>
                          {item.currentQuantity} {item.unit}
                        </td>
                        <td>{item.minQuantity} {item.unit}</td>
                        <td style={{ color: 'var(--warning)', fontWeight: 600 }}>
                          +{suggestedOrder} {item.unit}
                        </td>
                        <td>{item.supplier || '-'}</td>
                        <td>
                          <button
                            className="btn btn-sm btn-primary"
                            onClick={() => {
                              openCreatePOModal();
                              // Pre-add item to PO
                              setTimeout(() => {
                                addItemToPO({ id: item.id, name: item.name, unit: item.unit, cost: item.cost });
                              }, 100);
                            }}
                          >
                            <ShoppingCart size={14} />
                            Order
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <div style={{ textAlign: 'center', padding: '3rem' }}>
                <CheckCircle size={48} color="var(--success)" style={{ marginBottom: '1rem' }} />
                <p style={{ color: 'var(--text-secondary)' }}>
                  Semua stok mencukupi! Tiada item perlu reorder.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Add/Edit Supplier Modal */}
        <Modal
          isOpen={modalType === 'add-supplier' || modalType === 'edit-supplier'}
          onClose={closeModal}
          title={modalType === 'add-supplier' ? 'Tambah Supplier' : 'Edit Supplier'}
          maxWidth="500px"
        >
          <div className="form-group">
            <label className="form-label">Nama Syarikat *</label>
            <input
              type="text"
              className="form-input"
              value={supplierForm.name}
              onChange={(e) => setSupplierForm(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Contoh: ABC Supplies Sdn Bhd"
            />
          </div>

          <div className="grid grid-cols-2" style={{ gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Contact Person</label>
              <input
                type="text"
                className="form-input"
                value={supplierForm.contactPerson}
                onChange={(e) => setSupplierForm(prev => ({ ...prev, contactPerson: e.target.value }))}
                placeholder="Nama"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Telefon *</label>
              <input
                type="tel"
                className="form-input"
                value={supplierForm.phone}
                onChange={(e) => setSupplierForm(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="+673..."
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              type="email"
              className="form-input"
              value={supplierForm.email}
              onChange={(e) => setSupplierForm(prev => ({ ...prev, email: e.target.value }))}
              placeholder="email@example.com"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Alamat</label>
            <textarea
              className="form-input"
              value={supplierForm.address}
              onChange={(e) => setSupplierForm(prev => ({ ...prev, address: e.target.value }))}
              rows={2}
              style={{ resize: 'vertical' }}
            />
          </div>

          <div className="grid grid-cols-2" style={{ gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Payment Terms</label>
              <select
                className="form-select"
                value={supplierForm.paymentTerms}
                onChange={(e) => setSupplierForm(prev => ({ ...prev, paymentTerms: e.target.value as 'cod' | 'net7' | 'net14' | 'net30' }))}
              >
                {PAYMENT_TERMS.map(term => (
                  <option key={term.value} value={term.value}>{term.label}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Lead Time (hari)</label>
              <input
                type="number"
                className="form-input"
                value={supplierForm.leadTimeDays}
                onChange={(e) => setSupplierForm(prev => ({ ...prev, leadTimeDays: Number(e.target.value) }))}
                min="1"
              />
            </div>
          </div>

          {/* Account Numbers Section */}
          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <label className="form-label" style={{ marginBottom: 0 }}>Bank Account Numbers</label>
              <button
                type="button"
                className="btn btn-sm btn-outline"
                onClick={() => {
                  setSupplierForm(prev => ({
                    ...prev,
                    accountNumbers: [...prev.accountNumbers, { bankName: '', accountNumber: '', accountName: '' }]
                  }));
                }}
              >
                <Plus size={14} />
                Add Account
              </button>
            </div>
            {supplierForm.accountNumbers.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {supplierForm.accountNumbers.map((account, index) => (
                  <div key={index} style={{
                    padding: '0.75rem',
                    border: '1px solid var(--gray-200)',
                    borderRadius: 'var(--radius-sm)',
                    position: 'relative'
                  }}>
                    <button
                      type="button"
                      onClick={() => {
                        setSupplierForm(prev => ({
                          ...prev,
                          accountNumbers: prev.accountNumbers.filter((_, i) => i !== index)
                        }));
                      }}
                      style={{
                        position: 'absolute',
                        top: '0.5rem',
                        right: '0.5rem',
                        background: 'var(--gray-100)',
                        border: 'none',
                        borderRadius: '50%',
                        width: '24px',
                        height: '24px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        color: 'var(--danger)'
                      }}
                    >
                      <X size={14} />
                    </button>
                    <div className="grid grid-cols-2" style={{ gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Bank Name (e.g., BIBD, Baiduri)"
                        value={account.bankName}
                        onChange={(e) => {
                          setSupplierForm(prev => ({
                            ...prev,
                            accountNumbers: prev.accountNumbers.map((acc, i) =>
                              i === index ? { ...acc, bankName: e.target.value } : acc
                            )
                          }));
                        }}
                        style={{ fontSize: '0.875rem' }}
                      />
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Account Number"
                        value={account.accountNumber}
                        onChange={(e) => {
                          setSupplierForm(prev => ({
                            ...prev,
                            accountNumbers: prev.accountNumbers.map((acc, i) =>
                              i === index ? { ...acc, accountNumber: e.target.value } : acc
                            )
                          }));
                        }}
                        style={{ fontSize: '0.875rem' }}
                      />
                    </div>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Account Name (optional)"
                      value={account.accountName || ''}
                      onChange={(e) => {
                        setSupplierForm(prev => ({
                          ...prev,
                          accountNumbers: prev.accountNumbers.map((acc, i) =>
                            i === index ? { ...acc, accountName: e.target.value } : acc
                          )
                        }));
                      }}
                      style={{ fontSize: '0.875rem' }}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Nota</label>
            <textarea
              className="form-input"
              value={supplierForm.notes}
              onChange={(e) => setSupplierForm(prev => ({ ...prev, notes: e.target.value }))}
              rows={2}
              style={{ resize: 'vertical' }}
              placeholder="Catatan tambahan..."
            />
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.5rem' }}>
            <button className="btn btn-outline" onClick={closeModal} disabled={isProcessing} style={{ flex: 1 }}>
              Batal
            </button>
            <button
              className="btn btn-primary"
              onClick={modalType === 'add-supplier' ? handleAddSupplier : handleEditSupplier}
              disabled={isProcessing}
              style={{ flex: 1 }}
            >
              {isProcessing ? <><LoadingSpinner size="sm" /> Memproses...</> : modalType === 'add-supplier' ? 'Tambah' : 'Simpan'}
            </button>
          </div>
        </Modal>

        {/* Delete Supplier Modal */}
        <Modal
          isOpen={modalType === 'delete-supplier'}
          onClose={closeModal}
          title="Padam Supplier"
          maxWidth="400px"
        >
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <div style={{
              width: '60px', height: '60px',
              background: '#fee2e2', borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 1rem'
            }}>
              <Trash2 size={28} color="var(--danger)" />
            </div>
            <p style={{ color: 'var(--text-secondary)' }}>
              Padam supplier <strong>{selectedSupplier?.name}</strong>?
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn btn-outline" onClick={closeModal} style={{ flex: 1 }}>Batal</button>
            <button className="btn btn-danger" onClick={handleDeleteSupplier} disabled={isProcessing} style={{ flex: 1 }}>
              {isProcessing ? <LoadingSpinner size="sm" /> : 'Padam'}
            </button>
          </div>
        </Modal>

        {/* Create PO Modal */}
        <Modal
          isOpen={modalType === 'create-po'}
          onClose={closeModal}
          title="Buat Purchase Order"
          maxWidth="600px"
        >
          <div className="form-group">
            <label className="form-label">Supplier *</label>
            <select
              className="form-select"
              value={poForm.supplierId}
              onChange={(e) => setPoForm(prev => ({ ...prev, supplierId: e.target.value, items: [] }))}
            >
              <option value="">Pilih Supplier</option>
              {suppliers.filter(s => s.status === 'active').map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
            {poForm.supplierId && (
              <button
                className="btn btn-sm btn-outline"
                onClick={handleAutoFill}
                style={{ marginTop: '0.5rem', width: '100%', borderColor: 'var(--primary)', color: 'var(--primary)' }}
              >
                <AlertTriangle size={14} style={{ marginRight: '0.25rem' }} />
                Smart Auto-Fill (Low Stock Only)
              </button>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Tambah Item dari Inventori</label>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {inventory.slice(0, 10).map(item => (
                <button
                  key={item.id}
                  className="btn btn-sm btn-outline"
                  onClick={() => addItemToPO({ id: item.id, name: item.name, unit: item.unit, cost: item.cost })}
                >
                  + {item.name}
                </button>
              ))}
            </div>
          </div>

          {poForm.items.length > 0 && (
            <div style={{ marginBottom: '1rem' }}>
              <label className="form-label">Item dalam PO</label>
              <table className="table">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Qty</th>
                    <th>Harga</th>
                    <th>Jumlah</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {poForm.items.map(item => (
                    <tr key={item.stockItemId}>
                      <td>{item.stockItemName}</td>
                      <td>
                        <input
                          type="number"
                          className="form-input"
                          value={item.quantity}
                          onChange={(e) => updatePOItemQuantity(item.stockItemId, Number(e.target.value))}
                          min="1"
                          style={{ width: '80px' }}
                        />
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span>BND {item.unitPrice.toFixed(2)}</span>
                          {(() => {
                            const stockItem = inventory.find(i => i.id === item.stockItemId);
                            // If collecting a new price that is > 10% higher than historical cost
                            if (stockItem && stockItem.cost > 0 && item.unitPrice > stockItem.cost * 1.1) {
                              const diffPercent = ((item.unitPrice - stockItem.cost) / stockItem.cost) * 100;
                              return (
                                <span style={{ fontSize: '0.75rem', color: 'var(--warning)', display: 'flex', alignItems: 'center' }}>
                                  <AlertTriangle size={10} style={{ marginRight: '2px' }} />
                                  +{diffPercent.toFixed(0)}% vs avg
                                </span>
                              );
                            }
                            return null;
                          })()}
                        </div>
                      </td>
                      <td style={{ fontWeight: 600 }}>BND {(item.quantity * item.unitPrice).toFixed(2)}</td>
                      <td>
                        <button
                          className="btn btn-sm btn-outline"
                          onClick={() => removeItemFromPO(item.stockItemId)}
                          style={{ color: 'var(--danger)' }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{ fontWeight: 700 }}>
                    <td colSpan={3}>JUMLAH</td>
                    <td colSpan={2}>BND {poForm.items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0).toFixed(2)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Jangkaan Penghantaran</label>
            <input
              type="date"
              className="form-input"
              value={poForm.expectedDelivery}
              onChange={(e) => setPoForm(prev => ({ ...prev, expectedDelivery: e.target.value }))}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.5rem' }}>
            <button className="btn btn-outline" onClick={closeModal} style={{ flex: 1 }}>Batal</button>
            <button
              className="btn btn-primary"
              onClick={handleCreatePO}
              disabled={isProcessing || poForm.items.length === 0}
              style={{ flex: 1 }}
            >
              {isProcessing ? <LoadingSpinner size="sm" /> : 'Buat PO'}
            </button>
          </div>
        </Modal>

        {/* View PO Modal */}
        <Modal
          isOpen={modalType === 'view-po'}
          onClose={closeModal}
          title={`Purchase Order ${selectedPO?.poNumber}`}
          maxWidth="500px"
        >
          {selectedPO && (
            <>
              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>{selectedPO.supplierName}</div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                      {new Date(selectedPO.createdAt).toLocaleDateString('ms-MY')}
                    </div>
                  </div>
                  <span className={`badge ${selectedPO.status === 'draft' ? 'badge-warning' :
                    selectedPO.status === 'sent' ? 'badge-info' :
                      selectedPO.status === 'confirmed' ? 'badge-success' :
                        selectedPO.status === 'received' ? 'badge-success' : 'badge-danger'
                    }`}>
                    {selectedPO.status}
                  </span>
                </div>

                <table className="table">
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th>Qty</th>
                      <th>Harga</th>
                      <th>Jumlah</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedPO.items.map((item, idx) => (
                      <tr key={idx}>
                        <td>{item.stockItemName}</td>
                        <td>{item.quantity} {item.unit}</td>
                        <td>BND {item.unitPrice.toFixed(2)}</td>
                        <td style={{ fontWeight: 600 }}>BND {item.totalPrice.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr style={{ fontWeight: 700 }}>
                      <td colSpan={3}>JUMLAH</td>
                      <td>BND {selectedPO.total.toFixed(2)}</td>
                    </tr>
                  </tfoot>
                </table>

                {/* Additional Actions */}
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                  <button
                    className="btn btn-sm btn-outline"
                    onClick={() => handlePrintPO(selectedPO)}
                    style={{ flex: 1 }}
                  >
                    <Printer size={14} />
                    Print / PDF
                  </button>
                  <button
                    className="btn btn-sm btn-outline"
                    onClick={() => handleWhatsAppPO(selectedPO)}
                    style={{ flex: 1, borderColor: '#25D366', color: '#25D366' }}
                  >
                    <Phone size={14} />
                    WhatsApp
                  </button>
                  <button
                    className="btn btn-sm btn-outline"
                    onClick={() => handleEmailPO(selectedPO)}
                    style={{ flex: 1 }}
                  >
                    <Mail size={14} />
                    Email
                  </button>
                </div>
              </div>

              {selectedPO.status !== 'received' && selectedPO.status !== 'cancelled' && (
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {selectedPO.status === 'draft' && (
                    <button
                      className="btn btn-primary"
                      onClick={() => { updatePurchaseOrderStatus(selectedPO.id, 'sent'); closeModal(); }}
                      style={{ flex: 1 }}
                    >
                      <Send size={16} />
                      Hantar ke Supplier
                    </button>
                  )}
                  {selectedPO.status === 'sent' && (
                    <button
                      className="btn btn-primary"
                      onClick={() => { updatePurchaseOrderStatus(selectedPO.id, 'confirmed'); closeModal(); }}
                      style={{ flex: 1 }}
                    >
                      <CheckCircle size={16} />
                      Mark Confirmed
                    </button>
                  )}
                  {selectedPO.status === 'confirmed' && (
                    <button
                      className="btn btn-success"
                      onClick={() => { updatePurchaseOrderStatus(selectedPO.id, 'received'); closeModal(); }}
                      style={{ flex: 1 }}
                    >
                      <CheckCircle size={16} />
                      Mark Received
                    </button>
                  )}
                </div>
              )}
            </>
          )}
        </Modal>
      </div>
    </MainLayout>
  );
}




