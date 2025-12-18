'use client';

import { useState, useRef, useMemo, useEffect, useCallback } from 'react';
import RouteGuard from '@/components/RouteGuard';
import { useOrders, useMenu, useInventory, usePaymentMethods, useCustomers } from '@/lib/store';
import { useMenuRealtime, useInventoryRealtime, useModifiersRealtime } from '@/lib/supabase/realtime-hooks';
import { useTranslation } from '@/lib/contexts/LanguageContext';
import { useToast } from '@/lib/contexts/ToastContext';
import { CartItem, Order, MenuItem, SelectedModifier, ReceiptSettings, DEFAULT_RECEIPT_SETTINGS, Customer } from '@/lib/types';
import { getUpsellSuggestions } from '@/lib/menu-data';
import {
  thermalPrinter,
  loadReceiptSettings,
  isOnline,
  withRetry,
  getNetworkErrorMessage,
  generateTransactionId,
  isTransactionSubmitted,
  markTransactionSubmitted,
} from '@/lib/services';
import ReceiptPreview from '@/components/ReceiptPreview';
import { ArrowLeft, UtensilsCrossed, Sandwich, Coffee, History, Printer, Clock, ChefHat, CheckCircle, ShoppingBag, Plus, Minus, X, Sparkles, AlertTriangle, User, DollarSign, CreditCard, QrCode, Wallet, WifiOff, RefreshCw } from 'lucide-react';
import Modal from '@/components/Modal';
import LoadingSpinner from '@/components/LoadingSpinner';
import StatCard from '@/components/StatCard';
import RegisterModal from '@/components/cash-management/RegisterModal';
import RegisterStatus from '@/components/cash-management/RegisterStatus';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';

type ModalType = 'upsell' | 'checkout' | 'receipt' | 'history' | 'queue' | 'modifiers' | 'network-error' | null;

export default function POSPage() {
  const { orders, addOrder, updateOrderStatus, getTodayOrders, isInitialized } = useOrders();
  const { menuItems, modifierGroups, modifierOptions, getOptionsForGroup, refreshMenu } = useMenu();
  const { inventory, adjustStock, refreshInventory } = useInventory();
  const { paymentMethods, isInitialized: paymentMethodsInitialized } = usePaymentMethods();
  const { customers } = useCustomers();
  const { t, language } = useTranslation();
  const { showToast } = useToast();
  const router = useRouter();

  // Cash Register State
  const { currentRegister, isInitialized: storeInitialized } = useStore();
  const [registerModalOpen, setRegisterModalOpen] = useState(false);
  const [registerModalMode, setRegisterModalMode] = useState<'open' | 'close'>('open');

  // Enforce Open Register
  useEffect(() => {
    if (storeInitialized && !currentRegister) {
      setRegisterModalMode('open');
      setRegisterModalOpen(true);
    }
  }, [storeInitialized, currentRegister]);

  // Realtime subscriptions for menu, inventory, and modifiers

  // Realtime subscriptions for menu, inventory, and modifiers
  const handleMenuChange = useCallback(() => {
    console.log('[Realtime] Menu change detected, refreshing...');
    refreshMenu();
  }, [refreshMenu]);

  const handleInventoryChange = useCallback(() => {
    console.log('[Realtime] Inventory change detected, refreshing...');
    refreshInventory();
  }, [refreshInventory]);

  useMenuRealtime(handleMenuChange);
  useInventoryRealtime(handleInventoryChange);
  useModifiersRealtime(handleMenuChange); // Modifiers also refresh menu

  // Get enabled payment methods from settings - using useMemo for proper reactivity
  const enabledPaymentMethods = useMemo(() => {
    return paymentMethods
      .filter(pm => pm.isEnabled)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }, [paymentMethods]);

  const [selectedCategory, setSelectedCategory] = useState('All');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [modalType, setModalType] = useState<ModalType>(null);

  // Checkout State
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('+673');
  const [orderType, setOrderType] = useState<'takeaway' | 'gomamam'>('takeaway');
  const [paymentMethod, setPaymentMethod] = useState<string>('cash');
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastOrder, setLastOrder] = useState<Order | null>(null);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [cashReceived, setCashReceived] = useState<number>(0);
  const [usePoints, setUsePoints] = useState(false); // Loyalty Redemption Toggle
  const [receiptSettings, setReceiptSettings] = useState<ReceiptSettings>(DEFAULT_RECEIPT_SETTINGS);
  const receiptRef = useRef<HTMLDivElement>(null);

  // Customer Selection State
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerSearch, setCustomerSearch] = useState('');
  const [showCustomerResults, setShowCustomerResults] = useState(false);

  // Filter customers for search
  const filteredCustomers = useMemo(() => {
    if (!customerSearch) return [];
    const searchLower = customerSearch.toLowerCase();
    return customers.filter(c =>
      c.name.toLowerCase().includes(searchLower) ||
      c.phone.includes(searchLower)
    ).slice(0, 5);
  }, [customers, customerSearch]);

  const handleSelectCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setCustomerName(customer.name);
    setCustomerPhone(customer.phone);
    setCustomerSearch('');
    setShowCustomerResults(false);
  };

  const handleClearCustomer = () => {
    setSelectedCustomer(null);
    setCustomerName('');
    setCustomerPhone('+673');
  };

  // Network recovery state
  const [currentTransactionId, setCurrentTransactionId] = useState<string | null>(null);
  const [networkError, setNetworkError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  // Load receipt settings on mount
  useEffect(() => {
    const settings = loadReceiptSettings();
    setReceiptSettings(settings);
  }, []);

  // Modifier selection state
  const [selectedItemForModifiers, setSelectedItemForModifiers] = useState<MenuItem | null>(null);
  const [tempSelectedModifiers, setTempSelectedModifiers] = useState<SelectedModifier[]>([]);

  // Get available menu items only
  const availableMenuItems = useMemo(() => {
    return menuItems.filter(item => item.isAvailable);
  }, [menuItems]);

  // Get categories from menu
  const categories = useMemo(() => {
    const cats = new Set(availableMenuItems.map(item => item.category));
    return ['All', ...Array.from(cats)];
  }, [availableMenuItems]);

  const filteredMenu = selectedCategory === 'All'
    ? availableMenuItems
    : availableMenuItems.filter(item => item.category === selectedCategory);

  // Get upsell suggestions based on cart items
  const upsellSuggestions = useMemo(() => {
    const cartItemIds = cart.map(item => item.id);
    return getUpsellSuggestions(cartItemIds, menuItems);
  }, [cart, menuItems]);

  // Handle item click - check if has modifiers
  const handleItemClick = (item: MenuItem) => {
    if (item.modifierGroupIds.length > 0) {
      // Has modifiers - open modifier selection modal
      setSelectedItemForModifiers(item);
      setTempSelectedModifiers([]);
      setModalType('modifiers');
    } else {
      // No modifiers - add directly to cart
      addToCart(item, []);
    }
  };

  const addToCart = (item: MenuItem, selectedModifiers: SelectedModifier[]) => {
    const modifierTotal = selectedModifiers.reduce((sum, m) => sum + m.extraPrice, 0);
    const itemTotal = item.price + modifierTotal;

    // Generate unique key for cart item (including modifiers)
    const modifierKey = selectedModifiers.map(m => m.optionId).sort().join('-');
    const cartItemId = `${item.id}_${modifierKey || 'no-mod'}`;

    setCart(prev => {
      const existing = prev.find(i =>
        i.id === item.id &&
        JSON.stringify(i.selectedModifiers) === JSON.stringify(selectedModifiers)
      );

      if (existing) {
        return prev.map(i =>
          i === existing ? { ...i, quantity: i.quantity + 1 } : i
        );
      }

      const newCartItem: CartItem = {
        ...item,
        quantity: 1,
        selectedModifiers,
        itemTotal,
      };
      return [...prev, newCartItem];
    });
  };

  const updateCartQuantity = (index: number, quantity: number) => {
    if (quantity <= 0) {
      setCart(prev => prev.filter((_, i) => i !== index));
    } else {
      setCart(prev => prev.map((item, i) =>
        i === index ? { ...item, quantity } : item
      ));
    }
  };

  const removeFromCart = (index: number) => {
    setCart(prev => prev.filter((_, i) => i !== index));
  };

  // Calculate cart totals
  const cartSubtotal = cart.reduce((sum, item) => sum + (item.itemTotal * item.quantity), 0);
  const discountAmount = (cartSubtotal * discountPercent) / 100;

  const cartTotal = cartSubtotal - discountAmount;

  // Loyalty Redemption Calculation (100 Points = $1)
  const maxRedemptionValue = useMemo(() => {
    if (!selectedCustomer) return 0;
    const pointsValue = selectedCustomer.loyaltyPoints / 100;
    return Math.min(cartTotal, pointsValue);
  }, [selectedCustomer, cartTotal]);

  const redemptionAmount = usePoints ? maxRedemptionValue : 0;
  const pointsToRedeem = usePoints ? Math.ceil(redemptionAmount * 100) : 0; // Displayed points
  const finalPayable = Math.max(0, cartTotal - redemptionAmount);

  // Toggle modifier option
  const toggleModifierOption = (group: typeof modifierGroups[0], option: typeof modifierOptions[0]) => {
    setTempSelectedModifiers(prev => {
      const existingIndex = prev.findIndex(m => m.optionId === option.id);

      if (existingIndex >= 0) {
        // Remove this option
        return prev.filter(m => m.optionId !== option.id);
      }

      // Check if single select - remove other options from same group
      if (!group.allowMultiple) {
        const withoutGroupOptions = prev.filter(m => m.groupId !== group.id);
        return [...withoutGroupOptions, {
          groupId: group.id,
          groupName: group.name,
          optionId: option.id,
          optionName: option.name,
          extraPrice: option.extraPrice,
        }];
      }

      // Multiple select - check max
      const groupOptionsCount = prev.filter(m => m.groupId === group.id).length;
      if (groupOptionsCount >= group.maxSelection) {
        return prev;
      }

      return [...prev, {
        groupId: group.id,
        groupName: group.name,
        optionId: option.id,
        optionName: option.name,
        extraPrice: option.extraPrice,
      }];
    });
  };

  // Validate modifiers before adding to cart
  const validateModifiers = (): boolean => {
    if (!selectedItemForModifiers) return false;

    for (const groupId of selectedItemForModifiers.modifierGroupIds) {
      const group = modifierGroups.find(g => g.id === groupId);
      if (!group) continue;

      const selectedCount = tempSelectedModifiers.filter(m => m.groupId === groupId).length;

      if (group.isRequired && selectedCount < group.minSelection) {
        return false;
      }
    }

    return true;
  };

  // Add item with modifiers to cart
  const handleAddWithModifiers = () => {
    if (!selectedItemForModifiers) return;

    if (!validateModifiers()) {
      alert('Sila pilih semua modifier yang wajib');
      return;
    }

    addToCart(selectedItemForModifiers, tempSelectedModifiers);
    setModalType(null);
    setSelectedItemForModifiers(null);
    setTempSelectedModifiers([]);
  };

  const handleCheckout = () => {
    if (cart.length === 0) return;

    // Check for drinks (forced upsell)
    const hasDrink = cart.some(item => item.category === 'Minuman');

    if (!hasDrink) {
      setModalType('upsell');
      return;
    }

    setModalType('checkout');
  };

  const proceedToPayment = async (retrying: boolean = false) => {
    if (!customerPhone || customerPhone.length < 8) {
      showToast('Sila masukkan nombor telefon yang sah (minimum 8 digit)', 'error');
      return;
    }

    // Validate cash payment
    if (paymentMethod === 'cash') {
      // Validate cash payment
      if (paymentMethod === 'cash') {
        if (!cashReceived || cashReceived < finalPayable) {
          showToast('Sila masukkan jumlah bayaran yang mencukupi', 'error');
          return;
        }
      }
    }

    // Check network connectivity
    if (!isOnline()) {
      setNetworkError('Tiada sambungan internet. Sila semak rangkaian anda.');
      setModalType('network-error');
      return;
    }

    // Generate or reuse transaction ID (for retry scenarios)
    const transactionId = retrying && currentTransactionId
      ? currentTransactionId
      : generateTransactionId();

    // Check for duplicate submission
    if (isTransactionSubmitted(transactionId)) {
      showToast('Pesanan ini sudah diproses. Sila tunggu atau buat pesanan baru.', 'warning');
      return;
    }

    setCurrentTransactionId(transactionId);
    setIsProcessing(true);
    setNetworkError(null);

    try {
      // Process payment with retry logic
      const processOrder = async () => {
        // Simulate API call with potential network issues
        await new Promise((resolve, reject) => {
          setTimeout(() => {
            // Simulate occasional network failure for testing
            // In production, this would be the actual API call
            if (!isOnline()) {
              reject(new Error('Network disconnected'));
            } else {
              resolve(true);
            }
          }, 1500);
        });

        return true;
      };

      // Use retry logic for the payment process
      await withRetry(processOrder, {
        maxRetries: 2,
        baseDelay: 1000,
        onRetry: (attempt) => {
          setRetryCount(attempt);
          showToast(`Cuba semula... (${attempt}/2)`, 'info');
        },
      });

      // Mark transaction as submitted to prevent duplicates
      markTransactionSubmitted(transactionId);

      // Create order with customer name and payment method
      const newOrder = await addOrder({
        items: cart,
        total: cartTotal, // Store original total
        customerName: customerName || undefined,
        customerPhone,
        customerId: selectedCustomer?.id,
        redeemedPoints: pointsToRedeem > 0 ? pointsToRedeem : undefined,
        redemptionAmount: redemptionAmount > 0 ? redemptionAmount : undefined,
        orderType,
        paymentMethod,
        status: 'pending',
        createdAt: new Date().toISOString(),
      });

      // Decrement inventory based on sold items (simple mapping by category)
      cart.forEach(item => {
        // Find matching inventory items based on category keywords
        const categoryToInventory: Record<string, string[]> = {
          'Nasi Lemak': ['Nasi', 'Ayam', 'Telur', 'Sambal'],
          'Burger': ['Roti Burger', 'Daging'],
          'Minuman': ['Teh', 'Kopi', 'Milo', 'Gula'],
        };

        const relatedItems = categoryToInventory[item.category] || [];
        relatedItems.forEach(invName => {
          const invItem = inventory.find(inv =>
            inv.name.toLowerCase().includes(invName.toLowerCase())
          );
          if (invItem) {
            adjustStock(invItem.id, item.quantity, 'out', `Jualan: ${item.name}`);
          }
        });
      });

      setLastOrder(newOrder);

      // Show success toast
      showToast(`Pesanan ${newOrder.orderNumber} berjaya!`, 'success');

      // Auto-print if enabled
      if (receiptSettings.autoPrint && newOrder) {
        handlePrintReceipt(newOrder);
      }

      // Open cash drawer for cash payments
      if (receiptSettings.openCashDrawer && paymentMethod === 'cash' && thermalPrinter.isConnected()) {
        try {
          await thermalPrinter.openCashDrawer();
        } catch (error) {
          console.error('Failed to open cash drawer:', error);
        }
      }

      // Reset cart and modals
      setCart([]);
      setModalType('receipt');
      setCustomerName('');
      setCustomerPhone('+673');
      setPaymentMethod('cash');
      setDiscountPercent(0);
      setCashReceived(0);
      setUsePoints(false); // Reset redemption
      setCurrentTransactionId(null);
      setRetryCount(0);
    } catch (error) {
      console.error('Payment error:', error);
      const errorMessage = getNetworkErrorMessage(error);
      setNetworkError(errorMessage);
      setModalType('network-error');
    } finally {
      setIsProcessing(false);
    }
  };

  // Retry payment after network error
  const handleRetryPayment = useCallback(() => {
    setModalType('checkout');
    proceedToPayment(true);
  }, [currentTransactionId]);

  // Cancel payment and clear transaction
  const handleCancelPayment = useCallback(() => {
    setCurrentTransactionId(null);
    setNetworkError(null);
    setRetryCount(0);
    setModalType(null);
  }, []);

  const handlePrintReceipt = async (orderToPrint?: Order) => {
    const order = orderToPrint || lastOrder;
    if (!order) return;

    try {
      // Use thermal printer if connected, otherwise use browser print
      await thermalPrinter.print(order, receiptSettings);
    } catch (error) {
      console.error('Print error:', error);
      // Fallback to browser print
      thermalPrinter.printWithBrowser(order, receiptSettings);
    }
  };

  const todayOrders = getTodayOrders();
  const pendingOrders = todayOrders.filter(o => o.status === 'pending');
  const preparingOrders = todayOrders.filter(o => o.status === 'preparing');
  const readyOrders = todayOrders.filter(o => o.status === 'ready');

  if (!isInitialized) {
    return (
      <RouteGuard>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: 'var(--bg-secondary)' }}>
          <LoadingSpinner />
        </div>
      </RouteGuard>
    );
  }

  return (
    <RouteGuard>
      <div className="pos-standalone animate-fade-in" style={{
        minHeight: '100vh',
        background: 'var(--bg-secondary)',
        padding: '1.5rem',
        paddingBottom: '2rem' // Extra padding for bottom
      }}>
        <div className="page-header">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <button
                onClick={() => router.push('/')}
                className="btn btn-ghost"
                style={{ padding: '0.5rem' }}
                title={t('common.back')}
              >
                <ArrowLeft size={24} />
              </button>
              <h1 className="page-title" style={{ margin: 0 }}>
                {t('pos.title')}
              </h1>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <RegisterStatus
                onOpenClick={() => {
                  setRegisterModalMode('open');
                  setRegisterModalOpen(true);
                }}
                onCloseClick={() => {
                  setRegisterModalMode('close');
                  setRegisterModalOpen(true);
                }}
              />
              <button className="btn btn-outline" onClick={() => setModalType('queue')}>
                <ChefHat size={18} />
                {t('pos.orderQueue')} ({pendingOrders.length + preparingOrders.length})
              </button>
              <button className="btn btn-outline" onClick={() => setModalType('history')}>
                <History size={18} />
                {t('pos.orderHistory')} ({todayOrders.length})
              </button>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="content-grid cols-4 mb-lg">
          <StatCard
            label={t('pos.totalOrders')}
            value={todayOrders.length}
            change={todayOrders.length > 0 ? t('pos.ordersToday') : t('pos.noOrders')}
            changeType={todayOrders.length > 0 ? "positive" : "neutral"}
            icon={ShoppingBag}
            gradient="primary"
          />
          <StatCard
            label={t('pos.pending')}
            value={pendingOrders.length}
            change={pendingOrders.length > 0 ? t('pos.waiting') : t('pos.allProcessed')}
            changeType={pendingOrders.length > 0 ? "neutral" : "positive"}
            icon={Clock}
            gradient="warning"
          />
          <StatCard
            label={t('pos.preparing')}
            value={preparingOrders.length}
            change={preparingOrders.length > 0 ? t('pos.beingPrepared') : t('pos.noneInKitchen')}
            changeType="neutral"
            icon={ChefHat}
          />
          <StatCard
            label={t('pos.ready')}
            value={readyOrders.length}
            change={readyOrders.length > 0 ? t('pos.readyForPickup') : t('pos.noneReady')}
            changeType={readyOrders.length > 0 ? "positive" : "neutral"}
            icon={CheckCircle}
            gradient="peach"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3" style={{ gap: '1.5rem' }}>
          {/* Menu Section */}
          <div className="lg:col-span-2">
            {/* Category Filter */}
            <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {categories.map(category => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`btn btn-sm ${selectedCategory === category ? 'btn-primary' : 'btn-outline'}`}
                >
                  {category}
                </button>
              ))}
            </div>

            {/* Menu Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3" style={{ gap: '1rem' }}>
              {filteredMenu.map(item => (
                <div
                  key={item.id}
                  className="card"
                  style={{ cursor: 'pointer', transition: 'transform 0.2s' }}
                  onClick={() => handleItemClick(item)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                  }}
                >
                  <div style={{
                    width: '100%',
                    height: '100px',
                    background: 'var(--gray-100)',
                    borderRadius: 'var(--radius-md)',
                    marginBottom: '0.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--primary)',
                    position: 'relative'
                  }}>
                    {item.category === 'Nasi Lemak' ? <UtensilsCrossed size={40} /> :
                      item.category === 'Burger' ? <Sandwich size={40} /> : <Coffee size={40} />}
                    {item.modifierGroupIds.length > 0 && (
                      <div style={{
                        position: 'absolute',
                        top: '0.5rem',
                        right: '0.5rem',
                        background: 'var(--warning)',
                        color: 'white',
                        borderRadius: '50%',
                        width: '20px',
                        height: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.7rem',
                        fontWeight: 700
                      }}>
                        +
                      </div>
                    )}
                  </div>
                  <div style={{ fontWeight: 600, marginBottom: '0.25rem', fontSize: '0.9rem' }}>
                    {item.name}
                  </div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--primary)' }}>
                    BND {item.price.toFixed(2)}
                  </div>
                </div>
              ))}
            </div>

            {filteredMenu.length === 0 && (
              <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
                <p style={{ color: 'var(--text-secondary)' }}>
                  Tiada menu dalam kategori ini
                </p>
              </div>
            )}
          </div>

          {/* Cart Section */}
          <div>
            <div className="card" style={{ position: 'sticky', top: '2rem' }}>
              <div className="card-header">
                <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <ShoppingBag size={20} />
                  Keranjang
                </div>
                <div className="card-subtitle">{cart.length} item(s)</div>
              </div>

              {cart.length === 0 ? (
                <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem' }}>
                  Tiada item dalam keranjang
                </p>
              ) : (
                <>
                  <div style={{ maxHeight: '350px', overflowY: 'auto', marginBottom: '1rem' }}>
                    {cart.map((item, index) => (
                      <div
                        key={`${item.id}-${index}`}
                        style={{
                          padding: '0.75rem 0',
                          borderBottom: '1px solid var(--gray-200)',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>
                              {item.name}
                            </div>
                            {item.selectedModifiers.length > 0 && (
                              <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                                {item.selectedModifiers?.map((mod, i) => (
                                  <div key={i}>
                                    - {mod.groupName?.replace('Pilih ', '').replace('Flavour ', '') || ''}: <b>{mod.optionName}</b>
                                    {mod.extraPrice > 0 && ` (+$${mod.extraPrice.toFixed(2)})`}
                                  </div>
                                ))}
                              </div>
                            )}
                            <div style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 600, marginTop: '0.25rem' }}>
                              BND {item.itemTotal.toFixed(2)} each
                            </div>
                          </div>
                          <button
                            onClick={() => removeFromCart(index)}
                            style={{
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              color: 'var(--danger)',
                              padding: '0.25rem'
                            }}
                          >
                            <X size={16} />
                          </button>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                          <button
                            onClick={() => updateCartQuantity(index, item.quantity - 1)}
                            className="btn btn-sm btn-outline"
                            style={{ padding: '0.25rem 0.5rem', minWidth: 'auto' }}
                          >
                            <Minus size={14} />
                          </button>
                          <span style={{ minWidth: '2rem', textAlign: 'center', fontWeight: 600 }}>
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateCartQuantity(index, item.quantity + 1)}
                            className="btn btn-sm btn-outline"
                            style={{ padding: '0.25rem 0.5rem', minWidth: 'auto' }}
                          >
                            <Plus size={14} />
                          </button>
                          <span style={{ marginLeft: 'auto', fontWeight: 700 }}>
                            BND {(item.itemTotal * item.quantity).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Discount */}
                  <div style={{
                    padding: '0.75rem',
                    background: 'var(--gray-100)',
                    borderRadius: 'var(--radius-md)',
                    marginBottom: '1rem'
                  }}>
                    <label style={{ fontSize: '0.875rem', fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>
                      Diskaun (%)
                    </label>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      {[0, 5, 10, 15, 20].map(percent => (
                        <button
                          key={percent}
                          onClick={() => setDiscountPercent(percent)}
                          className={`btn btn-sm ${discountPercent === percent ? 'btn-primary' : 'btn-outline'}`}
                          style={{ flex: 1, padding: '0.5rem' }}
                        >
                          {percent}%
                        </button>
                      ))}
                    </div>
                  </div>

                  <div style={{
                    paddingTop: '1rem',
                    borderTop: '2px solid var(--gray-300)',
                    marginTop: '0.5rem'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                      <span>Subtotal:</span>
                      <span>BND {cartSubtotal.toFixed(2)}</span>
                    </div>
                    {discountPercent > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--success)' }}>
                        <span>Diskaun ({discountPercent}%):</span>
                        <span>-BND {discountAmount.toFixed(2)}</span>
                      </div>
                    )}
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: '1.25rem',
                      fontWeight: 700,
                      marginBottom: '1rem'
                    }}>
                      <span>Jumlah:</span>
                      <span>BND {cartTotal.toFixed(2)}</span>
                    </div>
                    <button
                      onClick={handleCheckout}
                      className="btn btn-primary"
                      style={{ width: '100%' }}
                    >
                      Checkout
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Modifier Selection Modal */}
        <Modal
          isOpen={modalType === 'modifiers'}
          onClose={() => {
            setModalType(null);
            setSelectedItemForModifiers(null);
            setTempSelectedModifiers([]);
          }}
          title={`Pilih Options - ${selectedItemForModifiers?.name}`}
          maxWidth="450px"
        >
          {selectedItemForModifiers && (
            <>
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{selectedItemForModifiers.name}</div>
                <div style={{ color: 'var(--primary)', fontWeight: 600 }}>BND {selectedItemForModifiers.price.toFixed(2)}</div>
              </div>

              {selectedItemForModifiers.modifierGroupIds.map(groupId => {
                const group = modifierGroups.find(g => g.id === groupId);
                if (!group) return null;

                const options = getOptionsForGroup(groupId).filter(opt => opt.isAvailable);
                const selectedCount = tempSelectedModifiers.filter(m => m.groupId === groupId).length;

                return (
                  <div key={groupId} style={{ marginBottom: '1.5rem' }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '0.75rem'
                    }}>
                      <div>
                        <span style={{ fontWeight: 600 }}>{group.name}</span>
                        {group.isRequired && (
                          <span style={{ color: 'var(--danger)', marginLeft: '0.5rem', fontSize: '0.75rem' }}>
                            * Wajib
                          </span>
                        )}
                      </div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        {selectedCount}/{group.maxSelection}
                      </span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {options.map(option => {
                        const isSelected = tempSelectedModifiers.some(m => m.optionId === option.id);
                        return (
                          <button
                            key={option.id}
                            onClick={() => toggleModifierOption(group, option)}
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              padding: '0.75rem 1rem',
                              border: isSelected ? '2px solid var(--primary)' : '1px solid var(--gray-300)',
                              borderRadius: 'var(--radius-md)',
                              background: isSelected ? 'var(--primary-light)' : 'white',
                              cursor: 'pointer',
                              transition: 'all 0.2s'
                            }}
                          >
                            <span style={{ fontWeight: isSelected ? 600 : 400 }}>{option.name}</span>
                            <span style={{
                              fontWeight: 600,
                              color: option.extraPrice > 0 ? 'var(--success)' : 'var(--text-secondary)'
                            }}>
                              {option.extraPrice > 0 ? `+BND ${option.extraPrice.toFixed(2)}` : 'Free'}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              {/* Total Preview */}
              <div style={{
                padding: '1rem',
                background: 'var(--gray-100)',
                borderRadius: 'var(--radius-md)',
                marginBottom: '1rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span>Harga Asas:</span>
                  <span>BND {selectedItemForModifiers.price.toFixed(2)}</span>
                </div>
                {tempSelectedModifiers.filter(m => m.extraPrice > 0).map((mod, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                    <span>+ {mod.groupName?.replace('Pilih ', '').replace('Flavour ', '')}: <b>{mod.optionName}</b></span>
                    <span>+BND {mod.extraPrice.toFixed(2)}</span>
                  </div>
                ))}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontWeight: 700,
                  fontSize: '1.1rem',
                  paddingTop: '0.5rem',
                  borderTop: '1px dashed var(--gray-300)',
                  marginTop: '0.5rem'
                }}>
                  <span>Jumlah:</span>
                  <span>BND {(selectedItemForModifiers.price + tempSelectedModifiers.reduce((sum, m) => sum + m.extraPrice, 0)).toFixed(2)}</span>
                </div>
              </div>

              <div style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '0.75rem',
                marginTop: '1.5rem',
                paddingTop: '1rem',
                borderTop: '1px solid var(--gray-200)'
              }}>
                <button
                  className="btn btn-outline"
                  onClick={() => {
                    setModalType(null);
                    setSelectedItemForModifiers(null);
                  }}
                  style={{
                    minWidth: '100px',
                    padding: '0.5rem 1rem'
                  }}
                >
                  Batal
                </button>
                <button
                  className="btn btn-primary"
                  onClick={handleAddWithModifiers}
                  disabled={!validateModifiers()}
                  style={{
                    minWidth: '160px',
                    padding: '0.5rem 1.25rem',
                    fontWeight: 600
                  }}
                >
                  Tambah ke Keranjang
                </button>
              </div>
            </>
          )}
        </Modal>

        {/* Upsell Modal - Product Cards */}
        <Modal
          isOpen={modalType === 'upsell'}
          onClose={() => setModalType(null)}
          title="Tambah Lagi?"
          maxWidth="550px"
        >
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            marginBottom: '1.25rem',
            padding: '0.75rem 1rem',
            background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
            borderRadius: 'var(--radius-md)',
            color: '#92400e'
          }}>
            <Sparkles size={20} />
            <span style={{ fontWeight: 500 }}>Jangan lupa minuman! Pilih di bawah:</span>
          </div>

          {/* Product Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '0.75rem',
            marginBottom: '1.5rem'
          }}>
            {upsellSuggestions.map(item => (
              <div
                key={item.id}
                style={{
                  background: 'white',
                  border: '2px solid var(--gray-200)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '1rem',
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--primary)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--gray-200)';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
                onClick={() => {
                  handleItemClick(item);
                }}
              >
                {/* Icon */}
                <div style={{
                  width: '56px',
                  height: '56px',
                  background: 'linear-gradient(135deg, var(--primary-light) 0%, #e0e7ff 100%)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 0.75rem',
                  color: 'var(--primary)'
                }}>
                  <Coffee size={28} />
                </div>

                {/* Name */}
                <div style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: '0.25rem' }}>
                  {item.name}
                </div>

                {/* Price */}
                <div style={{
                  color: 'var(--primary)',
                  fontWeight: 700,
                  fontSize: '1.1rem',
                  marginBottom: '0.75rem'
                }}>
                  BND {item.price.toFixed(2)}
                </div>

                {/* Add Button */}
                <button
                  className="btn btn-primary btn-sm"
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.35rem'
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleItemClick(item);
                  }}
                >
                  <Plus size={16} />
                  Tambah
                </button>
              </div>
            ))}
          </div>

          {/* Added Items Feedback */}
          {cart.filter(c => upsellSuggestions.some(u => u.id === c.id)).length > 0 && (
            <div style={{
              padding: '0.75rem 1rem',
              background: '#d1fae5',
              borderRadius: 'var(--radius-md)',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              color: '#065f46'
            }}>
              <CheckCircle size={18} />
              <span style={{ fontWeight: 500 }}>
                {cart.filter(c => upsellSuggestions.some(u => u.id === c.id)).reduce((sum, c) => sum + c.quantity, 0)} minuman ditambah
              </span>
            </div>
          )}

          {/* Action Buttons */}
          <div style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '0.75rem',
            marginTop: '1.5rem',
            paddingTop: '1rem',
            borderTop: '1px solid var(--gray-200)'
          }}>
            <button
              onClick={() => setModalType(null)}
              className="btn btn-outline"
              style={{
                minWidth: '100px',
                padding: '0.5rem 1rem'
              }}
            >
              Kembali
            </button>
            <button
              onClick={() => setModalType('checkout')}
              className="btn btn-primary"
              style={{
                minWidth: '160px',
                padding: '0.5rem 1.25rem',
                fontWeight: 600
              }}
            >
              Teruskan Checkout
            </button>
          </div>
        </Modal>

        {/* Checkout Modal */}
        <Modal
          isOpen={modalType === 'checkout'}
          onClose={() => !isProcessing && setModalType(null)}
          title="Checkout"
          subtitle={`Jumlah Perlu Dibayar: BND ${finalPayable.toFixed(2)}`}
          maxWidth="500px"
        >
          <div className="form-group">
            <label className="form-label">Jenis Pesanan *</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={() => setOrderType('takeaway')}
                className={`btn ${orderType === 'takeaway' ? 'btn-primary' : 'btn-outline'}`}
                style={{ flex: 1 }}
              >
                Takeaway
              </button>
              <button
                onClick={() => setOrderType('gomamam')}
                className={`btn ${orderType === 'gomamam' ? 'btn-primary' : 'btn-outline'}`}
                style={{ flex: 1 }}
              >
                GoMamam
              </button>
            </div>
          </div>

          {/* Customer Selection or Input */}
          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <User size={16} />
              Maklumat Pelanggan
            </label>

            {!selectedCustomer ? (
              <div style={{ position: 'relative', marginBottom: '1rem' }}>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Cari pelanggan (Nama/Tel)..."
                  value={customerSearch}
                  onChange={(e) => {
                    setCustomerSearch(e.target.value);
                    setShowCustomerResults(true);
                  }}
                  onFocus={() => setShowCustomerResults(true)}
                  style={{ borderColor: 'var(--primary)' }}
                />
                {showCustomerResults && customerSearch && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    background: 'white',
                    border: '1px solid var(--gray-300)',
                    borderRadius: 'var(--radius-md)',
                    zIndex: 10,
                    boxShadow: 'var(--shadow-lg)',
                    maxHeight: '200px',
                    overflowY: 'auto'
                  }}>
                    {filteredCustomers.length > 0 ? (
                      filteredCustomers.map(c => (
                        <div
                          key={c.id}
                          onClick={() => handleSelectCustomer(c)}
                          style={{
                            padding: '0.75rem',
                            borderBottom: '1px solid var(--gray-100)',
                            cursor: 'pointer',
                            transition: 'background 0.2s'
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = 'var(--gray-50)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'white'}
                        >
                          <div style={{ fontWeight: 600 }}>{c.name}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between' }}>
                            <span>{c.phone}</span>
                            <span style={{ color: 'var(--primary)', fontWeight: 600 }}>{c.loyaltyPoints} Pts</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div style={{ padding: '0.75rem', color: 'var(--text-secondary)', textAlign: 'center' }}>
                        Tiada rekod jumpa (Guna input manual di bawah)
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div style={{
                background: 'linear-gradient(135deg, var(--primary-light) 0%, #e0e7ff 100%)',
                padding: '0.75rem',
                borderRadius: 'var(--radius-md)',
                marginBottom: '1rem',
                border: '1px solid var(--primary)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <div style={{ fontWeight: 700, color: 'var(--primary)' }}>
                    {selectedCustomer.name}
                    <span className={`badge badge-${selectedCustomer.segment === 'vip' ? 'warning' : 'info'}`} style={{ marginLeft: '0.5rem', fontSize: '0.7rem' }}>
                      {selectedCustomer.segment.toUpperCase()}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    {selectedCustomer.phone} • <b>{selectedCustomer.loyaltyPoints} Points</b>
                  </div>
                </div>
                <button
                  onClick={handleClearCustomer}
                  className="btn btn-sm btn-outline"
                  style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }}
                >
                  <X size={14} />
                </button>
              </div>
            )}

            {/* Manual fallback fields (always visible but populated) */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              <div>
                <input
                  type="text"
                  className="form-input"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Nama"
                  readOnly={!!selectedCustomer}
                />
              </div>
              <div>
                <input
                  type="tel"
                  className="form-input"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="Tel (+673...)"
                  required
                  readOnly={!!selectedCustomer}
                />
              </div>
            </div>
          </div>

          {/* Payment Method Selection */}
          <div className="form-group">
            <label className="form-label">Kaedah Pembayaran *</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
              {enabledPaymentMethods.map((pm) => (
                <button
                  key={pm.id}
                  type="button"
                  onClick={() => setPaymentMethod(pm.code)}
                  className={`btn ${paymentMethod === pm.code ? 'btn-primary' : 'btn-outline'}`}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                >
                  {pm.icon && <span style={{ fontSize: '1.2rem' }}>{pm.icon}</span>}
                  {pm.name}
                </button>
              ))}
            </div>
            {enabledPaymentMethods.length === 0 && (
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.5rem' }}>
                Tiada kaedah pembayaran aktif. Sila tetapkan dalam Settings.
              </p>
            )}
          </div>

          {/* Loyalty Redemption Toggle */}
          {selectedCustomer && selectedCustomer.loyaltyPoints > 0 && (
            <div className="form-group" style={{
              background: 'linear-gradient(to right, #fef3c7, #fff)',
              padding: '0.75rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid #fcd34d'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Sparkles size={16} color="#d97706" fill="#d97706" />
                    Tebus Mata Ganjaran
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#92400e' }}>
                    Ada {selectedCustomer.loyaltyPoints} mata (Max tebus: ${maxRedemptionValue.toFixed(2)})
                  </div>
                </div>
                <label className="switch" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={usePoints}
                    onChange={(e) => setUsePoints(e.target.checked)}
                    style={{ accentColor: 'var(--primary)', width: '1.2rem', height: '1.2rem' }}
                  />
                  <span style={{ fontWeight: 600 }}>Guna</span>
                </label>
              </div>

              {usePoints && (
                <div style={{ marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px dashed #fcd34d', fontSize: '0.875rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#92400e' }}>
                    <span>Tebus {pointsToRedeem} mata:</span>
                    <span style={{ fontWeight: 700 }}>- BND {redemptionAmount.toFixed(2)}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Cash Amount Input - Show only for cash payment */}
          {paymentMethod === 'cash' && (
            <div className="form-group" style={{
              background: 'var(--gray-100)',
              padding: '1rem',
              borderRadius: 'var(--radius-md)',
              marginTop: '0.5rem'
            }}>
              <label className="form-label" style={{ marginBottom: '0.5rem' }}>
                Jumlah Diterima (BND)
              </label>
              <input
                type="number"
                className="form-input"
                placeholder="0.00"
                value={cashReceived || ''}
                onChange={(e) => setCashReceived(Number(e.target.value))}
                min="0"
                step="0.01"
                style={{ fontSize: '1.25rem', fontWeight: 700, textAlign: 'center' }}
              />
              {cashReceived > 0 && (
                <div style={{
                  marginTop: '0.75rem',
                  padding: '0.75rem',
                  background: cashReceived >= finalPayable ? 'var(--success-light, #d1fae5)' : 'var(--danger-light, #fee2e2)',
                  borderRadius: 'var(--radius-sm)',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                    Baki
                  </div>
                  <div style={{
                    fontSize: '1.5rem',
                    fontWeight: 700,
                    color: cashReceived >= finalPayable ? 'var(--success)' : 'var(--danger)'
                  }}>
                    BND {(cashReceived - finalPayable).toFixed(2)}
                  </div>
                  {cashReceived < finalPayable && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--danger)', marginTop: '0.25rem' }}>
                      Kurang BND {(finalPayable - cashReceived).toFixed(2)}
                    </div>
                  )}
                </div>
              )}
              {/* Quick cash buttons */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '0.5rem',
                marginTop: '0.75rem'
              }}>
                {[5, 10, 20, 50, 100].map(amount => (
                  <button
                    key={amount}
                    type="button"
                    onClick={() => setCashReceived(amount)}
                    className="btn btn-sm btn-outline"
                  >
                    ${amount}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setCashReceived(Math.ceil(finalPayable))}
                  className="btn btn-sm btn-primary"
                >
                  Tepat
                </button>
              </div>
            </div>
          )}

          <div style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '0.75rem',
            marginTop: '1.5rem',
            paddingTop: '1rem',
            borderTop: '1px solid var(--gray-200)'
          }}>
            <button
              onClick={() => setModalType(null)}
              className="btn btn-outline"
              style={{
                minWidth: '100px',
                padding: '0.5rem 1rem'
              }}
              disabled={isProcessing}
            >
              Batal
            </button>
            <button
              onClick={() => proceedToPayment()}
              className={`btn btn-primary ${isProcessing ? 'loading' : ''}`}
              style={{
                minWidth: '160px',
                padding: '0.5rem 1.25rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <LoadingSpinner size="sm" />
                  <span style={{ marginLeft: '0.5rem' }}>Memproses...</span>
                </>
              ) : (
                `Bayar BND ${finalPayable.toFixed(2)}`
              )}
            </button>
          </div>
        </Modal>

        {/* Receipt Modal */}
        <Modal
          isOpen={modalType === 'receipt'}
          onClose={() => setModalType(null)}
          title="Pesanan Berjaya!"
          maxWidth="450px"
        >
          {lastOrder && (
            <>
              <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                <div style={{
                  width: '60px',
                  height: '60px',
                  background: '#d1fae5',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1rem'
                }}>
                  <CheckCircle size={30} color="var(--success)" />
                </div>
                <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{lastOrder.orderNumber}</div>
                {lastOrder.customerName && (
                  <div style={{ fontSize: '1rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                    Pelanggan: {lastOrder.customerName}
                  </div>
                )}
              </div>

              {/* Receipt Preview */}
              <div
                ref={receiptRef}
                style={{
                  background: '#e5e5e5',
                  padding: '1rem',
                  borderRadius: 'var(--radius-md)',
                  display: 'flex',
                  justifyContent: 'center',
                }}
              >
                <ReceiptPreview
                  settings={receiptSettings}
                  sampleOrder={lastOrder}
                  width={receiptSettings.receiptWidth}
                  scale={0.85}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button
                  onClick={() => handlePrintReceipt()}
                  className="btn btn-primary"
                  style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.875rem' }}
                >
                  <Printer size={18} />
                  Cetak Resit
                </button>
                <button
                  onClick={() => setModalType(null)}
                  className="btn btn-outline"
                  style={{ width: '100%', padding: '0.875rem' }}
                >
                  Tutup
                </button>
              </div>

              {/* Printer Status Indicator */}
              <div style={{
                marginTop: '1rem',
                padding: '0.5rem 0.75rem',
                background: thermalPrinter.isConnected() ? '#d1fae5' : 'var(--gray-100)',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.75rem',
                textAlign: 'center',
                color: thermalPrinter.isConnected() ? '#059669' : 'var(--text-secondary)',
              }}>
                {thermalPrinter.isConnected()
                  ? '✓ Thermal printer disambung - cetak terus ke printer'
                  : 'Tiada thermal printer - akan cetak melalui browser'}
              </div>
            </>
          )}
        </Modal>

        {/* Order Queue Modal */}
        <Modal
          isOpen={modalType === 'queue'}
          onClose={() => setModalType(null)}
          title="Order Queue"
          subtitle="Kitchen Display"
          maxWidth="800px"
        >
          <div className="grid grid-cols-1 md:grid-cols-3" style={{ gap: '1rem' }}>
            {/* Pending */}
            <div>
              <h4 style={{
                fontSize: '1rem',
                fontWeight: 600,
                marginBottom: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                color: 'var(--warning)'
              }}>
                <Clock size={18} />
                Pending ({pendingOrders.length})
              </h4>
              <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                {pendingOrders.map(order => (
                  <div key={order.id} style={{
                    background: '#fef3c7',
                    padding: '0.75rem',
                    borderRadius: 'var(--radius-md)',
                    marginBottom: '0.5rem'
                  }}>
                    <div style={{ fontWeight: 700, marginBottom: '0.25rem' }}>{order.orderNumber}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                      {order.orderType === 'takeaway' ? 'Takeaway' : 'GoMamam'}
                    </div>
                    {order.items.map((item, idx) => (
                      <div key={idx} style={{ fontSize: '0.875rem' }}>
                        {item.quantity}x {item.name}
                        {item.selectedModifiers.length > 0 && (
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', paddingLeft: '0.5rem' }}>
                            {item.selectedModifiers?.map(m => `${m.groupName?.replace('Pilih ', '').replace('Flavour ', '') || ''}: ${m.optionName}`).join(', ')}
                          </div>
                        )}
                      </div>
                    ))}
                    <button
                      onClick={() => updateOrderStatus(order.id, 'preparing')}
                      className="btn btn-sm btn-primary"
                      style={{ width: '100%', marginTop: '0.5rem' }}
                    >
                      Start Preparing
                    </button>
                  </div>
                ))}
                {pendingOrders.length === 0 && (
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', textAlign: 'center' }}>Tiada pesanan</p>
                )}
              </div>
            </div>

            {/* Preparing */}
            <div>
              <h4 style={{
                fontSize: '1rem',
                fontWeight: 600,
                marginBottom: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                color: '#1e40af'
              }}>
                <ChefHat size={18} />
                Preparing ({preparingOrders.length})
              </h4>
              <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                {preparingOrders.map(order => (
                  <div key={order.id} style={{
                    background: '#dbeafe',
                    padding: '0.75rem',
                    borderRadius: 'var(--radius-md)',
                    marginBottom: '0.5rem'
                  }}>
                    <div style={{ fontWeight: 700, marginBottom: '0.25rem' }}>{order.orderNumber}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                      {order.orderType === 'takeaway' ? 'Takeaway' : 'GoMamam'}
                    </div>
                    {order.items.map((item, idx) => (
                      <div key={idx} style={{ fontSize: '0.875rem' }}>
                        {item.quantity}x {item.name}
                      </div>
                    ))}
                    <button
                      onClick={() => updateOrderStatus(order.id, 'ready')}
                      className="btn btn-sm btn-secondary"
                      style={{ width: '100%', marginTop: '0.5rem' }}
                    >
                      Mark Ready
                    </button>
                  </div>
                ))}
                {preparingOrders.length === 0 && (
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', textAlign: 'center' }}>Tiada pesanan</p>
                )}
              </div>
            </div>

            {/* Ready */}
            <div>
              <h4 style={{
                fontSize: '1rem',
                fontWeight: 600,
                marginBottom: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                color: 'var(--success)'
              }}>
                <CheckCircle size={18} />
                Ready ({readyOrders.length})
              </h4>
              <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                {readyOrders.map(order => (
                  <div key={order.id} style={{
                    background: '#d1fae5',
                    padding: '0.75rem',
                    borderRadius: 'var(--radius-md)',
                    marginBottom: '0.5rem'
                  }}>
                    <div style={{ fontWeight: 700, marginBottom: '0.25rem' }}>{order.orderNumber}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                      {order.orderType === 'takeaway' ? 'Takeaway' : 'GoMamam'}
                    </div>
                    {order.items.map((item, idx) => (
                      <div key={idx} style={{ fontSize: '0.875rem' }}>
                        {item.quantity}x {item.name}
                      </div>
                    ))}
                    <button
                      onClick={() => updateOrderStatus(order.id, 'completed')}
                      className="btn btn-sm btn-outline"
                      style={{ width: '100%', marginTop: '0.5rem' }}
                    >
                      Complete
                    </button>
                  </div>
                ))}
                {readyOrders.length === 0 && (
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', textAlign: 'center' }}>Tiada pesanan</p>
                )}
              </div>
            </div>
          </div>

          <div style={{ marginTop: '1.5rem' }}>
            <button className="btn btn-outline" onClick={() => setModalType(null)} style={{ width: '100%' }}>
              Tutup
            </button>
          </div>
        </Modal>

        {/* Order History Modal */}
        <Modal
          isOpen={modalType === 'history'}
          onClose={() => setModalType(null)}
          title="Sejarah Pesanan Hari Ini"
          subtitle={`${todayOrders.length} pesanan`}
          maxWidth="700px"
        >
          <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
            {todayOrders.length > 0 ? (
              <table className="table">
                <thead>
                  <tr>
                    <th>No. Pesanan</th>
                    <th>Items</th>
                    <th>Total</th>
                    <th>Jenis</th>
                    <th>Status</th>
                    <th>Masa</th>
                    <th>Tindakan</th>
                  </tr>
                </thead>
                <tbody>
                  {todayOrders.map(order => (
                    <tr key={order.id}>
                      <td style={{ fontWeight: 600 }}>{order.orderNumber}</td>
                      <td style={{ fontSize: '0.875rem' }}>
                        {order.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}
                      </td>
                      <td style={{ fontWeight: 600 }}>BND {order.total.toFixed(2)}</td>
                      <td>
                        <span className="badge badge-info" style={{ fontSize: '0.7rem' }}>
                          {order.orderType}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${order.status === 'completed' ? 'badge-success' :
                          order.status === 'ready' ? 'badge-success' :
                            order.status === 'preparing' ? 'badge-info' : 'badge-warning'
                          }`} style={{ fontSize: '0.7rem' }}>
                          {order.status}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        {new Date(order.createdAt).toLocaleTimeString('ms-MY', { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td>
                        <button
                          onClick={() => handlePrintReceipt(order)}
                          className="btn btn-sm btn-outline"
                          style={{ padding: '0.25rem 0.5rem', minWidth: 'auto' }}
                          title="Cetak Semula Resit"
                        >
                          <Printer size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem' }}>
                Tiada pesanan hari ini
              </p>
            )}
          </div>

          <div style={{
            marginTop: '1.5rem',
            paddingTop: '1rem',
            borderTop: '1px solid var(--gray-200)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <strong>Jumlah Jualan Hari Ini:</strong>
              <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--primary)', marginLeft: '0.5rem' }}>
                BND {todayOrders.reduce((sum, o) => sum + o.total, 0).toFixed(2)}
              </span>
            </div>
            <button className="btn btn-outline" onClick={() => setModalType(null)}>
              Tutup
            </button>
          </div>
        </Modal>

        {/* Network Error Modal */}
        <Modal
          isOpen={modalType === 'network-error'}
          onClose={handleCancelPayment}
          title="Ralat Rangkaian"
          maxWidth="400px"
        >
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <div style={{
              width: '70px',
              height: '70px',
              background: '#fef3c7',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem'
            }}>
              <WifiOff size={35} color="#d97706" />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--warning)' }}>
              Masalah Sambungan
            </h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              {networkError || 'Ralat rangkaian berlaku semasa memproses pembayaran.'}
            </p>

            {retryCount > 0 && (
              <div style={{
                background: 'var(--gray-100)',
                padding: '0.75rem',
                borderRadius: 'var(--radius-md)',
                marginBottom: '1rem',
                fontSize: '0.875rem'
              }}>
                <AlertTriangle size={16} color="var(--warning)" style={{ marginRight: '0.5rem' }} />
                Percubaan semula: {retryCount}/2
              </div>
            )}

            <div style={{
              background: '#fef3c7',
              padding: '1rem',
              borderRadius: 'var(--radius-md)',
              marginBottom: '1rem',
              textAlign: 'left',
              fontSize: '0.875rem',
              color: '#92400e'
            }}>
              <strong>Apa yang boleh anda lakukan:</strong>
              <ul style={{ marginTop: '0.5rem', paddingLeft: '1.25rem' }}>
                <li>Semak sambungan internet anda</li>
                <li>Cuba semula dalam beberapa saat</li>
                <li>Jika masalah berterusan, hubungi sokongan</li>
              </ul>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={handleCancelPayment}
              className="btn btn-outline"
              style={{ flex: 1 }}
            >
              Batal
            </button>
            <button
              onClick={handleRetryPayment}
              className="btn btn-primary"
              style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <LoadingSpinner size="sm" />
                  Cuba Semula...
                </>
              ) : (
                <>
                  <RefreshCw size={18} />
                  Cuba Semula
                </>
              )}
            </button>
          </div>
        </Modal>
      </div>
      {/* Register Modal */}
      <RegisterModal
        isOpen={registerModalOpen}
        onClose={(success) => {
          // If explicitly successful, or if register is set, do not redirect
          if (success || currentRegister) {
            setRegisterModalOpen(false);
          } else {
            // Only redirect if NOT successful AND no register
            router.push('/');
          }
        }}
        mode={registerModalMode}
      />
    </RouteGuard>
  );
}
